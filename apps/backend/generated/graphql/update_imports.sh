#!/bin/bash
# Script to update GraphQL imports after migration
# Run this from apps/backend directory after Task #1 completes

set -e

echo "🔄 Updating GraphQL imports..."

# Step 1: Update exec imports (backend/graph → backend/generated/graphql)
echo "📦 Updating exec imports in 7 files..."
for file in \
  "cmd/nnc/main_dev.go" \
  "cmd/nnc/routes_prod.go" \
  "graphql_test.go" \
  "internal/troubleshoot/integration_test.go" \
  "main.dev.go" \
  "main.prod.go"
do
  if [ -f "$file" ]; then
    echo "  - $file"
    # Replace "backend/graph" with "backend/generated/graphql" (not affecting backend/graph/model or backend/graph/resolver)
    sed -i 's|"backend/graph"$|"backend/generated/graphql"|g' "$file"
  else
    echo "  ⚠️  File not found: $file"
  fi
done

# Step 2: Update model imports (backend/graph/model → backend/generated/graphql)
# This is more complex - we need to analyze which files use generated types vs custom scalars
echo ""
echo "📦 Finding files that import backend/graph/model..."
model_files=$(grep -rl '"backend/graph/model"' --include="*.go" . || true)
total=$(echo "$model_files" | grep -c "." || echo "0")
echo "  Found $total files"

echo ""
echo "⚠️  MANUAL STEP REQUIRED:"
echo "  Not all files should be updated automatically."
echo "  Files using custom scalars (IPv4, MAC, CIDR, etc.) should keep backend/graph/model"
echo "  Files using generated types (Input, Payload, etc.) should change to backend/generated/graphql"
echo ""
echo "  Review these files manually or use the analyze_imports.sh script"

# Step 3: List files that will likely need updates (resolver files)
echo ""
echo "📋 Resolver files that likely need updating:"
find graph/resolver -name "*.go" -type f | grep -v "_test.go" | while read -r file; do
  if grep -q '"backend/graph/model"' "$file"; then
    echo "  - $file"
  fi
done

echo ""
echo "✅ Exec imports updated!"
echo "⚠️  Model imports require manual review"
echo ""
echo "Next steps:"
echo "  1. Review graph/resolver/*.go files"
echo "  2. For each file, check if it uses:"
echo "     - Custom scalars (keep backend/graph/model)"
echo "     - Generated types (change to backend/generated/graphql)"
echo "  3. Run: go build ./..."
echo "  4. Run: go test ./..."
