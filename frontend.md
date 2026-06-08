# CLAUDE.md — Flang Bounds-Sanitizer Frontend Dashboard

## Project Context

This frontend is the visual interface for the Flang HLFIR Bounds-Checking Sanitizer
(see `CLAUDE.md` in the root). It consumes the sanitizer's JSON output, displays
test results, renders benchmark overhead charts, shows annotated Fortran source
with OOB violations highlighted, and lets users trigger test runs via a thin
backend API.

The audience is compiler engineers and Fortran developers. The aesthetic must feel
like a **high-precision instrument dashboard** — not a generic dev tool.
Think oscilloscope readout meets code editor: monochromatic dark base, sharp amber/
red accent for errors, green for pass, dense information laid out with grid discipline.
Typography: a technical serif for headings (IBM Plex Serif or Playfair Display),
monospace (JetBrains Mono or Fira Code) for all code and numbers.

---

## Repository Layout

```
frontend/
├── CLAUDE.md                     ← this file
├── package.json
├── vite.config.ts
├── tsconfig.json
├── tailwind.config.ts
├── index.html
│
├── src/
│   ├── main.tsx
│   ├── App.tsx                   ← router root
│   ├── api/
│   │   ├── client.ts             ← fetch wrappers (base URL, error handling)
│   │   ├── types.ts              ← shared TypeScript types (TestResult, BenchmarkRun, etc.)
│   │   └── mock.ts               ← full mock data matching real API shape (for offline demo)
│   │
│   ├── pages/
│   │   ├── Dashboard.tsx         ← main overview page
│   │   ├── TestRunner.tsx        ← run tests, live streaming output
│   │   ├── TestDetail.tsx        ← single test: source + OOB annotation
│   │   ├── Benchmarks.tsx        ← overhead chart + table
│   │   └── PassInspector.tsx     ← MLIR/HLFIR diff viewer (before/after pass)
│   │
│   ├── components/
│   │   ├── layout/
│   │   │   ├── Shell.tsx         ← outer shell: sidebar + topbar
│   │   │   ├── Sidebar.tsx
│   │   │   └── Topbar.tsx
│   │   ├── tests/
│   │   │   ├── TestTable.tsx     ← sortable table of all 20 tests
│   │   │   ├── TestBadge.tsx     ← PASS / FAIL / SKIP badge
│   │   │   ├── TestFilter.tsx    ← filter by category (assumed-shape, pointers, …)
│   │   │   └── OOBAnnotator.tsx  ← Fortran source with inline error callouts
│   │   ├── benchmarks/
│   │   │   ├── OverheadChart.tsx ← grouped bar chart (uninstrumented vs instrumented)
│   │   │   ├── OverheadTable.tsx ← numeric table with delta column
│   │   │   └── SparkLine.tsx     ← tiny per-run variance sparkline
│   │   ├── pass/
│   │   │   ├── MLIRDiff.tsx      ← side-by-side HLFIR before/after
│   │   │   └── CheckCallHighlight.tsx ← highlights inserted _FortranABoundsCheck calls
│   │   └── ui/
│   │       ├── Terminal.tsx      ← scrolling terminal output component
│   │       ├── StatusDot.tsx     ← animated status indicator
│   │       ├── CodeBlock.tsx     ← syntax-highlighted code block (Fortran + MLIR)
│   │       ├── Tooltip.tsx
│   │       ├── Badge.tsx
│   │       └── Spinner.tsx
│   │
│   ├── hooks/
│   │   ├── useTestRun.ts         ← SSE / WebSocket hook for streaming test output
│   │   ├── useBenchmarks.ts      ← fetch + parse benchmark JSON
│   │   └── usePassOutput.ts      ← fetch MLIR dump for a given source file
│   │
│   ├── store/
│   │   └── sanitizerStore.ts     ← Zustand store: test results, benchmark data, run status
│   │
│   └── styles/
│       ├── globals.css           ← CSS variables, base reset
│       └── theme.ts              ← design tokens as JS (for recharts, etc.)
│
├── server/                       ← thin Node/Express backend (bridge to sanitizer CLI)
│   ├── index.ts
│   ├── routes/
│   │   ├── tests.ts              ← GET /api/tests, POST /api/run/:testId
│   │   ├── benchmarks.ts         ← GET /api/benchmarks
│   │   └── pass.ts               ← GET /api/pass-output/:sourceFile
│   └── sanitizerBridge.ts        ← spawns demo/run_all_tests.sh, streams stdout
│
└── public/
    └── sample-outputs/           ← pre-captured JSON for offline demo
        ├── test-results.json
        ├── benchmark-results.json
        └── pass-outputs/
            ├── oob_assumed_shape_1d.before.mlir
            └── oob_assumed_shape_1d.after.mlir
```

