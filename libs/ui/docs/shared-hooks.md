# Shared Hooks Reference

This document covers every reusable hook exported from `libs/ui/`. For each hook you will find the
full TypeScript signature, parameter descriptions, return type, and a usage example drawn directly
from the source.

**Import paths at a glance:**

| Hook group            | Import from             |
| --------------------- | ----------------------- |
| Platform hooks        | `@nasnet/ui/layouts`    |
| Memoization hooks     | `@nasnet/ui/patterns`   |
| Stable callback hooks | `@nasnet/ui/patterns`   |
| Toast hook            | `@nasnet/ui/patterns`   |
| Clipboard hooks       | `@nasnet/ui/patterns`   |
| Unsaved changes hook  | `@nasnet/ui/patterns`   |
| Focus hooks           | `@nasnet/ui/patterns`   |
| Primitive hooks       | `@nasnet/ui/primitives` |

---

## Platform Hooks

Platform hooks live in `libs/ui/layouts/src/responsive-shell/` and are exported from
`@nasnet/ui/layouts`. They implement the Headless + Platform Presenters architecture (ADR-018) and
are the primary mechanism for adaptive rendering across Mobile / Tablet / Desktop viewports.

The full reference for these hooks — including breakpoint thresholds, `PlatformProvider`,
`PlatformSwitch`, and the `usePlatformContext` API — is in **`layouts-and-platform.md`**. The table
below lists every platform hook for quick lookup.

| Hook                        | Signature                           | Returns                                          |
| --------------------------- | ----------------------------------- | ------------------------------------------------ |
| `usePlatform`               | `(debounceMs?: number): Platform`   | `'mobile' \| 'tablet' \| 'desktop'`              |
| `usePlatformWithBreakpoint` | `(debounceMs?: number)`             | `{ platform: Platform; breakpoint: Breakpoint }` |
| `useIsMobile`               | `(debounceMs?: number): boolean`    | `true` when viewport < 640 px                    |
| `useIsTablet`               | `(debounceMs?: number): boolean`    | `true` when viewport 640–1024 px                 |
| `useIsDesktop`              | `(debounceMs?: number): boolean`    | `true` when viewport > 1024 px                   |
| `useIsTouchPlatform`        | `(debounceMs?: number): boolean`    | `true` on mobile or tablet                       |
| `usePlatformConfig<T>`      | `(config: Record<Platform, T>): T`  | Config value for current platform                |
| `useBreakpoint`             | `(debounceMs?: number): Breakpoint` | `'xs' \| 'sm' \| 'md' \| 'lg' \| 'xl'`           |
| `useViewportWidth`          | `(debounceMs?: number): number`     | Viewport width in pixels                         |

All platform hooks are debounced (default 100 ms) and SSR-safe.

```tsx
import { usePlatform, usePlatformConfig } from '@nasnet/ui/layouts';

// Switch between presenters
export function RouterCard(props: RouterCardProps) {
  const platform = usePlatform();

  switch (platform) {
    case 'mobile':
      return <RouterCardMobile {...props} />;
    case 'tablet':
      return <RouterCardTablet {...props} />;
    case 'desktop':
      return <RouterCardDesktop {...props} />;
  }
}

// Platform-specific configuration without conditional rendering
function InterfaceGrid() {
  const layout = usePlatformConfig({
    mobile: { columns: 1, gap: 'sm' },
    tablet: { columns: 2, gap: 'md' },
    desktop: { columns: 3, gap: 'lg' },
  });

  return (
    <Grid
      columns={layout.columns}
      gap={layout.gap}
    >
      {/*...*/}
    </Grid>
  );
}
```

See **`layouts-and-platform.md`** for the full platform hooks guide.

---

## Memoization Hooks

**Source:** `libs/ui/patterns/src/hooks/useMemoizedFilter.ts` **Import:**
`import { useMemoizedFilter, ... } from '@nasnet/ui/patterns';`

These eight hooks wrap `useMemo` with a consistent dependency pattern — `[items, ...deps]` — so that
an array operation only re-runs when the array reference or one of the explicit extra dependencies
changes. Always pass stable function references (via `useCallback` or `useStableCallback`) to keep
the dependency arrays minimal.

### `useMemoizedFilter`

```ts
function useMemoizedFilter<T>(
  items: T[],
  filterFn: (item: T, index: number, array: T[]) => boolean,
  deps: DependencyList
): T[];
```

Memoizes `items.filter(filterFn)`. Returns a stable array reference when neither `items` nor any
value in `deps` has changed.

When to use: any list that conditionally hides entries based on state that does not change on every
render (status filter, search results after debounce, permission checks).

```tsx
import { useMemoizedFilter } from '@nasnet/ui/patterns';

function RouterList({ routers }: { routers: Router[] }) {
  const onlineRouters = useMemoizedFilter(
    routers,
    (r) => r.status === 'online',
    [] // predicate is pure — no extra deps needed
  );

  return (
    <>
      {onlineRouters.map((r) => (
        <RouterCard
          key={r.id}
          router={r}
        />
      ))}
    </>
  );
}
```

### `useMemoizedSort`

```ts
function useMemoizedSort<T>(items: T[], sortFn: (a: T, b: T) => number, deps: DependencyList): T[];
```

Returns `[...items].sort(sortFn)`. Creates a shallow copy before sorting, so the original array is
never mutated.

When to use: tables and lists where the user selects a sort column. Put
`[sortColumn, sortDirection]` in `deps`.

