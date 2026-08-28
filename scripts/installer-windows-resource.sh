#!/usr/bin/env bash
set -euo pipefail

version="${1:?usage: installer-windows-resource.sh <version> [build-number]}"
build="${2:-0}"

numeric="${version#v}"
numeric="${numeric%%-*}"
if [[ ! $numeric =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
  numeric="0.0.0"
fi
IFS=. read -r major minor patch <<<"$numeric"

cd "$(dirname "$0")/../graphical-installer"

go run github.com/josephspurrier/goversioninfo/cmd/goversioninfo@v1.7.0 \
  -o resource_windows_amd64.syso \
  -ver-major "$major" -ver-minor "$minor" -ver-patch "$patch" -ver-build "$build" \
  -product-ver-major "$major" -product-ver-minor "$minor" -product-ver-patch "$patch" \
  -product-ver-build "$build" \
  -file-version "$numeric.$build" \
  -product-version "$version" \
  versioninfo.json
