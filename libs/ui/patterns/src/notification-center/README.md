# NotificationCenter Pattern Component

Notification center panel for displaying and managing alert notifications with platform-specific
presenters.

## Features

- **Platform-specific UI**

  - Mobile (<640px): Full-screen Sheet with 44px touch targets and bottom action bar
  - Desktop (≥640px): 400px side panel with scrollable list and keyboard navigation

- **Filtering & Actions**

  - Severity filter chips (Critical, Warning, Info, All)
  - Mark individual notifications as read
  - Mark all notifications as read
  - Clear all notifications

- **Keyboard Navigation (Desktop)**

  - `Escape` - Close notification center
  - `ArrowUp/Down` - Navigate through notifications
  - `Enter` - Activate selected notification

- **Accessibility**
  - WCAG AAA compliant
  - Semantic HTML with ARIA labels
  - Keyboard navigation support
  - Screen reader friendly

## Usage

```tsx
import { NotificationCenter } from '@nasnet/ui/patterns';

function MyComponent() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <Button onClick={() => setIsOpen(true)}>Open Notifications</Button>

      <NotificationCenter
        open={isOpen}
        onClose={() => setIsOpen(false)}
      />
    </>
  );
}
```

## Architecture

Follows the **Headless + Platform Presenters** pattern from ADR-018:

1. **Headless Hook** (`use-notification-center.ts`)

   - Business logic for filtering and actions
   - Store integration
   - No UI code

2. **Platform Router** (`NotificationCenter.tsx`)

   - Detects platform via `usePlatform()`
   - Routes to appropriate presenter

3. **Platform Presenters**

   - `NotificationCenterDesktop.tsx` - 400px side panel
   - `NotificationCenterMobile.tsx` - Full-screen Sheet

4. **Shared Components**
   - `NotificationItem.tsx` - Individual notification display

## Components

### NotificationCenter

Main component that auto-detects platform and renders the appropriate presenter.

**Props:**

- `open: boolean` - Whether the notification center is open
- `onClose: () => void` - Callback when closing
- `className?: string` - Optional className

### NotificationItem

Displays a single notification with severity icon, title, message, and timestamp.

**Props:**

- `notification: InAppNotification` - The notification to display
- `onClick?: (notification: InAppNotification) => void` - Click handler
- `className?: string` - Optional className

### useNotificationCenter

Headless hook for notification center logic.

**Returns:**

```typescript
{
  allNotifications: InAppNotification[];
  filteredNotifications: InAppNotification[];
  severityFilter: SeverityFilterOption;
  setSeverityFilter: (filter: SeverityFilterOption) => void;
  markAsRead: (notificationId: string) => void;
  markAllRead: () => void;
  clearAll: () => void;
  unreadCount: number;
  totalCount: number;
  filteredCount: number;
}
```

## Store Integration

Uses `@nasnet/state/stores` alert notification store:

- Notifications are managed centrally in Zustand store
- Automatic 24-hour filtering
- Deduplication (2-second window)
- Max queue size (100 notifications)
- Persistent settings (localStorage)

## Storybook

View interactive demos:

```bash
npx nx run ui-patterns:storybook
```

Navigate to **Patterns > NotificationCenter** to see:

- Default state (10 notifications)
- Empty state
- Large list (150 notifications)
- Critical-only notifications
- Mixed read/unread state

## File Structure

```
notification-center/
├── index.ts                          # Exports
├── types.ts                          # TypeScript types
├── use-notification-center.ts        # Headless hook
├── NotificationCenter.tsx            # Platform router
├── NotificationCenterDesktop.tsx     # Desktop presenter
├── NotificationCenterMobile.tsx      # Mobile presenter
├── NotificationItem.tsx              # Notification item component
├── NotificationCenter.stories.tsx    # Storybook stories
└── README.md                         # This file
```

## Design Tokens

Uses semantic tokens from the design system:

- **Colors:**

  - `semantic-error` (Critical)
  - `semantic-warning` (Warning)
  - `semantic-info` (Info)
  - `primary` (Unread indicator)

- **Spacing:**
  - Mobile: 44px touch targets
  - Desktop: 400px panel width

## Related Components

- `NotificationBell` - Bell icon with unread count and quick preview
- `InAppNotificationPreferences` - Settings form for notification preferences
- `useAlertNotifications` - GraphQL subscription hook for real-time alerts

## References

- ADR-018: Headless + Platform Presenters Pattern
- Design System: `Docs/design/PLATFORM_PRESENTER_GUIDE.md`
- Architecture: `Docs/architecture/frontend-architecture.md`