```tsx
import { useMemoizedSort } from '@nasnet/ui/patterns';

function SortedInterfaceList({ interfaces, sortColumn, sortDirection }) {
  const sorted = useMemoizedSort(
    interfaces,
    (a, b) => {
      const cmp =
        a[sortColumn] < b[sortColumn] ? -1
        : a[sortColumn] > b[sortColumn] ? 1
        : 0;
      return sortDirection === 'asc' ? cmp : -cmp;
    },
    [sortColumn, sortDirection]
  );

  return <InterfaceTable rows={sorted} />;
}
```

### `useMemoizedFilterSort`

```ts
function useMemoizedFilterSort<T>(
  items: T[],
  filterFn: ((item: T, index: number, array: T[]) => boolean) | null,
  sortFn: ((a: T, b: T) => number) | null,
  deps: DependencyList
): T[];
```

Runs filter then sort in a single memoized pass. Pass `null` for either function to skip that step.

When to use: data tables that support both filtering and sorting simultaneously. Consolidates two
separate `useMemo` calls into one.

```tsx
import { useMemoizedFilterSort } from '@nasnet/ui/patterns';

function ServiceList({ services, filter, sortField }) {
  const displayItems = useMemoizedFilterSort(
    services,
    filter ? (s) => s.name.includes(filter) : null, // skip filter if empty
    (a, b) => a[sortField].localeCompare(b[sortField]),
    [filter, sortField]
  );

  return <ServiceTable rows={displayItems} />;
}
```

### `useMemoizedMap`

```ts
function useMemoizedMap<T, U>(
  items: T[],
  mapFn: (item: T, index: number, array: T[]) => U,
  deps: DependencyList
): U[];
```

Memoizes `items.map(mapFn)`. Use when you need a derived array (e.g., formatting display labels)
that should not recompute on unrelated state changes.

```tsx
import { useMemoizedMap } from '@nasnet/ui/patterns';

function IPAddressList({ interfaces }) {
  const labels = useMemoizedMap(interfaces, (iface) => `${iface.name} — ${iface.address}`, []);

  return (
    <ul>
      {labels.map((l, i) => (
        <li key={i}>{l}</li>
      ))}
    </ul>
  );
}
```

### `useMemoizedFind`

```ts
function useMemoizedFind<T>(
  items: T[],
  predicate: (item: T, index: number, array: T[]) => boolean,
  deps: DependencyList
): T | undefined;
```

Memoizes `items.find(predicate)`. Returns `undefined` when no item matches.

```tsx
import { useMemoizedFind } from '@nasnet/ui/patterns';

function SelectedRouter({ routers, selectedId }) {
  const selected = useMemoizedFind(routers, (r) => r.id === selectedId, [selectedId]);

  return selected ? <RouterDetail router={selected} /> : <EmptyState />;
}
```

### `useMemoizedGroupBy`

```ts
function useMemoizedGroupBy<T, K>(
  items: T[],
  keyFn: (item: T) => K,
  deps: DependencyList
): Map<K, T[]>;
```

Builds a `Map<K, T[]>` grouping items by the key returned from `keyFn`. Returns a stable `Map`
reference when inputs are unchanged.

```tsx
import { useMemoizedGroupBy } from '@nasnet/ui/patterns';

function VPNClientsByStatus({ clients }) {
  const byStatus = useMemoizedGroupBy(clients, (c) => c.status, []);

  return (
    <>
      <Section title="Online">
        {(byStatus.get('online') ?? []).map((c) => (
          <ClientRow
            key={c.id}
            client={c}
          />
        ))}
      </Section>
      <Section title="Offline">
        {(byStatus.get('offline') ?? []).map((c) => (
          <ClientRow
            key={c.id}
            client={c}
          />
        ))}
      </Section>
    </>
  );
}
```

### `useMemoizedReduce`

```ts
function useMemoizedReduce<T, U>(
  items: T[],
  reducer: (accumulator: U, currentValue: T, index: number, array: T[]) => U,
  initialValue: U,
  deps: DependencyList
): U;
```

Memoizes `items.reduce(reducer, initialValue)`. Suitable for computing aggregates (totals, counts,
combined bandwidth) that would otherwise run on every render.

```tsx
import { useMemoizedReduce } from '@nasnet/ui/patterns';

function BandwidthSummary({ interfaces }) {
  const totalBytes = useMemoizedReduce(
    interfaces,
    (sum, iface) => sum + iface.rxBytes + iface.txBytes,
    0,
    []
  );

  return (
    <Stat
      label="Total traffic"
      value={formatBytes(totalBytes)}
    />
  );
}
```

### `useMemoizedUnique`

```ts
function useMemoizedUnique<T>(
  items: T[],
  keyFn: ((item: T) => unknown) | null,
  deps: DependencyList
): T[];
```

Returns an array with duplicate entries removed. For primitive arrays pass `null` as `keyFn`; for
object arrays provide a key extractor.

```tsx
import { useMemoizedUnique } from '@nasnet/ui/patterns';

// Primitive deduplication
function UniqueStatuses({ logs }) {
  const statuses = useMemoizedUnique(
    logs.map((l) => l.status),
    null,
    []
  );
  // → ['info', 'warning', 'error']

  return <FilterChips options={statuses} />;
}

// Object deduplication by id
function UniqueRouters({ events }) {
  const routers = useMemoizedUnique(
    events.map((e) => e.router),
    (r) => r.id,
    []
  );

  return <RouterList routers={routers} />;
}
```

