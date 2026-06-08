import { TestMetadata, TestResult, BenchmarkResult, PassOutput } from './types';

export const mockTests: TestMetadata[] = [
  {
    id: 'allocatables/oob_allocatable_1d',
    category: 'allocatables',
    name: 'oob_allocatable_1d',
    sourcePath: 'tests/allocatables/oob_allocatable_1d.f90',
    expectedOutput: 'array index out of bounds\ndimension: 1, index: 101, valid range: [1, 100]',
    oobLine: 6,
    oobDimension: 1,
    oobIndex: 101,
    oobValidRange: [1, 100]
  },
  {
    id: 'allocatables/oob_allocatable_2d',
    category: 'allocatables',
    name: 'oob_allocatable_2d',
    sourcePath: 'tests/allocatables/oob_allocatable_2d.f90',
    expectedOutput: 'array index out of bounds\ndimension: 2, index: 11, valid range: [1, 10]',
    oobLine: 6,
    oobDimension: 2,
    oobIndex: 11,
    oobValidRange: [1, 10]
  },
  {
    id: 'allocatables/oob_allocatable_dealloc_access',
    category: 'allocatables',
    name: 'oob_allocatable_dealloc_access',
    sourcePath: 'tests/allocatables/oob_allocatable_dealloc_access.f90',
    expectedOutput: 'array not associated or allocated',
    oobLine: 7,
    oobDimension: 1,
    oobIndex: 1,
    oobValidRange: [0, -1]
  },
  {
    id: 'allocatables/oob_allocatable_reallocate',
    category: 'allocatables',
    name: 'oob_allocatable_reallocate',
    sourcePath: 'tests/allocatables/oob_allocatable_reallocate.f90',
    expectedOutput: 'array index out of bounds\ndimension: 1, index: 6, valid range: [1, 5]',
    oobLine: 8,
    oobDimension: 1,
    oobIndex: 6,
    oobValidRange: [1, 5]
  },
  {
    id: 'array_sections/oob_section_lower',
    category: 'array_sections',
    name: 'oob_section_lower',
    sourcePath: 'tests/array_sections/oob_section_lower.f90',
    expectedOutput: 'array index out of bounds\ndimension: 1, index: -5, valid range: [1, 10]',
    oobLine: 5,
    oobDimension: 1,
    oobIndex: -5,
    oobValidRange: [1, 10]
  },
  {
    id: 'array_sections/oob_section_multi_dim',
    category: 'array_sections',
    name: 'oob_section_multi_dim',
    sourcePath: 'tests/array_sections/oob_section_multi_dim.f90',
    expectedOutput: 'array index out of bounds\ndimension: 2, index: 6, valid range: [1, 5]',
    oobLine: 5,
    oobDimension: 2,
    oobIndex: 6,
    oobValidRange: [1, 5]
  },
  {
    id: 'array_sections/oob_section_remapping',
    category: 'array_sections',
    name: 'oob_section_remapping',
    sourcePath: 'tests/array_sections/oob_section_remapping.f90',
    expectedOutput: 'array index out of bounds\ndimension: 2, index: 6, valid range: [1, 5]',
    oobLine: 7,
    oobDimension: 2,
    oobIndex: 6,
    oobValidRange: [1, 5]
  },
  {
    id: 'array_sections/oob_section_stride',
    category: 'array_sections',
    name: 'oob_section_stride',
    sourcePath: 'tests/array_sections/oob_section_stride.f90',
    expectedOutput: 'array index out of bounds\ndimension: 1, index: 99, valid range: [1, 50]',
    oobLine: 5,
    oobDimension: 1,
    oobIndex: 99,
    oobValidRange: [1, 50]
  },
  {
    id: 'array_sections/oob_section_upper',
    category: 'array_sections',
    name: 'oob_section_upper',
    sourcePath: 'tests/array_sections/oob_section_upper.f90',
    expectedOutput: 'array index out of bounds\ndimension: 1, index: 11, valid range: [1, 10]',
    oobLine: 5,
    oobDimension: 1,
    oobIndex: 11,
    oobValidRange: [1, 10]
  },
  {
    id: 'assumed_shape/oob_assumed_shape_1d',
    category: 'assumed_shape',
    name: 'oob_assumed_shape_1d',
    sourcePath: 'tests/assumed_shape/oob_assumed_shape_1d.f90',
    expectedOutput: 'array index out of bounds\ndimension: 1, index: 11, valid range: [1, 10]',
    oobLine: 12,
    oobDimension: 1,
    oobIndex: 11,
    oobValidRange: [1, 10]
  },
  {
    id: 'assumed_shape/oob_assumed_shape_2d',
    category: 'assumed_shape',
    name: 'oob_assumed_shape_2d',
    sourcePath: 'tests/assumed_shape/oob_assumed_shape_2d.f90',
    expectedOutput: 'array index out of bounds\ndimension: 2, index: 6, valid range: [1, 5]',
    oobLine: 11,
    oobDimension: 2,
    oobIndex: 6,
    oobValidRange: [1, 5]
  },
  {
    id: 'assumed_shape/oob_assumed_shape_bounds',
    category: 'assumed_shape',
    name: 'oob_assumed_shape_bounds',
    sourcePath: 'tests/assumed_shape/oob_assumed_shape_bounds.f90',
    expectedOutput: 'array index out of bounds\ndimension: 1, index: 4, valid range: [5, 14]',
    oobLine: 11,
    oobDimension: 1,
    oobIndex: 4,
    oobValidRange: [5, 14]
  },
  {
    id: 'assumed_shape/oob_assumed_shape_contiguous',
    category: 'assumed_shape',
    name: 'oob_assumed_shape_contiguous',
    sourcePath: 'tests/assumed_shape/oob_assumed_shape_contiguous.f90',
    expectedOutput: 'array index out of bounds\ndimension: 1, index: 12, valid range: [1, 10]',
    oobLine: 11,
    oobDimension: 1,
    oobIndex: 12,
    oobValidRange: [1, 10]
  },
  {
    id: 'assumed_shape/oob_assumed_shape_intent_in',
    category: 'assumed_shape',
    name: 'oob_assumed_shape_intent_in',
    sourcePath: 'tests/assumed_shape/oob_assumed_shape_intent_in.f90',
    expectedOutput: 'array index out of bounds\ndimension: 1, index: 15, valid range: [1, 10]',
    oobLine: 12,
    oobDimension: 1,
    oobIndex: 15,
    oobValidRange: [1, 10]
  },
  {
    id: 'assumed_shape/oob_assumed_shape_negative',
    category: 'assumed_shape',
    name: 'oob_assumed_shape_negative',
    sourcePath: 'tests/assumed_shape/oob_assumed_shape_negative.f90',
    expectedOutput: 'array index out of bounds\ndimension: 1, index: 0, valid range: [1, 10]',
    oobLine: 11,
    oobDimension: 1,
    oobIndex: 0,
    oobValidRange: [1, 10]
  },
  {
    id: 'assumed_shape/oob_assumed_shape_slice',
    category: 'assumed_shape',
    name: 'oob_assumed_shape_slice',
    sourcePath: 'tests/assumed_shape/oob_assumed_shape_slice.f90',
    expectedOutput: 'array index out of bounds\ndimension: 1, index: 6, valid range: [1, 5]',
    oobLine: 12,
    oobDimension: 1,
    oobIndex: 6,
    oobValidRange: [1, 5]
  },
  {
    id: 'assumed_shape/oob_assumed_shape_zero_sized',
    category: 'assumed_shape',
    name: 'oob_assumed_shape_zero_sized',
    sourcePath: 'tests/assumed_shape/oob_assumed_shape_zero_sized.f90',
    expectedOutput: 'array index out of bounds\ndimension: 1, index: 1, valid range: [empty]',
    oobLine: 11,
    oobDimension: 1,
    oobIndex: 1,
    oobValidRange: [0, -1]
  },
  {
    id: 'edge_cases/oob_coarray_local_dim',
    category: 'edge_cases',
    name: 'oob_coarray_local_dim',
    sourcePath: 'tests/edge_cases/oob_coarray_local_dim.f90',
    expectedOutput: 'array index out of bounds\ndimension: 1, index: 11, valid range: [1, 10]',
    oobLine: 5,
    oobDimension: 1,
    oobIndex: 11,
    oobValidRange: [1, 10]
  },
  {
    id: 'edge_cases/oob_negative_stride',
    category: 'edge_cases',
    name: 'oob_negative_stride',
    sourcePath: 'tests/edge_cases/oob_negative_stride.f90',
    expectedOutput: 'array index out of bounds\ndimension: 1, index: 0, valid range: [1, 10]',
    oobLine: 5,
    oobDimension: 1,
    oobIndex: 0,
    oobValidRange: [1, 10]
  },
  {
    id: 'edge_cases/oob_zero_sized_array',
    category: 'edge_cases',
    name: 'oob_zero_sized_array',
    sourcePath: 'tests/edge_cases/oob_zero_sized_array.f90',
    expectedOutput: 'array index out of bounds\ndimension: 1, index: 1, valid range: [empty]',
    oobLine: 5,
    oobDimension: 1,
    oobIndex: 1,
    oobValidRange: [0, -1]
  },
  {
    id: 'pointers/oob_pointer_1d',
    category: 'pointers',
    name: 'oob_pointer_1d',
    sourcePath: 'tests/pointers/oob_pointer_1d.f90',
    expectedOutput: 'array index out of bounds\ndimension: 1, index: 11, valid range: [1, 10]',
    oobLine: 7,
    oobDimension: 1,
    oobIndex: 11,
    oobValidRange: [1, 10]
  },
  {
    id: 'pointers/oob_pointer_after_nullify',
    category: 'pointers',
    name: 'oob_pointer_after_nullify',
    sourcePath: 'tests/pointers/oob_pointer_after_nullify.f90',
    expectedOutput: 'array not associated or allocated',
    oobLine: 6,
    oobDimension: 1,
    oobIndex: 1,
    oobValidRange: [0, -1]
  },
  {
    id: 'pointers/oob_pointer_component',
    category: 'pointers',
    name: 'oob_pointer_component',
    sourcePath: 'tests/pointers/oob_pointer_component.f90',
    expectedOutput: 'array index out of bounds\ndimension: 1, index: 6, valid range: [1, 5]',
    oobLine: 10,
    oobDimension: 1,
    oobIndex: 6,
    oobValidRange: [1, 5]
  },
  {
    id: 'pointers/oob_pointer_remapped',
    category: 'pointers',
    name: 'oob_pointer_remapped',
    sourcePath: 'tests/pointers/oob_pointer_remapped.f90',
    expectedOutput: 'array index out of bounds\ndimension: 1, index: 3, valid range: [1, 2]',
    oobLine: 7,
    oobDimension: 1,
    oobIndex: 3,
    oobValidRange: [1, 2]
  }
];

