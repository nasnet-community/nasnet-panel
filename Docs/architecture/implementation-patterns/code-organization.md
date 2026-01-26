# Code Organization

## React Component Structure

```typescript
// libs/ui/patterns/src/vpn-card/VPNCard.tsx
import { forwardRef } from 'react';
import { Switch } from '@nasnet/ui/primitives';
import { cn } from '@nasnet/core/utils';

export interface VPNCardProps {
  connected: boolean;
  profile: { name: string; location: string };
  onToggle: () => void;
  isLoading?: boolean;
}

export const VPNCard = forwardRef<HTMLDivElement, VPNCardProps>(
  ({ connected, profile, onToggle, isLoading }, ref) => {
    return (
      <div ref={ref} className={cn('rounded-2xl p-4 bg-surface', /* ... */)}>
        {/* Component implementation */}
      </div>
    );
  }
);

VPNCard.displayName = 'VPNCard';
```

## Apollo Client Pattern

```typescript
// libs/api-client/queries/src/vpn/useVPNConnections.ts
import { useQuery } from '@apollo/client';
import { GET_VPN_CONNECTIONS } from '@nasnet/api-client/operations';
import type {
  GetVpnConnectionsQuery,
  GetVpnConnectionsQueryVariables
} from '@nasnet/api-client/generated';

export function useVPNConnections() {
  const { data, loading, error, refetch } = useQuery<
    GetVpnConnectionsQuery,
    GetVpnConnectionsQueryVariables
  >(GET_VPN_CONNECTIONS, {
    variables: { first: 20 },
    // Optimistic UI updates handled by Apollo Cache
    // Real-time updates handled by Subscriptions
  });

  return {
    connections: data?.vpnConnections.edges.map(e => e.node) ?? [],
    loading,
    error,
    refetch
  };
}
```

## Zustand Store Pattern

```typescript
// libs/state/stores/src/ui/theme.store.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface ThemeState {
  theme: 'light' | 'dark' | 'system';
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      theme: 'system',
      setTheme: (theme) => set({ theme }),
    }),
    { name: 'nasnet-theme' }
  )
);
```

---