---

## Design System

### Color Tokens (`styles/globals.css`)

```css
:root {
  /* Base — near-black with warm undertone, not pure #000 */
  --bg-base:        #0d0e0f;
  --bg-surface:     #141618;
  --bg-elevated:    #1c1f22;
  --bg-overlay:     #242729;

  /* Borders */
  --border-subtle:  #2a2d31;
  --border-default: #383d42;
  --border-strong:  #4e555d;

  /* Text */
  --text-primary:   #e8eaec;
  --text-secondary: #8d9399;
  --text-muted:     #545c64;
  --text-code:      #b8c4d0;

  /* Semantic */
  --color-pass:     #22c55e;   /* green-500 — test passed */
  --color-fail:     #ef4444;   /* red-500  — OOB caught */
  --color-warn:     #f59e0b;   /* amber-500 — overhead warning */
  --color-info:     #3b82f6;   /* blue-500  — info / neutral */
  --color-accent:   #f97316;   /* orange-500 — primary accent */

  /* Code highlighting */
  --hl-oob-line:    rgba(239, 68, 68, 0.12);   /* red tint on offending line */
  --hl-oob-gutter:  #ef4444;                    /* gutter dot */
  --hl-check-call:  rgba(249, 115, 22, 0.15);  /* orange tint on inserted check */
  --hl-keyword:     #93c5fd;
  --hl-string:      #86efac;
  --hl-number:      #fde68a;
  --hl-comment:     #4b5563;
  --hl-type:        #c4b5fd;

  /* Typography */
  --font-display:   'IBM Plex Serif', Georgia, serif;
  --font-body:      'IBM Plex Sans', system-ui, sans-serif;
  --font-mono:      'JetBrains Mono', 'Fira Code', monospace;

  /* Motion */
  --ease-snap:      cubic-bezier(0.16, 1, 0.3, 1);
  --ease-out:       cubic-bezier(0.0, 0.0, 0.2, 1);
  --duration-fast:  120ms;
  --duration-base:  220ms;
  --duration-slow:  380ms;
}
```

### Typography Scale

```css
/* Display — page titles */
.text-display { font-family: var(--font-display); font-size: 1.75rem; font-weight: 600; letter-spacing: -0.02em; }

/* Heading — section headers */
.text-heading { font-family: var(--font-body); font-size: 0.9rem; font-weight: 600; letter-spacing: 0.08em; text-transform: uppercase; color: var(--text-secondary); }

/* Code — all numbers, indices, paths, MLIR */
.text-code { font-family: var(--font-mono); font-size: 0.8rem; }

/* Label — small metadata */
.text-label { font-family: var(--font-body); font-size: 0.7rem; font-weight: 500; letter-spacing: 0.06em; text-transform: uppercase; }
```

### Grid System

All layouts use CSS Grid with 12 columns at 1280px max-width.
Sidebar is fixed 220px. Main content uses `grid-template-columns: 220px 1fr`.
No Tailwind arbitrary values — use only the tokens above.

---

## Page Specifications

### 1. Dashboard (`pages/Dashboard.tsx`)

**Layout:** 4 stat cards top row → 2-column split (test table left, benchmark mini-chart right) → pass activity feed bottom.

**Stat cards** (show these four numbers prominently):
```
┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐
│  20 / 20        │ │  3.2 ms         │ │  avg 7.4%       │ │  0              │
│  Tests Passing  │ │  Avg check cost │ │  Runtime overhead│ │  False positives│
└─────────────────┘ └─────────────────┘ └─────────────────┘ └─────────────────┘
```

Numbers use `--font-mono`, 2.5rem, `--color-pass` / `--color-fail` based on value.