---

## Stable Callback Hooks

**Source:** `libs/ui/patterns/src/hooks/useStableCallback.ts` **Import:**
`import { useStableCallback, ... } from '@nasnet/ui/patterns';`

These hooks solve the classic tension between `useCallback` with empty deps (stale closure values)
and `useCallback` with all deps (identity changes on every render). They guarantee a stable function
reference while always calling the latest version of the callback.

### `useStableCallback`

```ts
function useStableCallback<T extends (...args: never[]) => unknown>(callback: T): T;
```

Creates a callback whose identity never changes across renders, but which always invokes the current
version of `callback`. Internally stores `callback` in a `ref` and returns a permanent wrapper.

When to use: event handlers passed to memoized child components (`React.memo`) where you want zero
re-renders caused by the callback, yet still need access to fresh closure values.

Comparison with `useCallback`: `useCallback(fn, [])` gives a stable identity but captures stale
values; `useCallback(fn, [dep1, dep2])` gives fresh values but triggers downstream re-renders when
deps change. `useStableCallback` gives both.

```tsx
import { useStableCallback } from '@nasnet/ui/patterns';

function SearchPanel({ onSearch }: { onSearch: (query: string) => void }) {
  const [debounceMs, setDebounceMs] = useState(300);

  // Identity never changes even when debounceMs changes.
  // Safe to pass to a memoized child without causing re-renders.
  const handleSearch = useStableCallback((query: string) => {
    setTimeout(() => onSearch(query), debounceMs);
  });

  return <MemoizedInput onSubmit={handleSearch} />;
}
```

### `useStableEventHandler`

```ts
function useStableEventHandler<E extends { preventDefault: () => void }>(
  handler: (event: E) => void | Promise<void>
): (event: E) => void;
```

Wraps `handler` to call `event.preventDefault()` automatically before delegating to the latest
version of `handler`. Returns a permanently stable reference.

When to use: form `onSubmit`, link `onClick`, and any handler where preventing default browser
behavior is always required.

```tsx
import { useStableEventHandler } from '@nasnet/ui/patterns';

function LoginForm({ onSubmit }) {
  const handleSubmit = useStableEventHandler(async (e: React.FormEvent) => {
    await onSubmit(formData);
  });

  return <form onSubmit={handleSubmit}>...</form>;
}
```

### `useStableCallbackWithDeps`

```ts
function useStableCallbackWithDeps<T extends (...args: never[]) => unknown>(
  callback: T,
  deps: DependencyList
): T;
```

Middle ground between `useStableCallback` and `useCallback`. The returned function's identity only
changes when a value in `deps` changes — not on every render. Extra non-dep values in the closure
are always current because the callback ref is updated on every render.

When to use: when you need a callback to change identity only on specific dependency changes (e.g.,
when the user switches router context), but you don't want it changing on every other state update.

```tsx
import { useStableCallbackWithDeps } from '@nasnet/ui/patterns';

function RouterDataPanel({ routerId }) {
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Identity changes only when routerId changes.
  // showAdvanced is always current without being a dep.
  const fetchData = useStableCallbackWithDeps(
    () => api.fetchRouter(routerId, { advanced: showAdvanced }),
    [routerId]
  );

  useEffect(() => {
    fetchData();
  }, [fetchData]);
}
```

### `useDebouncedCallback`

```ts
function useDebouncedCallback<T extends (...args: never[]) => unknown>(
  callback: T,
  delay: number
): T;
```

Returns a debounced version of `callback`. Calls are coalesced: the underlying callback only runs
after `delay` milliseconds have elapsed with no new calls. The timeout is cleared on component
unmount. Identity changes when `delay` changes.

```tsx
import { useDebouncedCallback } from '@nasnet/ui/patterns';

function SearchInput({ onSearch }) {
  const debouncedSearch = useDebouncedCallback((query: string) => onSearch(query), 300);

  return (
    <input
      type="search"
      onChange={(e) => debouncedSearch(e.target.value)}
      placeholder="Search..."
    />
  );
}
```

### `useThrottledCallback`

```ts
function useThrottledCallback<T extends (...args: never[]) => unknown>(
  callback: T,
  delay: number
): T;
```

Returns a throttled version of `callback`. The callback runs at most once per `delay` milliseconds.
A trailing call is always scheduled so the final invocation is never silently dropped. The timeout
is cleared on component unmount.

Comparison with `useDebouncedCallback`: throttle executes _at the leading edge_ and then limits
frequency; debounce waits for a _quiet period_ before executing.

```tsx
import { useThrottledCallback } from '@nasnet/ui/patterns';

function TrafficMonitor({ onScroll }) {
  const throttledScroll = useThrottledCallback(
    (scrollY: number) => onScroll(scrollY),
    100 // at most once every 100 ms
  );

  useEffect(() => {
    const handler = () => throttledScroll(window.scrollY);
    window.addEventListener('scroll', handler);
    return () => window.removeEventListener('scroll', handler);
  }, [throttledScroll]);
}
```

---

## Toast Hook

**Source:** `libs/ui/patterns/src/hooks/useToast.ts` **Import:**
`import { useToast } from '@nasnet/ui/patterns';`

`useToast` bridges the Zustand notification store (`@nasnet/state/stores`) and the Sonner toast
library. It returns a stable object with methods for every notification type. All method return
values are notification IDs (strings) that can be used for later updates or dismissal.

