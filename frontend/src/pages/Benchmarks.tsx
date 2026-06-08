import React, { useEffect } from 'react';
import { useSanitizerStore } from '../store/sanitizerStore';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Legend } from 'recharts';
import { Shield, TrendingUp, AlertOctagon, HelpCircle } from 'lucide-react';

export function Benchmarks() {
  const { benchmarks, loadBenchmarks, benchmarksLoading } = useSanitizerStore();

  useEffect(() => {
    loadBenchmarks();
  }, []);

  // Format data for Recharts
  const chartData = benchmarks.map(b => ({
    name: b.program,
    Baseline: parseFloat((b.baseline_mean_ms / 1000).toFixed(3)),
    Sanitized: parseFloat((b.instrumented_mean_ms / 1000).toFixed(3)),
    Overhead: b.overhead_pct,
    unit: 's'
  }));

  // Sparkline SVG component helper
  const renderSparkline = (times: number[], color: string) => {
    if (!times || times.length === 0) return null;
    const min = Math.min(...times);
    const max = Math.max(...times);
    const range = max - min || 1;
    
    // Normalize coordinates for an 80x20 canvas
    const points = times.map((t, idx) => {
      const x = (idx / (times.length - 1)) * 70 + 5;
      const y = 20 - ((t - min) / range) * 12 - 4;
      return `${x},${y}`;
    }).join(' ');

    return (
      <svg className="w-20 h-6 overflow-visible" stroke={color} fill="none" strokeWidth={1.5}>
        <polyline points={points} strokeLinecap="round" strokeLinejoin="round" />
        {times.map((t, idx) => {
          const x = (idx / (times.length - 1)) * 70 + 5;
          const y = 20 - ((t - min) / range) * 12 - 4;
          return <circle key={idx} cx={x} cy={y} r={2} fill={color} />;
        })}
      </svg>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-display">Performance Benchmarks</h2>
        <p className="text-sm text-secondary">
          Overhead measurements comparing baseline execution against instrumented (sanitized) binaries.
        </p>
      </div>

      {benchmarksLoading ? (
        <div className="text-center py-12 text-muted animate-pulse">
          Loading benchmark results...
        </div>
      ) : (
        <>
          {/* Main Chart */}
          <div className="bg-surface border border-border-default rounded p-6">
            <h3 className="text-heading mb-4 border-b border-border-default pb-2">
              Execution Overhead (Seconds) vs 15% Threshold
            </h3>

            <div className="h-80 w-full text-code">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={chartData}
                  margin={{ top: 20, right: 30, left: 0, bottom: 5 }}
                  barGap={4}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#222" />
                  <XAxis dataKey="name" stroke="#666" tick={{ fontSize: 11 }} />
                  <YAxis stroke="#666" tick={{ fontSize: 11 }} label={{ value: 'Time (Seconds)', angle: -90, position: 'insideLeft', offset: 10 }} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#1c1f22', borderColor: '#383d42', color: '#e8eaec', fontSize: '11px' }}
                    labelStyle={{ fontFamily: 'var(--font-mono)', fontWeight: 'bold' }}
                    formatter={(value: any) => [`${value}s`]}
                  />
                  <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: '11px', fontFamily: 'var(--font-mono)' }} />
                  <Bar dataKey="Baseline" fill="var(--color-info)" name="Uninstrumented Baseline" />
                  <Bar dataKey="Sanitized" fill="var(--color-accent)" name="Sanitized (With Checks)" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Program Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {benchmarks.map((bench) => {
              const baseMeanS = (bench.baseline_mean_ms / 1000).toFixed(3);
              const instMeanS = (bench.instrumented_mean_ms / 1000).toFixed(3);
              const baseStdev = (Math.max(...bench.baseline_times_ms) - Math.min(...bench.baseline_times_ms)) / 2;
              const baseStdevS = (baseStdev / 1000).toFixed(3);
              
              return (
                <div key={bench.program} className="bg-surface border border-border-default rounded flex flex-col overflow-hidden">
                  {/* Card Title */}
                  <div className="bg-elevated px-4 py-3 border-b border-border-default flex items-center justify-between">
                    <span className="font-mono font-bold text-primary">{bench.program}.f90</span>
                    <span className="text-[10px] bg-base px-2 py-0.5 rounded text-secondary uppercase font-mono">
                      {bench.domain}
                    </span>
                  </div>

                  {/* Card Body */}
                  <div className="p-4 flex-1 space-y-4 font-mono text-xs text-secondary">
                    {/* Visual Comparison Bars */}
                    <div className="space-y-2.5">
                      {/* Baseline Row */}
                      <div className="space-y-1">
                        <div className="flex justify-between items-center text-[10px]">
                          <span>Baseline:</span>
                          <span className="text-primary font-bold">{baseMeanS}s</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <div className="flex-1 bg-elevated h-3 rounded overflow-hidden">
                            <div className="bg-info h-full rounded" style={{ width: '85%' }}></div>
                          </div>
                          <div className="shrink-0">
                            {renderSparkline(bench.baseline_times_ms, 'var(--color-info)')}
                          </div>
                        </div>
                      </div>

                      {/* Sanitized Row */}
                      <div className="space-y-1">
                        <div className="flex justify-between items-center text-[10px]">
                          <span>Sanitized (+{bench.overhead_pct.toFixed(2)}%):</span>
                          <span className="text-accent font-bold">{instMeanS}s</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <div className="flex-1 bg-elevated h-3 rounded overflow-hidden">
                            <div className="bg-accent h-full rounded" style={{ width: `${85 * (1 + bench.overhead_pct / 100)}%` }}></div>
                          </div>
                          <div className="shrink-0">
                            {renderSparkline(bench.instrumented_times_ms, 'var(--color-accent)')}
                          </div>
                        </div>
                      </div>
                    </div>

                    <hr className="border-border-subtle" />

                    {/* Stats details list */}
                    <div className="grid grid-cols-2 gap-y-2 text-[11px] leading-relaxed">
                      <div>Iterations:</div>
                      <div className="text-primary font-bold text-right">{bench.runs} runs</div>
                      
                      <div>Std Dev σ:</div>
                      <div className="text-primary text-right">± {baseStdevS}s</div>

                      <div>Checks Inserted:</div>
                      <div className="text-primary text-right">{bench.checks_inserted.toLocaleString()}</div>

                      <div>Checks Elided:</div>
                      <div className="text-pass text-right">{bench.checks_elided.toLocaleString()}</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Methodology Card */}
          <div className="bg-elevated/40 border border-border-subtle rounded p-4 text-xs leading-relaxed text-secondary font-mono">
            <h4 className="font-bold text-primary mb-1.5 flex items-center">
              <Shield size={14} className="text-accent mr-1.5" />
              Methodology & Compiler Optimization
            </h4>
            <p className="mb-2">
              Benchmarks are measured on an x86_64 CPU inside the WSL2 Ubuntu subsystem. Uninstrumented programs are compiled using <code>gfortran -O3</code>.
              Sanitized programs are instrumented using the HLFIR array checker pass (inserting inlined bounds guards and runtime shim boundaries) and compiled with <code>gfortran -O3</code>.
            </p>
            <p>
              To keep check overhead under the target 15% limit, static analysis automatically elides bounds assertions for arrays with compile-time constant shapes and induction indexes that are statically provable within bounds.
            </p>
          </div>
        </>
      )}
    </div>
  );
}
