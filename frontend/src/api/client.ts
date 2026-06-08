import { TestMetadata, TestResult, BenchmarkResult, PassOutput } from './types';
import * as mock from './mock';

const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true' || false;

console.log(`[API Client] Initialized. Using mock data: ${USE_MOCK}`);

export async function fetchTests(): Promise<TestMetadata[]> {
  if (USE_MOCK) {
    return mock.mockTests;
  }
  const res = await fetch('/api/tests');
  if (!res.ok) throw new Error('Failed to fetch tests');
  return res.json();
}

export async function fetchTestResult(category: string, name: string): Promise<TestResult> {
  if (USE_MOCK) {
    const testId = `${category}/${name}`;
    const result = mock.mockResults.find(r => r.testId === testId);
    if (result) return result;
    return {
      testId,
      status: 'pass',
      actualOutput: 'CFI descriptor checks passed.',
      duration_ms: 5,
      checksInserted: 2,
      timestamp: new Date().toISOString()
    };
  }
  const res = await fetch(`/api/tests/${category}/${name}/result`);
  if (!res.ok) throw new Error('Failed to fetch test result');
  return res.json();
}

export async function fetchBenchmarks(): Promise<BenchmarkResult[]> {
  if (USE_MOCK) {
    return mock.mockBenchmarks;
  }
  const res = await fetch('/api/benchmarks');
  if (!res.ok) throw new Error('Failed to fetch benchmarks');
  return res.json();
}

export async function fetchPassOutput(sourcePath: string): Promise<PassOutput> {
  if (USE_MOCK) {
    const output = mock.mockPassOutputs[sourcePath];
    if (output) return output;
    
    // Generate fallback
    return {
      sourcePath,
      beforeMLIR: `// ----- HLFIR Before bounds check pass -----\nfunc.func @test() {\n  // Accessing ${sourcePath}\n  return\n}`,
      afterMLIR: `// ----- HLFIR After bounds check pass -----\nfunc.func @test() {\n  // Accessing ${sourcePath}\n  // inserted check\n  return\n}`,
      checksInserted: 1,
      linesAdded: 8
    };
  }
  const encodedPath = encodeURIComponent(sourcePath);
  const res = await fetch(`/api/pass-output?sourcePath=${encodedPath}`);
  if (!res.ok) throw new Error('Failed to fetch pass output');
  return res.json();
}
