# 20. Deployment & CI/CD Patterns

## 9-Stage Update Lifecycle

```
┌─────────────────────────────────────────────────────┐
│                 UPDATE LIFECYCLE FLOW                │
├─────────────────────────────────────────────────────┤
│                                                      │
│  ┌──────────┐   ┌──────────┐   ┌──────────┐        │
│  │ DISCOVERY│ → │EVALUATION│ → │ DOWNLOAD │        │
│  │ (5 ways) │   │(policies)│   │ (delta)  │        │
│  └──────────┘   └──────────┘   └──────────┘        │
│       │              │              │               │
│       ↓              ↓              ↓               │
│  ┌──────────┐   ┌──────────┐   ┌──────────┐        │
│  │VERIFICATION│ → │  PREP   │ → │  APPLY   │       │
│  │(signatures)│   │(snapshot)│   │(cold rst)│       │
│  └──────────┘   └──────────┘   └──────────┘        │
│       │              │              │               │
│       ↓              ↓              ↓               │
│  ┌──────────┐   ┌────────┐   ┌────────┐           │
│  │ VALIDATE │ → │ COMMIT │ or │ROLLBACK│           │
│  │(60s WDT) │   └────────┘   └────────┘           │
│  └──────────┘        │              │              │
│                      └──────┬───────┘              │
│                             ↓                       │
│                       ┌──────────┐                  │
│                       │ REPORT   │                  │
│                       │(notify)  │                  │
│                       └──────────┘                  │
│                                                      │
│  SAFETY NETS:                                        │
│  ├── App-level watchdog: 60s timeout → auto-rollback│
│  └── RouterOS watchdog: 300s timeout → container swap│
│                                                      │
└─────────────────────────────────────────────────────┘
```

## Power-Safe Update System

```go
// Update journal for atomic file swaps with boot-time recovery
type UpdateJournal struct {
    Phase       UpdatePhase  // STAGING, MIGRATION, SWITCH, VALIDATION, COMMIT
    StartedAt   time.Time
    FromVersion string
    ToVersion   string
    Operations  []JournalOp  // File moves, DB migrations, etc.
}

// Boot-time recovery checks journal
func RecoverFromJournal() error {
    journal := loadJournal()
    if journal == nil {
        return nil  // No pending update
    }

    switch journal.Phase {
    case STAGING, MIGRATION:
        // Failed before switch - clean up staging
        return cleanupStaging()
    case SWITCH:
        // Failed during switch - rollback
        return rollback(journal)
    case VALIDATION:
        // Failed validation - rollback
        return rollback(journal)
    case COMMIT:
        // Almost done - complete commit
        return completeCommit(journal)
    }
    return nil
}
```

## Fleet Update Orchestration

```go
// Canary + Percentage rollout with auto-stop on failures
type FleetRollout struct {
    UpdateID   string
    Waves      []Wave
    FailureThreshold float64  // 10% = auto-stop
}

type Wave struct {
    Coverage   float64       // Percentage of fleet
    WaitTime   time.Duration // Wait before next wave
    Routers    []string      // Router IDs in this wave
    Status     WaveStatus
}

// Wave execution:
// Wave 1: Canary (1 router) → 5 min wait → Continue
// Wave 2: 10% → 5 min wait → Auto-rollback failed, STOP if >10% fail
// Wave 3: 50% → 5 min wait → Auto-rollback failed, STOP if >10% fail
// Wave 4: 100% → Complete
```

## Feature Crash Isolation

```go
// Isolate and disable problematic features without affecting core
type FeatureCrashTracker struct {
    FeatureID    string
    CrashCount   int
    LastCrash    time.Time
    Status       FeatureStatus  // RUNNING, CRASHED, DISABLED
}

const crashThreshold = 5
const crashWindow = time.Hour

func (t *FeatureCrashTracker) HandleCrash() {
    t.CrashCount++
    t.LastCrash = time.Now()

    if t.CrashCount >= crashThreshold {
        t.Status = DISABLED
        notifyUser(fmt.Sprintf(
            "Feature '%s' has been disabled due to repeated errors",
            t.FeatureID,
        ))
    }
}

// Reset counter after stable operation
func (t *FeatureCrashTracker) ResetIfStable() {
    if time.Since(t.LastCrash) > crashWindow {
        t.CrashCount = 0
    }
}
```

## Container Image Optimization

```dockerfile
# Multi-stage build for minimal size (<10MB target)
FROM golang:1.22-alpine AS builder
WORKDIR /app
COPY . .
RUN CGO_ENABLED=0 go build -ldflags="-s -w" -o nasnet ./cmd/server
RUN upx --best nasnet  # Additional compression

# Production: Scratch (smallest, ~5-6MB)
FROM scratch AS production
COPY --from=builder /app/nasnet /nasnet
COPY --from=builder /app/frontend /frontend

# Debug: Alpine (has shell, ~8-10MB)
FROM alpine:3.19 AS debug
RUN apk add --no-cache ca-certificates
COPY --from=builder /app/nasnet /nasnet
COPY --from=builder /app/frontend /frontend
```

## Release Channel Strategy

| Channel | Frequency | Auto-Update | Purpose |
|---------|-----------|-------------|---------|
| Nightly | Daily | Opt-in only | Developers, bleeding edge |
| Beta | Weekly | Opt-in | Early adopters, testing |
| Stable | Monthly | Default | Production recommended |
| LTS | Quarterly | Conservative | Long-term support, security only |
| Hotfix | As needed | Push | Emergency patches |

---