**Test table (left column):**
- Columns: `#` | `Category` | `Test Name` | `Status` | `OOB Line` | `Duration`
- Rows are clickable → navigate to `TestDetail`
- Default sort: failures first, then by category
- Filter bar above table: chip-style buttons for each category

**Mini benchmark chart (right column):**
- Grouped bar chart using Recharts `BarChart`
- X-axis: program name; two bars per program (uninstrumented / instrumented)
- Colors: `--color-info` and `--color-accent`
- Tooltip shows exact ms and % delta

**Pass activity feed (bottom):**
- Chronological list of the last N pass invocations
- Each entry: timestamp | source file | checks inserted count | duration
- Monospace, small, dense — like a git log

---

### 2. Test Runner (`pages/TestRunner.tsx`)

**Purpose:** Run one or all tests and stream live output.

**Layout:** Left panel = test selector tree; Right panel = terminal output + result.

**Test selector tree:**
```
▼ assumed_shape  (8)
    ○ oob_assumed_shape_1d
    ○ oob_assumed_shape_2d
    ...
▼ array_sections (5)
    ...
```
Checkboxes for multi-select. "Run Selected" / "Run All" buttons.

**Terminal component (`components/ui/Terminal.tsx`):**
- Dark background (`--bg-base`), monospace, line-buffered
- Lines are color-coded:
  - Lines starting with `PASS` → `--color-pass`
  - Lines starting with `FAIL` or containing `out of bounds` → `--color-fail`
  - Lines starting with `#` or `!` → `--text-muted` (comments/meta)
  - Everything else → `--text-code`
- Auto-scrolls to bottom; shows cursor blink when run is active
- "Copy output" button top-right

**Streaming implementation (`hooks/useTestRun.ts`):**
```typescript
// Connect to SSE endpoint, push lines to terminal state
const { lines, status, run, abort } = useTestRun();

// status: 'idle' | 'running' | 'done' | 'error'
// run(testIds: string[]) — POST /api/run with SSE response
// lines: Array<{ text: string; level: 'info'|'pass'|'fail'|'meta' }>
```

**Result summary panel** (appears after run completes):
```
┌─ Run Summary ─────────────────────────────────────────────┐
│  Passed: 20   Failed: 0   Duration: 4.3s                  │
│  Checks inserted: 847   False positives: 0                 │
└────────────────────────────────────────────────────────────┘
```

---

### 3. Test Detail (`pages/TestDetail.tsx`)

**Purpose:** Show one test's source code with the OOB violation annotated.

**URL:** `/tests/:category/:testId`

**Layout:** Two columns: source viewer (left, 60%) + metadata panel (right, 40%).

**Source viewer (`components/tests/OOBAnnotator.tsx`):**

```
 1 │ ! RUN: %flang -fcheck=bounds %s -o %t && not %t
 2 │ ! CHECK: array index out of bounds
 3 │
 4 │ subroutine sub(a)
 5 │   integer, intent(in) :: a(:)
 6 │●  print *, a(11)        ← red gutter dot + line highlight
 7 │ end subroutine
```

- Line numbers in `--text-muted`
- Offending line: `--hl-oob-line` background, `--hl-oob-gutter` dot in gutter
- Hover on highlighted line → tooltip showing the expected error message
- Syntax highlighting for Fortran keywords, strings, comments, numbers

**OOB callout card** (appears anchored to the offending line):
```
┌─ Out-of-Bounds Access ─────────────────────┐
│  Dimension:  1                              │
│  Index:      11                             │
│  Valid range: [1, 10]                       │
│  Detected by: hlfir.designate instrumentation│
└─────────────────────────────────────────────┘
```

**Metadata panel (right):**
- Category badge (color-coded chip)
- Test file path
- LIT directives rendered as read-only badges
- "Expected output" block — styled terminal showing the expected stderr
- "Actual output" block — what the last run produced
- PASS/FAIL status with timestamp

**Navigation:** prev/next test arrows in topbar.

---

### 4. Benchmarks (`pages/Benchmarks.tsx`)

**Purpose:** Display overhead measurements with full detail.

**Layout:** Full-width chart top → three program cards → methodology note.

