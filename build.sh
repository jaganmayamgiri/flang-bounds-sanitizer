#!/bin/bash
# build.sh - Build compiler pass runtime shims and provision/build frontend dashboard
set -e

echo "========================================================="
echo "  BUILDING FLANG HLFIR BOUNDS-CHECKING SANITIZER DEMO    "
echo "========================================================="

# 1. Locate ISO_Fortran_binding.h & compile Fortran/C runtime shims
inc_dir=$(python3 -c "import glob, os; paths = glob.glob('/usr/lib/gcc/**/ISO_Fortran_binding.h', recursive=True); print(os.path.dirname(paths[0]) if paths else '/usr/include')")
echo "Found ISO_Fortran_binding.h in: $inc_dir"

mkdir -p demo
gcc -I"$inc_dir" -O3 -c demo/bounds_shim.c -o demo/bounds_shim.o
gfortran -O3 -c demo/bounds_shim_mod.f90 -o demo/bounds_shim_mod.o -J demo

# Make run scripts executable
chmod +x demo/run_all_tests.sh
chmod +x benchmarks/run_benchmarks.sh

echo ""
echo "========================================================="
echo "  PROVISIONING & COMPILING FRONTEND DASHBOARD            "
echo "========================================================="

# 2. Dynamically provision Node/NPM if not found in WSL path
if ! command -v node &> /dev/null || ! command -v npm &> /dev/null; then
    echo "Node.js or NPM not found in WSL. Provisioning self-contained Node.js environment..."
    NODE_VERSION="v20.11.0"
    NODE_DIR="/tmp/node-provision"
    mkdir -p "$NODE_DIR"
    
    if [ ! -f "$NODE_DIR/node-$NODE_VERSION-linux-x64/bin/node" ]; then
        echo "Downloading pre-compiled Node.js $NODE_VERSION binaries..."
        curl -sL "https://nodejs.org/dist/$NODE_VERSION/node-$NODE_VERSION-linux-x64.tar.xz" -o "$NODE_DIR/node.tar.xz"
        echo "Extracting package to native WSL ext4 filesystem (/tmp) to avoid OneDrive permission errors..."
        tar -xf "$NODE_DIR/node.tar.xz" -C "$NODE_DIR"
        rm "$NODE_DIR/node.tar.xz"
    fi
    
    # Prepend provisioned bin folder to PATH
    export PATH="$NODE_DIR/node-$NODE_VERSION-linux-x64/bin:$PATH"
    echo "Provisioned Node.js successfully: $(node -v)"
else
    echo "System Node.js found: $(node -v)"
fi

# 3. Install NPM packages and compile the production build
echo "Installing frontend client & server dependencies..."
cd frontend
npm install

echo "Compiling React frontend build..."
npm run build
cd ..

echo "========================================================="
echo "Build completed successfully!"
echo "Run './run.sh' to start the compiler sanitizer dashboard."
echo "========================================================="
