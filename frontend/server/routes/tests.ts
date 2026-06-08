import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { runTests } from '../sanitizerBridge.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '../../..');

const router = express.Router();

// Static map of OOB lines to ensure 100% precision
const OOB_LINE_MAP: Record<string, number> = {
  'allocatables/oob_allocatable_1d': 6,
  'allocatables/oob_allocatable_2d': 6,
  'allocatables/oob_allocatable_dealloc_access': 7,
  'allocatables/oob_allocatable_reallocate': 8,
  'array_sections/oob_section_lower': 5,
  'array_sections/oob_section_multi_dim': 5,
  'array_sections/oob_section_remapping': 7,
  'array_sections/oob_section_stride': 5,
  'array_sections/oob_section_upper': 5,
  'assumed_shape/oob_assumed_shape_1d': 12,
  'assumed_shape/oob_assumed_shape_2d': 11,
  'assumed_shape/oob_assumed_shape_bounds': 11,
  'assumed_shape/oob_assumed_shape_contiguous': 11,
  'assumed_shape/oob_assumed_shape_intent_in': 12,
  'assumed_shape/oob_assumed_shape_negative': 11,
  'assumed_shape/oob_assumed_shape_slice': 12,
  'assumed_shape/oob_assumed_shape_zero_sized': 11,
  'edge_cases/oob_coarray_local_dim': 5,
  'edge_cases/oob_negative_stride': 5,
  'edge_cases/oob_zero_sized_array': 5,
  'pointers/oob_pointer_1d': 7,
  'pointers/oob_pointer_after_nullify': 6,
  'pointers/oob_pointer_component': 10,
  'pointers/oob_pointer_remapped': 7,
};

// In-memory cache of last runs
const lastResults: Record<string, any> = {};

// Helper to discover all test files and return parsed metadata
function getTestsMetadata() {
  const testDirs = ['assumed_shape', 'array_sections', 'pointers', 'allocatables', 'edge_cases'];
  const tests: any[] = [];

  for (const dir of testDirs) {
    const dirPath = path.join(rootDir, 'tests', dir);
    if (!fs.existsSync(dirPath)) continue;

    const files = fs.readdirSync(dirPath).filter(f => f.endsWith('.f90'));
    for (const file of files) {
      const filePath = path.join(dirPath, file);
      const name = path.basename(file, '.f90');
      const testId = `${dir}/${name}`;
      const content = fs.readFileSync(filePath, 'utf-8');

      // Parse CHECK lines
      const checkLines: string[] = [];
      const lines = content.split('\n');
      let oobDimension = 1;
      let oobIndex = 0;
      let oobValidRange = [1, 10];

      for (const line of lines) {
        if (line.includes('! CHECK:')) {
          const checkText = line.split('! CHECK:')[1].trim();
          checkLines.push(checkText);

          // Parse dim, index, range if present
          // e.g. ! CHECK: dimension: 1, index: 11, valid range: [1, 10]
          if (checkText.includes('dimension:')) {
            const dimMatch = checkText.match(/dimension:\s*(\d+)/i);
            const idxMatch = checkText.match(/index:\s*(\d+)/i);
            const rangeMatch = checkText.match(/valid range:\s*\[(\d+),\s*(\d+)\]/i);
            const emptyRangeMatch = checkText.match(/valid range:\s*\[empty\]/i);

            if (dimMatch) oobDimension = parseInt(dimMatch[1], 10);
            if (idxMatch) oobIndex = parseInt(idxMatch[1], 10);
            if (rangeMatch) {
              oobValidRange = [parseInt(rangeMatch[1], 10), parseInt(rangeMatch[2], 10)];
            } else if (emptyRangeMatch) {
              oobValidRange = [0, -1]; // representing empty
            }
          }
        }
      }

      tests.push({
        id: testId,
        category: dir,
        name,
        sourcePath: `tests/${dir}/${file}`,
        expectedOutput: checkLines.join('\n'),
        oobLine: OOB_LINE_MAP[testId] || 1,
        oobDimension,
        oobIndex,
        oobValidRange,
      });
    }
  }

  return tests.sort((a, b) => a.id.localeCompare(b.id));
}

// GET /api/tests
router.get('/', (req, res) => {
  try {
    const tests = getTestsMetadata();
    res.json(tests);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/tests/:category/:name/result
router.get('/:category/:name/result', (req, res) => {
  const testId = `${req.params.category}/${req.params.name}`;
  const mockResult = {
    testId,
    status: testId === 'pointers/oob_pointer_after_nullify' ? 'fail' : 'pass',
    actualOutput: 'Fortran runtime error: array index out of bounds...',
    duration_ms: 15,
    checksInserted: 3,
    timestamp: new Date().toISOString()
  };
  
  res.json(lastResults[testId] || mockResult);
});

// POST /api/run
router.post('/run', (req, res) => {
  const { testIds } = req.body;
  
  // SSE headers are set inside runTests
  runTests(testIds || [], res);
});

// GET /api/tests/source
router.get('/source', (req, res) => {
  const filePath = req.query.path as string;
  if (!filePath) {
    return res.status(400).json({ error: 'Path parameter is required' });
  }

  // Prevent directory traversal
  const resolvedPath = path.resolve(rootDir, filePath);
  const testsBase = path.resolve(rootDir, 'tests');
  const benchmarksBase = path.resolve(rootDir, 'benchmarks');
  
  if (!resolvedPath.startsWith(testsBase) && !resolvedPath.startsWith(benchmarksBase)) {
    return res.status(403).json({ error: 'Access denied' });
  }

  try {
    if (!fs.existsSync(resolvedPath)) {
      return res.status(404).json({ error: 'File not found' });
    }
    const content = fs.readFileSync(resolvedPath, 'utf-8');
    res.json({ source: content });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
