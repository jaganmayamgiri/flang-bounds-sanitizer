# CLAUDE.md — Flang HLFIR Bounds-Checking Sanitizer

## Project Overview

This project implements a runtime bounds-checking sanitizer for the Flang Fortran compiler
that exploits HLFIR (High-Level FIR) metadata to insert precise out-of-bounds checks for
Fortran array accesses. The sanitizer covers assumed-shape arrays, array sections, and
pointer-based accesses — cases where gfortran's `-fcheck=bounds` is weak or silent.

---

## Repository Layout

```
flang-bounds-sanitizer/
├── CLAUDE.md                        ← this file
├── README.md
├── CMakeLists.txt                   ← top-level build (ties into LLVM/Flang CMake)
│
├── passes/
│   ├── CMakeLists.txt
│   ├── HLFIRBoundsCheck.h           ← pass declaration
│   ├── HLFIRBoundsCheck.cpp         ← HLFIR instrumentation pass
│   └── BoundsCheckUtils.h           ← shared helpers (descriptor extraction, etc.)
│
├── runtime/
│   ├── CMakeLists.txt
│   ├── BoundsCheck.h                ← public API used by instrumented IR
│   ├── BoundsCheck.cpp              ← check execution + error reporting
│   └── BoundsCheckFortran.f90       ← optional Fortran-callable wrappers
│
├── driver/
│   ├── BoundsCheckFlag.td           ← TableGen for -fcheck=bounds driver flag
│   └── BoundsCheckFlag.patch        ← patch snippet for flang/tools/flang-driver
│
├── tests/
│   ├── CMakeLists.txt
│   ├── lit.cfg.py                   ← LLVM lit configuration
│   ├── assumed_shape/               ← 8 test programs
│   │   ├── oob_assumed_shape_1d.f90
│   │   ├── oob_assumed_shape_2d.f90
│   │   ├── oob_assumed_shape_negative.f90
│   │   ├── oob_assumed_shape_zero_sized.f90
│   │   ├── oob_assumed_shape_intent_in.f90
│   │   ├── oob_assumed_shape_slice.f90
│   │   ├── oob_assumed_shape_contiguous.f90
│   │   └── oob_assumed_shape_bounds.f90
│   ├── array_sections/              ← 5 test programs
│   │   ├── oob_section_stride.f90
│   │   ├── oob_section_lower.f90
│   │   ├── oob_section_upper.f90
│   │   ├── oob_section_multi_dim.f90
│   │   └── oob_section_remapping.f90
│   ├── pointers/                    ← 4 test programs
│   │   ├── oob_pointer_1d.f90
│   │   ├── oob_pointer_remapped.f90
│   │   ├── oob_pointer_after_nullify.f90
│   │   └── oob_pointer_component.f90
│   ├── allocatables/                ← 4 test programs
│   │   ├── oob_allocatable_1d.f90
│   │   ├── oob_allocatable_2d.f90
│   │   ├── oob_allocatable_reallocate.f90
│   │   └── oob_allocatable_dealloc_access.f90
│   ├── edge_cases/                  ← 3 test programs
│   │   ├── oob_zero_sized_array.f90
│   │   ├── oob_negative_stride.f90
│   │   └── oob_coarray_local_dim.f90
│   └── expected_outputs/            ← .txt files with expected stderr
│
└── benchmarks/
    ├── CMakeLists.txt
    ├── run_benchmarks.sh
    ├── polybench_mini/              ← stripped PolyBench kernels
    │   ├── jacobi_2d.f90
    │   ├── gemm.f90
    │   └── heat_3d.f90
    └── results/
        └── overhead_table.py        ← generates overhead table from timing JSON
```

---

## Architecture

### 1. HLFIR Instrumentation Pass (`passes/HLFIRBoundsCheck.cpp`)

**Pipeline position:** inserted between HLFIR canonicalization and `hlfir-to-fir` lowering.

**What to instrument:**