**Full-width overhead chart:**
- Recharts `BarChart` with two datasets per program
- Custom bar shape: sharp corners, 2px gap between bars in a group
- Y-axis: seconds; secondary Y-axis (right): overhead %
- Reference line at `y = overhead_threshold` (default 15%) in amber dashed
- Legend: custom colored squares with `--font-mono` labels

**Program cards** (one per benchmark program):
```
┌─ jacobi_2d.f90 ─── Stencil ──────────────────────────────────┐
│                                                                │
│  Uninstrumented  ████████████████████  0.82s                  │
│  With -fcheck=   ██████████████████████ 0.89s   +8.5%         │
│                                                                │
│  Runs: 5   σ: 0.012s   Min: 0.81s   Max: 0.91s               │
│  Checks inserted: 2,048   Elided (static-safe): 312           │
│  [▸ view source]  [▸ view MLIR]                               │
└────────────────────────────────────────────────────────────────┘
```

**Sparkline** (tiny 80×20 SVG, shows per-run variance):
- Uses `components/benchmarks/SparkLine.tsx`
- Dots for each run, line connecting them
- Color: `--color-info` baseline, `--color-accent` instrumented

**Methodology note** (collapsed by default):
- Explains run conditions (CPU, compiler flags, run count)
- Links to `benchmarks/run_benchmarks.sh`

---

### 5. Pass Inspector (`pages/PassInspector.tsx`)

**Purpose:** Show HLFIR before/after the bounds-check pass for any source file.

**Layout:** Full-width two-pane diff viewer.

**File picker:** Dropdown of all test source files.

**Diff viewer (`components/pass/MLIRDiff.tsx`):**
- Left pane: HLFIR before pass
- Right pane: HLFIR after pass (with inserted check calls)
- Inserted `_FortranABoundsCheck` calls highlighted with `--hl-check-call` background
- Line numbers synced scroll
- "Added lines" shown with `+` gutter in `--color-pass`
- Removed lines (if any) with `-` gutter in `--color-fail`

**Check call detail** (`components/pass/CheckCallHighlight.tsx`):
- Hover any highlighted check call → popover showing:
  - Which `hlfir.designate` triggered it
  - The dimension and variable name
  - Source location it maps to

**Stats bar** (above diff):
```
Checks inserted: 4   •   Lines added: 12   •   Estimated overhead: ~8%
```

---

## API Contract

### Backend Endpoints (`server/`)

```typescript
// GET /api/tests
// Returns all test metadata
interface TestMetadata {
  id: string;           // e.g. "assumed_shape/oob_assumed_shape_1d"
  category: TestCategory;
  name: string;
  sourcePath: string;
  expectedOutput: string;
  oobLine: number;
  oobDimension: number;
  oobIndex: number;
  oobValidRange: [number, number];
}

// GET /api/tests/:id/result
// Returns last run result for a test
interface TestResult {
  testId: string;
  status: 'pass' | 'fail' | 'skip' | 'pending';
  actualOutput: string;
  duration_ms: number;
  checksInserted: number;
  timestamp: string;
}

// POST /api/run  (body: { testIds: string[] })
// Returns: SSE stream of lines
// Each SSE event: { type: 'line', data: { text: string, level: string } }
//                 { type: 'done', data: RunSummary }
//                 { type: 'error', data: { message: string } }

// GET /api/benchmarks
interface BenchmarkResult {
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

// GET /api/pass-output/:encodedSourcePath
interface PassOutput {
  sourcePath: string;
  beforeMLIR: string;
  afterMLIR: string;
  checksInserted: number;
  linesAdded: number;
}
```

### Mock Data (`api/mock.ts`)

When `VITE_USE_MOCK=true` (the default for `npm run dev`), all hooks use mock data
instead of hitting the server. The mock data file must be complete and realistic —
it IS the demo when no Flang build is available.

```typescript
// api/mock.ts exports:
export const mockTests: TestMetadata[]          // all 20 tests
export const mockResults: TestResult[]          // all 20 with status=pass
export const mockBenchmarks: BenchmarkResult[]  // 3 programs
export const mockPassOutputs: Record<string, PassOutput>  // 3 files

// One test deliberately set to status='fail' for demo realism:
// "oob_pointer_after_nullify" shows a false-positive scenario being caught
```

