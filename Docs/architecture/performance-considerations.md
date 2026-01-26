# Performance Considerations

**Last Updated:** 2026-01-20  
**Version:** 3.0  
**Status:** Comprehensive - Optimization Strategies Across All Layers

---

## Table of Contents

- [Resource Constraints](#resource-constraints)
- [Bundle Optimization](#bundle-optimization)
- [GraphQL Performance](#graphql-performance)
- [Backend Performance](#backend-performance)
- [Database Performance](#database-performance)
- [Real-time Performance](#real-time-performance)
- [Network Optimization](#network-optimization)
- [Performance Monitoring](#performance-monitoring)

---

## Resource Constraints

### Target Specifications

| Resource | Ideal Target | Acceptable Target | Actual Achieved | Status |
|----------|--------------|-------------------|-----------------|--------|
| **Docker Image** | <10MB | <40MB | ~6MB base | ✅ Exceeded |
| **Runtime RAM** | <200MB | <400MB | 100-200MB base | ✅ Achieved |
| **Frontend Bundle** | <1.5MB | <3MB | 1.5-2.5MB gzipped | ✅ Achieved |
| **Backend Binary** | <5MB | <10MB | ~4MB (UPX) | ✅ Exceeded |
| **Database** | <20MB | <50MB | 6MB + 4-8MB/router | ✅ Scalable |
| **FCP** | <1s | <1.5s | TBD (load testing) | Pending |
| **TTI** | <2s | <3s | TBD (load testing) | Pending |
| **API Response p95** | <50ms | <100ms | TBD (load testing) | Pending |

**Deployment Flexibility:** All limits configurable per deployment environment

---

## Bundle Optimization

### Frontend Bundle Analysis

```
┌─────────────────────────────────────────────────────────────┐
│              FRONTEND BUNDLE BREAKDOWN                       │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  INITIAL BUNDLE (Critical Path)                             │
│  ┌─────────────────────────────────────────────────────────┐│
│  │  React + ReactDOM           ~45 KB (1.5%)               ││
│  │  Apollo Client              ~30.7 KB (1.0%)             ││
│  │  TanStack Router            ~12 KB (0.4%)               ││
│  │  Tailwind CSS (purged)      ~15 KB (0.5%)               ││
│  │  Radix UI Primitives        ~45 KB (1.5%)               ││
│  │  Zustand + XState           ~23 KB (0.8%)               ││
│  │  Forms (RHF + Zod)          ~23 KB (0.8%)               ││
│  │  Utilities                   ~20 KB (0.7%)               ││
│  │  Application Code           ~60-80 KB (2-3%)            ││
│  │  ─────────────────────────────────────────              ││
│  │  TOTAL INITIAL:             ~270-300 KB (9-10%)         ││
│  └─────────────────────────────────────────────────────────┘│
│                                                              │
│  LAZY-LOADED CHUNKS (On-Demand)                             │
│  ┌─────────────────────────────────────────────────────────┐│
│  │  Dashboard route             ~30 KB                      ││
│  │  VPN feature                 ~30 KB                      ││
│  │  Firewall feature            ~30 KB                      ││
│  │  WiFi feature                ~25 KB                      ││
│  │  System tools                ~25 KB                      ││
│  │  Setup Wizard                ~35 KB                      ││
│  │  ─────────────────────────────────────────              ││
│  │  Heavy components (lazy):                               ││
│  │  • Chart library             ~50 KB (loaded on demand)  ││
│  │  • Network Topology          ~40 KB (loaded on demand)  ││
│  │  • Log Viewer                ~30 KB (loaded on demand)  ││
│  └─────────────────────────────────────────────────────────┘│
│                                                              │
│  TOTAL BUDGET: 3 MB gzipped                                 │
│  ACTUAL USAGE: ~1.5-2.5 MB (50% headroom) ✅                │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### Optimization Techniques

| Technique | Implementation | Impact |
|-----------|----------------|--------|
| **Tree-Shaking** | Vite + ES modules, named imports | ~60% library code removed |
| **Tailwind Purge** | PurgeCSS removes unused classes | ~95% CSS eliminated |
| **Code-Splitting** | Route-based + feature-based lazy loading | ~40-60% initial bundle reduction |
| **Dynamic Imports** | Heavy components loaded on demand | ~150KB deferred |
| **Platform Lazy Loading** | Load tablet/desktop presenters on demand | ~30% responsive code savings |
| **Image Optimization** | WebP with fallbacks, lazy loading | ~70% image size reduction |
| **Font Subsetting** | Only include used glyphs | ~60% font size reduction |

**CI Enforcement:**

```yaml
# Bundle size gate in CI
- name: Check bundle size
  run: |
    npm run build
    SIZE=$(du -sb dist/assets/*.js | awk '{s+=$1}END{print s}')
    if [ $SIZE -gt 3145728 ]; then  # 3MB in bytes
      echo "Bundle size $SIZE exceeds 3MB limit"
      exit 1
    fi
```

---

## GraphQL Performance

### N+1 Query Prevention

**DataLoader Pattern:**

```go
// Batch multiple resource queries into single DB query
type ResourceLoader struct {
    loader *dataloader.Loader
}

func NewResourceLoader(db *ent.Client) *ResourceLoader {
    return &ResourceLoader{
        loader: dataloader.NewBatchedLoader(func(ctx context.Context, keys []string) []*dataloader.Result {
            // Single query instead of N queries
            resources, err := db.Resource.Query().
                Where(resource.UUIDIn(keys...)).
                All(ctx)
            
            // Map results to requested order
            results := make([]*dataloader.Result, len(keys))
            for i, key := range keys {
                result := findByUUID(resources, key)
                results[i] = &dataloader.Result{Data: result, Error: err}
            }
            return results
        }),
    }
}

// Usage in resolver
func (r *resourceResolver) DependsOn(ctx context.Context, resource *Resource) ([]*Resource, error) {
    depUUIDs := resource.Relationships.DependsOn  // ["uuid-1", "uuid-2", "uuid-3"]
    
    // DataLoader batches all requests in single GraphQL query into one DB query
    return r.resourceLoader.LoadMany(ctx, depUUIDs)
}
```

**Without DataLoader:** 1 query per dependency = N+1 problem  
**With DataLoader:** 1 batched query for all dependencies

---

### Query Complexity Limits

**Multi-Factor Scoring:**

```go
func calculateQueryComplexity(query *ast.Query) int {
    complexity := 0
    
    // Base costs
    complexity += fieldCount * 1
    complexity += listFieldCount * 10           // Lists multiply cost
    complexity += relationshipDepth * 50        // Deep nesting expensive
    
    // Expensive operations
    complexity += requiresRouterPoll * 100      // Runtime data = router API call!
    complexity += databaseJoinCount * 20        // Joins expensive
    complexity += subscriptionCount * 30        // Real-time overhead
    complexity += dependencyTraversal * 40      // Graph walking
    
    return complexity
}

// Enforcement
const (
    ComplexityWarn    = 750   // Log warning
    ComplexityMaxSync = 1000  // Max for synchronous execution
)

// Auto-async for complex queries
if complexity > ComplexityMaxSync {
    // Convert to async job
    jobID := createAsyncJob(query)
    return &AsyncJobError{
        JobID:   jobID,
        Message: "Query too complex. Use queryJob or subscribe to completion.",
    }
}
```

**Example:**

```graphql
# This query would score ~500 points
query DashboardData {
  devices {                      # +1 (field)
    resources {                  # +10 (list)
      configuration { ... }       # +10 (nested list)
      runtime {                   # +100 (requires router poll!)
        bytesIn
        bytesOut
      }
    }
  }
}
# Total: 1 + 10 + 10 + 100 = 121 points (acceptable)
```

### Depth Limits

```go
// Maximum 5 levels of nesting
const MaxQueryDepth = 5

// Enforced by gqlgen extension
srv.Use(extension.DepthLimit(5))
```

### Pagination Performance

**Relay Cursor Pattern:**

```graphql
query GetResourcesPaginated {
  resources(
    first: 20                    # Page size
    after: "cursor-abc123"       # Cursor from previous page
    filter: { category: "vpn" }
  ) {
    edges {
      node { uuid configuration }
      cursor                      # Opaque cursor for next page
    }
    pageInfo {
      hasNextPage
      endCursor
    }
    totalCount                    # Optional, expensive
  }
}
```

**Performance Characteristics:**
- First page: <10ms
- Subsequent pages: <5ms (cursor-based, no OFFSET)
- Total count: +20ms (requires COUNT query, make optional)

---

## Backend Performance

### Go Binary Optimization

**Build Flags:**

```bash
# Optimize binary size and performance
CGO_ENABLED=0 GOOS=linux go build \
  -ldflags="-s -w -extldflags '-static'" \
  -trimpath \
  -o nasnet ./cmd/nnc

# Breakdown:
# CGO_ENABLED=0        → Pure Go (no C dependencies)
# -ldflags="-s -w"     → Strip debug info and symbol table (~30% smaller)
# -extldflags='-static' → Static linking (no dynamic libs)
# -trimpath            → Remove file path information

# Result: ~10-12 MB
# After UPX compression: ~4-6 MB (50-70% reduction)
```

**UPX Compression:**

```bash
upx --best --lzma nasnet

# Trade-offs:
# + 50-70% smaller binary
# + Acceptable decompression time (~100ms on startup)
# + Works on all architectures
# - Slight startup delay (acceptable for embedded deployment)
```

### Connection Pooling

**Database Connections:**

```go
// SQLite connection pool
db, err := sql.Open("sqlite3", "file:nasnet.db?_journal_mode=WAL")
db.SetMaxOpenConns(10)   // Concurrent readers (WAL mode)
db.SetMaxIdleConns(5)    // Keep connections warm
db.SetConnMaxLifetime(time.Hour)
db.SetConnMaxIdleTime(10 * time.Minute)
```

**Router API Connections:**

```go
type ConnectionPool struct {
    maxConnections int           // 50 max
    maxWait        time.Duration  // 30s timeout
    maxHoldTime    time.Duration  // 5min force release
    
    connections map[string]*PooledConnection
    mu          sync.RWMutex
}

// Reuse connections, close after idle timeout
func (p *ConnectionPool) Get(routerID string) (*Connection, error) {
    // Check pool first
    if conn := p.getFromPool(routerID); conn != nil {
        return conn, nil
    }
    
    // Create new if under limit
    if p.count() < p.maxConnections {
        return p.createNew(routerID)
    }
    
    // Wait for available connection (with timeout)
    return p.waitForAvailable(p.maxWait)
}
```

### Caching Strategy

**Multi-Layer Cache:**

```go
// Layer 1: In-memory cache (ristretto)
cache, _ := ristretto.NewCache(&ristretto.Config{
    NumCounters: 1e7,        // 10M counters
    MaxCost:     1 << 30,    // 1GB max
    BufferItems: 64,
})

// Layer 2: Apollo Client (frontend)
// Normalized cache with automatic updates

// Layer 3: SQLite database
// Persistent storage with WAL mode

// Strategy:
// - Hot data (sessions, capabilities): ristretto (in-memory)
// - Server state (resources, features): Apollo cache (frontend)
// - Persistent data: SQLite (disk)
```

---

## Database Performance

### SQLite WAL Optimization

**Configuration:**

```sql
-- Write-Ahead Logging for concurrent reads
PRAGMA journal_mode=WAL;

-- Synchronous mode for balance
PRAGMA synchronous=NORMAL;  -- Not FULL (too slow) or OFF (risky)

-- Cache size (64MB)
PRAGMA cache_size=-64000;   -- Negative = KB

-- Busy timeout (5s)
PRAGMA busy_timeout=5000;   -- Wait for lock instead of immediate fail

-- Memory-mapped I/O (faster reads)
PRAGMA mmap_size=268435456; -- 256MB

-- Auto-vacuum
PRAGMA auto_vacuum=INCREMENTAL;

-- Page size
PRAGMA page_size=4096;      -- Match filesystem block size
```

**Checkpoint Strategy:**

```go
// Hybrid checkpoint strategy
type WALManager struct {
    db *sql.DB
}

// Hourly passive checkpoint (doesn't block writers)
func (w *WALManager) hourlyCheckpoint() {
    ticker := time.NewTicker(1 * time.Hour)
    for range ticker.C {
        w.db.Exec("PRAGMA wal_checkpoint(PASSIVE)")
    }
}

// Daily truncate checkpoint (aggressively reclaim space)
func (w *WALManager) dailyTruncate() {
    ticker := time.NewTicker(24 * time.Hour)
    for range ticker.C {
        w.db.Exec("PRAGMA wal_checkpoint(TRUNCATE)")
    }
}

// Emergency full checkpoint (if WAL > 10MB)
func (w *WALManager) emergencyCheckpoint() error {
    var walSize int64
    row := w.db.QueryRow("PRAGMA wal_checkpoint")
    row.Scan(&walSize)
    
    if walSize > 10*1024*1024 {  // 10MB
        _, err := w.db.Exec("PRAGMA wal_checkpoint(FULL)")
        return err
    }
    return nil
}
```

### Aggressive Indexing

**Index Strategy:**

```go
func (Resource) Indexes() []ent.Index {
    return []ent.Index{
        // Primary lookup (unique)
        index.Fields("uuid").Unique(),
        
        // List queries (composite)
        index.Fields("router_id", "type"),
        index.Fields("router_id", "category"),
        index.Fields("router_id", "state"),
        
        // Time-based queries
        index.Fields("created_at"),
        index.Fields("updated_at"),
        
        // Relationship queries
        index.Fields("type", "state"),
        
        // Full-text search (if needed)
        // index.Fields("name").StorageKey("idx_name_fts"),
    }
}

func (ResourceEvent) Indexes() []ent.Index {
    return []ent.Index{
        // Time-travel queries (critical!)
        index.Fields("resource_uuid", "created_at"),
        index.Fields("resource_uuid", "aggregate_version"),
        
        // Event filtering
        index.Fields("event_type", "created_at"),
        index.Fields("priority", "created_at"),
        
        // Correlation tracking
        index.Fields("correlation_id"),
        
        // Retention cleanup (critical!)
        index.Fields("created_at"),
    }
}
```

**Index Monitoring:**

```go
// Track slow queries in development
if config.IsDev {
    db.Use(func(next ent.Querier) ent.Querier {
        return ent.QuerierFunc(func(ctx context.Context, q ent.Query) (ent.Value, error) {
            start := time.Now()
            v, err := next.Query(ctx, q)
            duration := time.Since(start)
            
            if duration > 100*time.Millisecond {
                log.Printf("SLOW QUERY (%v): %s", duration, q)
                // Suggest index in development
            }
            
            return v, err
        })
    })
}
```

### Query Optimization

**Materialized Views for Fleet Dashboard:**

```go
// Pre-computed summaries in system.db (no router DB queries needed)
type FleetMetrics struct {
    TotalRouters      int
    OnlineRouters     int
    TotalResources    int
    ResourcesByType   map[string]int
    ResourcesByState  map[string]int
    LastUpdated       time.Time
}

// Updated via background job every 60s
func (s *MetricsService) UpdateFleetMetrics(ctx context.Context) error {
    // Query each router DB in parallel
    var wg sync.WaitGroup
    results := make(chan RouterMetrics, len(routers))
    
    for _, router := range s.getActiveRouters(ctx) {
        wg.Add(1)
        go func(r *Router) {
            defer wg.Done()
            db, _ := s.dbManager.GetRouterDB(ctx, r.ID)
            metrics := queryRouterMetrics(db)
            results <- metrics
        }(router)
    }
    
    go func() {
        wg.Wait()
        close(results)
    }()
    
    // Aggregate results
    fleetMetrics := aggregateMetrics(results)
    
    // Store in system.db (single write)
    s.systemDB.GlobalSettings.Create().
        SetCategory("fleet_metrics").
        SetSettings(fleetMetrics).
        Save(ctx)
    
    return nil
}

// Dashboard queries materialized view (fast!)
func (s *DashboardService) GetFleetSummary(ctx context.Context) (*FleetMetrics, error) {
    settings, _ := s.systemDB.GlobalSettings.Query().
        Where(globalsettings.Category("fleet_metrics")).
        Only(ctx)
    
    var metrics FleetMetrics
    json.Unmarshal(settings.Settings, &metrics)
    
    return &metrics, nil
}
```

**Performance:**
- Without materialization: 10 router DBs × 50ms = 500ms
- With materialization: 1 query to system.db = <5ms
- **100× improvement for fleet dashboard**

---

## GraphQL Performance

### Subscription Batching Strategy

**5-Level Priority System:**

```go
const (
    PriorityImmediate   = 0  // <100ms - router offline, VPN crashed
    PriorityCritical    = 1  // <1s - status changes, user feedback
    PriorityNormal      = 2  // <5s - config applied, feature installed
    PriorityLow         = 3  // <30s - batched updates
    PriorityBackground  = 4  // <60s - metrics, logs
)

// Manual classification with safe defaults
var eventPriorities = map[EventType]Priority{
    EventRouterOffline:          PriorityImmediate,
    EventFeatureCrashed:         PriorityImmediate,
    EventFeatureStarted:         PriorityCritical,
    EventConfigApplied:          PriorityNormal,
    EventMetricsUpdated:         PriorityBackground,
}

// Batching based on priority
func (s *SubscriptionService) publishEvent(event Event) {
    priority := eventPriorities[event.Type]
    
    switch priority {
    case PriorityImmediate:
        s.pushImmediately(event)  // <100ms
    case PriorityCritical:
        s.batchWithin(event, 1*time.Second)
    case PriorityNormal:
        s.batchWithin(event, 5*time.Second)
    case PriorityLow:
        s.batchWithin(event, 30*time.Second)
    case PriorityBackground:
        s.batchWithin(event, 60*time.Second)
    }
}
```

### Apollo Client Cache Optimization

**Normalized Cache Configuration:**

```typescript
const cache = new InMemoryCache({
  typePolicies: {
    Resource: {
      keyFields: ['uuid'],  // Cache key
      fields: {
        runtime: {
          merge: true,  // Merge instead of replace
        },
        telemetry: {
          merge(existing = [], incoming) {
            // Append telemetry, don't replace
            return [...existing, ...incoming];
          },
        },
      },
    },
    Query: {
      fields: {
        resources: {
          keyArgs: ['filter'],  // Separate cache per filter
          merge(existing, incoming, { args }) {
            if (!existing) return incoming;
            // Merge paginated results
            return {
              ...incoming,
              edges: [...existing.edges, ...incoming.edges],
            };
          },
        },
      },
    },
  },
});
```

**Cache Size Management:**

```typescript
// Persist cache to IndexedDB (optional, for offline support)
import { persistCache } from 'apollo3-cache-persist';

await persistCache({
  cache,
  storage: window.localStorage,
  maxSize: 1048576,  // 1MB max
  debug: import.meta.env.DEV,
});
```

---

## Real-time Performance

### WebSocket Optimization

**Connection Multiplexing:**
- Single WebSocket connection per client
- Multiple subscriptions multiplexed over same connection
- graphql-ws protocol handles message routing

**Heartbeat Strategy:**

```typescript
const wsClient = createClient({
  url: 'ws://localhost:8080/query',
  keepAlive: 15000,  // 15s ping interval
  connectionParams: () => ({
    authToken: getAuthToken(),
  }),
  retryAttempts: 5,
  retryWait: async (retries) => {
    // Exponential backoff: 1s, 2s, 4s, 8s, 16s
    await new Promise(resolve => 
      setTimeout(resolve, Math.min(1000 * Math.pow(2, retries), 30000))
    );
  },
});
```

**Subscription Debouncing:**

```go
// High-frequency events debounced before push
func (s *SubscriptionService) publishMetricsUpdate(metrics Metrics) {
    s.debouncer.Debounce("metrics", 1*time.Second, func() {
        s.pushToSubscribers(MetricsUpdatedEvent{Data: metrics})
    })
}

// Result: Metrics polling every 5s → Pushed max 1/s
```

---

## Network Optimization

### API Request Optimization

**Request Deduplication:**

```typescript
// Apollo automatically deduplicates simultaneous requests
const { data: data1 } = useQuery(GET_VPN, { variables: { uuid } });
const { data: data2 } = useQuery(GET_VPN, { variables: { uuid } });
// Only 1 network request made
```

**Prefetching:**

```typescript
// Prefetch on hover for instant navigation
<Link
  to="/vpn/$uuid"
  onMouseEnter={() => {
    apolloClient.query({
      query: GET_VPN_DETAIL,
      variables: { uuid },
    });
  }}
>
  {vpn.name}
</Link>
```

**Compression:**

```go
// GZIP compression for responses
import "github.com/labstack/echo/v4/middleware"

e.Use(middleware.GzipWithConfig(middleware.GzipConfig{
    Level: 5,  // Balance compression ratio vs CPU
    MinLength: 1024,  // Only compress >1KB
}))

// Typical savings: 70-90% for JSON responses
```

---

## Performance Monitoring

### Frontend Performance

**Lighthouse CI:**

```yaml
# .lighthouserc.json
{
  "ci": {
    "collect": {
      "numberOfRuns": 3,
      "url": ["http://localhost:3000/"]
    },
    "assert": {
      "preset": "lighthouse:recommended",
      "assertions": {
        "first-contentful-paint": ["error", {"maxNumericValue": 1500}],
        "speed-index": ["error", {"maxNumericValue": 2000}],
        "interactive": ["error", {"maxNumericValue": 3000}],
        "largest-contentful-paint": ["error", {"maxNumericValue": 2000}]
      }
    }
  }
}
```

**Core Web Vitals Targets:**

| Metric | Target | Measurement |
|--------|--------|-------------|
| **FCP** (First Contentful Paint) | <1.5s | Lighthouse, RUM |
| **LCP** (Largest Contentful Paint) | <2s | Lighthouse, RUM |
| **FID** (First Input Delay) | <100ms | RUM only |
| **CLS** (Cumulative Layout Shift) | <0.1 | Lighthouse, RUM |
| **TTI** (Time to Interactive) | <3s | Lighthouse |
| **TBT** (Total Blocking Time) | <200ms | Lighthouse |

### Backend Performance

**Prometheus Metrics (Optional):**

```go
// Key metrics to track
var (
    graphqlQueryDuration = prometheus.NewHistogramVec(
        prometheus.HistogramOpts{
            Name: "graphql_query_duration_seconds",
            Buckets: []float64{.001, .005, .01, .025, .05, .1, .25, .5, 1},
        },
        []string{"operation", "complexity"},
    )
    
    databaseQueryDuration = prometheus.NewHistogramVec(
        prometheus.HistogramOpts{
            Name: "database_query_duration_seconds",
            Buckets: []float64{.001, .005, .01, .025, .05, .1},
        },
        []string{"table", "operation"},
    )
    
    routerAPILatency = prometheus.NewHistogramVec(
        prometheus.HistogramOpts{
            Name: "router_api_latency_seconds",
            Buckets: []float64{.01, .025, .05, .1, .25, .5, 1, 2.5},
        },
        []string{"protocol", "command"},
    )
)
```

### Load Testing

**k6 Scripts:**

```javascript
// Load test GraphQL endpoint
import http from 'k6/http';
import { check } from 'k6';

export const options = {
  stages: [
    { duration: '30s', target: 20 },   // Ramp up to 20 users
    { duration: '1m', target: 20 },    // Sustain 20 users
    { duration: '10s', target: 0 },    // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<500', 'p(99)<1000'],  // 95% < 500ms, 99% < 1s
    http_req_failed: ['rate<0.01'],                   // <1% errors
  },
};

export default function () {
  const res = http.post('http://localhost:8080/graphql', JSON.stringify({
    query: `query { resources(first: 20) { edges { node { uuid configuration } } } }`,
  }), {
    headers: { 'Content-Type': 'application/json' },
  });
  
  check(res, {
    'status 200': (r) => r.status === 200,
    'has data': (r) => JSON.parse(r.body).data !== null,
  });
}
```

---

## Performance Budget

### CI Performance Gates

```yaml
# Performance budget enforcement
performance:
  frontend:
    bundle_size: 3145728          # 3MB gzipped max
    initial_js: 524288            # 512KB initial JS max
    fcp: 1500                     # First Contentful Paint <1.5s
    lcp: 2000                     # Largest Contentful Paint <2s
    tti: 3000                     # Time to Interactive <3s
    
  backend:
    docker_image: 41943040        # 40MB max (10MB ideal)
    binary_size: 10485760         # 10MB max (4MB achieved)
    memory_usage: 419430400       # 400MB max (200MB target)
    
  api:
    p95_latency: 500              # 95th percentile <500ms
    p99_latency: 1000             # 99th percentile <1s
    error_rate: 0.01              # <1% errors
```

**Enforcement:**

```bash
# CI check bundle size
npm run build
npm run bundlesize

# CI check API performance
k6 run performance/api-test.js

# CI check Lighthouse scores
lhci autorun
```

---

## Optimization Techniques

### Component-Level Optimization

```tsx
// 1. React.memo on all pattern components
export const ResourceCard = React.memo(function ResourceCard<T>(props: Props<T>) {
  // Component implementation
}, (prevProps, nextProps) => {
  // Custom comparison for resource updates
  return prevProps.resource.uuid === nextProps.resource.uuid &&
         prevProps.resource.metadata.version === nextProps.resource.metadata.version;
});

// 2. Virtualization for large lists
import { useVirtualizer } from '@tanstack/react-virtual';

export function VirtualResourceList({ resources }: Props) {
  const parentRef = React.useRef<HTMLDivElement>(null);
  
  const virtualizer = useVirtualizer({
    count: resources.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 100,  // Estimated row height
  });
  
  return (
    <div ref={parentRef} style={{ height: '600px', overflow: 'auto' }}>
      <div style={{ height: `${virtualizer.getTotalSize()}px` }}>
        {virtualizer.getVirtualItems().map((virtualRow) => (
          <div key={virtualRow.index} style={/* positioning */}>
            <ResourceCard resource={resources[virtualRow.index]} />
          </div>
        ))}
      </div>
    </div>
  );
}

// 3. useMemo for expensive computations
const sortedResources = useMemo(() => {
  return resources.sort((a, b) => 
    a.metadata.createdAt - b.metadata.createdAt
  );
}, [resources]);

// 4. useCallback for event handlers
const handleConnect = useCallback(() => {
  connectVPN(vpn.uuid);
}, [vpn.uuid]);
```

---

## Performance Targets Summary

| Category | Metric | Target | Status |
|----------|--------|--------|--------|
| **Bundle** | Initial JS | <512KB | ✅ ~270-300KB |
| **Bundle** | Total (lazy) | <3MB | ✅ ~1.5-2.5MB |
| **Frontend** | FCP | <1.5s | Pending load test |
| **Frontend** | TTI | <3s | Pending load test |
| **Backend** | API p95 | <500ms | Pending load test |
| **Backend** | API p99 | <1s | Pending load test |
| **Database** | Query | <10ms | Pending benchmark |
| **Memory** | Base | <200MB | ✅ Achieved |
| **Memory** | Peak | <400MB | ✅ Within target |
| **Image** | Compressed | <40MB | ✅ ~6MB (exceeded) |

**Overall Status:** **ON TRACK** - Targets achieved or within range, pending load testing validation

---

## Related Documents

- [Technology Stack](./technology-stack-details.md) - Complete technology profiles
- [Backend Architecture](./backend-architecture.md) - Backend performance patterns
- [Data Architecture](./data-architecture.md) - Database optimization
- [Frontend Architecture](./frontend-architecture.md) - Frontend patterns

---
