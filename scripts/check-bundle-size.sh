#!/bin/bash
# Bundle Size Validation Script
# Measures gzipped bundle size and enforces 500KB limit

set -e

DIST_DIR="dist/apps/connect"
LIMIT_BYTES=512000    # 500KB
WARN_BYTES=409600     # 400KB

if [ ! -d "$DIST_DIR" ]; then
  echo "❌ Error: Build directory not found: $DIST_DIR"
  echo "   Run 'npm run build' first"
  exit 1
fi

# Find all JavaScript and CSS files
JS_FILES=$(find "$DIST_DIR" -name "*.js" -type f)
CSS_FILES=$(find "$DIST_DIR" -name "*.css" -type f)

if [ -z "$JS_FILES" ] && [ -z "$CSS_FILES" ]; then
  echo "❌ Error: No JavaScript or CSS files found in $DIST_DIR"
  exit 1
fi

# Calculate gzipped sizes
JS_SIZE=0
CSS_SIZE=0

for file in $JS_FILES; do
  SIZE=$(gzip -c "$file" | wc -c)
  JS_SIZE=$((JS_SIZE + SIZE))
done

for file in $CSS_FILES; do
  SIZE=$(gzip -c "$file" | wc -c)
  CSS_SIZE=$((CSS_SIZE + SIZE))
done

TOTAL_SIZE=$((JS_SIZE + CSS_SIZE))

# Convert bytes to KB for display
JS_KB=$((JS_SIZE / 1024))
CSS_KB=$((CSS_SIZE / 1024))
TOTAL_KB=$((TOTAL_SIZE / 1024))

echo "📦 Bundle Size Report"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "JavaScript (gzipped): ${JS_KB}KB"
echo "CSS (gzipped):        ${CSS_KB}KB"
echo "Total (gzipped):      ${TOTAL_KB}KB"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if [ $TOTAL_SIZE -gt $LIMIT_BYTES ]; then
  echo "❌ ERROR: Bundle size exceeds 500KB limit!"
  echo "   Current: ${TOTAL_KB}KB"
  echo "   Limit: 500KB"
  exit 1
elif [ $TOTAL_SIZE -gt $WARN_BYTES ]; then
  echo "⚠️  WARNING: Bundle size approaching 500KB limit (${TOTAL_KB}KB)"
  echo "   Consider further optimization"
else
  echo "✅ Bundle size OK (under 500KB limit)"
fi

exit 0








