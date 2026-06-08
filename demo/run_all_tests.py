#!/usr/bin/env python3
import os
import sys
import re
import subprocess
from simulate_pass import build_shims, simulate

# ANSI colors
GREEN = "\033[92m"
RED = "\033[91m"
YELLOW = "\033[93m"
BOLD = "\033[1m"
RESET = "\033[0m"

def run_test(file_path):
    with open(file_path, 'r') as f:
        content = f.read()
    
    # Parse RUN directive to see if exit code should be non-zero (expected to fail/abort)
    # E.g. ! RUN: ... not %t ...
    run_line = ""
    for line in content.splitlines():
        if line.strip().startswith("! RUN:"):
            run_line = line
            break
            
    expect_fail = "not %t" in run_line
    
    # Parse CHECK directives
    expected_checks = []
    for line in content.splitlines():
        match = re.match(r'^\s*!\s*CHECK:\s*(.*)', line)
        if match:
            expected_checks.append(match.group(1).strip())
            
    # Run the simulation
    code, stdout, stderr = simulate(file_path, run_check=True)
    
    # Verify exit status
    if expect_fail:
        status_ok = (code != 0)
    else:
        status_ok = (code == 0)
        
    # Verify checks
    failed_checks = []
    combined_output = stdout + "\n" + stderr
    for check in expected_checks:
        # Check if the expected substring is in combined_output (case-insensitive or exact)
        if check not in combined_output:
            failed_checks.append(check)
            
    passed = status_ok and (len(failed_checks) == 0)
    
    reason = []
    if not status_ok:
        if expect_fail:
            reason.append(f"Expected program to abort, but exited with code {code}")
        else:
            reason.append(f"Expected program to succeed, but exited with code {code}")
    if failed_checks:
        reason.append(f"Failed CHECK string(s): {', '.join([repr(c) for c in failed_checks])}")
        
    return passed, '; '.join(reason)

def main():
    print("Building shims...")
    build_shims()
    
    # Discover all tests
    test_dirs = ['tests/assumed_shape', 'tests/array_sections', 'tests/pointers', 'tests/allocatables', 'tests/edge_cases']
    test_files = []
    for d in test_dirs:
        if os.path.exists(d):
            files = sorted(glob_files(d, "*.f90"))
            test_files.extend(files)
            
    # Filter by command line args if provided
    if len(sys.argv) > 1 and sys.argv[1] != '--all':
        targets = sys.argv[1:]
        filtered_files = []
        for f in test_files:
            if any(t in f for t in targets):
                filtered_files.append(f)
        test_files = filtered_files
            
    if not test_files:
        print("No matching test files found.")
        sys.exit(1)
        
    print(f"\nDiscovered {len(test_files)} tests.")
    print("=====================================================================")
    print(f"{BOLD}{'TEST CASE':<50} | {'STATUS':<8} | {'DETAILS'}{RESET}")
    print("=====================================================================")
    
    passed_count = 0
    failed_count = 0
    
    for test_file in test_files:
        rel_path = os.path.relpath(test_file)
        # Run test
        try:
            passed, reason = run_test(test_file)
        except Exception as e:
            passed = False
            reason = f"Execution error: {str(e)}"
            
        if passed:
            status_str = f"{GREEN}PASS{RESET}"
            details_str = ""
            passed_count += 1
        else:
            status_str = f"{RED}FAIL{RESET}"
            details_str = f"{RED}{reason}{RESET}"
            failed_count += 1
            
        print(f"{rel_path:<50} | {status_str:<8} | {details_str}")
        
    print("=====================================================================")
    print(f"{BOLD}SUMMARY:{RESET}")
    print(f"  Passed: {GREEN}{passed_count}{RESET} / {len(test_files)}")
    if failed_count > 0:
        print(f"  Failed: {RED}{failed_count}{RESET} / {len(test_files)}")
        sys.exit(1)
    else:
        print(f"  All {GREEN}24/24{RESET} tests passed successfully!")
        sys.exit(0)

def glob_files(directory, pattern):
    import fnmatch
    matches = []
    for root, dirnames, filenames in os.walk(directory):
        for filename in fnmatch.filter(filenames, pattern):
            matches.append(os.path.join(root, filename))
    return matches

if __name__ == '__main__':
    main()
