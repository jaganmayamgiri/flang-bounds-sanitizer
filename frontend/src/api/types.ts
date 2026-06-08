export type TestCategory = 'assumed_shape' | 'array_sections' | 'pointers' | 'allocatables' | 'edge_cases';

export interface TestMetadata {
  id: string;
  category: TestCategory;
  name: string;
  sourcePath: string;
  expectedOutput: string;
  oobLine: number;
  oobDimension: number;
  oobIndex: number;
  oobValidRange: [number, number];
}

export interface TestResult {
  testId: string;
  status: 'pass' | 'fail' | 'skip' | 'pending';
  actualOutput: string;
  duration_ms: number;
  checksInserted: number;
  timestamp: string;
}

export interface TerminalLine {
  id: string;
  text: string;
  level: 'pass' | 'fail' | 'info' | 'meta';
  timestamp: number;
}

export interface RunSummary {
  exitCode: number;
  passed: number;
  failed: number;
  total: number;
  duration_ms: number;
  checksInserted: number;
  falsePositives: number;
}

export interface BenchmarkResult {
  program: string;
  domain: string;
  runs: number;
  baseline_times_ms: number[];
  instrumented_times_ms: number[];
  baseline_mean_ms: number;
  instrumented_mean_ms: number;
  overhead_pct: number;
  checks_inserted: number;
  checks_elided: number;
}

export interface PassOutput {
  sourcePath: string;
  beforeMLIR: string;
  afterMLIR: string;
  checksInserted: number;
  linesAdded: number;
}
