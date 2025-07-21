#!/bin/bash

set -e

REPORT_DIR="./bug_hunt_reports"
mkdir -p "$REPORT_DIR"

echo "=== Starting comprehensive bug hunting scan ==="

# Helper function to run grep and save results
run_grep() {
  local name=$1
  shift
  local pattern=("$@")
  local outfile="$REPORT_DIR/$name.log"

  echo -e "\n🔍 Running check: $name"
  if grep -rEn --exclude-dir=node_modules --include="*.{js,jsx,ts,tsx,json}" "${pattern[@]}" ./src > "$outfile" 2>/dev/null; then
    echo "  Found issues. See $outfile"
  else
    echo "  No issues found."
    rm -f "$outfile"
  fi
}

# 1. Random values causing hydration issues
run_grep "random_values" \
  -e 'Math\.random\s*\(' \
  -e 'Date\.now\s*\(' \
  -e 'new\s*Date\s*\('

# 2. Environment variables usage
run_grep "env_vars" \
  -e 'process\.env\.NEXT_PUBLIC_[A-Z0-9_]+'

# 3. Deprecated lifecycle methods
run_grep "deprecated_lifecycle_methods" \
  -e 'componentWillMount' \
  -e 'componentWillReceiveProps' \
  -e 'componentWillUpdate'

# 4. Console logs and debugger
run_grep "console_debugger" \
  -e 'console\.log' \
  -e 'console\.debug' \
  -e 'console\.warn' \
  -e 'console\.error' \
  -e 'debugger'

# 5. Direct DOM manipulation
run_grep "direct_dom_manipulation" \
  -e 'document\.querySelector' \
  -e 'document\.getElementById' \
  -e 'document\.getElementsByClassName' \
  -e 'document\.getElementsByTagName'

# 6. Suspicious useEffect/useCallback
run_grep "useeffect_callback" \
  -e 'useEffect\s*\(\s*\([^)]*\)\s*=>' \
  -e 'useCallback\s*\(\s*\([^)]*\)\s*=>'

# 7. Hardcoded secrets
run_grep "hardcoded_secrets" \
  -e '(api_key|secret|password|token|access_key|private_key)\s*[:=]\s*[\"\'].*[\"\']'

# 8. Optional chaining calls
run_grep "optional_chaining" \
  -e '\?\.\w+\('

# 9. Non-strict equality
run_grep "non_strict_equality" \
  -e '[^=!]==[^=]' \
  -e '!='

# 10. Suspicious coercion operators
run_grep "suspicious_coercion" \
  -e '[^a-zA-Z0-9_] \+ [^a-zA-Z0-9_]' \
  -e '[^a-zA-Z0-9_] \- [^a-zA-Z0-9_]' \
  -e '&&'

# 11. Inline functions in JSX
run_grep "inline_jsx_functions" \
  -e 'on[A-Z][a-zA-Z]*=\{\s*\([^)]*=>[^}]*\}'

echo -e "\n📝 Reminder: Review React lists for duplicate keys manually."

# 12. TypeScript check
echo -e "\n🛠 Running TypeScript type check (no emit)..."
if npx tsc --noEmit; then
  echo "✅ No TypeScript errors."
else
  echo "❌ TypeScript errors detected. See TypeScript output above."
fi

# 13. Next.js lint
echo -e "\n🧹 Running Next.js lint check..."
if npx next lint; then
  echo "✅ No lint errors."
else
  echo "❌ Lint errors detected. See lint output above."
fi

# 14. Summary report
echo -e "\n=== Bug Hunting Summary Report ==="
for logfile in "$REPORT_DIR"/*.log; do
  [ -e "$logfile" ] || continue
  count=$(wc -l < "$logfile")
  echo "- $(basename "$logfile" .log): $count issues"
done

echo -e "\nReports saved in: $REPORT_DIR"
echo "✅ Comprehensive bug hunting scan complete."
