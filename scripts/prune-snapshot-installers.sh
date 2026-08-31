#!/usr/bin/env bash
# Drop graphical installer assets left on the snapshot release by earlier builds.
set -euo pipefail

platform="${1:?usage: prune-snapshot-installers.sh <windows|macos> <version>}"
version="${2:?usage: prune-snapshot-installers.sh <windows|macos> <version>}"

prefix="nasnet-panel-installer-${platform}-"
keep="${prefix}${version}."

gh release view snapshot --json assets --jq '.assets[].name' 2>/dev/null \
  | { grep "^${prefix}" || true; } \
  | { grep -v "^${keep}" || true; } \
  | while IFS= read -r asset; do
      echo "removing stale asset ${asset}"
      gh release delete-asset snapshot "$asset" --yes || true
    done
