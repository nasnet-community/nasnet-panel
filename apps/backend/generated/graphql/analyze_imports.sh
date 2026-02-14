#!/bin/bash
# Script to analyze backend/graph/model imports and categorize them
# Run this from apps/backend directory

set -e

echo "🔍 Analyzing backend/graph/model imports..."
echo ""

# Custom scalar types that should stay in backend/graph/model
CUSTOM_SCALARS=(
  "IPv4"
  "IPv6"
  "MAC"
  "CIDR"
  "Port"
  "PortRange"
  "Duration"
  "Bandwidth"
  "Size"
  "ULID"
)

# Find all files importing backend/graph/model
model_files=$(grep -rl '"backend/graph/model"' --include="*.go" . | grep -v "graph/model/" || true)

echo "📊 Analysis Results:"
echo "===================="
echo ""

needs_custom_scalars=()
needs_generated_types=()
needs_both=()

for file in $model_files; do
  has_custom=false
  has_generated=false

  # Check for custom scalar usage
  for scalar in "${CUSTOM_SCALARS[@]}"; do
    if grep -q "model\\.${scalar}" "$file" || grep -q "\\*model\\.${scalar}" "$file"; then
      has_custom=true
      break
    fi
  done

  # Check for generated type usage (common patterns)
  if grep -qE "model\\.(.*Input|.*Payload|.*Edge|.*Connection|MutationError)" "$file"; then
    has_generated=true
  fi

  # Categorize
  if [ "$has_custom" = true ] && [ "$has_generated" = true ]; then
    needs_both+=("$file")
  elif [ "$has_custom" = true ]; then
    needs_custom_scalars+=("$file")
  elif [ "$has_generated" = true ]; then
    needs_generated_types+=("$file")
  else
    # Couldn't determine - needs manual review
    needs_both+=("$file")
  fi
done

echo "✅ Files using ONLY custom scalars (keep backend/graph/model):"
echo "   Count: ${#needs_custom_scalars[@]}"
if [ ${#needs_custom_scalars[@]} -gt 0 ]; then
  for file in "${needs_custom_scalars[@]}"; do
    echo "   - $file"
  done
fi
echo ""

echo "🔄 Files using ONLY generated types (change to backend/generated/graphql):"
echo "   Count: ${#needs_generated_types[@]}"
if [ ${#needs_generated_types[@]} -gt 0 ]; then
  for file in "${needs_generated_types[@]}"; do
    echo "   - $file"
  done
fi
echo ""

echo "⚠️  Files using BOTH or UNCLEAR (needs manual review + dual import):"
echo "   Count: ${#needs_both[@]}"
if [ ${#needs_both[@]} -gt 0 ]; then
  for file in "${needs_both[@]}"; do
    echo "   - $file"
  done
fi
echo ""

echo "📝 Summary:"
echo "==========="
echo "Total files analyzed: $(echo "$model_files" | wc -l)"
echo "Keep backend/graph/model: ${#needs_custom_scalars[@]}"
echo "Change to backend/generated/graphql: ${#needs_generated_types[@]}"
echo "Needs both imports or review: ${#needs_both[@]}"
echo ""

echo "💡 Next steps:"
echo "1. For files using ONLY generated types, run:"
echo "   sed -i 's|\"backend/graph/model\"|\"backend/generated/graphql\"|g' <file>"
echo ""
echo "2. For files needing BOTH, add second import:"
echo "   import ("
echo "     \"backend/graph/model\"                  // For custom scalars"
echo "     gqlmodel \"backend/generated/graphql\"   // For generated types (aliased)"
echo "   )"
echo ""
echo "3. For files using ONLY custom scalars, no changes needed!"
