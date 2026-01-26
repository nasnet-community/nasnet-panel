# ADR-008: Direct Download Binary Distribution

**Date:** 2025-12-12
**Status:** Accepted
**Deciders:** Technical Architect, BMad
**Category:** Distribution / Licensing

---

## Context

NasNetConnect needs to distribute network service binaries (sing-box, Xray-core, Tor, MTProxy, Psiphon, AdGuard Home) to users. Several of these are licensed under GPL-3.0 or GPL-2.0.

### Licensing Landscape

| Project | License | Distribution Complexity |
|---------|---------|------------------------|
| sing-box | GPL-3.0 | Source distribution required if modified/redistributed |
| Xray-core | MPL-2.0 | File-level copyleft, less restrictive |
| Tor | BSD-3-Clause | Permissive, no issues |
| MTProxy | GPL-2.0 | Source distribution required if redistributed |
| Psiphon | GPL-3.0 | Source distribution required if redistributed |
| AdGuard Home | GPL-3.0 | Source distribution required if redistributed |

### The Problem

If NasNetConnect hosts or bundles GPL binaries:
1. Must provide source code access
2. Must track modifications
3. Complex legal compliance
4. Potential liability

## Decision

Implement **Direct Download Model** where NasNetConnect stores manifests (metadata + URLs) but users download binaries directly from official sources.

### How It Works

```
┌─────────────────────────────────────────────────────────────────┐
│                    NNC FEATURE REGISTRY                          │
│                                                                  │
│  Stores: manifest.json files with:                              │
│  - Feature metadata (name, version, description)                │
│  - Official download URL patterns                               │
│  - Verification checksums/signatures                            │
│  - Configuration generator info                                 │
│                                                                  │
│  Does NOT store: Binary files                                   │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            │ User clicks "Install sing-box"
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                    DOWNLOAD FLOW                                 │
│                                                                  │
│  1. NNC reads manifest for sing-box                             │
│  2. Constructs URL: github.com/SagerNet/sing-box/releases/...   │
│  3. Downloads binary directly from GitHub                       │
│  4. Verifies SHA256 checksum from official checksums.txt        │
│  5. Installs to /features/sing-box/bin/                         │
└─────────────────────────────────────────────────────────────────┘
```

### Manifest Schema

```json
{
  "id": "sing-box",
  "name": "sing-box",
  "version": "1.12.8",
  "license": "GPL-3.0",
  "source": {
    "type": "github-release",
    "owner": "SagerNet",
    "repo": "sing-box",
    "asset_pattern": "sing-box-{{version}}-linux-{{arch}}.tar.gz",
    "verification": {
      "type": "sha256",
      "checksums_asset": "checksums.txt"
    }
  }
}
```

### Verification Methods

| Method | Used By | How |
|--------|---------|-----|
| **SHA256** | sing-box, Xray-core, AdGuard | Download checksums.txt, verify hash |
| **GPG** | Tor | Verify against Tor Project's public key |
| **cosign** | Future | Sigstore verification for modern projects |

## Consequences

### Positive

- **No GPL Compliance Burden** - We don't distribute binaries
- **Always Official Binaries** - Users get authentic, unmodified software
- **Automatic Updates** - Point to new version, manifest updates
- **Reduced Attack Surface** - No supply chain attacks via NNC
- **Smaller Base Image** - Features downloaded on-demand

### Negative

- **Requires Internet** - Initial installation needs connectivity
- **External Dependency** - GitHub/official sites must be available
- **Version Pinning** - Must handle version mismatches carefully
- **Download Time** - First install takes longer

### Neutral

- **Caching** - Can cache downloaded binaries locally
- **Offline Mode** - Once downloaded, works offline
- **Version Management** - User controls when to update

## Implementation Details

### GitHub Releases API Integration

```go
type GitHubRegistry struct {
    client *github.Client
}

func (r *GitHubRegistry) GetLatestRelease(owner, repo string) (*Release, error)
func (r *GitHubRegistry) DownloadAsset(asset *Asset, destPath string) error
func (r *GitHubRegistry) VerifyChecksum(binaryPath, checksumsPath, filename string) error
```

### Architecture Pattern Matching

```go
func matchArchitecture(pattern string, goarch string) string {
    archMap := map[string]string{
        "amd64": "amd64",
        "arm64": "arm64",
        "arm":   "armv7",
    }
    return strings.ReplaceAll(pattern, "{{arch}}", archMap[goarch])
}
```

## Alternatives Considered

### 1. Bundle All Binaries

Include all service binaries in base Docker image.

**Rejected because:**
- Bloats image (100MB+ vs 6MB)
- GPL compliance nightmare
- Forces users to download unused features
- Harder to update individual features

### 2. Self-Hosted Binary Mirror

NasNetConnect project hosts binary mirror.

**Rejected because:**
- Must comply with GPL (source distribution)
- Bandwidth costs
- Supply chain security concerns
- Maintenance burden

### 3. Source Compilation on Device

Compile from source on user's router.

**Rejected because:**
- RouterOS container lacks build tools
- Compilation too resource-intensive
- Complex dependency management
- Impractical for C-based tools (Tor, MTProxy)

## Related Decisions

- [ADR-006: Virtual Interface Factory Pattern](./006-virtual-interface-factory.md)

---

**Legal Note:** This approach treats NasNetConnect as a "configuration and orchestration layer" that doesn't distribute GPL software, only references to it.

