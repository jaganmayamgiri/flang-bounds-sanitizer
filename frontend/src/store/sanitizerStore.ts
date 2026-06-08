import { create } from 'zustand';
import { TestMetadata, TestResult, TerminalLine, RunSummary, BenchmarkResult, PassOutput, TestCategory } from '../api/types';
import { fetchTests, fetchBenchmarks, fetchPassOutput, fetchTestResult } from '../api/client';

interface SanitizerState {
  // Test inventory
  tests: TestMetadata[];
  results: Record<string, TestResult>;
  selectedCategory: TestCategory | 'all';
  testsLoading: boolean;
  setCategory: (category: TestCategory | 'all') => void;
  loadTests: () => Promise<void>;
  loadResultForTest: (category: string, name: string) => Promise<void>;

  // Execution state
  runStatus: 'idle' | 'running' | 'done' | 'error';
  terminalLines: TerminalLine[];
  runSummary: RunSummary | null;
  activeController: AbortController | null;
  startRun: (testIds: string[]) => Promise<void>;
  abortRun: () => void;
  clearTerminal: () => void;

  // Benchmarks
  benchmarks: BenchmarkResult[];
  benchmarksLoading: boolean;
  loadBenchmarks: () => Promise<void>;

  // Pass inspector
  selectedSourceFile: string | null;
  passOutput: PassOutput | null;
  passOutputLoading: boolean;
  setSelectedSourceFile: (file: string | null) => void;
  loadPassOutput: (sourcePath: string) => Promise<void>;
}

