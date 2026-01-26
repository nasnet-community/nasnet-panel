# Frontend Architecture

## Adaptive Design Patterns

```typescript
// Responsive layout hook
function useAdaptiveLayout() {
  const breakpoint = useBreakpoint();
  const orientation = useOrientation();
  const prefersReducedMotion = usePrefersReducedMotion();

  return {
    isMobile: breakpoint === 'sm' || breakpoint === 'xs',
    isTablet: breakpoint === 'md',
    isDesktop: breakpoint === 'lg' || breakpoint === 'xl',
    isLandscape: orientation === 'landscape',
    shouldAnimate: !prefersReducedMotion,
  };
}

// Adaptive component pattern
function DeviceCard({ device }: { device: Device }) {
  const { isMobile, isDesktop } = useAdaptiveLayout();

  if (isMobile) {
    return <DeviceCardCompact device={device} />;
  }

  if (isDesktop) {
    return <DeviceCardExpanded device={device} />;
  }

  return <DeviceCardDefault device={device} />;
}
```

## TanStack Query Integration

```typescript
// Query configuration
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,       // 30 seconds
      gcTime: 5 * 60_000,      // 5 minutes (formerly cacheTime)
      retry: 3,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    },
  },
});

// Device query with real-time updates
function useDevice(deviceId: string) {
  const queryClient = useQueryClient();

  // Base query
  const query = useQuery({
    queryKey: ['device', deviceId],
    queryFn: () => fetchDevice(deviceId),
    staleTime: 10_000,
  });

  // Real-time subscription
  useEffect(() => {
    const subscription = subscribeToDevice(deviceId, (update) => {
      queryClient.setQueryData(['device', deviceId], (old) => ({
        ...old,
        ...update,
      }));
    });

    return () => subscription.unsubscribe();
  }, [deviceId, queryClient]);

  return query;
}

// Optimistic updates for mutations
function useUpdateInterface() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateInterface,
    onMutate: async (newData) => {
      await queryClient.cancelQueries({ queryKey: ['interface', newData.id] });
      const previous = queryClient.getQueryData(['interface', newData.id]);

      queryClient.setQueryData(['interface', newData.id], (old) => ({
        ...old,
        ...newData,
        validation: { status: 'pending' },
      }));

      return { previous };
    },
    onError: (err, newData, context) => {
      queryClient.setQueryData(['interface', newData.id], context.previous);
    },
    onSettled: (data, error, variables) => {
      queryClient.invalidateQueries({ queryKey: ['interface', variables.id] });
    },
  });
}
```

## Component Architecture

```typescript
// Feature-based organization
// src/features/devices/
// ├── components/
// │   ├── DeviceList.tsx
// │   ├── DeviceCard.tsx
// │   └── DeviceStatus.tsx
// ├── hooks/
// │   ├── useDevices.ts
// │   └── useDeviceStatus.ts
// ├── api/
// │   └── deviceApi.ts
// └── index.ts

// Compound component pattern
function DevicePanel({ children }: PropsWithChildren) {
  return (
    <DevicePanelContext.Provider value={useDevicePanelState()}>
      <div className="device-panel">{children}</div>
    </DevicePanelContext.Provider>
  );
}

DevicePanel.Header = function Header({ children }) {
  const { isExpanded, toggle } = useDevicePanelContext();
  return (
    <header onClick={toggle}>
      {children}
      <ChevronIcon direction={isExpanded ? 'up' : 'down'} />
    </header>
  );
};

DevicePanel.Content = function Content({ children }) {
  const { isExpanded } = useDevicePanelContext();
  if (!isExpanded) return null;
  return <div className="content">{children}</div>;
};

// Usage
<DevicePanel>
  <DevicePanel.Header>Device Name</DevicePanel.Header>
  <DevicePanel.Content>
    <InterfaceList />
    <RouteTable />
  </DevicePanel.Content>
</DevicePanel>
```

---
