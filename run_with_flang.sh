#!/bin/bash
# run_with_flang.sh - Compile and run a test case using LLVM Flang (flang-20)
set -e

# Path to LLVM 20 library dir
LLVM_LIB_DIR="/usr/lib/llvm-20/lib"
LLVM_INC_DIR="/usr/lib/llvm-20/include/flang"

# Ensure LD_LIBRARY_PATH includes LLVM shared libraries
export LD_LIBRARY_PATH="$LLVM_LIB_DIR:$LD_LIBRARY_PATH"

# Check if a test file was specified
if [ -z "$1" ]; then
    echo "Usage: ./run_with_flang.sh <test_case_path.f90>"
    echo "Example: ./run_with_flang.sh tests/assumed_shape/oob_assumed_shape_intent_in.f90"
    exit 1
fi

TEST_FILE="$1"
TEST_NAME=$(basename "$TEST_FILE" .f90)

echo "========================================================="
# 1. Compile shims using LLVM Flang / GCC (referencing flang headers)
echo "1. Building runtime shims with LLVM Flang headers..."
gcc -I"$LLVM_INC_DIR" -c demo/bounds_shim.c -o demo/bounds_shim_flang.o
flang-20 -c demo/bounds_shim_mod.f90 -o demo/bounds_shim_mod_flang.o -J demo

# 2. Instrument the test case source file
echo "2. Instrumenting the Fortran source file..."
python3 demo/instrument.py "$TEST_FILE" "demo/${TEST_NAME}_instrumented.f90"

# 3. Compile and link the instrumented source using flang-20
echo "3. Compiling and linking with flang-20..."
flang-20 -I demo \
         "demo/${TEST_NAME}_instrumented.f90" \
         demo/bounds_shim_flang.o \
         demo/bounds_shim_mod_flang.o \
         -o "demo/${TEST_NAME}_flang_exe"

echo "4. Running the compiled executable..."
echo "---------------------------------------------------------"
# Run and let it print output/errors
set +e
./demo/${TEST_NAME}_flang_exe
EXIT_CODE=$?
set -e
echo "---------------------------------------------------------"
echo "Program exited with code: $EXIT_CODE"
if [ $EXIT_CODE -ne 0 ]; then
    echo "Result: PASS (Out-of-Bounds caught successfully)"
else
    echo "Result: FAIL (Out-of-Bounds was NOT caught)"
fi
echo "========================================================="
