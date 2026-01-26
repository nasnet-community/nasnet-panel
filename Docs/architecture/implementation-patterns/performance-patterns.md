# Performance Patterns

## Caching Strategy

```typescript
// Multi-layer caching
class CacheManager {
  private l1Cache: Map<string, CacheEntry>;  // Memory cache
  private l2Cache: IDBDatabase;              // IndexedDB

  async get<T>(key: string, options?: CacheOptions): Promise<T | null> {
    // L1: Memory
    const l1Entry = this.l1Cache.get(key);
    if (l1Entry && !this.isExpired(l1Entry)) {
      return l1Entry.data as T;
    }

    // L2: IndexedDB
    const l2Entry = await this.getFromIndexedDB(key);
    if (l2Entry && !this.isExpired(l2Entry)) {
      // Promote to L1
      this.l1Cache.set(key, l2Entry);
      return l2Entry.data as T;
    }

    return null;
  }

  async set<T>(key: string, data: T, ttl: number): Promise<void> {
    const entry: CacheEntry = {
      data,
      timestamp: Date.now(),
      ttl,
    };

    // Write to both layers
    this.l1Cache.set(key, entry);
    await this.writeToIndexedDB(key, entry);
  }
}

// Query-specific caching with TanStack Query
const deviceQueryOptions = (deviceId: string) => ({
  queryKey: ['device', deviceId],
  queryFn: () => fetchDevice(deviceId),
  staleTime: 30_000,        // Consider fresh for 30s
  gcTime: 5 * 60_000,       // Keep in cache for 5min
  refetchOnWindowFocus: true,
  refetchOnReconnect: true,
});
```

## Batch Operations

```go
// Batch command executor
type BatchExecutor struct {
    maxBatchSize  int
    flushInterval time.Duration
    pending       []Command
    mu            sync.Mutex
}

func (b *BatchExecutor) Add(cmd Command) <-chan Result {
    resultCh := make(chan Result, 1)

    b.mu.Lock()
    b.pending = append(b.pending, commandWithChannel{cmd, resultCh})
    shouldFlush := len(b.pending) >= b.maxBatchSize
    b.mu.Unlock()

    if shouldFlush {
        go b.flush()
    }

    return resultCh
}

func (b *BatchExecutor) flush() {
    b.mu.Lock()
    commands := b.pending
    b.pending = nil
    b.mu.Unlock()

    if len(commands) == 0 {
        return
    }

    // Group by device
    byDevice := groupByDevice(commands)

    // Execute in parallel per device
    var wg sync.WaitGroup
    for deviceID, deviceCmds := range byDevice {
        wg.Add(1)
        go func(id DeviceID, cmds []commandWithChannel) {
            defer wg.Done()
            b.executeForDevice(id, cmds)
        }(deviceID, deviceCmds)
    }
    wg.Wait()
}
```

## Lazy Loading & Code Splitting

```typescript
// Route-based code splitting
const routes = [
  {
    path: '/devices',
    component: lazy(() => import('./pages/Devices')),
  },
  {
    path: '/devices/:id',
    component: lazy(() => import('./pages/DeviceDetail')),
  },
  {
    path: '/fleet',
    component: lazy(() => import('./pages/Fleet')),
  },
];

// Feature-based lazy loading
const AdvancedFeatures = lazy(() =>
  import('./features/advanced').then(mod => ({ default: mod.AdvancedFeatures }))
);

function App() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <Routes>
        {routes.map(route => (
          <Route key={route.path} path={route.path} element={<route.component />} />
        ))}
      </Routes>
    </Suspense>
  );
}
```

---
