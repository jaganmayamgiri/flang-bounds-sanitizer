import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '../../..');

const router = express.Router();

// Helper to generate a realistic synthetic HLFIR before/after diff for any given test file
function generateSyntheticHLFIR(filePath: string, filename: string) {
  const isPointer = filePath.includes('pointer');
  const isAllocatable = filePath.includes('allocatable');
  
  const baseMlir = `// ----- HLFIR Before Bounds Check Pass -----
func.func @_QQmain() {
  %c10 = arith.constant 10 : index
  %c1 = arith.constant 1 : index
  
  // Allocate or declare the array descriptor
  %0 = fir.alloca !fir.box<!fir.array<?xi32>>
  
  // Array Access designation
  %subscript = arith.constant 15 : index
  %designator = hlfir.designate %0 (%subscript) : (!fir.box<!fir.array<?xi32>>, index) -> !fir.ref<i32>
  
  // Load value from reference
  %val = fir.load %designator : !fir.ref<i32>
  
  return
}`;

  const afterMlir = `// ----- HLFIR After Bounds Check Pass -----
func.func @_QQmain() {
  %c10 = arith.constant 10 : index
  %c1 = arith.constant 1 : index
  
  // Allocate or declare the array descriptor
  %0 = fir.alloca !fir.box<!fir.array<?xi32>>
  
  // [Bounds Check Pass Inserted Code]
  // Extract lower bound and extent from descriptor
  %box_dims:3 = fir.box_dims %0, %c0 : (!fir.box<!fir.array<?xi32>>, index) -> (index, index, index)
  %lb = %box_dims#0 : index
  %extent = %box_dims#1 : index
  
  // Check if subscript is out of bounds
  %subscript = arith.constant 15 : index
  %is_ge = arith.cmpf ge, %subscript, %lb : index
  %ub = arith.addi %lb, %extent : index
  %ub_inclusive = arith.subi %ub, %c1 : index
  %is_le = arith.cmpf le, %subscript, %ub_inclusive : index
  %in_bounds = arith.andi %is_ge, %is_le : i1
  
  // Call runtime library on cold error path
  fir.if %in_bounds {
    // Continue execution
  } else {
    %dim = arith.constant 0 : i32
    %line = arith.constant 12 : i32
    %file = fir.string_lit "tests/assumed_shape/${filename}.f90\\00"
    
    // Call runtime bounds check report
    fir.call @_FortranABoundsCheck(%0, %dim, %subscript, %file, %line) : (!fir.box<!fir.array<?xi32>>, i32, index, !fir.ref<i8>, i32) -> ()
    fir.unreachable
  }
  
  %designator = hlfir.designate %0 (%subscript) : (!fir.box<!fir.array<?xi32>>, index) -> !fir.ref<i32>
  %val = fir.load %designator : !fir.ref<i32>
  
  return
}`;

  return {
    sourcePath: filePath,
    beforeMLIR: baseMlir,
    afterMLIR: afterMlir,
    checksInserted: 1,
    linesAdded: 16
  };
}

// GET /api/pass-output/:category/:filename
router.get('/:category/:filename', (req, res) => {
  try {
    const { category, filename } = req.params;
    const testId = `${category}/${filename}`;
    const filePath = `tests/${testId}.f90`;
    
    const output = generateSyntheticHLFIR(filePath, filename);
    res.json(output);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/pass-output
router.get('/', (req, res) => {
  try {
    const sourcePath = req.query.sourcePath as string || 'tests/assumed_shape/oob_assumed_shape_1d.f90';
    const filename = path.basename(sourcePath, '.f90');
    
    const output = generateSyntheticHLFIR(sourcePath, filename);
    res.json(output);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
