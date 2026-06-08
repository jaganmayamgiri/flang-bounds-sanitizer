import React, { useEffect, useState, useRef } from 'react';
import { useSanitizerStore } from '../store/sanitizerStore';
import { Terminal as TerminalIcon, Play, Square, Copy, ArrowDownCircle, CheckSquare, Square as CheckboxEmpty } from 'lucide-react';
import { TestCategory } from '../api/types';

export function TestRunner() {
  const {
    tests,
    loadTests,
    runStatus,
    terminalLines,
    runSummary,
    startRun,
    abortRun,
    clearTerminal
  } = useSanitizerStore();

  const [selectedTests, setSelectedTests] = useState<string[]>([]);
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({
    assumed_shape: true,
    array_sections: true,
    pointers: true,
    allocatables: true,
    edge_cases: true,
  });

  const terminalEndRef = useRef<HTMLDivElement>(null);
  const terminalContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadTests();
  }, []);

  // Auto-scroll to bottom of terminal when new lines arrive
  useEffect(() => {
    if (terminalEndRef.current) {
      terminalEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [terminalLines]);

  // Group tests by category
  const testsByCategory: Record<TestCategory, typeof tests> = tests.reduce((acc, test) => {
    if (!acc[test.category]) {
      acc[test.category] = [];
    }
    acc[test.category].push(test);
    return acc;
  }, {} as Record<TestCategory, typeof tests>);

  const toggleCategoryExpand = (cat: string) => {
    setExpandedCategories(prev => ({ ...prev, [cat]: !prev[cat] }));
  };

  const handleSelectTest = (id: string) => {
    setSelectedTests(prev => {
      if (prev.includes(id)) {
        return prev.filter(t => t !== id);
      } else {
        return [...prev, id];
      }
    });
  };

  const handleSelectAllCategory = (cat: TestCategory) => {
    const catTests = testsByCategory[cat]?.map(t => t.id) || [];
    const allSelected = catTests.every(id => selectedTests.includes(id));
    
    if (allSelected) {
      setSelectedTests(prev => prev.filter(id => !catTests.includes(id)));
    } else {
      setSelectedTests(prev => [...new Set([...prev, ...catTests])]);
    }
  };

  const selectAll = () => {
    setSelectedTests(tests.map(t => t.id));
  };

  const selectNone = () => {
    setSelectedTests([]);
  };

  const handleRunSelected = () => {
    if (selectedTests.length === 0) return;
    startRun(selectedTests);
  };

  const handleRunAll = () => {
    startRun([]);
  };

  const handleCopyTerminal = () => {
    const text = terminalLines.map(l => l.text).join('\n');
    navigator.clipboard.writeText(text);
    alert('Terminal logs copied to clipboard.');
  };

  const getLineClass = (level: string) => {
    switch (level) {
      case 'pass': return 'text-pass';
      case 'fail': return 'text-fail font-bold';
      case 'meta': return 'text-muted';
      default: return 'text-code';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-display">Test Runner</h2>
          <p className="text-sm text-secondary">
            Execute correctness checks using the LLVM compiler and stream output logs.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left Panel: Test Tree Selector */}
        <div className="bg-surface border border-border-default rounded flex flex-col p-4 h-[600px]">
          <h3 className="text-heading mb-4 pb-2 border-b border-border-default flex justify-between items-center">
            <span>Test Suite</span>
            <span className="text-[10px] bg-elevated px-2 py-0.5 rounded text-secondary font-mono">
              {selectedTests.length} selected
            </span>
          </h3>

          <div className="flex justify-between gap-1 mb-4 text-[10px] font-mono">
            <button onClick={selectAll} className="flex-1 bg-elevated border border-border-default py-1 rounded hover:text-accent">
              SELECT ALL
            </button>
            <button onClick={selectNone} className="flex-1 bg-elevated border border-border-default py-1 rounded hover:text-accent">
              CLEAR
            </button>
          </div>

          <div className="flex-1 overflow-y-auto space-y-4 pr-1 text-xs">
            {Object.entries(testsByCategory).map(([category, catTests]) => {
              const allSelected = catTests.every(t => selectedTests.includes(t.id));
              const someSelected = catTests.some(t => selectedTests.includes(t.id)) && !allSelected;
              const isExpanded = expandedCategories[category];

              return (
                <div key={category} className="space-y-1.5 font-mono">
                  <div className="flex items-center justify-between group">
                    <button
                      onClick={() => toggleCategoryExpand(category)}
                      className="text-left font-semibold text-secondary hover:text-primary flex items-center space-x-1.5 flex-1"
                    >
                      <span>{isExpanded ? '▼' : '►'}</span>
                      <span className="truncate">{category.replace('_', ' ').toUpperCase()}</span>
                      <span className="text-[9px] text-muted">({catTests.length})</span>
                    </button>
                    
                    <button
                      onClick={() => handleSelectAllCategory(category as TestCategory)}
                      className="text-muted hover:text-accent"
                    >
                      {allSelected ? (
                        <span className="text-accent text-[10px] font-bold">[X]</span>
                      ) : someSelected ? (
                        <span className="text-accent/60 text-[10px] font-bold">[-]</span>
                      ) : (
                        <span className="text-[10px]">[ ]</span>
                      )}
                    </button>
                  </div>

                  {isExpanded && (
                    <div className="pl-4 border-l border-border-subtle space-y-1 mt-1.5">
                      {catTests.map(test => {
                        const isSelected = selectedTests.includes(test.id);
                        return (
                          <div
                            key={test.id}
                            onClick={() => handleSelectTest(test.id)}
                            className={`flex items-center justify-between py-1 px-1.5 rounded cursor-pointer transition-colors ${
                              isSelected ? 'bg-elevated/40 text-primary' : 'text-secondary hover:bg-elevated/20 hover:text-primary'
                            }`}
                          >
                            <span className="truncate max-w-[170px]" title={test.name}>
                              {test.name}
                            </span>
                            <span className="text-[10px]">
                              {isSelected ? '■' : '□'}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Panel: Terminal Output console */}
        <div className="lg:col-span-3 bg-surface border border-border-default rounded flex flex-col h-[600px] overflow-hidden">
          {/* Controls Bar */}
          <div className="bg-elevated px-4 py-3 border-b border-border-default flex items-center justify-between shrink-0">
            <div className="flex items-center space-x-2">
              <TerminalIcon size={16} className="text-secondary" />
              <h3 className="text-heading">Execution Monitor</h3>
            </div>

            <div className="flex items-center space-x-2 text-xs">
              {runStatus === 'running' ? (
                <button
                  onClick={abortRun}
                  className="flex items-center space-x-1.5 bg-fail/20 text-fail border border-fail/40 px-3 py-1.5 rounded font-mono hover:bg-fail/30 font-bold"
                >
                  <Square size={12} fill="currentColor" />
                  <span>ABORT RUN</span>
                </button>
              ) : (
                <>
                  <button
                    onClick={handleRunSelected}
                    disabled={selectedTests.length === 0}
                    className="flex items-center space-x-1.5 bg-accent text-base font-bold border border-accent/40 px-3 py-1.5 rounded font-mono hover:bg-accent/90 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Play size={12} fill="currentColor" />
                    <span>RUN SELECTED ({selectedTests.length})</span>
                  </button>
                  <button
                    onClick={handleRunAll}
                    className="flex items-center space-x-1.5 bg-elevated border border-border-default text-primary px-3 py-1.5 rounded font-mono hover:border-strong hover:text-accent font-bold"
                  >
                    <Play size={12} fill="currentColor" className="text-accent" />
                    <span>RUN ALL TESTS</span>
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Scrolling Terminal Output Area */}
          <div
            ref={terminalContainerRef}
            className="flex-1 bg-base p-4 overflow-y-auto text-xs font-mono space-y-1.5 relative select-text"
            role="log"
            aria-live="polite"
          >
            {terminalLines.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-muted select-none">
                <TerminalIcon size={40} className="mb-2 text-border-strong opacity-40 animate-pulse" />
                <p>System idle. Select test cases and trigger execution.</p>
                <p className="text-[10px] mt-1">Output will stream here in real-time.</p>
              </div>
            ) : (
              terminalLines.map((line) => (
                <div key={line.id} className={getLineClass(line.level)}>
                  {line.text}
                </div>
              ))
            )}
            <div ref={terminalEndRef} />
          </div>

          {/* Terminal Footer Panel */}
          {terminalLines.length > 0 && (
            <div className="bg-elevated px-4 py-3 border-t border-border-default flex items-center justify-between shrink-0 font-mono text-[10px] text-secondary">
              <div className="flex items-center space-x-4">
                {runStatus === 'running' && (
                  <span className="flex items-center">
                    <span className="h-2 w-2 rounded-full bg-accent animate-ping mr-2"></span>
                    <span>COMPILING & EXECUTING...</span>
                  </span>
                )}
                {runStatus === 'done' && runSummary && (
                  <div className="flex items-center space-x-3">
                    <span className="text-pass font-bold">PASSED: {runSummary.passed}</span>
                    <span className={runSummary.failed > 0 ? 'text-fail font-bold' : ''}>FAILED: {runSummary.failed}</span>
                    <span>TOTAL: {runSummary.total}</span>
                    <span>TIME: {runSummary.duration_ms}ms</span>
                  </div>
                )}
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={clearTerminal}
                  className="px-2.5 py-1 rounded border border-border-default hover:text-primary hover:border-strong bg-surface"
                >
                  CLEAR
                </button>
                <button
                  onClick={handleCopyTerminal}
                  className="flex items-center space-x-1 px-2.5 py-1 rounded border border-border-default hover:text-primary hover:border-strong bg-surface"
                >
                  <Copy size={10} />
                  <span>COPY</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
