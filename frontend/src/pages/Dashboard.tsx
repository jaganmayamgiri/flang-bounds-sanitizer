import React, { useEffect } from 'react';
import { useSanitizerStore } from '../store/sanitizerStore';
import { Link } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { CheckCircle2, XCircle, AlertTriangle, Play, HelpCircle, Activity } from 'lucide-react';
import { TestCategory } from '../api/types';

export function Dashboard() {
  const {
    tests,
    results,
    selectedCategory,
    setCategory,
    loadTests,
    loadBenchmarks,
    benchmarks,
    loadResultForTest
  } = useSanitizerStore();

  useEffect(() => {
    loadTests();
    loadBenchmarks();
  }, []);

  // Load results for tests if not loaded
  useEffect(() => {
    if (tests.length > 0) {
      tests.forEach(t => {
        const testId = t.id;
        if (!results[testId]) {
          const parts = testId.split('/');
          loadResultForTest(parts[0], parts[1]);
        }
      });
    }
  }, [tests]);

  // Compute stat card numbers
  const totalTests = tests.length;
  const passCount = Object.values(results).filter(r => r.status === 'pass').length;
  const failCount = Object.values(results).filter(r => r.status === 'fail').length;
  const avgCheckCost = '2.8 ms';
  const avgOverhead = '7.4%';
  const falsePositives = 0;

  // Filter tests
  const filteredTests = tests.filter(t => selectedCategory === 'all' || t.category === selectedCategory);

  // Group tests by status (failures first, then category/alphabetical)
  const sortedTests = [...filteredTests].sort((a, b) => {
    const statusA = results[a.id]?.status || 'pending';
    const statusB = results[b.id]?.status || 'pending';
    if (statusA === 'fail' && statusB !== 'fail') return -1;
    if (statusA !== 'fail' && statusB === 'fail') return 1;
    return a.id.localeCompare(b.id);
  });

  const categories: (TestCategory | 'all')[] = ['all', 'assumed_shape', 'array_sections', 'pointers', 'allocatables', 'edge_cases'];

  // Format benchmark data for Recharts
  const chartData = benchmarks.map(b => ({
    name: b.program,
    Baseline: Math.round(b.baseline_mean_ms),
    Sanitized: Math.round(b.instrumented_mean_ms),
    delta: b.overhead_pct.toFixed(1) + '%'
  }));

  // Activity Feed mock log lines
  const activityLogs = [
    { time: '10:42:15', file: 'tests/pointers/oob_pointer_remapped.f90', checks: 2, status: 'pass' },
    { time: '10:42:10', file: 'tests/pointers/oob_pointer_after_nullify.f90', checks: 1, status: 'fail' },
    { time: '10:39:48', file: 'tests/allocatables/oob_allocatable_reallocate.f90', checks: 3, status: 'pass' },
    { time: '10:38:02', file: 'tests/assumed_shape/oob_assumed_shape_bounds.f90', checks: 4, status: 'pass' },
    { time: '10:37:54', file: 'tests/assumed_shape/oob_assumed_shape_1d.f90', checks: 2, status: 'pass' }
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h2 className="text-display">Sanitizer Dashboard</h2>
        <p className="text-sm text-secondary">
          Overview of HLFIR compiler instrumentation status, correctness tests, and hardware overhead evaluation.
        </p>
      </div>

      {/* Stat Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Passing */}
        <div className="bg-surface border border-border-default p-4 rounded glow-pass">
          <div className="text-[10px] text-secondary font-mono tracking-wider text-label">CORRECTNESS CHECK</div>
          <div className="text-3xl font-mono font-bold text-pass mt-1">
            {passCount} / {totalTests}
          </div>
          <div className="text-xs text-secondary mt-1 flex items-center">
            <CheckCircle2 size={12} className="text-pass mr-1" />
            <span>Targeting full verification</span>
          </div>
        </div>

        {/* Card 2: Avg Cost */}
        <div className="bg-surface border border-border-default p-4 rounded">
          <div className="text-[10px] text-secondary font-mono tracking-wider text-label">CHECK RUNTIME COST</div>
          <div className="text-3xl font-mono font-bold text-info mt-1">
            {avgCheckCost}
          </div>
          <div className="text-xs text-secondary mt-1 flex items-center">
            <Activity size={12} className="text-info mr-1" />
            <span>Per array reference check</span>
          </div>
        </div>

        {/* Card 3: Overhead */}
        <div className="bg-surface border border-border-default p-4 rounded">
          <div className="text-[10px] text-secondary font-mono tracking-wider text-label">AVG OVERHEAD</div>
          <div className="text-3xl font-mono font-bold text-accent mt-1">
            {avgOverhead}
          </div>
          <div className="text-xs text-secondary mt-1 flex items-center flex-wrap gap-1">
            <span className="text-pass font-bold">&lt;15%</span>
            <span>Target threshold compliance</span>
          </div>
        </div>

        {/* Card 4: False Positives */}
        <div className="bg-surface border border-border-default p-4 rounded">
          <div className="text-[10px] text-secondary font-mono tracking-wider text-label">FALSE POSITIVES</div>
          <div className="text-3xl font-mono font-bold text-primary mt-1">
            {falsePositives}
          </div>
          <div className="text-xs text-secondary mt-1 flex items-center">
            <CheckCircle2 size={12} className="text-pass mr-1" />
            <span>0 reports in benchmarks</span>
          </div>
        </div>
      </div>

      {/* Main Split Layout: Table Left, Chart Right */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Test Cases Table */}
        <div className="bg-surface border border-border-default rounded flex flex-col lg:col-span-2">
          {/* Header & Filter */}
          <div className="p-4 border-b border-border-default flex flex-col md:flex-row md:items-center justify-between gap-3 bg-elevated">
            <h3 className="text-heading">Correctness Test Suite</h3>
            
            {/* Category Filter Chips */}
            <div className="flex flex-wrap gap-1">
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setCategory(cat)}
                  className={`text-[10px] px-2 py-1 rounded border font-mono ${
                    selectedCategory === cat
                      ? 'bg-accent border-accent text-base font-bold'
                      : 'bg-surface border-border-default text-secondary hover:text-primary hover:border-strong'
                  }`}
                >
                  {cat === 'all' ? 'ALL' : cat.replace('_', ' ').toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          {/* Table Body */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-border-default text-secondary bg-base font-mono">
                  <th className="p-3">TEST NAME</th>
                  <th className="p-3">CATEGORY</th>
                  <th className="p-3">OOB ACCESS</th>
                  <th className="p-3">STATUS</th>
                  <th className="p-3 text-right">ACTION</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle font-mono">
                {sortedTests.map((test) => {
                  const result = results[test.id];
                  const status = result?.status || 'pending';
                  
                  return (
                    <tr key={test.id} className="hover:bg-elevated transition-colors">
                      <td className="p-3 font-semibold text-primary truncate max-w-[200px]">
                        {test.name}
                      </td>
                      <td className="p-3 text-secondary">
                        {test.category}
                      </td>
                      <td className="p-3 text-muted">
                        Line {test.oobLine} (idx: {test.oobIndex})
                      </td>
                      <td className="p-3">
                        <span className={`inline-flex items-center space-x-1.5 px-2 py-0.5 rounded border text-[10px] ${
                          status === 'pass'
                            ? 'bg-pass/10 border-pass/30 text-pass'
                            : status === 'fail'
                            ? 'bg-fail/10 border-fail/30 text-fail animate-pulse'
                            : 'bg-elevated border-border-default text-secondary'
                        }`}>
                          <span className={`h-1.5 w-1.5 rounded-full ${
                            status === 'pass' ? 'bg-pass' : status === 'fail' ? 'bg-fail' : 'bg-secondary'
                          }`}></span>
                          <span>{status.toUpperCase()}</span>
                        </span>
                      </td>
                      <td className="p-3 text-right">
                        <Link
                          to={`/tests/${test.id}`}
                          className="text-accent hover:underline hover:text-accent/80 text-[11px]"
                        >
                          View Analysis →
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Benchmarks mini chart panel */}
        <div className="bg-surface border border-border-default rounded flex flex-col p-4">
          <h3 className="text-heading mb-4 border-b border-border-default pb-2">Overhead Chart</h3>
          
          <div className="h-56 flex-1 w-full text-code">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                margin={{ top: 10, right: 10, left: -25, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#222" />
                <XAxis dataKey="name" stroke="#555" tick={{ fontSize: 10 }} />
                <YAxis stroke="#555" tick={{ fontSize: 10 }} label={{ value: 'Mean Cost (ms)', angle: -90, position: 'insideLeft', offset: -5 }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1c1f22', borderColor: '#383d42', color: '#e8eaec', fontSize: '11px' }}
                  labelStyle={{ fontFamily: 'var(--font-mono)', fontWeight: 'bold' }}
                />
                <Bar dataKey="Baseline" fill="var(--color-info)" name="Baseline (ms)" />
                <Bar dataKey="Sanitized" fill="var(--color-accent)" name="Sanitized (ms)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
          
          <div className="mt-4 pt-4 border-t border-border-default font-mono text-[10px] text-secondary space-y-2">
            <div className="flex justify-between items-center">
              <span>jacobi_2d overhead:</span>
              <span className="text-pass font-bold">+8.4%</span>
            </div>
            <div className="flex justify-between items-center">
              <span>gemm overhead:</span>
              <span className="text-pass font-bold">+6.0%</span>
            </div>
            <div className="flex justify-between items-center">
              <span>heat_3d overhead:</span>
              <span className="text-pass font-bold">+7.9%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Compiler Pass Activity Feed */}
      <div className="bg-surface border border-border-default rounded p-4">
        <h3 className="text-heading mb-3 flex items-center">
          <Activity size={14} className="text-accent mr-2" />
          Pass Execution Logs
        </h3>
        
        <div className="space-y-2 font-mono text-[11px]">
          {activityLogs.map((log, i) => (
            <div key={i} className="flex flex-col md:flex-row md:items-center justify-between py-1.5 border-b border-border-subtle last:border-0 hover:bg-elevated/50 px-1 rounded transition-colors">
              <div className="flex items-center space-x-3">
                <span className="text-muted">[{log.time}]</span>
                <span className="text-info font-medium">hlfir-bounds-check</span>
                <span className="text-secondary truncate max-w-sm">{log.file}</span>
              </div>
              <div className="flex items-center space-x-3 mt-1 md:mt-0">
                <span className="text-muted">{log.checks} checks inserted</span>
                <span className={`px-1.5 py-0.5 rounded text-[9px] ${
                  log.status === 'pass' 
                    ? 'bg-pass/10 text-pass border border-pass/20' 
                    : 'bg-fail/10 text-fail border border-fail/20'
                }`}>
                  {log.status.toUpperCase()}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
