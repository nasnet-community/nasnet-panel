# ADR-013: Three-Tier Event Storage Strategy

**Date:** 2026-01-20  
**Status:** Accepted  
**Deciders:** Technical Architect, BMad  
**Category:** Architecture / Data / Performance  
**Source Session:** brainstorming-session-database-2026-01-03.md  
**Related ADRs:** ADR-012 (Universal State v2), ADR-014 (Hybrid Database)

---

## Context

NasNetConnect uses event sourcing for complete audit trail and time-travel capabilities. With event sourcing, every state mutation generates an event that must be persisted.

**Challenges:**
1. **Flash Wear:** RouterOS uses NAND flash with limited write cycles (~10,000-100,000)
2. **High Event Volume:** Metrics updates every 5-60s generate thousands of events daily
3. **Storage Constraints:** Limited flash space (~70MB usable on /var)
4. **Power Failure Risk:** Volatile storage like tmpfs loses data on power loss
5. **Audit Requirements:** Critical events (config changes, auth) must persist

**Conflicting Requirements:**
- Need to write all events for complete audit trail
- Cannot write all events to flash (wear + space constraints)
- Must persist critical events for compliance
- Need fast query access to recent events

---

## Decision

Implement a **Three-Tier Event Storage Strategy** that balances performance, flash longevity, and audit requirements:

### Tier 1: HOT (tmpfs - Volatile, Unlimited Writes)

- **Location:** `/tmp/events_hot.db` (tmpfs, RAM-backed)
- **Duration:** 24 hours
- **Events:** ALL events (no filtering)
- **Writes:** Unlimited (tmpfs has no wear concern)
- **Volatility:** Lost on power failure (acceptable for low-value events)
- **Purpose:** Fast queries, recent history, real-time analytics

### Tier 2: WARM (Flash - Persistent, Filtered)

- **Location:** `/var/router-{id}.db` (flash storage)
- **Duration:** 7-30 days (configurable per event type)
- **Events:** Critical events only (filtered)
- **Compression:** zstd for large payloads (10x better than gzip)
- **Writes:** Minimized via filtering and batching
- **Volatility:** Persistent across reboots
- **Purpose:** Audit trail, compliance, rollback

### Tier 3: COLD (External - Unlimited Archive)

- **Location:** `/mnt/usb/events_archive/` (optional external storage)
- **Duration:** Unlimited (user-managed)
- **Events:** Complete archive (all events)
- **Compression:** zstd level 9 (maximum compression)
- **Format:** Partitioned by month (events-2026-01.db.zst)
- **Volatility:** Persistent (if external storage available)
- **Purpose:** Long-term audit, forensics, compliance

---

## Event Classification

### Critical Events (Warm Tier - 30 days)

```go
var criticalEventTypes = []string{
    "resource.wan.created",
    "resource.wan.deleted",
    "resource.vpn.created",
    "resource.vpn.deleted",
    "resource.firewall.modified",
    "auth.session.revoked",
    "auth.password.changed",
    "router.deleted",
    "config.applied",
    "feature.installed",
    "feature.crashed",
}
```

### Normal Events (Warm Tier - 7 days)

```go
var normalEventTypes = []string{
    "resource.created",
    "resource.updated",
    "resource.deleted",
    "feature.started",
    "feature.stopped",
    "router.connected",
    "router.disconnected",
}
```

### Low-Value Events (Hot Tier Only - 24 hours)

```go
var lowValueEventTypes = []string{
    "metric.updated",
    "log.appended",
    "runtime.polled",
    "health.checked",
}
```

---

## Sync Strategy

### Critical Events: Immediate Sync

```go
func (es *EventStore) PublishCriticalEvent(event Event) error {
    // 1. Write to hot tier (tmpfs) - fast
    if err := es.hotDB.WriteEvent(event); err != nil {
        return err
    }
    
    // 2. Sync to warm tier immediately (flash) - durable
    if isCritical(event.Type) {
        if err := es.warmDB.WriteEvent(event); err != nil {
            log.Printf("Warning: failed to sync critical event to warm tier: %v", err)
            // Don't fail the operation - event is in hot tier
        }
    }
    
    return nil
}
```

### Normal Events: Daily Batch Sync

```go
// Daily job at 2 AM syncs yesterday's events to warm tier
func (es *EventStore) DailySync() error {
    yesterday := time.Now().Add(-24 * time.Hour)
    
    events, err := es.hotDB.GetEventsSince(yesterday)
    if err != nil {
        return err
    }
    
    // Filter: Only normal/critical events go to warm tier
    filtered := filterForWarmTier(events)
    
    // Batch write to flash (single transaction)
    return es.warmDB.WriteBatch(filtered)
}
```

---

## Rationale

### Why Three Tiers?

**Two Tiers Insufficient:**
- Hot + Warm only: No long-term archive for compliance
- Warm + Cold only: Flash wear from high-volume low-value events

