#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")"

echo "Testing Fujin grammar on all test cases..."
echo ""

passed=0
failed=0
failed_tests=()

for file in test_cases/*.fjs test_cases/*.fjt; do
  [ -f "$file" ] || continue
  
  basename=$(basename "$file")
  printf "%-40s " "$basename"
  
  if bun tree-sitter parse "$file" 2>&1 | grep -q "ERROR"; then
    echo "❌ FAILED"
    failed=$((failed + 1))
    failed_tests+=("$basename")
  else
    echo "✅ PASSED"
    passed=$((passed + 1))
  fi
done

echo ""
echo "================================"
echo "Results: $passed passed, $failed failed"

if [ $failed -gt 0 ]; then
  echo ""
  echo "Failed tests:"
  for test in "${failed_tests[@]}"; do
    echo "  - $test"
  done
  exit 1
fi
