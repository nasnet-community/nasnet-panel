# Deployment Architecture

**Last Updated:** 2026-01-20  
**Version:** 3.0  
**Status:** Comprehensive - 5-Phase Power-Safe Updates + Pull-Based Architecture

---

## Table of Contents

- [Overview](#overview)
- [Docker Container Strategy](#docker-container-strategy)
- [Multi-Stage Build](#multi-stage-build)
- [Resource Optimization](#resource-optimization)
- [Update System](#update-system)
  - [Pull-Based Architecture](#pull-based-architecture)
  - [9-Stage Update Lifecycle](#9-stage-update-lifecycle)
  - [5-Phase Power-Safe Application](#5-phase-power-safe-application)
  - [Rollback Mechanisms](#rollback-mechanisms)
- [Fleet Update Orchestration](#fleet-update-orchestration)
- [Release Channels](#release-channels)
- [CI/CD Pipeline](#cicd-pipeline)

---

## Overview

NasNetConnect deploys as a Docker container running directly **ON the MikroTik router** with strict resource constraints:

| Constraint | Target | Actual | Status |
|------------|--------|--------|--------|
| **Docker Image** | <10MB ideal, <40MB acceptable | ~6MB base + features | ✅ |
| **Runtime RAM** | 200-400MB configurable | 100-200MB base | ✅ |
| **CPU** | Shared, <5% idle | ~2-3% measured | ✅ |
| **Downtime (Updates)** | <10 seconds | ~5-8 seconds | ✅ |

---

## Docker Container Strategy

### Multi-Architecture Support

```dockerfile
# Build for multiple platforms
FROM --platform=$BUILDPLATFORM golang:1.22-alpine AS builder

ARG TARGETPLATFORM
ARG BUILDPLATFORM

WORKDIR /app

# ... build steps ...

# Supported architectures
- linux/amd64    # x86-64 (CCR, most routers)
- linux/arm64    # ARM 64-bit (newer ARM routers)
- linux/arm/v7   # ARM 32-bit (hAP, older devices)
```

### Image Variants

| Tag | Base Image | Size | Use Case |
|-----|-----------|------|----------|
| `nasnet:2.5.0` | scratch | ~6MB | Production (smallest) |
| `nasnet:2.5.0-debug` | alpine:3.19 | ~8-10MB | Debugging (has shell) |
| `nasnet:2.5.0-distroless` | distroless/static | ~7MB | Production (security) |

---

## Multi-Stage Build

### Optimized Dockerfile

```dockerfile
# ============================================
# Stage 1: Build Backend (Go)
# ============================================
FROM golang:1.22-alpine AS backend
WORKDIR /app

# Install build dependencies
RUN apk add --no-cache gcc musl-dev upx

# Download dependencies (cached layer)
COPY go.mod go.sum ./
RUN go mod download

# Build with optimization flags
COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build \
    -ldflags="-s -w -extldflags '-static'" \
    -o nasnet ./cmd/nnc

# Compress with UPX (50-70% smaller)
RUN upx --best --lzma nasnet

# ============================================
# Stage 2: Build Frontend (React + Vite)
# ============================================
FROM node:20-alpine AS frontend
WORKDIR /app

# Install dependencies (cached layer)
COPY package*.json ./
COPY packages/*/package.json ./packages/
RUN npm ci --include=dev

# Generate GraphQL types
COPY . .
RUN npm run generate:graphql

# Build optimized production bundle
RUN npm run build
# Output: dist/ (~1.5MB gzipped)

# ============================================
# Stage 3: Runtime Image (Production)
# ============================================
FROM scratch AS production

# Copy TLS certificates (for HTTPS API calls)
COPY --from=builder /etc/ssl/certs/ca-certificates.crt /etc/ssl/certs/

# Copy timezone data
COPY --from=builder /usr/share/zoneinfo /usr/share/zoneinfo

# Copy application
COPY --from=backend /app/nasnet /app/nasnet
COPY --from=frontend /app/dist /app/static

# Gateway for SOCKS5 → TUN conversion
COPY --from=builder /app/hev-socks5-tunnel /app/hev-socks5-tunnel

WORKDIR /app

# Expose ports
EXPOSE 8080

# Volume for persistent data
VOLUME /data

# Run as non-root (security)
USER 1000:1000

# Entry point
ENTRYPOINT ["/app/nasnet"]
CMD ["serve"]

# ============================================
# Stage 4: Debug Image (Alpine)
# ============================================
FROM alpine:3.19 AS debug

RUN apk add --no-cache ca-certificates tzdata

# Create non-root user
RUN adduser -D -u 1000 nnc

COPY --from=backend --chown=nnc:nnc /app/nasnet /app/nasnet
COPY --from=frontend --chown=nnc:nnc /app/dist /app/static
COPY --from=builder --chown=nnc:nnc /app/hev-socks5-tunnel /app/hev-socks5-tunnel

WORKDIR /app
USER nnc

EXPOSE 8080
VOLUME /data

ENTRYPOINT ["/app/nasnet"]
CMD ["serve"]
```

---

## Resource Optimization

### Build Optimization Techniques

| Technique | Savings | Impact |
|-----------|---------|--------|
| **CGO_ENABLED=0** | ~20% | Pure Go, no C dependencies |
| **-ldflags="-s -w"** | ~30% | Strip debug info and symbol table |
| **UPX compression** | ~50-70% | Runtime decompression (acceptable) |
| **Multi-stage build** | ~80% | Only runtime artifacts in final image |
| **Vite tree-shaking** | ~60% | Remove unused JavaScript |
| **Tailwind purge** | ~95% | Remove unused CSS classes |

**Size Breakdown:**

```
Backend binary (stripped):  ~10-12 MB
After UPX compression:      ~4-6 MB
Frontend bundle (gzipped):  ~1.5 MB
Gateway (hev-socks5):       ~150 KB
Base image overhead:        ~500 KB
────────────────────────────────────
Total compressed image:     ~6-8 MB ✅
```

---

## Update System

### Pull-Based Architecture

**Philosophy:** Routers control their own update schedule, server is stateless.

```
┌─────────────────────────────────────────────────────────────┐
│                PULL-BASED UPDATE MODEL                       │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Update Server (Passive)          Router (Active)           │
│  ┌──────────────────────┐       ┌───────────────────────┐  │
│  │ • Hosts manifests    │       │ • Checks for updates │  │
│  │ • Serves packages    │ ◄───  │   on schedule        │  │
│  │ • No push capability │ PULL  │ • Decides when to    │  │
│  │ • Stateless          │       │   apply              │  │
│  │ • CDN-friendly       │       │ • Respects local     │  │
│  └──────────────────────┘       │   conditions         │  │
│                                 └───────────────────────┘  │
│                                                              │
│  Benefits:                                                   │
│  ✓ User controls timing (not interrupted)                   │
│  ✓ Respects network conditions (metered, low BW)            │
│  ✓ No server-side state (infinite scale)                    │
│  ✓ Works behind NAT/firewalls (outbound only)               │
│  ✓ Scales with CDN (no custom infrastructure)               │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

**Check Schedule:**
- Default: Every 24 hours
- User-configurable: 1 hour to 7 days
- Smart timing: During idle periods, not active use
- Manual trigger: "Check now" button always available

---

### 9-Stage Update Lifecycle

```
┌──────────┐   ┌──────────┐   ┌──────────┐   ┌──────────┐
│ DISCOVERY│ → │EVALUATION│ → │ DOWNLOAD │ → │  VERIFY  │
│ (5 ways) │   │(policies)│   │ (delta)  │   │ (sign)   │
└──────────┘   └──────────┘   └──────────┘   └──────────┘
      │              │              │              │
      │              │              │              ▼
      │              │              │        ┌──────────┐
      │              │              │        │   PREP   │
      │              │              │        │(snapshot)│
      │              │              │        └──────────┘
      │              │              │              │
      │              │              │              ▼
      │              │              │        ┌──────────┐
      │              │              │        │  APPLY   │
      │              │              │        │ (5-phase)│
      │              │              │        └──────────┘
      │              │              │              │
      │              │              │              ▼
      │              │              │        ┌──────────┐
      │              │              │        │ VALIDATE │
      │              │              │        │ (60s WD) │
      │              │              │        └──────────┘
      │              │              │         │        │
      │              │              │         ▼        ▼
      │              │              │    ┌────────┐ ┌────────┐
      │              │              │    │ COMMIT │ │ROLLBACK│
      │              │              │    └────────┘ └────────┘
      │              │              │         │        │
      │              │              │         └────┬───┘
      │              │              │              ▼
      │              │              │        ┌──────────┐
      │              │              │        │  REPORT  │
      │              │              │        │ (notify) │
      │              │              │        └──────────┘
```

#### Stage 1: DISCOVERY

**5 Update Discovery Channels:**

| Channel | Method | Trigger | Use Case |
|---------|--------|---------|----------|
| **Polling** | Router checks manifest endpoint | 24h interval (configurable) | Default for most routers |
| **Push Notification** | Cloud service pushes alert | Critical security updates | Immediate awareness |
| **On-Demand** | User clicks "Check for Updates" | Manual | User-initiated |
| **Fleet Broadcast** | Fleet manager notifies routers | Fleet admin triggers | Centralized control |
| **DNS-based** | TXT record check | Fallback | Works without internet |

#### Stage 2: EVALUATION

**Update Policy Engine:**

```go
type UpdatePolicy struct {
    AutoApply          bool
    MaintenanceWindows []TimeWindow
    MinSeverity        Severity
    RequireUserApproval bool
}

func (e *UpdateEvaluator) ShouldApply(update *Update, policy UpdatePolicy) ApplyDecision {
    // Security updates bypass user preference
    if update.Severity == SeverityCritical {
        return ApplyImmediate
    }
    
    // Check maintenance window
    if !policy.IsInMaintenanceWindow(time.Now()) {
        return ApplyDefer
    }
    
    // Check severity threshold
    if update.Severity < policy.MinSeverity {
        return ApplySkip
    }
    
    // Check auto-apply policy
    if !policy.AutoApply {
        return ApplyAskUser
    }
    
    return ApplyProceed
}
```

**Severity Matrix:**

| Update Type | Auto-Apply | User Prompt | Notification |
|-------------|------------|-------------|--------------|
| **Security/Critical** | Yes (immediately) | No | Persistent banner + push |
| **Major Version** | No | Yes + changelog | Modal on login |
| **Minor/Patch** | Yes (during idle) | No | Subtle indicator |
| **Feature Release** | No | Badge only | None |

#### Stage 3: DOWNLOAD

**Delta Updates with Resume:**

```go
type DownloadManager struct {
    cacheDir       string
    resumeEnabled  bool
    retentionDays  int  // 7 days for partial downloads
}

func (d *DownloadManager) Download(update *Update) error {
    // Check for partial download
    partial := d.findPartialDownload(update.Version)
    if partial != nil && partial.IsValid() {
        // Resume from last position
        return d.resumeDownload(update, partial)
    }
    
    // Fresh download
    return d.downloadFresh(update)
}
```

**Download Priority (Fallback Chain):**
1. CDN (primary) - https://cdn.nasnet.io/releases/
2. Mirror servers - https://mirror1.nasnet.io/, https://mirror2.nasnet.io/
3. GitHub Releases - https://github.com/nasnetconnect/releases/
4. Local cache (if available) - Other routers in fleet
5. Fleet manager cache - For fleet-managed routers

#### Stage 4: VERIFICATION

**Package Verification:**

```go
func (v *PackageVerifier) Verify(pkg *Package) error {
    // 1. Verify SHA256 hash
    if !v.verifyHash(pkg.Bytes(), pkg.ExpectedHash) {
        return ErrHashMismatch
    }
    
    // 2. Check CRL (hybrid: cached + online)
    keyID := pkg.SignatureKeyID()
    if revoked, _ := v.crl.IsKeyRevoked(keyID); revoked {
        return ErrKeyRevoked
    }
    
    // 3. Verify package signature
    if !v.verifySignature(pkg.Bytes(), pkg.Signature(), keyID) {
        // Silent re-download (max 3 retries) on tamper detection
        if v.retryCount < 3 {
            return v.downloadAndVerify(pkg.URL, v.retryCount+1)
        }
        return ErrSignatureInvalid
    }
    
    return nil
}
```

---

### 5-Phase Power-Safe Application

**Design Goal:** Power loss at ANY point results in recoverable state.

```
┌─────────────────────────────────────────────────────────────────┐
│              5-PHASE POWER-SAFE UPDATE                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Phase 1: STAGING (Power loss = no change)                     │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ 1. Write journal: state=STAGING                          │   │
│  │ 2. Copy new binary to /staging/nasnet.new                │   │
│  │ 3. Copy new frontend to /staging/frontend/               │   │
│  │ 4. Backup database to /backup/db.sql                     │   │
│  │ 5. Write journal: state=STAGED                           │   │
│  └──────────────────────────────────────────────────────────┘   │
│           │                                                      │
│           │ Power loss → Boot detects STAGING                   │
│           │            → Delete staging, continue normal        │
│           ▼                                                      │
│                                                                  │
│  Phase 2: MIGRATION (Power loss = rollback DB)                 │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ 6. Write journal: state=MIGRATING                        │   │
│  │ 7. Run database migration (transactional)                │   │
│  │ 8. Write journal: state=MIGRATED, old_schema=X           │   │
│  └──────────────────────────────────────────────────────────┘   │
│           │                                                      │
│           │ Power loss → Boot detects MIGRATING                 │
│           │            → Restore db.sql, delete staging         │
│           ▼                                                      │
│                                                                  │
│  Phase 3: SWITCH (Power loss = boot old binary)                │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  9. Write journal: state=SWITCHING                       │   │
│  │ 10. Atomic rename: /app/nasnet → /backup/nasnet.old     │   │
│  │ 11. Atomic rename: /staging/nasnet.new → /app/nasnet    │   │
│  │ 12. Atomic rename frontend files                         │   │
│  │ 13. Write journal: state=SWITCHED                        │   │
│  └──────────────────────────────────────────────────────────┘   │
│           │                                                      │
│           │ Power loss → Boot detects SWITCHING                 │
│           │            → Restore old binary + db.sql            │
│           ▼                                                      │
│                                                                  │
│  Phase 4: VALIDATION (Power loss = full rollback)              │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ 14. Write journal: state=VALIDATING                      │   │
│  │ 15. Start new binary                                     │   │
│  │ 16. Run health checks (60s watchdog)                     │   │
│  │     • HTTP endpoint responsive?                          │   │
│  │     • GraphQL queries working?                           │   │
│  │     • Database intact?                                    │   │
│  │     • Router API reachable?                              │   │
│  │     • Internet connectivity OK?                          │   │
│  │ 17. Write journal: state=VALIDATED                       │   │
│  └──────────────────────────────────────────────────────────┘   │
│           │                                                      │
│           │ Power loss → Boot detects VALIDATING                │
│           │            → Full rollback (binary + DB)            │
│           ▼                                                      │
│                                                                  │
│  Phase 5: COMMIT (Power loss = cleanup incomplete)             │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ 18. Write journal: state=COMMITTING                      │   │
│  │ 19. Delete staging directory                             │   │
│  │ 20. Delete N-2 backups (keep N-1 only)                   │   │
│  │ 21. Write journal: state=COMPLETE                        │   │
│  │ 22. Delete journal file                                  │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
│  COMPLETE: Update successful, system stable                     │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

**Update Journal Structure:**

```go
// Persists across reboots: /data/update.journal
type UpdateJournal struct {
    UpdateID        string    `json:"update_id"`
    TargetVersion   string    `json:"target_version"`
    CurrentVersion  string    `json:"current_version"`
    State           string    `json:"state"`
    StartedAt       time.Time `json:"started_at"`
    LastUpdated     time.Time `json:"last_updated"`
    
    // Recovery paths
    StagingDir      string    `json:"staging_dir"`
    BackupDir       string    `json:"backup_dir"`
    DBBackupPath    string    `json:"db_backup_path"`
    OldBinaryPath   string    `json:"old_binary_path"`
    OldSchemaVersion string   `json:"old_schema_version"`
    
    // Error tracking
    LastError       string    `json:"last_error,omitempty"`
    FailedAt        string    `json:"failed_at,omitempty"`
}

// Atomic write (temp file + rename)
func (j *UpdateJournal) Write() error {
    j.LastUpdated = time.Now()
    data, _ := json.MarshalIndent(j, "", "  ")
    
    tmpPath := JournalPath + ".tmp"
    if err := os.WriteFile(tmpPath, data, 0644); err != nil {
        return err
    }
    
    return os.Rename(tmpPath, JournalPath)  // Atomic
}
```

**Boot-Time Recovery:**

```go
func CheckAndRecoverOnBoot() error {
    journal, err := LoadUpdateJournal()
    if err != nil {
        // No journal = clean state
        return nil
    }
    
    log.Printf("Incomplete update detected: state=%s", journal.State)
    
    switch journal.State {
    case "STAGING", "STAGED":
        // Safe - just cleanup staging
        os.RemoveAll(journal.StagingDir)
        
    case "MIGRATING", "MIGRATED":
        // Restore database from backup
        RestoreDatabase(journal.DBBackupPath)
        os.RemoveAll(journal.StagingDir)
        
    case "SWITCHING":
        // Partially switched - restore binary AND database
        RestoreBinary(journal.OldBinaryPath)
        RestoreDatabase(journal.DBBackupPath)
        
    case "SWITCHED", "VALIDATING":
        // New binary in place but not validated - full rollback
        FullRollback(journal)
        
    case "VALIDATED", "COMMITTING":
        // Almost done - finish cleanup
        os.RemoveAll(journal.StagingDir)
    }
    
    os.Remove(JournalPath)
    NotifyUser("System recovered from interrupted update")
    
    return nil
}
```

---

### Rollback Mechanisms

**Three-Layer Safety Net:**

```
┌─────────────────────────────────────────────────────────────┐
│                ROLLBACK SAFETY LAYERS                        │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Layer 1: APP-LEVEL WATCHDOG (60 seconds)                   │
│  ┌─────────────────────────────────────────────────────────┐│
│  │  • Health checks start immediately after new binary     ││
│  │  • Critical checks: HTTP, GraphQL, Database, Router API ││
│  │  │  Non-critical: WebSocket, Features (retry 3x)        ││
│  │  • Timeout: 60 seconds                                   ││
│  │  • Action: Auto-rollback if any critical check fails    ││
│  └─────────────────────────────────────────────────────────┘│
│                          │                                   │
│                          ▼ If app watchdog passes            │
│                                                              │
│  Layer 2: ROUTEROS WATCHDOG (300 seconds)                   │
│  ┌─────────────────────────────────────────────────────────┐│
│  │  • RouterOS scheduler checks health every 30s           ││
│  │  • 10 consecutive failures (300s total) = swap          ││
│  │  • Action: RouterOS swaps primary ↔ backup container    ││
│  │  • No physical access required                           ││
│  └─────────────────────────────────────────────────────────┘│
│                          │                                   │
│                          ▼ If RouterOS watchdog passes       │
│                                                              │
│  Layer 3: MANUAL RECOVERY (User Intervention)               │
│  ┌─────────────────────────────────────────────────────────┐│
│  │  • User SSH into router                                 ││
│  │  • Manually swap container or restore from backup       ││
│  │  • Last resort for catastrophic failures                ││
│  └─────────────────────────────────────────────────────────┘│
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

**Rollback Execution:**

```go
func (u *UpdateService) Rollback(journal *UpdateJournal) error {
    log.Printf("Rolling back update to version %s", journal.CurrentVersion)
    
    // 1. Stop new binary
    u.shutdown(5 * time.Second)
    
    // 2. Restore old binary
    if err := os.Rename(journal.OldBinaryPath, "/app/nasnet"); err != nil {
        return err
    }
    
    // 3. Restore database
    if err := u.restoreDatabase(journal.DBBackupPath); err != nil {
        return err
    }
    
    // 4. Cleanup staging
    os.RemoveAll(journal.StagingDir)
    
    // 5. Write rollback event
    u.auditLog.Log(AuditEvent{
        Type: "update.rollback",
        Details: map[string]interface{}{
            "from_version": journal.TargetVersion,
            "to_version":   journal.CurrentVersion,
            "reason":       journal.LastError,
        },
    })
    
    // 6. Notify user
    u.notifyUser("Update rolled back. Running version: " + journal.CurrentVersion)
    
    return nil
}
```

**Database Rollback:**

```go
// Transactional migrations with down scripts
type Migration struct {
    Version   string
    Up        []MigrationStep  // Forward
    Down      []MigrationStep  // Reverse (rollback)
    PreCheck  string
}

func (m *Migrator) RollbackTo(targetVersion string) error {
    currentVersion := m.getCurrentVersion()
    migrationsToRollback := m.getMigrationsBetween(targetVersion, currentVersion)
    
    tx, _ := m.db.Begin()
    defer tx.Rollback()
    
    // Apply DOWN migrations in reverse order
    for i := len(migrationsToRollback) - 1; i >= 0; i-- {
        migration := migrationsToRollback[i]
        for _, step := range migration.Down {
            if _, err := tx.Exec(step.SQL); err != nil {
                // Down migration failed - restore from SQL dump backup
                return m.restoreFromBackup()
            }
        }
        tx.Exec("DELETE FROM schema_migrations WHERE version = ?", migration.Version)
    }
    
    return tx.Commit()
}
```

---

## Fleet Update Orchestration

### Canary + Percentage Rollout

```
┌─────────────────────────────────────────────────────────────┐
│               FLEET UPDATE WAVES                             │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Wave 1: CANARY (1 router)                                  │
│  ├─ Deploy to single test router                            │
│  ├─ Wait: 5 minutes                                          │
│  ├─ Monitor: Health checks, error rates                     │
│  └─ Decision: Continue or abort                             │
│                                                              │
│  Wave 2: 10% of Fleet                                       │
│  ├─ Deploy to 10% of routers                                │
│  ├─ Wait: 5 minutes                                          │
│  ├─ Failure threshold: >10% fail → AUTO-STOP                │
│  └─ Auto-rollback failed routers immediately                │
│                                                              │
│  Wave 3: 50% of Fleet                                       │
│  ├─ Deploy to next 40% of routers                           │
│  ├─ Wait: 5 minutes                                          │
│  ├─ Failure threshold: >10% fail → AUTO-STOP                │
│  └─ Auto-rollback failed routers                            │
│                                                              │
│  Wave 4: 100% (Remaining)                                   │
│  ├─ Deploy to final 50%                                     │
│  └─ Complete                                                 │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

**Failure Analysis:**

```go
func (f *FleetUpdateService) shouldStopRollout(wave WaveStatus) bool {
    if wave.Total == 0 {
        return false
    }
    
    failureRate := float64(wave.Failed) / float64(wave.Total)
    
    // 10% threshold
    if failureRate >= 0.10 {
        // Analyze failure patterns
        analysis := f.analyzeFailures(wave.Failures)
        
        // Common patterns?
        if analysis.CommonRouterOSVersion != "" {
            log.Printf("Common RouterOS version in failures: %s", 
                analysis.CommonRouterOSVersion)
        }
        
        if analysis.CommonError != "" {
            log.Printf("Common error across failures: %s", 
                analysis.CommonError)
        }
        
        // Stop rollout and notify
        f.notifyAdmin(FleetUpdateStopped{
            Wave:        wave.Number,
            FailureRate: failureRate,
            Analysis:    analysis,
        })
        
        return true
    }
    
    return false
}
```

---

## Release Channels

### Four-Channel Strategy

| Channel | Frequency | Auto-Update | Purpose | Stability |
|---------|-----------|-------------|---------|-----------|
| **Nightly** | Daily | Opt-in only | Developers, bleeding edge | Experimental |
| **Beta** | Weekly | Opt-in | Early adopters, testing | Release candidate |
| **Stable** | Monthly | Default | Production recommended | High |
| **LTS** | Quarterly | Conservative | Long-term support, security only | Maximum |

**Version Format (SemVer):**
- Stable: `2.5.0`
- Beta: `2.6.0-beta.3`
- Nightly: `2.6.0-nightly.20260120`
- LTS: `2.0.0-lts`

**Channel Switching:**

```go
func (s *UpdateService) SwitchChannel(channel ReleaseChannel) error {
    // Update configuration
    s.config.ReleaseChannel = channel
    
    // Immediate check for updates
    if updates, err := s.checkForUpdates(); err == nil && len(updates) > 0 {
        s.notifyUser(fmt.Sprintf("Updates available on %s channel", channel))
    }
    
    return s.saveConfig()
}
```

---

## CI/CD Pipeline

### GitHub Actions Workflow

```yaml
name: Build and Release

on:
  push:
    tags: ['v*']
  workflow_dispatch:

jobs:
  # Parallel builds for multiple architectures
  build:
    strategy:
      matrix:
        arch: [amd64, arm64, armv7]
    
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v4
      
      # Affected builds (Nx optimization)
      - name: Determine affected projects
        run: npx nx affected:build --base=HEAD~1
      
      - name: Build Docker image
        run: |
          docker buildx build \
            --platform linux/${{ matrix.arch }} \
            --tag nasnet:${{ github.ref_name }}-${{ matrix.arch }} \
            --output type=docker \
            .
      
      - name: Sign image
        run: |
          cosign sign --key ${{ secrets.COSIGN_KEY }} \
            nasnet:${{ github.ref_name }}-${{ matrix.arch }}
      
      - name: Push to registry
        run: |
          docker push nasnet:${{ github.ref_name }}-${{ matrix.arch }}
  
  # Create multi-arch manifest
  manifest:
    needs: build
    runs-on: ubuntu-latest
    steps:
      - name: Create manifest
        run: |
          docker manifest create nasnet:${{ github.ref_name }} \
            nasnet:${{ github.ref_name }}-amd64 \
            nasnet:${{ github.ref_name }}-arm64 \
            nasnet:${{ github.ref_name }}-armv7
          
          docker manifest push nasnet:${{ github.ref_name }}
```

### Quality Gates

```yaml
# PR Workflow (Fast Feedback)
on: [pull_request]

jobs:
  test:
    steps:
      - name: Affected tests
        run: nx affected --target=test --parallel=4
      
      - name: Affected lint
        run: nx affected --target=lint
      
      - name: Affected build
        run: nx affected --target=build
      
  security:
    steps:
      - name: Dependency scan
        run: snyk test --severity-threshold=high
      
      - name: Code scan
        run: snyk code test
      
      - name: Container scan
        run: trivy image nasnetconnect:latest
```

---

## Related Documents

- [Backend Architecture](./backend-architecture.md) - Service layer and infrastructure
- [Security Architecture](./security-architecture.md) - Authentication and encryption
- [Data Architecture](./data-architecture.md) - Database and state management
- [ADR-016: Pull-Based Update System](#) - Update architecture decision

---