export const useSanitizerStore = create<SanitizerState>((set, get) => ({
  tests: [],
  results: {},
  selectedCategory: 'all',
  testsLoading: false,
  setCategory: (category) => set({ selectedCategory: category }),
  
  loadTests: async () => {
    set({ testsLoading: true });
    try {
      const tests = await fetchTests();
      set({ tests, testsLoading: false });
    } catch (err) {
      console.error('Failed loading tests:', err);
      set({ testsLoading: false });
    }
  },

  loadResultForTest: async (category, name) => {
    const testId = `${category}/${name}`;
    try {
      const result = await fetchTestResult(category, name);
      set((state) => ({
        results: { ...state.results, [testId]: result }
      }));
    } catch (err) {
      console.error(`Failed loading result for ${testId}:`, err);
    }
  },

  // Running tests & terminal streaming
  runStatus: 'idle',
  terminalLines: [],
  runSummary: null,
  activeController: null,

  clearTerminal: () => set({ terminalLines: [], runSummary: null, runStatus: 'idle' }),

  abortRun: () => {
    const { activeController } = get();
    if (activeController) {
      activeController.abort();
      set({
        runStatus: 'idle',
        activeController: null
      });
      const abortLine: TerminalLine = {
        id: Math.random().toString(),
        text: '>>> Run aborted by user.',
        level: 'meta',
        timestamp: Date.now()
      };
      set((state) => ({
        terminalLines: [...state.terminalLines, abortLine]
      }));
    }
  },

  startRun: async (testIds) => {
    // Abort active run if any
    get().abortRun();
    
    set({
      runStatus: 'running',
      terminalLines: [],
      runSummary: null
    });

    const controller = new AbortController();
    set({ activeController: controller });

    try {
      // If we are in mock mode, simulate stream
      const isMock = import.meta.env.VITE_USE_MOCK === 'true';
      if (isMock) {
        set({
          terminalLines: [
            { id: 'm1', text: '=========================================================', level: 'meta', timestamp: Date.now() },
            { id: 'm2', text: '  RUNNING CORRETNESS TESTS (MOCK SIMULATION MODE)', level: 'info', timestamp: Date.now() },
            { id: 'm3', text: '=========================================================', level: 'meta', timestamp: Date.now() },
            { id: 'm4', text: 'Building shims...', level: 'info', timestamp: Date.now() },
          ]
        });

        const testsToRun = testIds.length ? get().tests.filter(t => testIds.includes(t.id)) : get().tests;
        
        let idx = 0;
        const interval = setInterval(() => {
          if (idx >= testsToRun.length) {
            clearInterval(interval);
            const passed = testsToRun.filter(t => t.id !== 'pointers/oob_pointer_after_nullify').length;
            const failed = testsToRun.length - passed;
            const summary: RunSummary = {
              exitCode: failed > 0 ? 1 : 0,
              passed,
              failed,
              total: testsToRun.length,
              duration_ms: testsToRun.length * 15,
              checksInserted: testsToRun.length * 3 + 4,
              falsePositives: 0
            };
            set((state) => ({
              runStatus: 'done',
              runSummary: summary,
              terminalLines: [
                ...state.terminalLines,
                { id: `d1`, text: '=========================================================', level: 'meta', timestamp: Date.now() },
                { id: `d2`, text: 'SUMMARY:', level: 'meta', timestamp: Date.now() },
                { id: `d3`, text: `  Passed: ${passed} / ${testsToRun.length}`, level: 'pass', timestamp: Date.now() },
                { id: `d4`, text: `  Failed: ${failed} / ${testsToRun.length}`, level: failed > 0 ? 'fail' : 'pass', timestamp: Date.now() },
                { id: `d5`, text: '=========================================================', level: 'meta', timestamp: Date.now() }
              ],
              activeController: null
            }));
            return;
          }

          const currentTest = testsToRun[idx];
          const passed = currentTest.id !== 'pointers/oob_pointer_after_nullify';
          
          set((state) => {
            const newLines: TerminalLine[] = [
              {
                id: `t-run-${currentTest.id}`,
                text: `Running test case: ${currentTest.sourcePath}...`,
                level: 'info',
                timestamp: Date.now()
              }
            ];

            if (passed) {
              newLines.push({
                id: `t-pass-${currentTest.id}`,
                text: `PASS: ${currentTest.id} executed successfully and caught OOB bounds.`,
                level: 'pass',
                timestamp: Date.now()
              });
            } else {
              newLines.push({
                id: `t-fail-1-${currentTest.id}`,
                text: `Fortran runtime error: array not associated or allocated`,
                level: 'fail',
                timestamp: Date.now()
              });
              newLines.push({
                id: `t-fail-2-${currentTest.id}`,
                text: `FAIL: ${currentTest.id} disassociation was NOT caught or triggered panic.`,
                level: 'fail',
                timestamp: Date.now()
              });
            }

            return {
              terminalLines: [...state.terminalLines, ...newLines]
            };
          });
          idx++;
        }, 300);

        // Keep track of interval so abort works
        controller.signal.addEventListener('abort', () => {
          clearInterval(interval);
        });

        return;
      }

      // Real network stream via readable stream fetch
      const response = await fetch('/api/tests/run', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ testIds }),
        signal: controller.signal
      });

      if (!response.body) {
        throw new Error('Readable stream not supported by server response.');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const parts = buffer.split('\n\n');
        buffer = parts.pop() || ''; // Keep the incomplete part

        for (const part of parts) {
          if (part.startsWith('data: ')) {
            const rawData = part.substring(6);
            try {
              const event = JSON.parse(rawData);
              if (event.type === 'line') {
                const line: TerminalLine = {
                  id: Math.random().toString(),
                  text: event.data.text,
                  level: event.data.level,
                  timestamp: Date.now()
                };
                set((state) => ({
                  terminalLines: [...state.terminalLines, line]
                }));
              } else if (event.type === 'done') {
                set({
                  runStatus: 'done',
                  runSummary: event.data,
                  activeController: null
                });
              } else if (event.type === 'error') {
                const line: TerminalLine = {
                  id: Math.random().toString(),
                  text: `ERROR: ${event.data.message}`,
                  level: 'fail',
                  timestamp: Date.now()
                };
                set((state) => ({
                  terminalLines: [...state.terminalLines, line],
                  runStatus: 'error',
                  activeController: null
                }));
              }
            } catch (e) {
              console.error('Failed parsing stream chunk:', e);
            }
          }
        }
      }

      set({ runStatus: 'done', activeController: null });
    } catch (error: any) {
      if (error.name === 'AbortError') return;
      console.error('Fetch run error:', error);
      const line: TerminalLine = {
        id: Math.random().toString(),
        text: `Execution failed: ${error.message}`,
        level: 'fail',
        timestamp: Date.now()
      };
      set((state) => ({
        terminalLines: [...state.terminalLines, line],
        runStatus: 'error',
        activeController: null
      }));
    }
  },

  // Benchmarks
  benchmarks: [],
  benchmarksLoading: false,
  loadBenchmarks: async () => {
    set({ benchmarksLoading: true });
    try {
      const benchmarks = await fetchBenchmarks();
      set({ benchmarks, benchmarksLoading: false });
    } catch (err) {
      console.error('Failed loading benchmarks:', err);
      set({ benchmarksLoading: false });
    }
  },

  // Pass inspector
  selectedSourceFile: null,
  passOutput: null,
  passOutputLoading: false,
  setSelectedSourceFile: (file) => set({ selectedSourceFile: file }),
  loadPassOutput: async (sourcePath) => {
    set({ passOutputLoading: true });
    try {
      const passOutput = await fetchPassOutput(sourcePath);
      set({ passOutput, passOutputLoading: false });
    } catch (err) {
      console.error('Failed loading pass output:', err);
      set({ passOutputLoading: false });
    }
  }
}));
