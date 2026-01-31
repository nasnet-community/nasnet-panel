#!/bin/bash
# Docker Image Size Validation Script
# Measures Docker image size and enforces RouterOS container limits

set -e

IMAGE_NAME=${1:-nasnet:local}

# Size limits in bytes
LIMIT_BYTES=10485760    # 10MB
WARN_BYTES=9437184      # 9MB

echo ""
echo "🐳 Docker Image Size Check"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Image: $IMAGE_NAME"
echo ""

# Check if Docker is running
if ! docker version > /dev/null 2>&1; then
  echo "❌ Error: Docker is not running or not installed"
  echo "   Start Docker Desktop and try again"
  exit 1
fi

# Check if image exists
if ! docker inspect "$IMAGE_NAME" > /dev/null 2>&1; then
  echo "❌ Error: Image '$IMAGE_NAME' not found"
  echo "   Run docker:build first to create the image"
  exit 1
fi

# Get image size in human-readable format
SIZE_HR=$(docker images "$IMAGE_NAME" --format "{{.Size}}")

# Get uncompressed size in bytes
SIZE_BYTES=$(docker inspect "$IMAGE_NAME" --format='{{.Size}}')

SIZE_MB=$((SIZE_BYTES / 1048576))

echo "Size (uncompressed): $SIZE_HR ($SIZE_MB MB)"
echo "RouterOS limit:      10 MB"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

if [ $SIZE_BYTES -gt $LIMIT_BYTES ]; then
  echo "❌ ERROR: Image exceeds 10MB RouterOS container limit!"
  echo "   Current: $SIZE_MB MB"
  echo "   Limit:   10 MB"
  echo ""
  echo "Optimization suggestions:"
  echo "   - Verify UPX compression is applied to backend binary"
  echo "   - Remove unnecessary files from static build"
  echo "   - Check for duplicate dependencies"
  exit 1
elif [ $SIZE_BYTES -gt $WARN_BYTES ]; then
  echo "⚠️  WARNING: Image approaching 10MB limit ($SIZE_MB MB)"
  echo "   Consider further optimization for safety margin"
  echo ""
else
  echo "✅ Image size OK ($SIZE_MB MB < 10MB limit)"
  echo ""
fi

# Show layer breakdown
echo "Layer breakdown (top 5):"
docker history "$IMAGE_NAME" --format "{{.Size}}\t{{.CreatedBy}}" | head -5 | while read line; do
  size=$(echo "$line" | cut -f1)
  cmd=$(echo "$line" | cut -f2 | cut -c1-60)
  printf "  %-10s %s\n" "$size" "$cmd"
done

echo ""
exit 0