### Signature

```ts
function useToast(): UseToastReturn;
```

### Return type

```ts
interface UseToastReturn {
  toast(options: GenericToastOptions): string;
  success(title: string, options?: ToastOptions): string;
  error(title: string, options?: ToastOptions): string;
  warning(title: string, options?: ToastOptions): string;
  info(title: string, options?: ToastOptions): string;
  progress(title: string, options?: ProgressToastOptions): string;
  update(id: string, updates: Partial<NotificationInput>): void;
  dismiss(id: string): void;
  dismissAll(): void;
  promise<T>(promise: Promise<T>, messages: PromiseToastMessages<T>): Promise<T>;
}
```

### Option types

```ts
interface ToastOptions {
  message?: string; // Body text beneath the title
  duration?: number | null; // ms before auto-dismiss; null = persistent
  action?: NotificationAction;
}

interface ProgressToastOptions extends ToastOptions {
  progress?: number; // Initial progress 0–100
}

interface PromiseToastMessages<T> {
  loading: string;
  success: string | ((data: T) => string);
  error: string | ((error: unknown) => string);
}

interface GenericToastOptions {
  title?: string;
  description?: string;
  variant?: 'default' | 'destructive';
  duration?: number | null;
  action?: NotificationAction;
}
```

### Behaviour notes

- **`error`** is persistent by default (`duration: null`). All other types auto-dismiss.
- **`progress`** never auto-dismisses. Call `dismiss(id)` when the operation completes.
- **`promise`** shows a progress toast while the promise is pending, then replaces it with a success
  or error toast based on the result. It re-throws on failure so you can still `catch`.
- **`toast`** (generic) maps `variant: 'destructive'` to `'error'` type; everything else becomes
  `'info'`.

### Usage examples

```tsx
import { useToast } from '@nasnet/ui/patterns';

// Basic usage
function SaveButton() {
  const { success, error } = useToast();

  const handleSave = async () => {
    try {
      await saveConfiguration();
      success('Configuration saved');
    } catch (e) {
      error('Save failed', { message: (e as Error).message });
    }
  };

  return <Button onClick={handleSave}>Save</Button>;
}

// promise() helper
function DeployButton() {
  const { promise } = useToast();

  const handleDeploy = () => {
    promise(deployService(), {
      loading: 'Deploying service...',
      success: (result) => `Deployed ${result.name} successfully`,
      error: (e) => `Deploy failed: ${(e as Error).message}`,
    });
  };

  return <Button onClick={handleDeploy}>Deploy</Button>;
}

// progress() with manual updates
function FirmwareUpload() {
  const { progress, update, dismiss, success } = useToast();

  const handleUpload = async () => {
    const id = progress('Uploading firmware...', { progress: 0 });

    for (let pct = 0; pct <= 100; pct += 10) {
      await delay(200);
      update(id, { progress: pct });
    }

    dismiss(id);
    success('Firmware uploaded successfully');
  };

  return <Button onClick={handleUpload}>Upload</Button>;
}

// Generic toast (shadcn-compatible API)
function NotifyButton() {
  const { toast } = useToast();

  return (
    <Button onClick={() => toast({ title: 'Action taken', description: 'Details here' })}>
      Notify
    </Button>
  );
}
```

---

## Clipboard Hooks

**Source:** `libs/ui/patterns/src/hooks/useClipboard.ts`, `useBulkCopy.ts`, `usePasteImport.ts`
**Import:** `import { useClipboard, useBulkCopy, usePasteImport } from '@nasnet/ui/patterns';`

### `useClipboard`

```ts
function useClipboard(options?: UseClipboardOptions): UseClipboardReturn;
```

Copies a single string to the clipboard. Uses the modern `navigator.clipboard.writeText` API with an
`execCommand` fallback for older browsers. Automatically resets the `copied` flag after `timeout`
ms.

```ts
interface UseClipboardOptions {
  timeout?: number; // ms before 'copied' resets — default 2000
  onSuccess?: (value: string) => void;
  onError?: (error: Error) => void;
}

interface UseClipboardReturn {
  copy(value: string): Promise<boolean>;
  copied: boolean;
  error: Error | null;
  reset(): void;
  isLoading: boolean;
}
```

The exported constant `CLIPBOARD_TIMEOUT_MS = 2000` is the default timeout value.

```tsx
import { useClipboard } from '@nasnet/ui/patterns';
import { Check, Copy } from 'lucide-react';

function CopyIPButton({ ip }: { ip: string }) {
  const { copy, copied, isLoading } = useClipboard();

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => copy(ip)}
      disabled={isLoading}
      aria-label={copied ? 'Copied' : 'Copy IP address'}
    >
      {copied ?
        <Check className="h-4 w-4" />
      : <Copy className="h-4 w-4" />}
    </Button>
  );
}
```

### `useBulkCopy`

```ts
function useBulkCopy(options?: UseBulkCopyOptions): UseBulkCopyReturn;
```

Copies multiple table rows to the clipboard in CSV, JSON, or plain-text format. Builds on
`useClipboard` internally.

