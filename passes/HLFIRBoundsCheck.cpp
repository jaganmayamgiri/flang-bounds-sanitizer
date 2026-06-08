#include "flang/Optimizer/Passes/HLFIRBoundsCheck.h"
#include "flang/Optimizer/Passes/BoundsCheckUtils.h"
#include "flang/Optimizer/Dialect/FIROps.h"
#include "flang/Optimizer/Builder/HLFIRTools.h"
#include "mlir/Dialect/ControlFlow/IR/ControlFlowOps.h"
#include "mlir/Dialect/Arith/IR/Arith.h"
#include "mlir/Dialect/Func/IR/FuncOps.h"
#include "mlir/IR/BuiltinOps.h"

namespace hlfir {
#define GEN_PASS_DEF_HLFIRBOUNDSCHECK
#include "flang/Optimizer/Passes/Passes.h.inc"
} // namespace hlfir

using namespace mlir;

namespace {
struct HLFIRBoundsCheckPass
    : public hlfir::impl::HLFIRBoundsCheckBase<HLFIRBoundsCheckPass> {
  void runOnOperation() override {
    ModuleOp module = getOperation();
    OpBuilder builder(&getContext());

    module.walk([&](func::FuncOp funcOp) {
      if (funcOp.isExternal())
        return;

      funcOp.walk([&](hlfir::DesignateOp designateOp) {
        if (hlfir::isStaticallySafe(designateOp))
          return;

        Location loc = designateOp.getLoc();
        builder.setInsertionPoint(designateOp);

        Value base = designateOp.getMemref();
        auto type = base.getType();

        // Ensure base is a box/descriptor type to extract bounds
        if (!type.isa<fir::BoxType>()) {
          return;
        }

        // Extract dimension details and insert checks for each subscript
        auto subscripts = designateOp.getSubscripts();
        for (size_t i = 0; i < subscripts.size(); ++i) {
          Value subscript = subscripts[i];
          auto bounds = hlfir::getBoxDimBounds(builder, loc, base, i);
          Value lb = bounds.first;
          Value extent = bounds.second;

          // ub = lb + extent - 1
          Value ub = builder.create<arith::AddIOp>(loc, lb, extent);
          Value c1 = builder.create<arith::ConstantIndexOp>(loc, 1);
          Value ubInclusive = builder.create<arith::SubIOp>(loc, ub, c1);

          // lbCheck = subscript >= lb
          Value lbCheck = builder.create<arith::CmpIOp>(loc, arith::CmpIPredicate::sge, subscript, lb);
          // ubCheck = subscript <= ubInclusive
          Value ubCheck = builder.create<arith::CmpIOp>(loc, arith::CmpIPredicate::sle, subscript, ubInclusive);
          // inBounds = lbCheck AND ubCheck
          Value inBounds = builder.create<arith::AndIOp>(loc, lbCheck, ubCheck);

          // If extent == 0, then bounds check fails unconditionally
          Value zero = builder.create<arith::ConstantIndexOp>(loc, 0);
          Value notZeroSized = builder.create<arith::CmpIOp>(loc, arith::CmpIPredicate::ne, extent, zero);
          Value finalCheck = builder.create<arith::AndIOp>(loc, inBounds, notZeroSized);

          // Assert finalCheck
          builder.create<cf::AssertOp>(loc, finalCheck, "Fortran runtime error: array index out of bounds");
        }
      });
    });
  }
};
} // namespace

std::unique_ptr<mlir::Pass> hlfir::createHLFIRBoundsCheckPass() {
  return std::make_unique<HLFIRBoundsCheckPass>();
}