| HLFIR operation | Check to insert |
|---|---|
| `hlfir.designate` with subscripts | subscript ∈ [lb, ub] for each dimension |
| `hlfir.elemental` | implicit index within shape extents |
| `hlfir.region_assign` with section | section bounds vs. array descriptor |
| `fir.array_coor` (already lowered) | fallback: check if designate was missed |

**Algorithm:**

```
For each FuncOp in the module:
  Walk all hlfir.designate ops:
    Extract the base array value (fir.box / fir.ref<array>)
    For each subscript dimension i:
      Read lb_i and ub_i from the descriptor (fir.box_dims)
      Insert:
        %in_bounds = AND(subscript_i >= lb_i, subscript_i <= ub_i)
        cf.assert %in_bounds, "array index out of bounds ..."
      OR call runtime:
        call @_FortranABoundsCheck(base_desc, dim, index, src_file, src_line)
```

**Descriptor extraction helpers (`BoundsCheckUtils.h`):**

```cpp
// Returns {lower_bound, extent} pair for dimension `dim` of a fir.box value
std::pair<Value, Value> getBoxDimBounds(OpBuilder &b, Location loc,
                                         Value box, int64_t dim);
// Returns true if the array is a compile-time constant shape (no check needed)
bool isStaticallySafe(hlfir::DesignateOp op);
```

**Pass registration** goes in `flang/lib/Optimizer/Passes/Passes.td` and
`flang/lib/Optimizer/Passes/CMakeLists.txt`. The pass class:

```cpp
struct HLFIRBoundsCheckPass
    : public impl::HLFIRBoundsCheckBase<HLFIRBoundsCheckPass> {
  void runOnOperation() override;
};
```

---

### 2. Runtime Library (`runtime/BoundsCheck.cpp`)

**Public symbols (C linkage, called from instrumented IR):**

```c
// Primary check: called for each array access
void _FortranABoundsCheck(
    const CFI_cdesc_t *descriptor,  // ISO_Fortran_binding descriptor
    int           dimension,         // 0-based dimension index
    CFI_index_t   index,             // the subscript value being checked
    const char   *source_file,       // __FILE__ of the Fortran source
    int           source_line        // __LINE__
);

// Section check: validates a triplet (lower:upper:stride) against descriptor
void _FortranABoundsCheckSection(
    const CFI_cdesc_t *descriptor,
    int           dimension,
    CFI_index_t   section_lower,
    CFI_index_t   section_upper,
    CFI_index_t   stride,
    const char   *source_file,
    int           source_line
);

// Pointer/allocatable: checks that the descriptor is associated before access
void _FortranABoundsCheckAssociated(
    const CFI_cdesc_t *descriptor,
    const char        *source_file,
    int                source_line
);
```

**Error reporting format** (stderr, then `abort()`):

```
Fortran runtime error: array index out of bounds
  file: jacobi.f90, line: 47
  dimension: 1 (1-based), index: 513, valid range: [1, 512]
  array: CFI rank=2, extents=[512,512]
```

**Build this as a static archive** `libFortranBoundsCheck.a` linked in when `-fcheck=bounds`
is active. Alternatively, bundle into the existing `libFortranRuntime.a` behind a compile flag.

---

### 3. Driver Flag (`driver/`)

**TableGen entry** (add to `flang/include/flang/Driver/Options.td`):

```tablegen
def fcheck_EQ : Joined<["-"], "fcheck=">,
  Group<f_Group>, Flags<[FlangOption, CC1Option]>,
  HelpText<"Enable runtime checks. Supported: bounds">;
```

**CC1 handling** (in `flang/lib/Frontend/CompilerInvocation.cpp`):

```cpp
if (Args.hasFlag(OPT_fcheck_EQ, OPT_fno_check_EQ, false)) {
  StringRef Val = Args.getLastArgValue(OPT_fcheck_EQ);
  if (Val == "bounds" || Val == "all")
    Opts.BoundsCheck = true;
}
```

**Pass insertion** (in `flang/lib/Frontend/FrontendActions.cpp`, inside
`CodeGenAction::runOptimizationPipeline` or equivalent):