```ts
type ExportFormat = 'csv' | 'json' | 'text';

interface UseBulkCopyOptions {
  defaultFormat?: ExportFormat; // default 'csv'
  timeout?: number; // default 2000
  csvDelimiter?: string; // default ','
  includeHeader?: boolean; // default true
  textSeparator?: string; // default '\n'
  jsonIndent?: number; // default 2
  onSuccess?: (count: number, format: ExportFormat) => void;
  onError?: (error: Error) => void;
}

interface UseBulkCopyReturn {
  copyItems<T extends Record<string, unknown>>(items: T[], columns?: (keyof T)[]): Promise<boolean>;
  format: ExportFormat;
  setFormat(format: ExportFormat): void;
  copied: boolean;
  copiedCount: number;
  error: Error | null;
  reset(): void;
  isLoading: boolean;
  supportedFormats: readonly ExportFormat[];
}
```

Exported constants: `SUPPORTED_FORMATS = ['csv', 'json', 'text']`,
`FORMAT_LABELS = { csv: 'CSV', json: 'JSON', text: 'Plain Text' }`.

```tsx
import { useBulkCopy, FORMAT_LABELS, SUPPORTED_FORMATS } from '@nasnet/ui/patterns';

function ARPTableActions({ selectedRows }: { selectedRows: ArpEntry[] }) {
  const { copyItems, format, setFormat, copied, copiedCount } = useBulkCopy({
    defaultFormat: 'csv',
    onSuccess: (count, fmt) => console.log(`Copied ${count} rows as ${fmt}`),
  });

  return (
    <div className="flex gap-2">
      <Select
        value={format}
        onValueChange={(v) => setFormat(v as ExportFormat)}
      >
        {SUPPORTED_FORMATS.map((f) => (
          <SelectItem
            key={f}
            value={f}
          >
            {FORMAT_LABELS[f]}
          </SelectItem>
        ))}
      </Select>

      <Button
        onClick={() => copyItems(selectedRows, ['ip', 'mac', 'interface'])}
        disabled={selectedRows.length === 0}
      >
        {copied ? `Copied ${copiedCount} rows` : 'Copy Selected'}
      </Button>
    </div>
  );
}
```

### `usePasteImport`

```ts
function usePasteImport(options?: UsePasteImportOptions): UsePasteImportReturn;
```

Parses clipboard content pasted into a `textarea` or other element. Supports IP lists, CSV, RouterOS
command sequences, and auto-detection. Validates each line and collects structured errors.

```ts
type ImportType = 'ip-list' | 'csv' | 'routeros' | 'auto';

interface UsePasteImportOptions {
  type?: ImportType; // default 'auto'
  maxItems?: number; // default 1000
  csvDelimiter?: string; // default ','
  csvColumns?: string[]; // validate expected CSV headers
  onParsed?: (result: ParseResult) => void;
  onError?: (error: Error) => void;
}

interface UsePasteImportReturn {
  handlePaste(event: React.ClipboardEvent): void;
  parseContent(content: string): ParseResult;
  parseResult: ParseResult | null;
  clearResult(): void;
  isParsing: boolean;
}

interface ParseResult {
  success: boolean;
  type: ImportType;
  items: ParsedItem[];
  errors: ValidationError[];
  totalLines: number;
  rawContent: string;
}

interface ParsedItem {
  line: number;
  original: string;
  value: string | Record<string, string>;
}

interface ValidationError {
  line: number;
  message: string;
  content: string;
}
```

```tsx
import { usePasteImport } from '@nasnet/ui/patterns';

function AddressListImport({ onImport }) {
  const { handlePaste, parseResult, clearResult, isParsing } = usePasteImport({
    type: 'ip-list',
    maxItems: 500,
    onParsed: (result) => {
      if (result.success) {
        onImport(result.items.map((i) => i.value as string));
      }
    },
  });

  return (
    <div>
      <textarea
        onPaste={handlePaste}
        placeholder="Paste IP addresses here (one per line)"
        className="h-32 w-full font-mono text-sm"
      />
      {isParsing && <Spinner />}
      {parseResult && !parseResult.success && <ErrorList errors={parseResult.errors} />}
      {parseResult && (
        <Button
          variant="ghost"
          size="sm"
          onClick={clearResult}
        >
          Clear
        </Button>
      )}
    </div>
  );
}
```

---

## useUnsavedChanges

**Source:** `libs/ui/patterns/src/hooks/useUnsavedChanges.ts` **Import:**
`import { useUnsavedChanges, getUnsavedChangesMessage } from '@nasnet/ui/patterns';`

Tracks page-scoped undo history (from `@nasnet/state/stores`) to determine whether the user has
unsaved changes. Blocks in-app navigation via TanStack Router and adds a `beforeunload` handler to
warn about browser-level navigation.

### Signature

```ts
function useUnsavedChanges(options?: UseUnsavedChangesOptions): UseUnsavedChangesReturn;
```

### Options

```ts
interface UseUnsavedChangesOptions {
  isCritical?: boolean; // Shows warning-level dialog styling — default false
  message?: string; // Custom dialog body text
  onSave?: () => Promise<boolean> | boolean; // Return false to keep dialog open on save failure
  onDiscard?: () => void;
  enabled?: boolean; // Toggle tracking — default true
  filter?: (action: { scope: 'page' | 'global' }) => boolean;
  // default: (action) => action.scope === 'page'
}
```

### Return type

```ts
interface UseUnsavedChangesReturn {
  hasUnsavedChanges: boolean;
  unsavedCount: number;
  isDialogOpen: boolean;
  openDialog(): void;
  closeDialog(): void;
  confirmSave(): Promise<void>;
  confirmDiscard(): void;
  markAsSaved(): void;
  getBlockerProps(): { condition: boolean; onBlock: () => void };
}
```

