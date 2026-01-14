import re

def parse_python_unittest(stdout, stderr):
    """
    Parses typical python unittest output.
    Returns a dict with success indicator and a short summary.
    """
    # Example success: 'Ran 1 test in 0.000s\nOK\n'
    # Example failure: 'Ran 1 test in 0.000s\nFAILED (failures=1)\n'
    
    combined = stdout + "\n" + stderr
    
    # Look for "Ran X tests in Ys"
    ran_match = re.search(r'Ran (\d+) tests? in', combined)
    tests_run = int(ran_match.group(1)) if ran_match else 0
    
    if "OK" in combined and "FAILED" not in combined:
        return {
            "success": True,
            "score": 100.0 if tests_run > 0 else 0.0,
            "summary": f"Passed all {tests_run} tests." if tests_run > 0 else "Execution successful (no tests found)."
        }
    
    # Look for "FAILED (failures=1, errors=1)"
    failed_match = re.search(r'FAILED \(([^)]+)\)', combined)
    if failed_match:
        details = failed_match.group(1)
        # Try to calculate score based on failure count
        failures = 0
        errors = 0
        f_match = re.search(r'failures=(\d+)', details)
        e_match = re.search(r'errors=(\d+)', details)
        if f_match: failures = int(f_match.group(1))
        if e_match: errors = int(e_match.group(1))
        
        passed_count = max(0, tests_run - (failures + errors))
        score = (passed_count / tests_run * 100.0) if tests_run > 0 else 0.0
        
        return {
            "success": False,
            "score": score,
            "summary": f"Failed {tests_run} tests: {details}"
        }
    
    if "Traceback" in stderr or "Traceback" in stdout:
        # Extract last line of traceback
        lines = [l for l in combined.split('\n') if l.strip()]
        last_error = lines[-1] if lines else "Unknown error"
        return {
            "success": False,
            "score": 0.0,
            "summary": f"Runtime error: {last_error}"
        }
        
    return {
        "success": "FAILED" not in combined,
        "score": 0.0,
        "summary": "Tests completed."
    }
