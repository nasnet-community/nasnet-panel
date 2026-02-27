# Provider Stack Deep Dive

All React context providers are composed in a single file:
`apps/connect/src/app/providers/index.tsx`

The root route (`apps/connect/src/routes/__root.tsx`) wraps the entire application in `<Providers>`
before rendering any route content.

## Provider Nesting Order

```tsx
// apps/connect/src/app/providers/index.tsx

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <I18nProvider loadingFallback={<I18nLoadingFallback />}>
      {' '}
      // 1. outermost
      <DirectionProvider>
        {' '}
        // 2.
        <ThemeProvider>
          {' '}
          // 3.
          <PlatformProvider>
            {' '}
            // 4.
            <AnimationProvider>
              {' '}
              // 5.
              <ApolloProvider>
                {' '}
                // 6.
                <QueryClientProvider client={queryClient}>
                  {' '}
                  // 7.
                  <ToastProvider>{children}</ToastProvider> // 8. innermost
                </QueryClientProvider>
              </ApolloProvider>
            </AnimationProvider>
          </PlatformProvider>
        </ThemeProvider>
      </DirectionProvider>
    </I18nProvider>
  );
}
```

Order matters: inner providers can safely consume context from any outer provider, but not the
reverse.

## Provider Reference

### 1. I18nProvider

**Source:** `@nasnet/core/i18n` (`libs/core/i18n/src`)

**Purpose:** Bootstraps react-i18next and manages lazy loading of language packs.

**What it does:**

- Initializes i18next with HTTP backend (language files fetched at runtime)
- Wraps children in a `React.Suspense` boundary; shows `I18nLoadingFallback` while the initial
  language bundle downloads
- Makes the `useTranslation` hook available throughout the tree

**Why it's outermost:** Every other provider may render translated text. If i18n were nested inside
another provider, that provider's own UI (e.g., a loading spinner with a text label) could not be
translated.

**Loading fallback:**

```tsx
function I18nLoadingFallback() {
  return (
    <div className="bg-background flex h-screen w-screen items-center justify-center">
      <div className="text-muted-foreground animate-pulse">Loading...</div>
    </div>
  );
}
```

---

### 2. DirectionProvider

**Source:** `@nasnet/core/i18n` (`libs/core/i18n/src`)

**Purpose:** Detects the text direction of the active language and applies it to the document.

**What it does:**

- Reads the current language from i18next (available because `I18nProvider` is already mounted)
- Sets `document.documentElement.dir` to `"rtl"` or `"ltr"`
- Sets `document.documentElement.lang` to the current locale
- Exposes the `useDirection()` hook for direction-aware components

**Why it's second:** Requires i18n to be ready (needs the active language). Must be above
ThemeProvider and everything else that might render directional text.

---

### 3. ThemeProvider

**Source:** `apps/connect/src/app/providers/ThemeProvider.tsx`

**Purpose:** Applies the active theme to the document root so Tailwind dark-mode utilities work.

**What it does:**

- Reads `theme` and `resolvedTheme` from the Zustand `useThemeStore`
- Uses `useLayoutEffect` (synchronous, fires before paint) to apply or remove the `.dark` CSS class
  on `<html>`, preventing Flash of Unstyled Content (FOUC)
- Also sets `data-theme="dark|light"` and `color-scheme` for native browser element theming
  (scrollbars, date pickers)
- When `theme === "system"`, registers a `matchMedia` listener for `(prefers-color-scheme: dark)`
  and updates `resolvedTheme` automatically

**Key implementation detail:**

```tsx
// useLayoutEffect fires synchronously before browser paint
useLayoutEffect(() => {
  const root = document.documentElement;
  if (resolvedTheme === 'dark') {
    root.classList.add('dark');
    root.setAttribute('data-theme', 'dark');
    root.style.colorScheme = 'dark';
  } else {
    root.classList.remove('dark');
    root.setAttribute('data-theme', 'light');
    root.style.colorScheme = 'light';
  }
}, [resolvedTheme]);
```

**Why it's third:** Must be above PlatformProvider and AnimationProvider so that all UI
components—including the responsive shell and modals—render with the correct color scheme from the
first paint.

---

### 4. PlatformProvider

**Source:** `@nasnet/ui/layouts` (`libs/ui/layouts/src`)

**Purpose:** Detects the current viewport and exposes a `platform` value (`"mobile"` | `"tablet"` |
`"desktop"`) via context.

**What it does:**

- Uses a `ResizeObserver` or media-query listeners to classify the viewport:
  - Mobile: `<640px`
  - Tablet: `640–1024px`
  - Desktop: `>1024px`
- Exposes the `usePlatform()` hook consumed by every Pattern component in the three-layer component
  system

**Why it's fourth:** Platform detection doesn't depend on i18n, direction, or theme. It must be
above AnimationProvider because the animation system uses platform context to adjust animation
tokens (e.g., shorter durations on mobile).

**Usage in pattern components:**

```tsx
export function ResourceCard<T>(props) {
  const platform = usePlatform();
  return platform === 'mobile' ?
      <ResourceCardMobile {...props} />
    : <ResourceCardDesktop {...props} />;
}
```

See `Docs/design/PLATFORM_PRESENTER_GUIDE.md` for the full pattern.

---

### 5. AnimationProvider

**Source:** `@nasnet/ui/patterns` (`libs/ui/patterns/src`)