`getBlockerProps()` returns an object compatible with TanStack Router's `useBlocker` hook. When
`condition` is `true`, the router calls `onBlock`, which opens the confirmation dialog.

### Helper function

```ts
function getUnsavedChangesMessage(count: number, isCritical: boolean): string;
// "You have 3 unsaved changes. Are you sure you want to leave?"
// "You have 1 critical unsaved change. These changes may affect system stability."
```

### Dialog props

```ts
interface UnsavedChangesDialogProps {
  open: boolean;
  count?: number;
  isCritical?: boolean;
  message?: string;
  onCancel(): void;
  onSave?(): void;
  onDiscard(): void;
  canSave?: boolean;
}
```

### Usage with React Hook Form

```tsx
import { useUnsavedChanges } from '@nasnet/ui/patterns';
import { useBlocker } from '@tanstack/react-router';
import { useForm } from 'react-hook-form';

function FirewallRuleEditor() {
  const form = useForm<RuleFormValues>();

  const {
    hasUnsavedChanges,
    isDialogOpen,
    closeDialog,
    confirmSave,
    confirmDiscard,
    getBlockerProps,
  } = useUnsavedChanges({
    onSave: async () => {
      const valid = await form.trigger();
      if (!valid) return false; // keep dialog open
      await form.handleSubmit(saveRule)();
      return true;
    },
    onDiscard: () => form.reset(),
  });

  useBlocker(getBlockerProps());

  return (
    <>
      <Form {...form}>
        {/* form fields */}
        {hasUnsavedChanges && <Badge variant="warning">{unsavedCount} unsaved</Badge>}
      </Form>

      <UnsavedChangesDialog
        open={isDialogOpen}
        onCancel={closeDialog}
        onSave={confirmSave}
        onDiscard={confirmDiscard}
      />
    </>
  );
}
```

---

## Focus Hooks

**Source:** `libs/ui/patterns/src/hooks/use-focus-restore.ts` **Import:**
`import { useFocusRestore, useFocusManagement } from '@nasnet/ui/patterns';`

These hooks implement WCAG 2.4.3 (Focus Order) requirements. When a modal or dialog opens, focus
should move inside it; when it closes, focus must return to the element that triggered it.

### `useFocusRestore`

```ts
function useFocusRestore(options?: UseFocusRestoreOptions): UseFocusRestoreReturn;
```

Stores a reference to the currently focused DOM element and can restore focus to it later. Handles
edge cases: element removed from DOM, element no longer focusable, optional fallback element.

```ts
interface UseFocusRestoreOptions {
  autoSave?: boolean; // Save trigger on mount — default false
  autoRestore?: boolean; // Restore focus on unmount — default false
  fallback?: React.RefObject<HTMLElement> | string; // CSS selector or ref
  restoreDelay?: number; // ms delay before restoring (for close animations) — default 0
}

interface UseFocusRestoreReturn {
  saveTrigger(): void;
  restoreFocus(): void;
  hasSavedTrigger(): boolean;
  clearTrigger(): void;
}
```

```tsx
import { useFocusRestore } from '@nasnet/ui/patterns';

function ConfirmDialog({ isOpen, onClose, children }) {
  const { saveTrigger, restoreFocus } = useFocusRestore({
    restoreDelay: 150, // wait for close animation
  });

  useEffect(() => {
    if (isOpen) saveTrigger();
  }, [isOpen, saveTrigger]);

  const handleClose = () => {
    onClose();
    restoreFocus();
  };

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
    >
      {children}
      <Button onClick={handleClose}>Close</Button>
    </div>
  );
}
```

### `useFocusManagement`

```ts
function useFocusManagement(options: UseFocusManagementOptions): UseFocusManagementReturn;
```

Higher-level hook that combines focus restoration, focus trapping (Tab cycling within the dialog),
and Escape key handling into a single composable unit.

```ts
interface UseFocusManagementOptions {
  isOpen: boolean;
  onClose?: () => void;
  trapFocus?: boolean; // default true — Tab key loops within dialog
  closeOnEscape?: boolean; // default true
}

interface UseFocusManagementReturn {
  dialogRef: React.RefObject<HTMLElement>;
  onOpenChange(open: boolean): void;
}
```

```tsx
import { useFocusManagement } from '@nasnet/ui/patterns';

function AccessibleDialog({ isOpen, onClose, children }) {
  const { dialogRef, onOpenChange } = useFocusManagement({
    isOpen,
    onClose,
    trapFocus: true,
    closeOnEscape: true,
  });

  if (!isOpen) return null;

  return (
    // Attach dialogRef to the container — focus trap and Escape handler are automatic
    <div
      ref={dialogRef as React.RefObject<HTMLDivElement>}
      role="dialog"
      aria-modal="true"
    >
      {children}
      <Button onClick={() => onOpenChange(false)}>Close</Button>
    </div>
  );
}
```

---

## Primitive Hooks

**Source:** `libs/ui/primitives/src/hooks/` **Import:**
`import { useReducedMotion, useMediaQuery } from '@nasnet/ui/primitives';`

These are low-level hooks with no business logic dependencies. Both are SSR-safe (return `false`
during server-side rendering to avoid hydration mismatches).

Note: `@nasnet/ui/layouts` also exports `useReducedMotion` from its responsive-shell module along
with additional motion utilities (`useAnimationDuration`, `useMotionConfig`, `useMotionClasses`).
See the Motion Hooks section below and **`tokens-and-animation.md`** for details.

