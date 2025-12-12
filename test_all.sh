#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")"

echo "Testing Fujin grammar on all test cases..."
echo ""

passed=0
failed=0
failed_tests=()

for file in ../lang/test_cases/*.fjs test_cases/*.fjt; do
  [ -f "$file" ] || continue

  basename=$(basename "$file")
  printf "%-40s " "$basename"

  # Capture output and check both for ERROR in output and exit code
  output=$(bun tree-sitter parse "$file" 2>&1) || parse_failed=1

  if echo "$output" | grep -q "ERROR"; then
    echo "❌ FAILED (parse error in AST)"
    failed=$((failed + 1))
    failed_tests+=("$basename")
  elif [ "${parse_failed:-0}" = "1" ]; then
    echo "❌ FAILED (parser crashed)"
    failed=$((failed + 1))
    failed_tests+=("$basename")
  else
    echo "✅ PASSED"
    passed=$((passed + 1))
  fi

  unset parse_failed
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
