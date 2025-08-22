#!/bin/bash

# Script to remove console.log statements from production code
# This script should be run before production deployment

echo "🧹 Cleaning up console.log statements..."

# Define directories to clean
DIRS=("src/app" "src/components" "src/lib" "src/services" "src/hooks")

# Count total files to process
total_files=0
for dir in "${DIRS[@]}"; do
    if [ -d "$dir" ]; then
        count=$(find "$dir" -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" | wc -l)
        total_files=$((total_files + count))
    fi
done

echo "📊 Found $total_files files to process..."

# Remove console.log statements but preserve console.error and console.warn
for dir in "${DIRS[@]}"; do
    if [ -d "$dir" ]; then
        echo "🔍 Processing directory: $dir"
        
        find "$dir" -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" | while read -r file; do
            # Create backup
            cp "$file" "$file.backup"
            
            # Remove console.log statements (but keep console.error, console.warn, etc.)
            sed -i.tmp '/console\.log(/d' "$file"
            rm "$file.tmp" 2>/dev/null || true
            
            # Check if file changed
            if ! diff -q "$file" "$file.backup" > /dev/null 2>&1; then
                echo "  ✅ Cleaned: $file"
            fi
            
            # Remove backup
            rm "$file.backup"
        done
    fi
done

# Clean up specific test files that might have debug logs
echo "🧪 Cleaning test files..."
rm -f test-*.js 2>/dev/null || true

echo "✨ Console.log cleanup complete!"
echo "📝 Note: This only removes console.log statements, not console.error or console.warn"
echo "🔍 Run 'npm run build' to verify everything still works correctly"