### `useReducedMotion`

```ts
function useReducedMotion(): boolean;
```

Reads the `(prefers-reduced-motion: reduce)` CSS media query. Returns `true` when the user's OS or
browser accessibility settings request reduced motion. Subscribes to changes so components respond
dynamically if the preference changes while the app is running.

Required for **WCAG 2.1 SC 2.3.3** compliance. Any animated component in NasNetConnect must use this
hook to disable or minimise motion when the preference is set.

```tsx
import { useReducedMotion } from '@nasnet/ui/primitives';

function PulsingIndicator({ status }) {
  const prefersReducedMotion = useReducedMotion();

  return (
    <span
      className={cn(
        'h-2 w-2 rounded-full',
        status === 'online' ? 'bg-success' : 'bg-muted',
        !prefersReducedMotion && status === 'online' && 'animate-pulse'
      )}
    />
  );
}
```

### `useMediaQuery`

```ts
function useMediaQuery(query: string): boolean;
```

Returns `true` when the given CSS media query matches the current environment. Subscribes to changes
(e.g., screen rotation, browser resize) and updates the returned boolean reactively.

Use this hook for one-off media queries. For platform detection, prefer `usePlatform()` from
`@nasnet/ui/layouts`.

```tsx
import { useMediaQuery } from '@nasnet/ui/primitives';

function PrintButton() {
  // Show only in print-capable contexts
  const canPrint = useMediaQuery('print');

  // Dark mode awareness without the theme provider
  const prefersDark = useMediaQuery('(prefers-color-scheme: dark)');

  // Touch capability detection
  const isTouch = useMediaQuery('(hover: none) and (pointer: coarse)');

  return canPrint ? <Button>Print Report</Button> : null;
}
```

---

## Motion Hooks (from layouts)

**Source:** `libs/ui/layouts/src/responsive-shell/useReducedMotion.ts` **Import:**
`import { useReducedMotion, useAnimationDuration, useMotionConfig, useMotionClasses } from '@nasnet/ui/layouts';`

These extend the primitive `useReducedMotion` with utilities tailored to the NasNetConnect design
token animation durations. See **`tokens-and-animation.md`** for the full motion system reference.

### `useAnimationDuration`

```ts
function useAnimationDuration(normalDuration: number, reducedDuration?: number): number;
```

Returns `reducedDuration` (default `0`) when the user prefers reduced motion, otherwise returns
`normalDuration`. Accepts milliseconds.

```tsx
import { useAnimationDuration, ANIMATION_DURATIONS } from '@nasnet/ui/layouts';

function CollapsiblePanel({ isOpen, children }) {
  const duration = useAnimationDuration(ANIMATION_DURATIONS.SIDEBAR); // 200 ms or 0

  return (
    <div
      style={{ transitionDuration: `${duration}ms` }}
      className="overflow-hidden transition-all"
    >
      {isOpen && children}
    </div>
  );
}
```

### `useMotionConfig`

```ts
function useMotionConfig(durationMs?: number): {
  shouldAnimate: boolean;
  transition: { duration: number } | { duration: number; ease: string };
  duration: number;
  durationSeconds: number;
};
```

Returns a Framer Motion-compatible transition object. When reduced motion is active, `duration` and
`durationSeconds` are `0` and `shouldAnimate` is `false`.

```tsx
import { motion } from 'framer-motion';
import { useMotionConfig, ANIMATION_DURATIONS } from '@nasnet/ui/layouts';

function AnimatedSidebar({ isCollapsed }) {
  const { transition, shouldAnimate } = useMotionConfig(ANIMATION_DURATIONS.SIDEBAR);

  return (
    <motion.div
      initial={shouldAnimate ? { width: 256 } : false}
      animate={{ width: isCollapsed ? 64 : 256 }}
      transition={transition}
    >
      Sidebar content
    </motion.div>
  );
}
```

### `useMotionClasses`

```ts
function useMotionClasses(): {
  transitionClass: 'transition-all' | 'transition-none';
  durationClass: 'duration-200' | 'duration-0';
  motionClass: string;
};
```

Returns Tailwind CSS class strings safe to use on any animated element.

```tsx
import { useMotionClasses } from '@nasnet/ui/layouts';
import { cn } from '@nasnet/ui/utils';

function FadePanel({ visible, children }) {
  const { motionClass } = useMotionClasses();

  return <div className={cn(motionClass, 'opacity-0', visible && 'opacity-100')}>{children}</div>;
}
```

**`ANIMATION_DURATIONS` constant:**

```ts
const ANIMATION_DURATIONS = {
  SIDEBAR: 200, // sidebar collapse/expand
  LAYOUT: 150, // layout/platform transitions
  DRAWER: 200, // mobile drawer, modal, sheet open/close
  QUICK: 100, // hover states, micro-interactions
  DEFAULT: 200, // standard transitions and fades
  SLOW: 300, // deliberate transitions with visual emphasis
} as const;
```

---

## Hook Composition Patterns

### Live search with debounced filter

Combining `useMemoizedFilterSort` and `useDebouncedCallback` gives a responsive search box that does
not re-filter on every keystroke.

