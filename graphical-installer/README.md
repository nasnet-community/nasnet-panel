# Nasnet Panel Installer

Cross-platform desktop installer that deploys Nasnet Panel to a MikroTik router as a container.
Built with [Wails v2](https://wails.io) (Go backend, static HTML/JS frontend), shipped for Windows
and macOS from the release workflows.

## Install steps

The engine (`internal/install/engine.go`) runs these in order, with rollback on failure:

1. Connect to router
2. Check system
3. Enable container device-mode
4. Download image
5. Upload to router
6. Configure network
7. Deploy container
8. Start and health check
9. LAN baseline

Uninstall reverses the container, network config, and uploaded files.

## LAN baseline script

`scripts/nasnet-lan-baseline.rsc` at the repo root is the single source for the LAN baseline
applied in the final install step. The installer embeds it from `assets/`, which is generated and
not tracked in git, because `go:embed` cannot reference a path outside its own package.

Copy it in before any build, `go vet`, or `wails dev` run:

```bash
cp ../scripts/nasnet-lan-baseline.rsc assets/
```

Skipping the copy fails with `pattern nasnet-lan-baseline.rsc: no matching files found`. CI runs
the same copy step in every installer job, so edit the script only in `scripts/`.

## Building

Run from this directory, after staging the baseline script above.

```bash
# Windows
GOOS=windows GOARCH=amd64 CGO_ENABLED=0 go build -tags desktop,production \
  -ldflags "-s -w -H windowsgui" \
  -o dist/nasnet-panel-installer-windows-amd64.exe .

# macOS (requires cgo and a macOS host)
export CGO_LDFLAGS="-framework UniformTypeIdentifiers"
GOOS=darwin GOARCH=arm64 CGO_ENABLED=1 go build -tags desktop,production \
  -ldflags "-s -w" -o dist/installer-arm64 .
```

Release builds produce a universal binary via `lipo`, wrap it in `Nasnet Panel Installer.app` using
`darwin/Info.plist`, and package a DMG. See `.github/workflows/release.yml` for the full sequence.

## Versioning

`internal/buildinfo.Version` defaults to `v0.0.0-dev` and is replaced at link time:

```bash
go build -ldflags "-X nasnet-panel-installer/internal/buildinfo.Version=v1.2.3" .
```

The UI reads it through `AppVersion` and shows it in the header. CI passes the release tag, or
`dev-<short sha>` for snapshot builds, and stamps the same value into the macOS bundle
(`CFBundleShortVersionString`) and the Windows version resource:

```bash
../scripts/installer-windows-resource.sh v1.2.3 0
```

That writes `resource_windows_amd64.syso`, which `go build` links into the Windows executable. The
file is generated and gitignored, so regenerate it whenever you want a local Windows build to carry
version metadata.

## Checks

```bash
gofmt -l .
GOOS=windows GOARCH=amd64 go vet -tags desktop,production ./...
```

## Frontend

`frontend/dist/` holds the built UI assets, embedded by `main.go`. There is no frontend build step;
`wails.json` sets `frontend:build` to empty and the files are edited directly.
