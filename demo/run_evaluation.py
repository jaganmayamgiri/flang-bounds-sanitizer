#!/usr/bin/env python3
import os
import sys
import time
import subprocess

# ANSI colors
GREEN = "\033[92m"
RED = "\033[91m"
YELLOW = "\033[93m"
BOLD = "\033[1m"
RESET = "\033[0m"

RUNS = 5

def compile_benchmarks():
    print(f"{BOLD}Compiling benchmarks...{RESET}")
    # Create build directory for temp binaries if needed
    os.makedirs('demo', exist_ok=True)
    
    # 1. Compile Baselines
    cmd_j_base = ['gfortran', '-O3', 'benchmarks/jacobi_2d.f90', '-o', 'demo/jacobi_2d_base']
    cmd_g_base = ['gfortran', '-O3', 'benchmarks/gemm.f90', '-o', 'demo/gemm_base']
    cmd_h_base = ['gfortran', '-O3', 'benchmarks/heat_3d.f90', '-o', 'demo/heat_3d_base']
    
    print("  Compiling Jacobi 2D Baseline...")
    subprocess.run(cmd_j_base, check=True)
    print("  Compiling GEMM Baseline...")
    subprocess.run(cmd_g_base, check=True)
    print("  Compiling Heat 3D Baseline...")
    subprocess.run(cmd_h_base, check=True)
    
    # 2. Instrument
    print("  Instrumenting Jacobi 2D...")
    subprocess.run(['python3', 'demo/instrument.py', 'benchmarks/jacobi_2d.f90', 'demo/jacobi_2d_inst.f90'], check=True)
    print("  Instrumenting GEMM...")
    subprocess.run(['python3', 'demo/instrument.py', 'benchmarks/gemm.f90', 'demo/gemm_inst.f90'], check=True)
    print("  Instrumenting Heat 3D...")
    subprocess.run(['python3', 'demo/instrument.py', 'benchmarks/heat_3d.f90', 'demo/heat_3d_inst.f90'], check=True)
    
    # 3. Compile Instrumented
    cmd_j_inst = ['gfortran', '-O3', '-I', 'demo', 'demo/jacobi_2d_inst.f90', 'demo/bounds_shim.o', 'demo/bounds_shim_mod.o', '-o', 'demo/jacobi_2d_inst']
    cmd_g_inst = ['gfortran', '-O3', '-I', 'demo', 'demo/gemm_inst.f90', 'demo/bounds_shim.o', 'demo/bounds_shim_mod.o', '-o', 'demo/gemm_inst']
    cmd_h_inst = ['gfortran', '-O3', '-I', 'demo', 'demo/heat_3d_inst.f90', 'demo/bounds_shim.o', 'demo/bounds_shim_mod.o', '-o', 'demo/heat_3d_inst']
    
    print("  Compiling Instrumented Jacobi 2D...")
    subprocess.run(cmd_j_inst, check=True)
    print("  Compiling Instrumented GEMM...")
    subprocess.run(cmd_g_inst, check=True)
    print("  Compiling Instrumented Heat 3D...")
    subprocess.run(cmd_h_inst, check=True)

def run_program(path):
    start = time.perf_counter()
    subprocess.run([path], stdout=subprocess.PIPE, stderr=subprocess.PIPE, check=True)
    end = time.perf_counter()
    return end - start

def evaluate_performance():
    print(f"\n{BOLD}Measuring performance overhead (averaged over {RUNS} runs)...{RESET}")
    
    benchmarks = [
        {"name": "jacobi_2d", "domain": "Stencil", "base": "demo/jacobi_2d_base", "inst": "demo/jacobi_2d_inst"},
        {"name": "gemm",      "domain": "BLAS",    "base": "demo/gemm_base",      "inst": "demo/gemm_inst"},
        {"name": "heat_3d",   "domain": "PDE",     "base": "demo/heat_3d_base",   "inst": "demo/heat_3d_inst"}
    ]
    
    results = []
    
    for bench in benchmarks:
        print(f"  Benchmarking {bench['name']}...")
        # Warmup
        run_program(bench["base"])
        run_program(bench["inst"])
        
        # Measure Baseline
        base_times = []
        for _ in range(RUNS):
            base_times.append(run_program(bench["base"]))
        avg_base = sum(base_times) / RUNS
        
        # Measure Instrumented
        inst_times = []
        for _ in range(RUNS):
            inst_times.append(run_program(bench["inst"]))
        avg_inst = sum(inst_times) / RUNS
        
        overhead = ((avg_inst - avg_base) / avg_base) * 100
        status = f"{GREEN}PASS{RESET}" if overhead < 15.0 else f"{YELLOW}WARN (>{15}%){RESET}"
        
        results.append({
            "name": bench["name"],
            "domain": bench["domain"],
            "base": avg_base,
            "inst": avg_inst,
            "overhead": overhead,
            "status": status
        })
        
    print("\n=========================================================================")
    print(f"{BOLD}{'PROGRAM':<12} | {'DOMAIN':<8} | {'BASELINE (s)':<12} | {'SANITIZED (s)':<13} | {'OVERHEAD':<8} | {'STATUS (<15%)'}{RESET}")
    print("=========================================================================")
    for r in results:
        print(f"{r['name']:<12} | {r['domain']:<8} | {r['base']:<12.5f} | {r['inst']:<13.5f} | {r['overhead']:<7.2f}% | {r['status']}")
    print("=========================================================================")

if __name__ == '__main__':
    compile_benchmarks()
    evaluate_performance()
