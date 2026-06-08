#!/bin/bash
# Shell script wrapper to run the test suite

# Ensure we are in the script's directory (or project root)
cd "$(dirname "$0")/.."
python3 demo/run_all_tests.py