**Three Tiers Optimal:**
- Hot tier handles high-volume writes (tmpfs unlimited)
- Warm tier provides persistence for important events (flash protected)
- Cold tier enables unlimited retention (optional external storage)

### Why tmpfs for Hot Tier?

**Benefits:**
- **No wear:** RAM-backed, unlimited writes
- **Fast:** 10-100x faster than flash
- **RouterOS Support:** /tmp is tmpfs with ~443MB available

**Trade-off Accepted:**
- Volatile (lost on power failure)
- Acceptable because:
  - Critical events sync immediately to warm tier
  - Low-value events (metrics, logs) acceptable to lose
  - Daily sync moves everything important to persistent storage

### Why zstd Compression?

| Algorithm | Compression Ratio | Compress Speed | Decompress Speed |
|-----------|------------------|----------------|------------------|
| **zstd level 3** | 2.5-3x | Fast (200 MB/s) | Very fast (800 MB/s) |
| gzip level 6 | 2-2.5x | Slow (40 MB/s) | Slow (300 MB/s) |
| lz4 | 1.5-2x | Fastest | Fastest |

**Decision:** zstd level 3 for daily sync, level 9 for cold archive
- 10x faster than gzip
- Better compression ratio
- Fast decompression for time-travel queries

---

## Consequences

### Positive

- **Flash Longevity:** 99% of writes go to tmpfs, flash wear minimized
- **Fast Queries:** Recent events (90% of queries) served from tmpfs
- **Complete Audit:** Critical events persisted to flash
- **Unlimited History:** Optional external storage for compliance
- **Graceful Degradation:** Works without external storage
- **Power-Safe:** Critical events sync immediately

### Negative

- **Complexity:** Three storage locations to manage
- **Potential Data Loss:** Low-value events lost on power failure
- **Query Complexity:** Must check hot → warm → cold for time-travel
- **Dependency:** Requires tmpfs support (standard on RouterOS)

### Mitigations

- **Unified Query API:** Application code doesn't care about tiers
  ```go
  // High-level API hides tier complexity
  events := eventStore.GetEventsForResource(uuid, timeRange)
  // Automatically queries hot → warm → cold as needed
  ```

- **Graceful Degradation:** System works without external mount
  ```go
  // Cold tier is optional
  if externalMountAvailable() {
      archiveToColddTier(events)
  } else {
      log.Println("No external storage - skipping cold tier archive")
  }
  ```

- **Documentation:** Clear guidelines on event classification
  ```markdown
  ## Event Classification Guide
  - Critical: Config changes, auth events, deletions → 30 days warm
  - Normal: Resource CRUD, feature lifecycle → 7 days warm
  - Low-value: Metrics, logs, polling → 24h hot only
  ```

---

## Performance Metrics

**Write Performance:**
| Tier | Latency | Throughput | Location |
|------|---------|------------|----------|
| Hot | <1ms | 10,000+ events/sec | tmpfs |
| Warm | <10ms | 100-500 events/sec | flash |
| Cold | <100ms | 10-50 events/sec | external |

**Query Performance:**
| Query Type | Latency | Source |
|------------|---------|--------|
| Last 24h | <10ms | Hot tier only |
| Last 7 days | <50ms | Hot + Warm |
| Last 30 days | <200ms | Hot + Warm + Cold |
| Time travel (3 months ago) | <1s | Cold tier + event replay |

**Storage Usage (10 routers, 30 days):**
- Hot tier: ~50-100MB (tmpfs, acceptable)
- Warm tier: ~10-20MB per router (flash, acceptable)
- Cold tier: ~100-500MB per router (external, unlimited)

---

## Alternatives Considered

### Single-Tier (All Flash) - Rejected

**Approach:** Write all events to flash directly

**Why rejected:**
- Flash wear unacceptable (metrics every 5s = 17,280 writes/day/router)
- Limited flash space fills quickly
- No benefit over three-tier approach

### Two-Tier (Hot + Warm) - Rejected

**Approach:** Only hot (tmpfs) and warm (flash)

**Why rejected:**
- No long-term archive for compliance requirements
- 30-day retention on flash may still cause space issues
- Missing offline/external backup capability

### Write-Through Cache (Rejected)

**Approach:** Write to flash first, cache in memory

**Why rejected:**
- Still causes flash wear on every write
- Doesn't solve the core problem (too many writes)
- Three-tier is better solution

---

## Review Date

Review after 6 months of production use:
- Measure actual flash wear (SMART stats if available)
- Assess if event classification correct (too many critical events?)
- Check if 24h hot tier duration sufficient
- Evaluate cold tier adoption rate (how many users enable external storage?)

---

## References

- Brainstorming Session: `Docs/brainstorming-sessions/brainstorming-session-database-2026-01-03.md`
- Data Architecture: `architecture/data-architecture.md`
- Backend Architecture: `architecture/backend-architecture.md`

---