export const mockResults: TestResult[] = mockTests.map((t, idx) => ({
  testId: t.id,
  status: t.id === 'pointers/oob_pointer_after_nullify' ? 'fail' : 'pass',
  actualOutput: t.id === 'pointers/oob_pointer_after_nullify' 
    ? `Fortran runtime error: array not associated or allocated\n  file: ${t.sourcePath}, line: ${t.oobLine}\nAborted`
    : `Fortran runtime error: array index out of bounds\n  file: ${t.sourcePath}, line: ${t.oobLine}\n  dimension: ${t.oobDimension}, index: ${t.oobIndex}, valid range: [${t.oobValidRange[0] === 0 && t.oobValidRange[1] === -1 ? 'empty' : t.oobValidRange.join(', ')}]\nAborted`,
  duration_ms: 10 + (idx % 5) * 3,
  checksInserted: 3 + (idx % 3),
  timestamp: new Date(Date.now() - 3600000 * (idx + 1)).toISOString()
}));

export const mockBenchmarks: BenchmarkResult[] = [
  {
    program: 'jacobi_2d',
    domain: 'Stencil',
    runs: 5,
    baseline_times_ms: [812, 824, 831, 818, 825],
    instrumented_times_ms: [881, 892, 904, 891, 885],
    baseline_mean_ms: 822.0,
    instrumented_mean_ms: 890.6,
    overhead_pct: 8.35,
    checks_inserted: 2048,
    checks_elided: 312
  },
  {
    program: 'gemm',
    domain: 'BLAS',
    runs: 5,
    baseline_times_ms: [1132, 1145, 1151, 1140, 1142],
    instrumented_times_ms: [1201, 1215, 1222, 1211, 1205],
    baseline_mean_ms: 1142.0,
    instrumented_mean_ms: 1210.8,
    overhead_pct: 6.02,
    checks_inserted: 1536,
    checks_elided: 124
  },
  {
    program: 'heat_3d',
    domain: 'PDE',
    runs: 5,
    baseline_times_ms: [2011, 2032, 2045, 2030, 2022],
    instrumented_times_ms: [2170, 2191, 2205, 2182, 2190],
    baseline_mean_ms: 2028.0,
    instrumented_mean_ms: 2187.6,
    overhead_pct: 7.87,
    checks_inserted: 4096,
    checks_elided: 842
  }
];

