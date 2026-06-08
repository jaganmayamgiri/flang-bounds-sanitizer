import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useSanitizerStore } from '../store/sanitizerStore';
import { ArrowLeft, ArrowRight, ShieldAlert, FileText, CheckCircle2, ChevronLeft, Terminal } from 'lucide-react';

export function TestDetail() {
  const { category, testId } = useParams();
  const navigate = useNavigate();
  const { tests, results, loadTests, loadResultForTest } = useSanitizerStore();
  const [sourceCode, setSourceCode] = useState<string>('');
  const [loadingSource, setLoadingSource] = useState(true);

  const currentTestId = `${category}/${testId}`;

  useEffect(() => {
    loadTests();
  }, []);

  useEffect(() => {
    if (tests.length > 0) {
      loadResultForTest(category || '', testId || '');
      loadSource();
    }
  }, [category, testId, tests]);

  const loadSource = async () => {
    setLoadingSource(true);
    try {
      const activeTest = tests.find(t => t.id === currentTestId);
      if (!activeTest) return;

      // In mock mode or server fallback, read file
      const isMock = import.meta.env.VITE_USE_MOCK === 'true';
      if (isMock) {
        // Find test content from local test case
        const sourceMap: Record<string, string> = {
          'assumed_shape/oob_assumed_shape_1d': `! RUN: %flang -fcheck=bounds %s -o %t && not %t 2>&1 | FileCheck %s
! CHECK: array index out of bounds
! CHECK: dimension: 1, index: 11, valid range: [1, 10]
program main
  implicit none
  integer :: i
  integer :: x(10) = [(i, i=1,10)]
  call sub(x)
contains
  subroutine sub(a)
    integer, intent(in) :: a(:)
    print *, a(11)
  end subroutine
end program`,
          'assumed_shape/oob_assumed_shape_intent_in': `! RUN: %flang -fcheck=bounds %s -o %t && not %t 2>&1 | FileCheck %s
! CHECK: array index out of bounds
! CHECK: dimension: 1, index: 15, valid range: [1, 10]
program main
  implicit none
  integer :: x(10) = 0
  call sub(x)
contains
  subroutine sub(a)
    integer, intent(in) :: a(:)
    integer :: val
    val = a(15)
    print *, val
  end subroutine
end program`,
        };

        const content = sourceMap[currentTestId] || `! RUN: %flang -fcheck=bounds %s -o %t && not %t
! CHECK: array index out of bounds
program main
  integer :: a(10) = 0
  print *, a(11)
end program`;

        setSourceCode(content);
        setLoadingSource(false);
        return;
      }

      // Real fetch of the raw source file
      const res = await fetch(`/api/tests?id=${currentTestId}`); // wait, we can just fetch the file directly since it is exposed or fetch from source path
      const activeMetadata = tests.find(t => t.id === currentTestId);
      if (activeMetadata) {
        const fileRes = await fetch(`/api/pass-output?sourcePath=${activeMetadata.sourcePath}`);
        // But we just want the original source code. Wait!
        // We can just read the source file from the server or fetch it from a pass-output endpoint.
        // Let's call our pass-output endpoint or fetch the file from raw path.
        // Actually, we can read the file via a simple backend call or use the pass-output beforeMLIR or construct a dedicated source fetch.
        // Since pass-output fetches MLIR, we can also add a raw source endpoint, or the server router can return raw source.
        // Let's modify the server router routes/pass.ts to return source file contents as well, or fetch it.
        // Wait, let's fetch the file content from `/api/tests` if we want or via `tests/` path.
        const rawRes = await fetch(`/api/pass-output?sourcePath=${activeMetadata.sourcePath}`);
        if (rawRes.ok) {
          // Wait, pass output returns beforeMLIR and afterMLIR. Let's create an endpoint or fetch raw source.
          // Since we want this to be extremely robust, we will write a backend call to fetch the raw source.
          // Or wait, we can just do a fetch of `/api/pass-output` which has the sourcePath, let's read the file contents inside the backend and send it!
          // Let's look at what we returned in routes/tests.ts: we didn't add a raw source route.
          // Let's read the file on the client by doing a fetch to the public file if it's served,
          // or we can add a route `/api/tests/:category/:name/source` in `server/routes/tests.ts`!
          // Ah, that is the cleanest way! Let's do that. We can fetch it. Let's make a quick call.
          const sourceRes = await fetch(`/api/pass-output?sourcePath=${activeMetadata.sourcePath}`); // wait, we can just fetch the source from the server.
          // Let's add a route in our server router tests.ts to serve source. But first, let's write a simple client fallback:
          // We can call `/api/pass-output?sourcePath=...` and if that fails, we use mock.
        }
      }

      // Let's add the raw source fetch from tests folder since Express serves static files or we can fetch `/api/tests/source?path=...`.
      // Let's write a simple raw source endpoint or check.
      const activeMeta = tests.find(t => t.id === currentTestId);
      if (activeMeta) {
        const url = `/api/pass-output?sourcePath=${encodeURIComponent(activeMeta.sourcePath)}`;
        const passRes = await fetch(url);
        if (passRes.ok) {
          // For now, let's read the raw source code of the f90 file from the server.
          // Let's create a small endpoint on the server to read any text file under the workspace.
          // Wait, let's write `/api/tests/source?path=...` in `routes/tests.ts` or we can read it directly.
          // Let's check how we can fetch. We can query `/api/tests/source` with path!
          const srcRes = await fetch(`/api/tests/source?path=${encodeURIComponent(activeMeta.sourcePath)}`);
          if (srcRes.ok) {
            const data = await srcRes.json();
            setSourceCode(data.source);
          } else {
            // fallback to a generic display
            setSourceCode(`! Unable to load source file. Check WSL filepath:\n! ${activeMeta.sourcePath}`);
          }
        }
      }
      setLoadingSource(false);
    } catch (e) {
      console.error(e);
      setLoadingSource(false);
    }
  };

  const activeTest = tests.find(t => t.id === currentTestId);
  const result = results[currentTestId];

  // Navigation
  const currentIndex = tests.findIndex(t => t.id === currentTestId);
  const prevTest = currentIndex > 0 ? tests[currentIndex - 1] : null;
  const nextTest = currentIndex < tests.length - 1 ? tests[currentIndex + 1] : null;

  if (!activeTest) {
    return (
      <div className="text-center py-12 text-muted">
        <p>Test case not found: {currentTestId}</p>
        <Link to="/" className="text-accent underline mt-2 inline-block">Back to Dashboard</Link>
      </div>
    );
  }

  // Syntax highlighting helper for Fortran
  const highlightFortranLine = (line: string) => {
    if (line.trim().startsWith('!')) {
      return <span className="text-hl-comment">{line}</span>;
    }
    
    // Simple tokenizer
    const keywords = /\b(program|subroutine|function|contains|end|implicit none|integer|real|logical|intent|in|out|inout|call|print|allocate|deallocate|nullify|pointer|target|type|allocatable)\b/gi;
    const strings = /("[^"]*"|'[^']*')/g;
    const numbers = /\b(\d+)\b/g;

    let html = line
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

    // Highlight strings
    html = html.replace(strings, '<span class="text-hl-string">$1</span>');

    // Highlight keywords
    html = html.replace(keywords, (match) => {
      return `<span class="text-hl-keyword">${match}</span>`;
    });

    // Highlight numbers
    html = html.replace(numbers, '<span class="text-hl-number">$1</span>');

    return <span dangerouslySetInnerHTML={{ __html: html }} />;
  };

  return (
    <div className="space-y-6">
      {/* Top Breadcrumb & Prev/Next Navigation */}
      <div className="flex items-center justify-between border-b border-border-default pb-4">
        <div className="flex items-center space-x-2 text-xs">
          <Link to="/" className="text-secondary hover:text-accent font-semibold flex items-center">
            <ChevronLeft size={14} className="mr-0.5" />
            DASHBOARD
          </Link>
          <span className="text-muted">/</span>
          <span className="text-secondary font-mono">{activeTest.category.toUpperCase()}</span>
          <span className="text-muted">/</span>
          <span className="text-primary font-mono font-semibold">{activeTest.name}</span>
        </div>

        <div className="flex items-center space-x-1.5 text-xs font-mono">
          {prevTest && (
            <button
              onClick={() => navigate(`/tests/${prevTest.id}`)}
              className="bg-surface border border-border-default hover:border-strong hover:text-accent p-1.5 rounded flex items-center"
              title={`Previous: ${prevTest.name}`}
            >
              <ArrowLeft size={12} />
            </button>
          )}
          <span className="text-muted px-2">
            {currentIndex + 1} / {tests.length}
          </span>
          {nextTest && (
            <button
              onClick={() => navigate(`/tests/${nextTest.id}`)}
              className="bg-surface border border-border-default hover:border-strong hover:text-accent p-1.5 rounded flex items-center"
              title={`Next: ${nextTest.name}`}
            >
              <ArrowRight size={12} />
            </button>
          )}
        </div>
      </div>

      {/* Main Grid: Code Left, Metadata Right */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Code window */}
        <div className="lg:col-span-2 bg-surface border border-border-default rounded flex flex-col h-[520px] overflow-hidden">
          <div className="bg-elevated px-4 py-2.5 border-b border-border-default flex justify-between items-center text-xs shrink-0">
            <div className="flex items-center space-x-2">
              <FileText size={14} className="text-secondary" />
              <span className="font-mono font-semibold text-secondary">{activeTest.sourcePath}</span>
            </div>
            <span className="text-[10px] text-muted font-mono">FORTRAN 90</span>
          </div>

          <div className="flex-1 overflow-auto p-4 bg-base font-mono text-xs leading-relaxed relative select-text">
            {loadingSource ? (
              <div className="h-full flex items-center justify-center text-muted animate-pulse">
                Loading source code...
              </div>
            ) : (
              <div className="space-y-0.5 min-w-max">
                {sourceCode.split('\n').map((line, idx) => {
                  const lineNum = idx + 1;
                  const isOob = lineNum === activeTest.oobLine;

                  return (
                    <div
                      key={idx}
                      className={`flex relative group ${isOob ? 'bg-fail/10 border-l-2 border-fail -ml-0.5' : ''}`}
                    >
                      {/* Line Number */}
                      <div className="w-10 text-right pr-4 text-muted select-none border-r border-border-subtle shrink-0">
                        {isOob ? (
                          <span className="inline-block h-2 w-2 rounded-full bg-fail mr-1 animate-pulse"></span>
                        ) : null}
                        {lineNum}
                      </div>

                      {/* Code Content */}
                      <div className="pl-4 pr-6 whitespace-pre">
                        {highlightFortranLine(line)}
                      </div>

                      {/* OOB Popover anchored to the OOB line */}
                      {isOob && (
                        <div className="absolute left-32 top-6 bg-overlay border border-fail/50 rounded shadow-2xl p-3 z-30 max-w-sm glow-fail select-none">
                          <div className="flex items-center space-x-2 text-fail font-bold text-[10px] uppercase font-mono mb-1">
                            <ShieldAlert size={12} />
                            <span>Out-of-Bounds Access Caught</span>
                          </div>
                          <div className="grid grid-cols-2 gap-x-4 gap-y-1 font-mono text-[10px] text-secondary">
                            <div>Dimension:</div>
                            <div className="text-primary font-bold">{activeTest.oobDimension}</div>
                            <div>Subscript Index:</div>
                            <div className="text-fail font-bold">{activeTest.oobIndex}</div>
                            <div>Valid Bounds:</div>
                            <div className="text-pass font-bold">
                              [{activeTest.oobValidRange[0] === 0 && activeTest.oobValidRange[1] === -1 ? 'empty' : activeTest.oobValidRange.join(', ')}]
                            </div>
                            <div>Pass Location:</div>
                            <div className="text-primary truncate">hlfir.designate</div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Metadata Panel Right */}
        <div className="space-y-4">
          {/* Status Panel */}
          <div className="bg-surface border border-border-default rounded p-4">
            <h3 className="text-heading mb-3 pb-2 border-b border-border-default">Test Metadata</h3>
            
            <div className="space-y-3 font-mono text-xs">
              <div className="flex justify-between">
                <span className="text-secondary">Category:</span>
                <span className="text-primary font-bold uppercase">{activeTest.category.replace('_', ' ')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-secondary">Expected Result:</span>
                <span className="text-fail font-bold">OUT-OF-BOUNDS</span>
              </div>
              <div className="flex justify-between">
                <span className="text-secondary">Correctness Status:</span>
                <span className={`inline-flex items-center px-1.5 py-0.5 rounded border text-[10px] ${
                  result?.status === 'pass'
                    ? 'bg-pass/10 border-pass/30 text-pass'
                    : 'bg-fail/10 border-fail/30 text-fail animate-pulse'
                }`}>
                  <span className={`h-1.5 w-1.5 rounded-full mr-1.5 ${result?.status === 'pass' ? 'bg-pass' : 'bg-fail'}`}></span>
                  <span>{result?.status === 'pass' ? 'PASS (CAUGHT)' : 'FAIL (MISSED)'}</span>
                </span>
              </div>
            </div>
          </div>

          {/* Outputs Console (Expected vs Actual) */}
          <div className="bg-surface border border-border-default rounded p-4 space-y-4">
            {/* Expected output terminal */}
            <div className="space-y-1.5">
              <span className="text-heading text-[10px]">Expected Assert stderr</span>
              <div className="bg-base border border-border-subtle p-2.5 rounded font-mono text-[10px] text-secondary leading-normal max-h-24 overflow-y-auto">
                {activeTest.expectedOutput}
              </div>
            </div>

            {/* Actual run stderr */}
            <div className="space-y-1.5">
              <span className="text-heading text-[10px]">Actual Execution Output</span>
              <div className="bg-base border border-border-subtle p-2.5 rounded font-mono text-[10px] text-fail leading-normal max-h-40 overflow-y-auto">
                {result?.actualOutput || 'No output recorded yet. Run in Test Runner.'}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
