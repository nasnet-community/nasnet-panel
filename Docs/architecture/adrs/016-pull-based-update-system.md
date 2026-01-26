# ADR-016: Pull-Based Update System

**Date:** 2026-01-20  
**Status:** Accepted  
**Deciders:** Technical Architect, BMad  
**Category:** Architecture / Deployment / UX  
**Source Session:** brainstorming-session-deployment-cicd-2026-01-03.md  
**Related ADRs:** ADR-005 (Docker Deployment)

---

## Context

NasNetConnect runs as a Docker container ON the router and requires a reliable update mechanism that:

1. **Respects User Control:** Users should control when updates happen
2. **Works Behind NAT:** Many routers behind NAT/firewalls (no inbound connections)
3. **Handles Poor Connectivity:** Updates should work with metered/slow connections
4. **Scales Infinitely:** No server-side state per router
5. **Safety-Critical:** Network infrastructure - failed update could break internet

**Traditional Push-Based Updates (like Mobile Apps):**
- Server pushes updates to clients
- Requires inbound connectivity or long-lived connection
- Server tracks state per client (millions of devices = complex)
- Users interrupted during critical network usage

**Problem:**
How to deliver updates reliably, safely, and at scale while giving users control over timing?

---

## Decision

Adopt a **Pull-Based Update Architecture** where:
- Routers check for updates on their own schedule
- Update server is stateless (no per-router state)
- Users control when updates apply
- Server scales infinitely with CDN

### Core Principles

1. **Router as Active Agent:** Router initiates update check, not server
2. **Stateless Server:** Server just hosts manifests and packages
3. **User Control:** User decides when to apply (or auto-apply based on policy)
4. **Smart Timing:** Updates during idle periods, respects network conditions
5. **Safety-First:** 5-phase power-safe application with multi-layer rollback

---

## Architecture

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
│  Manifest Endpoint:                                          │
│  GET https://updates.nasnet.io/v1/manifest.json             │
│                                                              │
│  Response:                                                   │
│  {                                                           │
│    "version": "2.5.0",                                       │
│    "releaseDate": "2026-01-20",                             │
│    "severity": "normal",  // critical, major, minor          │
│    "downloadUrl": "https://cdn.nasnet.io/v2.5.0.tar.gz",    │
│    "sha256": "abc123...",                                    │
│    "signature": "...",                                       │
│    "changelog": "https://nasnet.io/changelog/2.5.0"         │
│  }                                                           │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### Update Check Schedule

**Router-Initiated Checks:**

| Schedule | Frequency | Use Case |
|----------|-----------|----------|
| **Default** | Every 24 hours | Standard polling |
| **Aggressive** | Every 1 hour | Users who want latest |
| **Conservative** | Every 7 days | Users who prefer stability |
| **Manual** | On-demand | User clicks "Check Now" |

**Smart Timing:**
```go
func (u *UpdateChecker) isGoodTimeToCheck() bool {
    now := time.Now()
    
    // Not during user-defined quiet hours
    if u.policy.IsQuietHour(now) {
        return false
    }
    
    // Not during active network usage (high traffic)
    if u.monitor.IsHighTraffic() {
        return false
    }
    
    // Not if on metered connection (optional check)
    if u.network.IsMetered() && !u.policy.AllowOnMetered {
        return false
    }
    
    return true
}
```

---

## Auto-Apply Policy Matrix

| Update Type | Auto-Apply | User Confirmation | Notification |
|-------------|------------|-------------------|--------------|
| **Security Hotfix** | Yes (immediate) | No | Persistent banner + toast after |
| **Minor Patch (x.x.N)** | Yes (during idle) | No | Subtle badge in settings |
| **Major Version (x.N.x)** | No | Yes + changelog modal | Modal on next login |
| **Breaking Changes (N.x.x)** | No | Yes + impact review | Persistent until addressed |

**Safeguards for Auto-Apply:**
1. Rollback automatically if health check fails (60s watchdog)
2. User can disable auto-updates in settings
3. Auto-updates only during idle periods (low traffic)
4. Maximum 1 auto-update per 24 hours
5. Maintenance windows respected

```go
type UpdatePolicy struct {
    AutoApplyEnabled   bool
    AutoApplySeverity  Severity  // Only auto-apply if >= this severity
    MaintenanceWindows []TimeWindow
    AllowOnMetered     bool
    QuietHours         []TimeWindow
}
```

---

## Rationale

### Why Pull Over Push?