---

## State Management (`store/sanitizerStore.ts`)

```typescript
import { create } from 'zustand'

interface SanitizerStore {
  // Test data
  tests: TestMetadata[];
  results: Record<string, TestResult>;
  selectedCategory: TestCategory | 'all';
  setCategory: (c: TestCategory | 'all') => void;

  // Active run
  runStatus: 'idle' | 'running' | 'done' | 'error';
  terminalLines: TerminalLine[];
  runSummary: RunSummary | null;
  startRun: (testIds: string[]) => void;
  abortRun: () => void;

  // Benchmarks
  benchmarks: BenchmarkResult[];
  benchmarksLoaded: boolean;

  // Pass inspector
  selectedSourceFile: string | null;
  passOutput: PassOutput | null;
  passOutputLoading: boolean;
}
```

---

## Backend Bridge (`server/sanitizerBridge.ts`)

Spawns the sanitizer's demo script and streams stdout as SSE:

```typescript
import { spawn } from 'child_process';
import { Response } from 'express';

export function runTests(testIds: string[], res: Response) {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  // If testIds is empty, run all
  const args = testIds.length ? testIds : ['--all'];
  const proc = spawn('bash', ['../demo/run_all_tests.sh', ...args], {
    cwd: process.cwd(),
    env: { ...process.env, FORCE_COLOR: '0' }
  });

  proc.stdout.on('data', (chunk: Buffer) => {
    const lines = chunk.toString().split('\n').filter(Boolean);
    for (const line of lines) {
      const level = classifyLine(line);  // 'pass' | 'fail' | 'info' | 'meta'
      res.write(`data: ${JSON.stringify({ type: 'line', data: { text: line, level } })}\n\n`);
    }
  });

  proc.on('close', (code) => {
    res.write(`data: ${JSON.stringify({ type: 'done', data: { exitCode: code } })}\n\n`);
    res.end();
  });
}

function classifyLine(line: string): TerminalLineLevel {
  if (/^PASS/.test(line)) return 'pass';
  if (/^FAIL|out of bounds|error/i.test(line)) return 'fail';
  if (/^#|^!/.test(line)) return 'meta';
  return 'info';
}
```

---

## Tech Stack

| Concern | Choice | Reason |
|---|---|---|
| Framework | React 18 + TypeScript | Component model fits the panel-heavy layout |
| Build tool | Vite | Fast HMR, easy SSE proxy config |
| Routing | React Router v6 | Nested routes for test detail |
| State | Zustand | Minimal boilerplate for this data shape |
| Charts | Recharts | Composable, works well with custom styling |
| Code highlighting | Shiki | MLIR grammar support; outputs HTML, not DOM |
| Styling | Tailwind CSS + CSS variables | Utility classes + design token integration |
| Backend | Node.js + Express | Minimal; only bridges CLI to SSE |
| Testing | Vitest + Testing Library | Unit tests for hooks and data transforms |

### Vite Config (proxy for dev)

```typescript
// vite.config.ts
export default defineConfig({
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      }
    }
  }
})
```

---

## Setup & Run

```bash
# Install
cd frontend
npm install

# Development (uses mock data, no Flang needed)
npm run dev
# → http://localhost:5173

# Development with real backend
npm run dev:server   # starts Express on :3001
npm run dev          # starts Vite on :5173

# Production build
npm run build
npm run preview

# Tests
npm run test
npm run test:coverage
```

---

## Component Implementation Notes

### `OOBAnnotator.tsx` — Fortran source with inline error callouts

```typescript
interface OOBAnnotatorProps {
  source: string;          // raw Fortran source text
  oobLines: number[];      // 1-based line numbers with OOB accesses
  insertedCheckLines?: number[];  // lines where checks were inserted
  language: 'fortran' | 'mlir';
}
```

Implementation strategy:
1. Use Shiki to tokenize the source (Fortran grammar)
2. Map line numbers to Shiki output rows
3. Inject `data-oob="true"` attribute on matching rows
4. CSS targets `[data-oob="true"]` for background highlight
5. Gutter dots are `::before` pseudo-elements on the line number cell

Do NOT use `dangerouslySetInnerHTML` on untrusted content — the source files
are always from the local test suite, but wrap in a sanitizer anyway.