```tsx
import { useMemoizedFilterSort, useDebouncedCallback } from '@nasnet/ui/patterns';

function FilterableServiceList({ services }: { services: Service[] }) {
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');

  // Debounce the query that drives the filter
  const updateDebounced = useDebouncedCallback(setDebouncedQuery, 250);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value); // Update input immediately
    updateDebounced(e.target.value); // Trigger filter after 250 ms quiet period
  };

  const displayed = useMemoizedFilterSort(
    services,
    debouncedQuery ? (s) => s.name.toLowerCase().includes(debouncedQuery.toLowerCase()) : null,
    (a, b) => a.name.localeCompare(b.name),
    [debouncedQuery] // recompute only when debounced query changes
  );

  return (
    <>
      <input
        value={query}
        onChange={handleChange}
        placeholder="Filter services"
      />
      <ServiceTable rows={displayed} />
    </>
  );
}
```

### Stable table action handler

Stable callbacks prevent `React.memo` tables from re-rendering when a parent re-renders due to
unrelated state.

```tsx
import { useStableCallback, useBulkCopy, useToast } from '@nasnet/ui/patterns';

function RouterTable({ routers }: { routers: Router[] }) {
  const { success, error } = useToast();
  const { copyItems, format, setFormat } = useBulkCopy();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Stable — identity never changes, so MemoizedTable never re-renders for this prop alone
  const handleRowSelect = useStableCallback((id: string, checked: boolean) => {
    setSelectedIds((prev) => (checked ? [...prev, id] : prev.filter((x) => x !== id)));
  });

  const selectedRouters = useMemoizedFilter(routers, (r) => selectedIds.includes(r.id), [
    selectedIds,
  ]);

  const handleCopy = async () => {
    const ok = await copyItems(selectedRouters, ['name', 'address', 'status']);
    if (ok) success(`Copied ${selectedRouters.length} routers`);
    else error('Copy failed');
  };

  return (
    <>
      <MemoizedTable
        routers={routers}
        onSelect={handleRowSelect}
      />
      <Button
        onClick={handleCopy}
        disabled={selectedIds.length === 0}
      >
        Export Selected
      </Button>
    </>
  );
}
```

### Modal with full accessibility

Combining `useFocusManagement`, `useToast`, and `useUnsavedChanges` for a fully accessible
configuration modal.

```tsx
import { useFocusManagement, useToast, useUnsavedChanges } from '@nasnet/ui/patterns';

function ConfigModal({ isOpen, onClose }) {
  const { success, error } = useToast();

  const {
    hasUnsavedChanges,
    isDialogOpen: isUnsavedDialogOpen,
    confirmSave,
    confirmDiscard,
    closeDialog: closeUnsavedDialog,
  } = useUnsavedChanges({
    onSave: async () => {
      try {
        await saveConfig();
        return true;
      } catch {
        error('Save failed');
        return false;
      }
    },
    onDiscard: resetConfig,
  });

  // Attempt to close — prompt if dirty
  const handleClose = () => {
    if (hasUnsavedChanges) {
      // useUnsavedChanges blocker handles the prompt
    } else {
      onClose();
    }
  };

  const { dialogRef, onOpenChange } = useFocusManagement({
    isOpen,
    onClose: handleClose,
    trapFocus: true,
    closeOnEscape: true,
  });

  if (!isOpen) return null;

  return (
    <div
      ref={dialogRef as React.RefObject<HTMLDivElement>}
      role="dialog"
      aria-modal="true"
    >
      {/* config form */}
      <UnsavedChangesDialog
        open={isUnsavedDialogOpen}
        onCancel={closeUnsavedDialog}
        onSave={confirmSave}
        onDiscard={confirmDiscard}
      />
    </div>
  );
}
```

### Best practices for hook dependencies

1. **Pass stable functions to memoization hooks.** Wrap inline predicate or sort functions in
   `useStableCallback` so they do not become unintentional dependencies:

   ```tsx
   const isOnline = useStableCallback((r: Router) => r.status === 'online');
   const online = useMemoizedFilter(routers, isOnline, []);
   // deps array stays empty — no risk of accidental re-filter
   ```

2. **Keep `deps` minimal and explicit.** Only include values that actually change the output of the
   filter/sort/map function. Avoid spreading entire objects; destructure only the properties you
   compare.

3. **Co-locate debounce with the state it updates.** Place `useDebouncedCallback` in the same
   component that owns the state being debounced. Do not pass a debounced callback down through
   multiple component layers — the delay accumulates unpredictably.

4. **Use `useThrottledCallback` for continuous events.** Scroll, resize, and pointer-move handlers
   benefit from throttle (leading execution + trailing call). Debounce is better suited for input
   fields where you want to wait for a pause.

5. **Never pass a debounced or throttled callback into a memoization hook's `deps` array.** Both
   `useDebouncedCallback` and `useThrottledCallback` change identity when `delay` changes, which
   would invalidate the memoized result unexpectedly.

---

## Cross-References

| Topic                                         | Document                                                           |
| --------------------------------------------- | ------------------------------------------------------------------ |
| Platform hooks full guide                     | `layouts-and-platform.md`                                          |
| Animation tokens and motion system            | `tokens-and-animation.md`                                          |
| Domain-specific hooks (useResourceCard, etc.) | `patterns-domain-components.md`                                    |
| Three-layer component architecture            | `Docs/architecture/adrs/017-three-layer-component-architecture.md` |
| Headless + Platform Presenters ADR            | `Docs/architecture/adrs/018-headless-platform-presenters.md`       |
| WCAG AAA accessibility requirements           | `Docs/design/ux-design/8-responsive-design-accessibility.md`       |
