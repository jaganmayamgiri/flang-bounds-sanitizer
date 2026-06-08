#!/usr/bin/env python3
import sys
import os
import subprocess
import glob

def find_iso_fortran_binding_dir():
    # Search for ISO_Fortran_binding.h in standard GCC directories
    paths = glob.glob('/usr/lib/gcc/**/ISO_Fortran_binding.h', recursive=True)
    if paths:
        return os.path.dirname(paths[0])
    # Fallbacks
    for path in ['/usr/lib/gcc/x86_64-linux-gnu/15/include', '/usr/lib/gcc/x86_64-linux-gnu/14/include', '/usr/lib/gcc/x86_64-linux-gnu/13/include']:
        if os.path.exists(os.path.join(path, 'ISO_Fortran_binding.h')):
            return path
    return '/usr/include'

def build_shims():
    inc_dir = find_iso_fortran_binding_dir()
    print(f"Using ISO_Fortran_binding.h from: {inc_dir}")
    
    # Create demo/ directory if not present
    os.makedirs('demo', exist_ok=True)
    
    # Compile C shim
    cmd_c = ['gcc', f'-I{inc_dir}', '-c', 'demo/bounds_shim.c', '-o', 'demo/bounds_shim.o']
    print(f"Compiling C shim: {' '.join(cmd_c)}")
    subprocess.run(cmd_c, check=True)
    
    # Compile Fortran shim module
    cmd_f = ['gfortran', '-c', 'demo/bounds_shim_mod.f90', '-o', 'demo/bounds_shim_mod.o', '-J', 'demo']
    print(f"Compiling Fortran module: {' '.join(cmd_f)}")
    subprocess.run(cmd_f, check=True)

def simulate(fortran_file, run_check=True):
    # Prepare paths
    basename = os.path.basename(fortran_file)
    name, ext = os.path.splitext(basename)
    
    instrumented_file = f"demo/{name}_instrumented.f90"
    executable = f"demo/{name}_exe"
    
    # Step 1: Instrument
    if run_check:
        print(f"\nInstrumenting {fortran_file} -> {instrumented_file}")
        cmd_inst = ['python3', 'demo/instrument.py', fortran_file, instrumented_file]
        subprocess.run(cmd_inst, check=True)
        compile_file = instrumented_file
    else:
        print(f"\nCompiling clean {fortran_file} (no checks)")
        compile_file = fortran_file
        
    # Step 2: Compile & Link
    cmd_compile = ['gfortran', '-fcoarray=single', '-I', 'demo', compile_file]
    if run_check:
        cmd_compile.extend(['demo/bounds_shim.o', 'demo/bounds_shim_mod.o'])
    cmd_compile.extend(['-o', executable])
    
    print(f"Compiling: {' '.join(cmd_compile)}")
    subprocess.run(cmd_compile, check=True)
    
    # Step 3: Run
    print(f"Running: {executable}")
    res = subprocess.run([executable], stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
    
    print(f"Exit code: {res.returncode}")
    if res.stdout:
        print("Stdout:")
        print(res.stdout, end="")
    if res.stderr:
        print("Stderr:")
        print(res.stderr, end="")
        
    return res.returncode, res.stdout, res.stderr

if __name__ == '__main__':
    if len(sys.argv) < 2:
        print("Usage: simulate_pass.py <file.f90> [--clean]")
        sys.exit(1)
        
    file_path = sys.argv[1]
    run_check = '--clean' not in sys.argv
    
    # Ensure shims are built
    if not os.path.exists('demo/bounds_shim.o') or not os.path.exists('demo/bounds_shim_mod.o'):
        build_shims()
        
    simulate(file_path, run_check)
