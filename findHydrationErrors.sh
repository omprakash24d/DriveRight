#!/bin/bash

# Directory to search for pages
PAGES_DIR="./pages"

# Function to check for hydration issues
check_file_for_hydration_issues() {
  local file_path="$1"
  local issues=()

  # Check for non-deterministic values
  if grep -qE 'Math\.random\(\)|Date\.now\(\)' "$file_path"; then
    issues+=("Non-deterministic value found (Math.random() or Date.now())")
  fi

  # Check for useEffect without proper cleanup
  if grep -q 'useEffect' "$file_path" && ! grep -q 'return () =>' "$file_path"; then
    issues+=("useEffect without cleanup function")
  fi

  # Check for conditional rendering that might differ
  if grep -qE 'if\s*\(|return\s*\(' "$file_path"; then
    issues+=("Potential conditional rendering issue")
  fi

  # Print issues if any found
  if [ ${#issues[@]} -ne 0 ]; then
    echo "Issues found in $file_path:"
    for issue in "${issues[@]}"; do
      echo " - $issue"
    done
  fi
}

# Find all relevant files in the pages directory
find "$PAGES_DIR" -type f \( -name "*.js" -o -name "*.jsx" -o -name "*.ts" -o -name "*.tsx" \) | while read -r file; do
  check_file_for_hydration_issues "$file"
done
