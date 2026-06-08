#ifndef FLANG_OPTIMIZER_PASSES_BOUNDSCHECKUTILS_H
#define FLANG_OPTIMIZER_PASSES_BOUNDSCHECKUTILS_H

#include "flang/Optimizer/Builder/HLFIRTools.h"
#include "flang/Optimizer/Dialect/FIROps.h"
#include "mlir/IR/Builders.h"
#include "mlir/IR/Value.h"
#include <utility>

namespace hlfir {

// Returns {lower_bound, extent} pair for dimension `dim` of a fir.box value
inline std::pair<mlir::Value, mlir::Value> getBoxDimBounds(mlir::OpBuilder &builder, mlir::Location loc,
                                                           mlir::Value box, int64_t dim) {
  auto dimIdx = builder.create<mlir::arith::ConstantIndexOp>(loc, dim);
  auto boxDims = builder.create<fir::BoxDimsOp>(loc, builder.getIndexType(), builder.getIndexType(), builder.getIndexType(), box, dimIdx);
  return {boxDims.getLowerBound(), boxDims.getExtent()};
}

// Returns true if the array has static shape and index is statically within bounds
inline bool isStaticallySafe(hlfir::DesignateOp op) {
  // If the designate has compile-time constant subscripts and array is statically shaped
  // we could prove it's safe. Return false by default to ensure runtime check is inserted.
  return false;
}

} // namespace hlfir

#endif // FLANG_OPTIMIZER_PASSES_BOUNDSCHECKUTILS_H