### `Terminal.tsx` — Streaming output display

```typescript
interface TerminalLine {
  id: string;       // uuid for React key
  text: string;
  level: 'pass' | 'fail' | 'info' | 'meta';
  timestamp: number;
}
```

- Render with `react-virtuoso` if line count > 500 (prevents DOM bloat on long runs)
- Auto-scroll: `useEffect` with `scrollIntoView` on last line ref
- Pause auto-scroll when user scrolls up; resume on "Jump to bottom" click

### `MLIRDiff.tsx` — HLFIR before/after diff

```typescript
// Compute diff client-side using diff-match-patch
import { diff_match_patch } from 'diff-match-patch';

// Line-level diff only (not character-level) — MLIR is too verbose for char diff
function computeLineDiff(before: string, after: string): DiffLine[]
```

Sync scroll between panes: use a shared `scrollTop` ref and `onScroll` handler
that updates both panes simultaneously.

### `OverheadChart.tsx` — Benchmark bars

```typescript
// Custom bar shape: flat top, slight inner shadow
const CustomBar = (props) => {
  const { x, y, width, height, fill } = props;
  return (
    <g>
      <rect x={x} y={y} width={width} height={height} fill={fill} rx={1} />
      {/* Top edge highlight */}
      <rect x={x} y={y} width={width} height={1.5}
            fill="rgba(255,255,255,0.15)" rx={1} />
    </g>
  );
};
```

---

## Responsive Behavior

The dashboard targets 1280px+ primarily. At narrower widths:
- `< 1280px`: Sidebar collapses to icon-only rail (220px → 56px)
- `< 900px`: Two-column layouts stack vertically
- `< 640px`: Test table shows only Name + Status columns; "tap for detail"

Mobile is supported but secondary. The core user is on a desktop workstation.

---

## Accessibility

- All interactive elements keyboard-navigable
- Status badges have `aria-label` (not just color)
- Terminal output has `role="log"` and `aria-live="polite"`
- Color is never the only differentiator (PASS/FAIL also use text and icons)
- Focus rings use `--color-accent` outline, 2px, offset 2px

---

## Performance Targets

| Metric | Target |
|---|---|
| LCP (dashboard load) | < 1.2s on localhost |
| TTI | < 800ms |
| Terminal lines rendered | 10,000 lines without jank |
| MLIR diff (5,000 lines) | < 200ms compute |
| Chart render (3 programs) | < 50ms |

---

## Mock Data Specification

`api/mock.ts` must export realistic data that makes the demo compelling:

```typescript
// The 20 tests with these specific outcomes (for a convincing demo):
// - 19 tests: status = 'pass'
// - 1 test (oob_pointer_after_nullify): status = 'fail' for demo realism
//   (shows what a failure looks like)

// Benchmark timings that match the overhead table in CLAUDE.md:
// jacobi_2d:  baseline=[0.81,0.82,0.83,0.82,0.82], instrumented=[0.88,0.89,0.90,0.89,0.88]
// gemm:       baseline=[1.13,1.14,1.15,1.14,1.14], instrumented=[1.20,1.21,1.22,1.21,1.20]
// heat_3d:    baseline=[2.01,2.03,2.04,2.03,2.02], instrumented=[2.17,2.19,2.20,2.18,2.19]

// MLIR pass output must include at least one real _FortranABoundsCheck call:
// (copy actual output from a Flang build, or construct a realistic synthetic version)
```

---

## Status Checklist

- [ ] All 5 pages render without errors in mock mode
- [ ] Test runner streams mock output correctly with correct color coding
- [ ] OOB annotator highlights correct lines in all 20 test sources
- [ ] Benchmark chart renders all 3 programs with correct overhead values
- [ ] MLIR diff shows inserted check calls highlighted in orange
- [ ] Sidebar navigation works; active route is highlighted
- [ ] Responsive: sidebar collapses at 1280px
- [ ] All TypeScript strict checks pass (`tsc --noEmit`)
- [ ] `npm run test` passes (unit tests for hooks + data transforms)
- [ ] Lighthouse score > 90 on Performance, Accessibility
- [ ] Works fully offline with `VITE_USE_MOCK=true`