export const mockPassOutputs: Record<string, PassOutput> = {
  'tests/assumed_shape/oob_assumed_shape_1d.f90': {
    sourcePath: 'tests/assumed_shape/oob_assumed_shape_1d.f90',
    beforeMLIR: `// ----- HLFIR Before Bounds Check Pass -----
func.func @_QPsub(%arg0: !fir.box<!fir.array<?xi32>> {fir.bindc_name = "a"}) {
  %c11 = arith.constant 11 : index
  %0 = hlfir.designate %arg0 (%c11) : (!fir.box<!fir.array<?xi32>>, index) -> !fir.ref<i32>
  %1 = fir.load %0 : !fir.ref<i32>
  // Print operation
  return
}`,
    afterMLIR: `// ----- HLFIR After Bounds Check Pass -----
func.func @_QPsub(%arg0: !fir.box<!fir.array<?xi32>> {fir.bindc_name = "a"}) {
  %c11 = arith.constant 11 : index
  
  // [Pass inserted] Extract dimension 1 bounds
  %c0 = arith.constant 0 : index
  %box_dims:3 = fir.box_dims %arg0, %c0 : (!fir.box<!fir.array<?xi32>>, index) -> (index, index, index)
  %lb = %box_dims#0 : index
  %extent = %box_dims#1 : index
  
  // [Pass inserted] Check subscript
  %c1 = arith.constant 1 : index
  %ub = arith.addi %lb, %extent : index
  %ub_inc = arith.subi %ub, %c1 : index
  %is_ge = arith.cmpf ge, %c11, %lb : index
  %is_le = arith.cmpf le, %c11, %ub_inc : index
  %in_bounds = arith.andi %is_ge, %is_le : i1
  
  fir.if %in_bounds {
    // safe
  } else {
    // report runtime failure
    %dim = arith.constant 0 : i32
    %line = arith.constant 12 : i32
    %file = fir.string_lit "tests/assumed_shape/oob_assumed_shape_1d.f90\\00"
    fir.call @_FortranABoundsCheck(%arg0, %dim, %c11, %file, %line) : (!fir.box<!fir.array<?xi32>>, i32, index, !fir.ref<i8>, i32) -> ()
    fir.unreachable
  }

  %0 = hlfir.designate %arg0 (%c11) : (!fir.box<!fir.array<?xi32>>, index) -> !fir.ref<i32>
  %1 = fir.load %0 : !fir.ref<i32>
  return
}`,
    checksInserted: 1,
    linesAdded: 22
  }
};
