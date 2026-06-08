import React, { useEffect, useRef, useState } from 'react';
import { useSanitizerStore } from '../store/sanitizerStore';
import { FileText, Cpu, AlertCircle, RefreshCw } from 'lucide-react';

export function PassInspector() {
  const {
    tests,
    loadTests,
    selectedSourceFile,
    setSelectedSourceFile,
    passOutput,
    passOutputLoading,
    loadPassOutput
  } = useSanitizerStore();

  const [activeTestId, setActiveTestId] = useState('assumed_shape/oob_assumed_shape_1d');

  const beforeRef = useRef<HTMLPreElement>(null);
  const afterRef = useRef<HTMLPreElement>(null);
  const isSyncingScroll = useRef(false);

  useEffect(() => {
    loadTests();
  }, []);

  useEffect(() => {
    const activeTest = tests.find(t => t.id === activeTestId);
    if (activeTest) {
      loadPassOutput(activeTest.sourcePath);
    }
  }, [activeTestId, tests]);

  // Handle synchronized scroll between panes
  const handleScroll = (source: 'before' | 'after') => {
    if (isSyncingScroll.current) return;
    
    isSyncingScroll.current = true;
    const sourceEl = source === 'before' ? beforeRef.current : afterRef.current;
    const targetEl = source === 'before' ? afterRef.current : beforeRef.current;
    
    if (sourceEl && targetEl) {
      targetEl.scrollTop = sourceEl.scrollTop;
      targetEl.scrollLeft = sourceEl.scrollLeft;
    }
    
    // Release sync lock on next frame
    requestAnimationFrame(() => {
      isSyncingScroll.current = false;
    });
  };

  const highlightMLIRLine = (line: string) => {
    // Simple MLIR regex highlighter
    const isCheckCall = line.includes('_FortranABoundsCheck');
    const isBoxDim = line.includes('box_dims');
    
    const keywords = /\b(func\.func|fir\.alloca|fir\.load|fir\.store|fir\.call|fir\.box_dims|arith\.constant|arith\.addi|arith\.subi|arith\.cmpf|arith\.andi|fir\.if|fir\.unreachable|return)\b/g;
    const types = /(!fir\.[a-z0-9<>?_!:]+|i32|i1|index|i8)/g;
    const variables = /(%[a-zA-Z0-9_#:]+)/g;
    const comments = /(\/\/.*)/g;

    let html = line
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

    html = html.replace(comments, '<span class="text-hl-comment">$1</span>');
    html = html.replace(keywords, '<span class="text-hl-keyword">$1</span>');
    html = html.replace(types, '<span class="text-hl-type">$1</span>');
    html = html.replace(variables, '<span class="text-secondary">$1</span>');

    return (
      <div className={`px-2 py-0.5 font-mono text-[11px] leading-normal whitespace-pre min-w-max ${
        isCheckCall ? 'bg-accent/10 border-l-2 border-accent font-semibold' : isBoxDim ? 'bg-info/5 border-l-2 border-info' : ''
      }`}>
        {html ? <span dangerouslySetInnerHTML={{ __html: html }} /> : '\n'}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header & Selector */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border-default pb-4">
        <div>
          <h2 className="text-display">Pass Inspector</h2>
          <p className="text-sm text-secondary">
            Inspect High-Level Fortran IR (HLFIR) transformations before and after the bounds checking pass.
          </p>
        </div>

        {/* Dropdown selector */}
        <div className="flex items-center space-x-2">
          <FileText size={14} className="text-secondary" />
          <select
            value={activeTestId}
            onChange={(e) => setActiveTestId(e.target.value)}
            className="bg-surface border border-border-default rounded px-3 py-1.5 text-xs text-primary font-mono outline-none focus:border-strong"
          >
            {tests.map(test => (
              <option key={test.id} value={test.id}>
                {test.id}.f90
              </option>
            ))}
          </select>
        </div>
      </div>

      {passOutputLoading ? (
        <div className="text-center py-24 text-muted animate-pulse">
          Retrieving HLFIR outputs...
        </div>
      ) : passOutput ? (
        <div className="space-y-4">
          {/* Metadata Statistics bar */}
          <div className="bg-surface border border-border-default px-4 py-3 rounded flex items-center justify-between text-xs font-mono text-secondary">
            <div className="flex items-center space-x-4">
              <span>Checks Inserted: <strong className="text-accent">{passOutput.checksInserted}</strong></span>
              <span>Lines Added: <strong className="text-pass">+{passOutput.linesAdded}</strong></span>
            </div>
            
            <div className="flex items-center space-x-2 text-[10px]">
              <Cpu size={12} className="text-info" />
              <span>Optimized HLFIR-to-FIR pipeline active</span>
            </div>
          </div>

          {/* Two-Pane Diff Code Viewer */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Before Pass */}
            <div className="bg-surface border border-border-default rounded flex flex-col h-[520px] overflow-hidden">
              <div className="bg-elevated px-4 py-2 border-b border-border-default text-xs font-mono font-semibold text-secondary flex justify-between items-center select-none">
                <span>BEFORE BOUNDS CHECK PASS</span>
                <span className="text-[10px] text-muted">HLFIR CANONICAL</span>
              </div>
              <pre
                ref={beforeRef}
                onScroll={() => handleScroll('before')}
                className="flex-1 overflow-auto p-2 bg-base scrollbar-thin select-text"
              >
                {passOutput.beforeMLIR.split('\n').map((line, idx) => (
                  <div key={idx} className="flex hover:bg-elevated/20">
                    <span className="w-8 text-right pr-3 text-muted select-none text-[10px] border-r border-border-subtle shrink-0 mt-0.5">
                      {idx + 1}
                    </span>
                    <div className="flex-1 overflow-visible pl-2">
                      {highlightMLIRLine(line)}
                    </div>
                  </div>
                ))}
              </pre>
            </div>

            {/* After Pass */}
            <div className="bg-surface border border-border-default rounded flex flex-col h-[520px] overflow-hidden">
              <div className="bg-elevated px-4 py-2 border-b border-border-default text-xs font-mono font-semibold text-secondary flex justify-between items-center select-none">
                <span>AFTER BOUNDS CHECK PASS</span>
                <span className="text-[10px] text-accent">INSTRUMENTED HLFIR</span>
              </div>
              <pre
                ref={afterRef}
                onScroll={() => handleScroll('after')}
                className="flex-1 overflow-auto p-2 bg-base scrollbar-thin select-text"
              >
                {passOutput.afterMLIR.split('\n').map((line, idx) => (
                  <div key={idx} className="flex hover:bg-elevated/20">
                    <span className="w-8 text-right pr-3 text-muted select-none text-[10px] border-r border-border-subtle shrink-0 mt-0.5">
                      {idx + 1}
                    </span>
                    <div className="flex-1 overflow-visible pl-2">
                      {highlightMLIRLine(line)}
                    </div>
                  </div>
                ))}
              </pre>
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center py-24 text-muted flex items-center justify-center space-x-2">
          <AlertCircle size={16} />
          <span>Failed to load HLFIR pass dumps. Check compiler output logs.</span>
        </div>
      )}
    </div>
  );
}
