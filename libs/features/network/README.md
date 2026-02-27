# @nasnet/features/network

Network interface management feature module for NasNetConnect.

**Story:** NAS-6.1 - Interface List and Configuration **Epic:** Epic 6 - Network Management (Gate 5)

## Overview

Comprehensive network interface management with full CRUD operations, real-time updates, and
responsive design. Provides list view, detail panels, settings editor, and batch operations with
safety confirmations.

## Features

### ✅ Interface List

- **Desktop:** DataTable with columns (name, type, status, enabled, IP, MTU, comment)
- **Mobile:** Card view with touch-optimized interactions
- **Filtering:** By type, status, and search
- **Selection:** Multi-select for batch operations
- **Real-time updates:** GraphQL subscription integration
- **Sorting & pagination:** Ready for large interface lists

### ✅ Interface Detail

- **Desktop:** 600px right-side Sheet panel
- **Mobile:** Full-screen dialog
- **Tabs:** Status, Traffic, Configuration
- **Live data:** Real-time traffic rates and statistics
- **Quick actions:** Enable/disable, edit settings

### ✅ Interface Editor

- **React Hook Form** with Zod validation
- **Fields:** Enabled toggle, MTU (68-9000), Comment (max 255)
- **Validation:** Client-side (Zod) + server-side error handling
- **Feedback:** Toast notifications for success/error

### ✅ Batch Operations

- **Actions:** Enable/Disable multiple interfaces
- **Safety checks:** Gateway interface detection
- **Confirmation dialog:** 3-second countdown for critical operations
- **Detailed preview:** Shows all affected interfaces

## Architecture

### Pattern: Headless + Platform Presenters (ADR-018)

```
InterfaceList (wrapper)
  ├── Headless logic (state, filtering, subscriptions)
  ├── InterfaceListDesktop (table presenter)
  └── InterfaceListMobile (card presenter)
```

**Separation of concerns:**

- **Headless:** Business logic, state management, API calls
- **Presenters:** Platform-specific UI (desktop table vs mobile cards)
- **Auto-switching:** `usePlatform()` hook detects device

### Component Hierarchy

```
InterfaceListPage
  └── InterfaceList (main wrapper)
      ├── InterfaceListDesktop/Mobile
      │   ├── InterfaceListFilters
      │   └── BatchActionsToolbar
      │       └── BatchConfirmDialog
      └── InterfaceDetail
          ├── InterfaceDetailDesktop/Mobile
          └── InterfaceEditForm
```

## Usage

### Basic Usage

```tsx
import { InterfaceListPage } from '@nasnet/features/network';

// In your route
export const Route = createFileRoute('/dashboard/network')({
  component: InterfaceListPage,
});
```

### Individual Components

```tsx
import { InterfaceList, InterfaceDetail, InterfaceEditForm } from '@nasnet/features/network';

// List only
<InterfaceList routerId="router-1" />

// Detail panel
<InterfaceDetail
  routerId="router-1"
  interfaceId="*1"
  open={true}
  onClose={() => setOpen(false)}
/>

// Edit form only
<InterfaceEditForm
  routerId="router-1"
  interface={interfaceData}
  onSuccess={() => console.log('saved')}
  onCancel={() => console.log('cancelled')}
/>
```

## API Integration

### GraphQL Queries

```graphql
query GetInterfaces($routerId: ID!, $type: InterfaceType) {
  interfaces(routerId: $routerId, type: $type) {
    edges {
      node {
        id
        name
        type
        status
        enabled
        running
        mtu
        comment
      }
    }
  }
}
```

### Mutations

```graphql
mutation EnableInterface($routerId: ID!, $interfaceId: ID!) {
  enableInterface(routerId: $routerId, interfaceId: $interfaceId) {
    interface {
      id
      name
      enabled
      status
    }
    errors {
      code
      message
    }
  }
}
```

### Subscriptions

```graphql
subscription InterfaceStatusChanged($routerId: ID!) {
  interfaceStatusChanged(routerId: $routerId) {
    interfaceId
    name
    status
    enabled
    running
  }
}
```

## Hooks

### `useInterfaceList(routerId, type?)`

Fetches interface list with real-time updates.

```tsx
const { interfaces, loading, error, refetch } = useInterfaceList('router-1');
```

**Returns:**

- `interfaces: Interface[]` - List of interfaces
- `totalCount: number` - Total count
- `loading: boolean` - Loading state
- `error: Error | null` - Error if any
- `refetch: () => void` - Manual refetch function

### `useInterfaceDetail(routerId, interfaceId)`

Fetches single interface details.

```tsx
const { interface, loading, error } = useInterfaceDetail('router-1', '*1');
```

### `useUpdateInterface()`

Updates interface settings.

```tsx
const [updateInterface, { loading }] = useUpdateInterface();

await updateInterface({
  variables: {
    routerId: 'router-1',
    interfaceId: '*1',
    input: { mtu: 1400, comment: 'WAN' },
  },
});
```