```cpp
if (CI.getInvocation().getFrontendOpts().BoundsCheck) {
  pm.addPass(createHLFIRBoundsCheckPass());
}
```

**Linker group** (in the driver's link step, add when BoundsCheck is true):

```
-lFortranBoundsCheck
```

---

## Build Instructions

### Prerequisites

```bash
# Tested configuration
cmake >= 3.20
ninja
clang >= 17 (to bootstrap)
LLVM/Flang source tree (llvm-project, main branch)
```

### Step 1 — Patch the Flang source tree

```bash
export LLVM_SRC=$HOME/llvm-project

# Copy pass sources
cp passes/HLFIRBoundsCheck.h   $LLVM_SRC/flang/include/flang/Optimizer/Passes/
cp passes/HLFIRBoundsCheck.cpp $LLVM_SRC/flang/lib/Optimizer/Passes/
cp passes/BoundsCheckUtils.h   $LLVM_SRC/flang/include/flang/Optimizer/Passes/

# Copy runtime sources
cp runtime/BoundsCheck.h   $LLVM_SRC/flang/runtime/
cp runtime/BoundsCheck.cpp $LLVM_SRC/flang/runtime/

# Apply driver patch
cd $LLVM_SRC && git apply /path/to/flang-bounds-sanitizer/driver/BoundsCheckFlag.patch

# Register pass in CMakeLists
echo 'add_flang_pass(HLFIRBoundsCheck HLFIRBoundsCheck.cpp)' \
  >> $LLVM_SRC/flang/lib/Optimizer/Passes/CMakeLists.txt

# Register runtime file
echo 'add_flang_runtime_source(BoundsCheck.cpp)' \
  >> $LLVM_SRC/flang/runtime/CMakeLists.txt
```

### Step 2 — Configure and build

```bash
mkdir -p $LLVM_SRC/build && cd $LLVM_SRC/build

cmake .. \
  -G Ninja \
  -DCMAKE_BUILD_TYPE=RelWithDebInfo \
  -DLLVM_ENABLE_PROJECTS="clang;flang;mlir" \
  -DLLVM_TARGETS_TO_BUILD=X86 \
  -DCMAKE_C_COMPILER=clang \
  -DCMAKE_CXX_COMPILER=clang++

ninja flang-new libFortranRuntime
```

### Step 3 — Verify the pass is registered

```bash
./bin/flang-new -fcheck=bounds -### /dev/null 2>&1 | grep bounds
# Expected: -fcheck=bounds appears in cc1 invocation
```

---

## Standalone Demo (No LLVM Build Required)

For demonstrating and testing WITHOUT rebuilding Flang, use the **standalone simulation**
approach: a Python script (`demo/simulate_pass.py`) that:

1. Parses a Fortran source file
2. Identifies array accesses via regex heuristics
3. Inserts calls to a pure-C bounds-check shim
4. Compiles the instrumented C version with gcc
5. Runs it and captures the OOB error output

This lets all 20+ test cases be run and shown to work immediately.

```
demo/
├── simulate_pass.py        ← orchestrator
├── bounds_shim.h           ← C shim matching the real runtime API
├── bounds_shim.c           ← implementation
├── instrument.py           ← Fortran→C array-access transformer
└── run_all_tests.sh        ← runs all 20 tests and prints pass/fail table
```

---

## Test Suite (20 Programs)

Each test has three parts:
1. **Source** — `.f90` file with a deliberate OOB access
2. **Expected output** — the exact error line it must print to stderr
3. **LIT directives** — `! RUN:` and `! CHECK:` lines in the source itself

### Test Catalogue

#### Assumed-Shape Arrays (8 tests)

**`oob_assumed_shape_1d.f90`**
```fortran
! RUN: %flang -fcheck=bounds %s -o %t && not %t 2>&1 | FileCheck %s
! CHECK: array index out of bounds
! CHECK: dimension: 1, index: 11, valid range: [1, 10]
subroutine sub(a)
  integer, intent(in) :: a(:)
  print *, a(11)          ! array has only 10 elements
end subroutine
program main
  integer :: x(10) = [(i, i=1,10)]
  call sub(x)
end program
```

**`oob_assumed_shape_2d.f90`** — 2D assumed-shape, OOB on second dimension

**`oob_assumed_shape_negative.f90`** — index below lower bound (lb=1, index=0)

**`oob_assumed_shape_zero_sized.f90`** — access on zero-sized array (extent=0)

**`oob_assumed_shape_intent_in.f90`** — read-only dummy argument, OOB read

**`oob_assumed_shape_slice.f90`** — slice passed as assumed-shape, OOB via stride

**`oob_assumed_shape_contiguous.f90`** — CONTIGUOUS attribute still needs check

**`oob_assumed_shape_bounds.f90`** — non-default lower bound (lb=5), access at lb-1

#### Array Sections (5 tests)

**`oob_section_stride.f90`** — section `a(1:100:2)` but array only has 50 elements

**`oob_section_lower.f90`** — section lower bound below array lower bound

**`oob_section_upper.f90`** — section upper bound beyond array extent

**`oob_section_multi_dim.f90`** — 2D section with OOB in second dimension

**`oob_section_remapping.f90`** — pointer rank remapping with OOB access

#### Pointer Arrays (4 tests)

**`oob_pointer_1d.f90`** — pointer associated to a(1:10), access at index 11

**`oob_pointer_remapped.f90`** — rank-remapped pointer, OOB on remapped shape

**`oob_pointer_after_nullify.f90`** — access after NULLIFY (should report disassociated)

**`oob_pointer_component.f90`** — OOB via pointer component of a derived type

#### Allocatables (4 tests)

**`oob_allocatable_1d.f90`** — ALLOCATE(a(100)), then access a(101)

**`oob_allocatable_2d.f90`** — 2D allocatable, OOB on column index

**`oob_allocatable_reallocate.f90`** — access uses old bounds after REALLOCATE shrinks

**`oob_allocatable_dealloc_access.f90`** — access after DEALLOCATE (descriptor check)

#### Edge Cases (3 tests)

**`oob_zero_sized_array.f90`** — any access on zero-sized is OOB

**`oob_negative_stride.f90`** — triplet with negative stride: `a(10:1:-1)`, access at 0

**`oob_coarray_local_dim.f90`** — coarray local dimension bounds check (non-codimension)

### Running the Tests

```bash
# With real Flang build
cd $LLVM_SRC/build
llvm-lit flang/test/bounds-check/ -v

# With standalone demo
cd flang-bounds-sanitizer/demo
bash run_all_tests.sh
```

Expected output:
```
PASS  assumed_shape/oob_assumed_shape_1d
PASS  assumed_shape/oob_assumed_shape_2d
...
PASS  edge_cases/oob_negative_stride
--------------------------------------
20/20 tests passed
```

---

## Benchmarks

### Programs

| Program | Domain | Lines | Array access pattern |
|---|---|---|---|
| `jacobi_2d.f90` | Stencil | ~80 | 2D assumed-shape, tight loop |
| `gemm.f90` | BLAS | ~60 | 2D, all three dimensions accessed |
| `heat_3d.f90` | PDE | ~120 | 3D allocatable, nested loops |

### Running

```bash
cd benchmarks
bash run_benchmarks.sh --runs 5 --output results/timings.json
python3 results/overhead_table.py results/timings.json
```

### Expected Overhead Table (targets)

| Program | Uninstrumented (s) | With -fcheck=bounds (s) | Overhead |
|---|---|---|---|
| jacobi_2d | 0.82 | 0.89 | ~8% |
| gemm | 1.14 | 1.21 | ~6% |
| heat_3d | 2.03 | 2.19 | ~8% |

Overhead target: **< 15%** for tight loop kernels. If higher, enable the
`--elide-static-safe` pass option which skips statically-provable safe accesses.

---

## Key Implementation Details

### Descriptor Access in FIR/HLFIR

Fortran array descriptors (fir.box) expose bounds via `fir.box_dims`:

```mlir
%lb, %extent, %stride = fir.box_dims %array, %dim_idx : (!fir.box<!fir.array<?xi32>>, index) -> (index, index, index)
%ub = arith.addi %lb, %extent : index
%ub_inclusive = arith.subi %ub, %c1 : index
```

Use `%lb` and `%ub_inclusive` as the valid range for the subscript check.

### Avoiding Redundant Checks

Before inserting a check, call `isStaticallySafe(op)`:
- If the subscript is a compile-time constant AND the array has static shape → skip
- If inside a DO loop where the induction variable is provably within bounds → skip (optional, implement as a follow-on optimization)

### Source Location Propagation

HLFIR ops carry `mlir::Location`. Extract file/line with:

```cpp
if (auto fileLoc = loc.dyn_cast<FileLineColLoc>()) {
  StringRef file = fileLoc.getFilename();
  unsigned line  = fileLoc.getLine();
}
```

Pass these as string/integer constants to the runtime call.

### Thread Safety

The runtime `_FortranABoundsCheck` is read-only except for the error path (which calls
`abort()`). No locking is needed. The function is marked `__attribute__((cold))` and
`__attribute__((noinline))` so it does not pollute the hot path's instruction cache.

---

## Extending the Pass

### Adding a New Check Category

1. Add a new `Walk` pattern in `HLFIRBoundsCheck.cpp`:
   ```cpp
   getOperation()->walk([&](NewHLFIROp op) {
     insertCheckFor(op);
   });
   ```
2. Add the corresponding runtime function to `BoundsCheck.h` / `BoundsCheck.cpp`
3. Add at least 2 test cases under `tests/new_category/`
4. Document in this file under the Test Catalogue

### Suppressing Checks (Escape Hatch)

Individual arrays can be marked with a Fortran attribute comment:
```fortran
!$FLANG NOBOUNDSCHECK
real :: a(100)
```

The pass checks for this pragma via `hlfir.declare` attributes before inserting checks.

---

## Debugging the Pass

```bash
# Dump HLFIR before and after the pass
flang-new -fcheck=bounds -mmlir --mlir-print-ir-before=hlfir-bounds-check \
          -mmlir --mlir-print-ir-after=hlfir-bounds-check  \
          test.f90 -o test

# Disable only the bounds-check pass to isolate failures
flang-new -fcheck=bounds -mmlir --disable-pass=hlfir-bounds-check test.f90
```

---

## Common Pitfalls

| Pitfall | Fix |
|---|---|
| Pass runs after `hlfir-to-fir` — descriptors already gone | Register pass BEFORE `hlfir-to-fir` in the pipeline |
| `fir.box_dims` on a `fir.ref<array>` (not a box) — crashes | Check `isa<fir::BoxType>` before calling box_dims; emit static size check for ref types |
| Zero-sized arrays: lb > ub arithmetically — false positives | Special-case: if extent == 0, any access is unconditionally OOB |
| Pointer/allocatable not associated — null deref in descriptor read | Always call `_FortranABoundsCheckAssociated` before reading descriptor bounds |
| Source location is `UnknownLoc` — useless error message | Walk up to parent FuncOp and use its location as fallback |

---

## References

- HLFIR design doc: `flang/docs/HighLevelFIR.md` in llvm-project
- FIR spec: `flang/docs/FIRLangRef.md`
- ISO Fortran binding (`CFI_cdesc_t`): ISO/IEC TS 29113:2012
- gfortran bounds check source: `gcc/fortran/trans-array.cc`, function `gfc_trans_array_bound_check`
- MLIR pass infrastructure: https://mlir.llvm.org/docs/PassManagement/

---

## Status Checklist

- [ ] Pass skeleton compiles against Flang HEAD
- [ ] `hlfir.designate` 1D assumed-shape check works end-to-end
- [ ] All 20 test cases produce expected OOB messages
- [ ] `-fcheck=bounds` flag recognized by driver
- [ ] Runtime library linked correctly
- [ ] Benchmarks show < 15% overhead
- [ ] No false positives on clean (in-bounds) code
- [ ] LLVM lit suite passes: `llvm-lit flang/test/bounds-check/ --pass-threshold 100`
