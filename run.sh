#!/bin/bash
# run.sh - Run the sanitizer dashboard backend (which serves the compiled React app)
set -e

# Ensure we are in the script's directory
cd "$(dirname "$0")"

# 1. Provision Node path if provisioned locally in WSL native filesystem
NODE_VERSION="v20.11.0"
LOCAL_NODE_BIN="/tmp/node-provision/node-$NODE_VERSION-linux-x64/bin"
if [ -d "$LOCAL_NODE_BIN" ]; then
    export PATH="$LOCAL_NODE_BIN:$PATH"
fi

# Ensure node is executable
if ! command -v node &> /dev/null; then
    echo "ERROR: Node.js is not installed. Please run './build.sh' first."
    exit 1
fi

echo "========================================================="
echo "  STARTING FLANG BOUNDS-SANITIZER DEVELOPER DASHBOARD    "
echo "========================================================="
echo "Dashboard running at: http://localhost:3001"
echo "Press Ctrl+C to stop the dashboard server."
echo "========================================================="
echo ""

# Run backend API server (which hosts Express on port 3001 and serves index.html/assets)
cd frontend
npm run start