**Pull Benefits:**
| Benefit | Explanation |
|---------|-------------|
| **User Control** | User decides timing, not interrupted during critical use |
| **Works Behind NAT** | No inbound connection required (outbound HTTPS only) |
| **Stateless Server** | No per-router tracking, infinite scalability |
| **Respects Conditions** | Router can defer if on metered connection or high load |
| **CDN-Friendly** | Static files, easy to cache globally |
| **Offline Resilient** | Router can retry on its schedule, no server state lost |

**Push Drawbacks (Avoided):**
- Requires inbound connectivity or persistent connection
- Server must track state for millions of routers
- Users may be interrupted during critical network usage
- Complex server infrastructure for push notifications

### Why Severity-Based Auto-Apply?

**Balances Security and Control:**
- Security updates must apply quickly (auto-apply)
- Major versions should require user review (manual)
- Minor patches reduce friction (auto-apply during idle)

**User Trust:**
- Predictable behavior (security = auto, major = ask)
- Always safe to auto-apply (rollback on failure)
- Never interrupts user during active use

### Why Smart Timing?

**Respects User Context:**
- Don't update during gaming session (high traffic detected)
- Don't wake user at 3 AM (quiet hours configured)
- Don't use cellular data if expensive (metered detection)
- Do update during idle time (low traffic, middle of day)

---

## Consequences

### Positive

- **Infinite Scalability:** CDN serves manifests, no backend state
- **User Control:** Updates on user's schedule, not server's
- **NAT-Friendly:** Works behind any firewall (outbound HTTPS)
- **Resilient:** Retry on router's schedule, no timeout pressure
- **Cost-Effective:** No push notification infrastructure needed
- **Privacy:** Server doesn't track which routers are online

### Negative

- **Delayed Updates:** Critical security patches take up to 24h to reach all routers (default polling)
- **No Forced Updates:** Cannot force-push critical update (relies on polling)
- **Bandwidth:** Each router downloads independently (can't multicast)

### Mitigations

- **Critical Security:** Use push notification as optional supplementary channel
  ```go
  // Optional: Subscribe to critical update alerts
  if u.policy.EnablePushNotifications {
      u.subscribeToPushService("https://push.nasnet.io/critical")
  }
  ```

- **Fleet Caching:** First router in fleet caches, serves to other routers
  ```go
  // Fleet-managed routers can get updates from fleet cache
  if u.fleet.IsManaged() {
      if cached := u.fleet.GetCachedUpdate(version); cached != nil {
          return cached  // Local network, fast
      }
  }
  ```

- **Configurable Polling:** Aggressive polling (1h) for users who need fast updates

---

## Implementation

### Update Check Flow

```
Router Update Service (Background Job)
         │
         ▼
Timer Trigger (24h default)
         │
         ▼
Check if good time? ─No──> Defer 1 hour, retry
         │
        Yes
         ▼
GET https://updates.nasnet.io/v1/manifest.json?channel=stable&current=2.4.0
         │
         ▼
Compare versions ──Same──> Log "up to date", exit
         │
      Different
         ▼
Evaluate policy (auto-apply? maintenance window?)
         │
         ├──Auto-apply──> Download in background
         │                       │
         │                       ▼
         │                Apply during idle period
         │                       │
         └──Manual────> Notify user "Update available"
                               │
                               ▼
                        User clicks "Update"
                               │
                               ▼
                        Download & Apply
```

---

## Alternatives Considered

### Push-Based Updates (Rejected)

**Approach:** Server pushes updates to routers via WebSocket/SSE

**Why rejected:**
- Requires persistent connection (overhead)
- Complex server infrastructure (millions of connections)
- Doesn't work behind NAT without port forwarding
- Server must track every router's state

### Hybrid Pull-Push (Rejected)

**Approach:** Pull for discovery, push for critical updates

**Why rejected:**
- Added complexity of two systems
- Push still requires persistent connection
- Pull alone sufficient with configurable polling
- Can add push later as optional enhancement

### Automatic Updates Only (Rejected)

**Approach:** All updates apply automatically without user control

**Why rejected:**
- Users don't trust automatic updates on network infrastructure
- Major version changes may break user workflows
- No way to defer update during critical period
- Violates user control principle

---

## Review Date

Review after 6 months of production use:
- Measure update adoption rates across channels
- Assess if 24h default polling acceptable or should be more aggressive
- Check if push notification channel needed for critical security
- Evaluate fleet caching adoption and effectiveness

---

## References

- Brainstorming Session: `Docs/brainstorming-sessions/brainstorming-session-deployment-cicd-2026-01-03.md`
- Deployment Architecture: `architecture/deployment-architecture.md`
- Security Architecture: `architecture/security-architecture.md`

---
