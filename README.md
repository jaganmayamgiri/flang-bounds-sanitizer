# Flang HLFIR Bounds-Checking Sanitizer

A high-performance runtime bounds-checking sanitizer for the LLVM Flang Fortran compiler that exploits HLFIR (High-Level Fortran IR) metadata to insert precise, context-aware safety checks. This sanitizer expands checking coverage to assumed-shape arrays, array sections, pointer arrays, and allocatables, where traditional tools (like gfortran's `-fcheck=bounds`) are often silent.

## Project Structure

```
flang-bounds-sanitizer/
├── README.md             <- General description & usage
├── DESIGN.md             <- Architectural approach & design alternatives
├── IMPLEMENTATION.md     <- LLVM Flang compiler pass and runtime library details
├── EVALUATION.md         <- Correctness test cases and performance results
├── build.sh              <- Provisions standalone Node.js and compiles all shims/binaries
├── run.sh                <- Starts the developer dashboard (API server + React frontend)
├── run_with_flang.sh     <- Helper to compile and run any test case using flang-20 on WSL
│
├── demo/                 <- Standalone simulation framework
│   ├── instrument.py     <- Regex-based Fortran AST instrumenter simulating the HLFIR pass
│   ├── bounds_shim.c     <- C runtime implementation matching Flang CFI descriptors
│   └── run_all_tests.py  <- Correctness test driver
│
├── tests/                <- Correctness test cases (24 test programs)
│   ├── assumed_shape/    <- Assumed-shape dummy arguments
│   ├── array_sections/   <- Array section slicing and striding
│   ├── pointers/         <- Pointer targets, Nullify, and component accesses
│   ├── allocatables/     <- Allocatable arrays and reallocations
│   └── edge_cases/       <- Coarrays and zero-sized allocations
│
├── benchmarks/           <- Performance benchmarks
│   ├── jacobi_2d.f90     <- 2D stencil kernel
│   ├── gemm.f90          <- Matrix multiplication kernel
│   └── heat_3d.f90       <- 3D heat diffusion kernel
│
└── frontend/             <- Visual developer dashboard (Vite React + Express API server)
```

## How to Build & Run

### Prerequisites
- **OS**: WSL2 (Ubuntu Subsystem) on Windows 10/11
- **Compilers**: `gcc`, `gfortran`, and optionally `flang-20` (for LLVM verification)
- **Node.js**: Natively installed on the Windows host machine (v18+ recommended)

### Step 1: Clone the Repository
Ensure the repository is cloned into your workspace folder.

### Step 2: Build the Project
Run the build script in Windows PowerShell (or WSL bash if Node is available in WSL):
```bash
# In the project root folder
./build.sh
```
This script will compile the Fortran and C runtime shims, automatically download and provision Node.js inside WSL if missing, install npm packages, and build the React SPA production bundle.

### Step 3: Run the Dashboard
Start the dashboard Express backend:
```bash
./run.sh
```
The console will print the server address:
```text
=========================================================
  STARTING FLANG BOUNDS-SANITIZER DEVELOPER DASHBOARD
=========================================================
Dashboard running at: http://localhost:3001
Press Ctrl+C to stop the dashboard server.
=========================================================
```

Open [http://localhost:3001](http://localhost:3001) in your browser to inspect test outcomes, run real-time builds, view compiler pass differences, and check performance benchmarks.

---

## Proving with LLVM (flang-20)
To run a specific correctness test case using the actual **LLVM Flang compiler (`flang-20`)**, run:
```bash
./run_with_flang.sh tests/assumed_shape/oob_assumed_shape_intent_in.f90
```
This instruments the test case, compiles the bounds-checking shim using Flang-provided ISO C headers, and links it using `flang-20`.