### `useEnableInterface()` / `useDisableInterface()`

Enable or disable interface with optimistic updates.

```tsx
const [enableInterface] = useEnableInterface();
const [disableInterface] = useDisableInterface();

await enableInterface({
  variables: { routerId: 'router-1', interfaceId: '*1' },
});
```

### `useBatchInterfaceOperation()`

Perform batch operations.

```tsx
const [batchOperation] = useBatchInterfaceOperation();

await batchOperation({
  variables: {
    routerId: 'router-1',
    input: {
      interfaceIds: ['*1', '*2', '*3'],
      action: BatchInterfaceAction.Enable,
    },
  },
});
```

## Validation

### MTU Validation

- **Range:** 68-9000 bytes (RouterOS limits)
- **Client-side:** Zod schema validation
- **Server-side:** Backend validation in InterfaceService

### Comment Validation

- **Max length:** 255 characters
- **Client-side:** Zod + textarea maxLength
- **Server-side:** Backend validation

## Responsive Design

### Breakpoints

- **Mobile:** < 640px (cards, bottom action bar)
- **Tablet:** 640-1024px (hybrid)
- **Desktop:** > 1024px (table, side panel)

### Touch Optimization

- **44px minimum touch targets** (WCAG AAA)
- **Swipe-friendly cards** on mobile
- **Fixed bottom toolbar** for batch actions

## Accessibility (WCAG AAA)

### Keyboard Navigation

- ✅ Tab through all interactive elements
- ✅ Enter to open detail panel
- ✅ Escape to close dialogs
- ✅ Arrow keys in table navigation

### Screen Readers

- ✅ ARIA labels on all controls
- ✅ Form field descriptions
- ✅ Status announcements for mutations
- ✅ Live region updates for real-time data

### Visual

- ✅ 7:1 contrast ratio (AAA)
- ✅ Focus indicators (3px ring)
- ✅ Reduced motion support
- ✅ Color is not sole indicator (badges + text)

## Performance

### Optimizations

- ✅ **Client-side filtering** - No server round-trips
- ✅ **Memoized computations** - `useMemo` for filtered lists
- ✅ **Optimistic updates** - Immediate UI feedback
- ✅ **Debounced search** - 300ms delay (recommended)
- ✅ **Subscription-based updates** - No polling overhead

### Future Enhancements

- **Virtualization:** For 100+ interfaces, add `@tanstack/react-virtual`
- **Server-side pagination:** When interface count > 500
- **Traffic charts:** Real-time visualization with Chart.js

## Testing

### Unit Tests (TODO - Phase 10)

```bash
npx nx test network
```

### E2E Tests (TODO - Phase 10)

```bash
npx nx e2e connect-e2e --grep "interface"
```

### Accessibility Tests (TODO - Phase 10)

```bash
npx pa11y-ci http://localhost:5173/dashboard/network
```

## File Structure

```
libs/features/network/
├── src/
│   ├── components/
│   │   ├── interface-list/
│   │   │   ├── InterfaceList.tsx (main wrapper)
│   │   │   ├── InterfaceListDesktop.tsx
│   │   │   ├── InterfaceListMobile.tsx
│   │   │   ├── InterfaceListFilters.tsx
│   │   │   ├── BatchActionsToolbar.tsx
│   │   │   ├── BatchConfirmDialog.tsx
│   │   │   └── index.ts
│   │   ├── interface-detail/
│   │   │   ├── InterfaceDetail.tsx
│   │   │   ├── InterfaceDetailDesktop.tsx
│   │   │   ├── InterfaceDetailMobile.tsx
│   │   │   └── index.ts
│   │   └── interface-edit/
│   │       ├── InterfaceEditForm.tsx
│   │       └── index.ts
│   ├── pages/
│   │   ├── InterfaceListPage.tsx
│   │   └── index.ts
│   └── index.ts
├── project.json
├── tsconfig.json
└── README.md
```

## Dependencies

### Required

- `@nasnet/ui/primitives` - Base components (Button, Table, Sheet, Dialog)
- `@nasnet/ui/patterns` - Composite patterns (DataTable, ResourceCard)
- `@nasnet/ui/layouts` - Platform detection (`usePlatform`)
- `@nasnet/api-client/queries` - GraphQL hooks
- `@nasnet/api-client/generated` - Generated types
- `@apollo/client` - GraphQL client
- `react-hook-form` - Form state management
- `zod` - Schema validation
- `@hookform/resolvers` - Zod integration

### Peer Dependencies

- `react@18.x`
- `react-dom@18.x`

## Related

- **Backend Service:** `apps/backend/internal/services/interface_service.go`
- **GraphQL Resolvers:** `apps/backend/graph/resolver/interface.resolvers.go`
- **GraphQL Schema:** `schema/schema.graphql` (lines 216-255, 511-571)
- **API Hooks:** `libs/api-client/queries/src/network/`
- **Route:** `apps/connect/src/routes/dashboard.network.tsx`

## License

Proprietary - NasNetConnect
