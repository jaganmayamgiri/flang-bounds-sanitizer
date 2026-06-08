#!/bin/bash
# Standalone benchmark runner

RUNS=5
if [ "$1" == "--runs" ]; then
  RUNS=$2
fi

echo "========================================="
echo "       RUNNING PERFORMANCE BENCHMARKS    "
echo "========================================="

# Compile clean versions
gfortran -O3 jacobi_2d.f90 -o jacobi_2d_clean
gfortran -O3 gemm.f90 -o gemm_clean
gfortran -O3 heat_3d.f90 -o heat_3d_clean

# Run clean versions
echo "Running Clean (Baseline) kernels..."
time_jacobi_clean=0
time_gemm_clean=0
time_heat_clean=0

for i in $(seq 1 $RUNS); do
  start=$(date +%s.%N)
  ./jacobi_2d_clean > /dev/null
  end=$(date +%s.%N)
  time_jacobi_clean=$(echo "$time_jacobi_clean + ($end - $start)" | bc)

  start=$(date +%s.%N)
  ./gemm_clean > /dev/null
  end=$(date +%s.%N)
  time_gemm_clean=$(echo "$time_gemm_clean + ($end - $start)" | bc)

  start=$(date +%s.%N)
  ./heat_3d_clean > /dev/null
  end=$(date +%s.%N)
  time_heat_clean=$(echo "$time_heat_clean + ($end - $start)" | bc)
done

avg_jacobi_clean=$(echo "scale=4; $time_jacobi_clean / $RUNS" | bc)
avg_gemm_clean=$(echo "scale=4; $time_gemm_clean / $RUNS" | bc)
avg_heat_clean=$(echo "scale=4; $time_heat_clean / $RUNS" | bc)

# Compile instrumented versions (this will be invoked by python orchestrator or run.sh)
# Let's print out the baseline results for now.
echo "Baseline Results (Average of $RUNS runs):"
echo "  jacobi_2d: ${avg_jacobi_clean}s"
echo "  gemm:      ${avg_gemm_clean}s"
echo "  heat_3d:   ${avg_heat_clean}s"
