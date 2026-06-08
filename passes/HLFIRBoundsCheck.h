#ifndef FLANG_OPTIMIZER_PASSES_HLFIRBOUNDSCHECK_H
#define FLANG_OPTIMIZER_PASSES_HLFIRBOUNDSCHECK_H

#include "mlir/Pass/Pass.h"
#include <memory>

namespace mlir {
class Pass;
} // namespace mlir

namespace hlfir {

#define GEN_PASS_DECL_HLFIRBOUNDSCHECK
#include "flang/Optimizer/Passes/Passes.h.inc"

std::unique_ptr<mlir::Pass> createHLFIRBoundsCheckPass();

} // namespace hlfir

#endif // FLANG_OPTIMIZER_PASSES_HLFIRBOUNDSCHECK_H
