# IMPLEMENTATION — HLFIR Bounds-Checking Pass & Runtime

This document describes the code implementation details of the compiler pass, driver configuration, and runtime checking libraries.

## 1. HLFIR Pass (`passes/`)

The core compiler instrumentation is implemented as an MLIR pass walking HLFIR dialects.

### Pass Skeleton (`passes/HLFIRBoundsCheck.cpp`)
The pass is registered inside the MLIR pass manager. It overrides `runOnOperation` to execute over all functions inside a module:

```cpp
void HLFIRBoundsCheckPass::runOnOperation() {
  mlir::ModuleOp module = getOperation();
  OpBuilder builder(&getContext());

  module.walk([&](hlfir::DesignateOp designateOp) {
    if (isStaticallySafe(designateOp)) return;
    
    // Extract base array box (fir.box)
    Value base = designateOp.getMemref();
    if (!base.getType().isa<fir::BoxType>()) return;
    
    Location loc = designateOp.getLoc();
    auto subscripts = designateOp.getSubscripts();

    for (size_t i = 0; i < subscripts.size(); ++i) {
      Value subscript = subscripts[i];
      
      // Generate box_dims query in HLFIR
      auto boxDims = builder.create<fir::BoxDimsOp>(loc, base, builder.getI32IntegerAttr(i));
      Value lb = boxDims.getLowerBound();
      Value extent = boxDims.getExtent();
      
      // Inline the fast checking logic
      Value ub = builder.create<arith::AddIOp>(loc, lb, extent);
      Value c1 = builder.create<arith::ConstantOp>(loc, builder.getIndexType(), builder.getIndexAttr(1));
      Value ubInclusive = builder.create<arith::SubIOp>(loc, ub, c1);
      
      Value ge = builder.create<arith::CmpIOp>(loc, arith::CmpIPredicate::sge, subscript, lb);
      Value le = builder.create<arith::CmpIOp>(loc, arith::CmpIPredicate::sle, subscript, ubInclusive);
      Value inBounds = builder.create<arith::AndIOp>(loc, ge, le);
      
      // Control flow branching to cold abort path
      builder.create<fir::IfOp>(loc, inBounds, 
        /*withElse=*/true,
        [&](OpBuilder &thenBuilder, Location thenLoc) {
          thenBuilder.create<fir::ResultOp>(thenLoc);
        },
        [&](OpBuilder &elseBuilder, Location elseLoc) {
          // Call runtime: _FortranABoundsCheck
          Value line = elseBuilder.create<arith::ConstantOp>(elseLoc, elseBuilder.getI32Type(), elseBuilder.getI32IntegerAttr(loc.getLine()));
          elseBuilder.create<fir::CallOp>(elseLoc, boundsCheckFunc, ValueRange{base, builder.getI32IntegerAttr(i), subscript, line});
          elseBuilder.create<fir::UnreachableOp>(elseLoc);
        }
      );
    }
  });
}
```

---

## 2. Driver Flags (`driver/`)

The compilation flag `-fcheck=bounds` is integrated into the driver using LLVM TableGen options:

### Driver TableGen Option (`driver/BoundsCheckFlag.td`)
```tablegen
def fcheck_EQ : Joined<["-"], "fcheck=">,
  Group<f_Group>, Flags<[FlangOption, CC1Option]>,
  HelpText<"Enable runtime checks. Supported values: bounds">;
```

When active, the option parses `Opts.BoundsCheck = true` inside the compiler invocation, which appends the `HLFIRBoundsCheckPass` to the optimizer pipeline before lowering to FIR.

---

## 3. Runtime Library (`runtime/`)

The runtime checking library receives the array descriptors dynamically using the standard **ISO Fortran Binding descriptor format (`CFI_cdesc_t`)**.

### C Runtime Boundary Checks (`runtime/BoundsCheck.cpp`)
```cpp
#include "ISO_Fortran_binding.h"
#include <stdio.h>
#include <stdlib.h>

extern "C" {
void _FortranABoundsCheck(
    const CFI_cdesc_t *desc,
    int dimension,
    CFI_index_t index,
    const char *source_file,
    int source_line
) {
    if (!desc || !desc->base_addr) {
        fprintf(stderr, "Fortran runtime error: array not associated or allocated\n");
        if (source_file) fprintf(stderr, "  file: %s, line: %d\n", source_file, source_line);
        abort();
    }

    CFI_dim_t dim = desc->dim[dimension];
    CFI_index_t lb = dim.lower_bound;
    CFI_index_t ub = lb + dim.extent - 1;

    if (index < lb || index > ub) {
        fprintf(stderr, "Fortran runtime error: array index out of bounds\n");
        if (source_file) fprintf(stderr, "  file: %s, line: %d\n", source_file, source_line);
        fprintf(stderr, "  dimension: %d, index: %ld, valid range: [%ld, %ld]\n",
                dimension + 1, (long)index, (long)lb, (long)ub);
        fprintf(stderr, "  array: CFI rank=%d, extents=[%ld]\n", desc->rank, (long)dim.extent);
        abort();
    }
}
}
```
This library decodes the descriptors dynamically, prints highly structured debug information to stderr, and invokes `abort()`.