**Purpose:** Provides a unified animation context that respects the user's reduced-motion preference
and adjusts animation tokens by platform.

**What it does:**

- Reads `reducedMotion` from the Zustand UI store
- Reads the current `platform` from `PlatformProvider` (already mounted)
- Exposes helper functions: `getVariant()`, `getTransition()`, `getDuration()`
- Animation tokens are scaled: desktop gets full durations, mobile gets shorter durations,
  reduced-motion collapses all animations to instant

**Why it's fifth:** Depends on PlatformProvider for platform detection. Must be above ApolloProvider
because animated loading states and skeleton screens are used during data fetches.

---

### 6. ApolloProvider

**Source:** `@nasnet/api-client/core` (`libs/api-client/core/src`)

**Purpose:** Provides the Apollo Client instance to the entire component tree for GraphQL queries,
mutations, and subscriptions.

**What it does:**

- Creates (or reuses) the Apollo Client with:
  - Split link: WebSocket link for subscriptions, HTTP link for queries/mutations
  - Auth link: Reads the JWT from Zustand store and adds `Authorization: Bearer <token>` header
  - Router ID link: Reads the active router from Zustand store and injects `X-Router-Id` header
  - Error link: Intercepts 401 responses to trigger logout
  - Normalized in-memory cache with type policies for real-time updates
- Exposes the `useQuery`, `useMutation`, `useSubscription` hooks via Apollo's React context

**Why it's sixth:** ApolloProvider depends on nothing from the UI layers. Placing it here ensures
all feature components and pattern components below it can perform data fetching.

---

### 7. QueryClientProvider

**Source:** `@tanstack/react-query`

**Purpose:** Provides a TanStack Query client for any hooks that still use REST endpoints.

**What it does:**

- Holds a `QueryClient` instance created once at module level
  (`const queryClient = new QueryClient()`)
- Enables `useQuery`, `useMutation`, `useInfiniteQuery` from `@tanstack/react-query`

**Note:** Apollo and TanStack Query coexist during a migration period. Apollo handles all new
GraphQL features (subscriptions, real-time). TanStack Query handles any remaining REST-based
endpoints.

**Why it's seventh:** Ordering relative to Apollo is arbitrary here since they are independent. Both
must be above `ToastProvider` so that success/error toasts can be triggered from inside data hooks.

---

### 8. ToastProvider

**Source:** `@nasnet/ui/patterns` (`libs/ui/patterns/src`)

**Purpose:** Mounts the Sonner `<Toaster>` component and bridges Zustand notification store events
to the visible toast queue.

**What it does:**

- Renders the Sonner `<Toaster>` with theme integration (inherits from ThemeProvider)
- Implements `NotificationManager`: subscribes to the Zustand notification store and calls Sonner's
  imperative `toast()` API when a new notification is added
- Responsive positioning: bottom-right on desktop, bottom-center on mobile (uses PlatformProvider)
- Enforces a maximum of 3 visible toasts with queue management

**Why it's innermost:** The toast system sits at the edge of the UI layer. It must be inside all
data providers so that mutations (Apollo/TanStack Query) can trigger toasts. It wraps `{children}`
directly, meaning toasts appear above all page content.

## How Root Integrates the Providers

```tsx
// apps/connect/src/routes/__root.tsx

function RootComponent() {
  return (
    <Providers>
      <RootInner />
      {import.meta.env.DEV && <TanStackRouterDevtools position="bottom-right" />}
    </Providers>
  );
}

function RootInner() {
  // These hooks are inside Providers, so all context is available:
  useConnectionToast();       // Apollo subscription → toast
  useConnectionHeartbeat();   // Polling heartbeat via Apollo
  useDefaultCommands();       // Registers Cmd+K commands
  useGlobalShortcuts();       // Keyboard shortcuts (Cmd+K, ?)
  useAlertNotifications();    // Alert subscription → toast + sound

  return (
    <ResponsiveShell
      header={<AppHeader />}
      sidebar={<AppSidebar />}
      ...
    >
      <Outlet />   {/* route components render here */}
    </ResponsiveShell>
  );
}
```

## Provider Summary Table

| #   | Provider            | Source                            | Key Context                                               |
| --- | ------------------- | --------------------------------- | --------------------------------------------------------- |
| 1   | I18nProvider        | `@nasnet/core/i18n`               | `useTranslation()`                                        |
| 2   | DirectionProvider   | `@nasnet/core/i18n`               | `useDirection()`                                          |
| 3   | ThemeProvider       | `apps/connect/src/app/providers/` | Applies `.dark` class to `<html>`                         |
| 4   | PlatformProvider    | `@nasnet/ui/layouts`              | `usePlatform()` → `"mobile"` \| `"tablet"` \| `"desktop"` |
| 5   | AnimationProvider   | `@nasnet/ui/patterns`             | `getVariant()`, `getTransition()`, reduced-motion         |
| 6   | ApolloProvider      | `@nasnet/api-client/core`         | `useQuery()`, `useMutation()`, `useSubscription()`        |
| 7   | QueryClientProvider | `@tanstack/react-query`           | `useQuery()`, `useMutation()` (REST)                      |
| 8   | ToastProvider       | `@nasnet/ui/patterns`             | Sonner toaster, `NotificationManager`                     |

## Related Documents

- [Architecture Overview](./overview.md)
- [Routing](./routing.md)
- [State Management Overview](../state-management/overview.md)
