# Component Testing

Component tests verify that React components render correctly and respond to user interactions as
expected. They sit at the integration level of the testing pyramid — components are rendered with
real logic, connected to mocked network requests via MSW, and exercised through user events.

**Tools:** React Testing Library, `@testing-library/user-event`, MSW

---

## Custom Render Wrapper

`apps/connect/src/test/test-utils.tsx` provides a `render` function that wraps components with all
application providers. This replaces the default `render` from `@testing-library/react` throughout
the test suite.

```typescript
import { render, screen } from '@/test/test-utils';
// NOT: import { render } from '@testing-library/react';
```

### Provider Stack

The test wrapper mirrors the production provider tree:

```tsx
function AllProviders({ children }: AllProvidersProps): ReactElement {
  const queryClient = createTestQueryClient();
  const router = createTestRouter(children);

  return (
    <MockApolloProvider>
      <I18nProvider>
        <DirectionProvider>
          <ThemeProvider>
            <PlatformProvider>
              <AnimationProvider>
                <QueryClientProvider client={queryClient}>
                  <ToastProvider>
                    <RouterProvider router={router} />
                  </ToastProvider>
                </QueryClientProvider>
              </AnimationProvider>
            </PlatformProvider>
          </ThemeProvider>
        </DirectionProvider>
      </I18nProvider>
    </MockApolloProvider>
  );
}
```

Each test gets a **fresh** `QueryClient` and in-memory router — state does not leak between tests.

See `../architecture/provider-stack.md` for the full production provider hierarchy and how it maps
to this test wrapper.

### renderWithUser

For tests that involve user interactions, use `renderWithUser` to get a pre-configured `userEvent`
instance:

```typescript
import { renderWithUser, screen } from '@/test/test-utils';

it('should update when clicked', async () => {
  const { user } = renderWithUser(<MyComponent />);

  await user.click(screen.getByRole('button', { name: /submit/i }));

  expect(screen.getByText('Submitted')).toBeInTheDocument();
});
```

The `user` object from `userEvent.setup()` simulates realistic browser events (pointer events, input
events, focus changes) rather than synthetic events.

---

## Component Test Patterns

### Rendering and Snapshot

Test that a component renders its expected structure. Prefer `getByRole` and `getByText` over
snapshots, which are fragile to markup changes.

```tsx
// ARPTable.test.tsx
import { render, screen } from '@testing-library/react';
import { ARPTable } from './ARPTable';

const mockEntries: ARPEntry[] = [
  {
    id: '*1',
    ipAddress: '192.168.1.10',
    macAddress: 'AA:BB:CC:DD:EE:FF',
    interface: 'bridge',
    status: 'complete',
    isDynamic: true,
  },
  ...
];

it('should render table headers', () => {
  render(<ARPTable entries={mockEntries} />);
  expect(screen.getByText('IP Address')).toBeInTheDocument();
  expect(screen.getByText('MAC Address')).toBeInTheDocument();
  expect(screen.getByText('Interface')).toBeInTheDocument();
  expect(screen.getByText('Status')).toBeInTheDocument();
});

it('should display all entries', () => {
  render(<ARPTable entries={mockEntries} />);
  expect(screen.getByText('192.168.1.10')).toBeInTheDocument();
  expect(screen.getByText('AA:BB:CC:DD:EE:FF')).toBeInTheDocument();
});

it('should show empty state when no entries', () => {
  render(<ARPTable entries={[]} />);
  expect(screen.getByText('No ARP entries found')).toBeInTheDocument();
});
```

### User Interactions

```tsx
// ARPTable.test.tsx — sort interaction
import userEvent from '@testing-library/user-event';

it('should sort by IP address numerically', async () => {
  const user = userEvent.setup();
  const { container } = render(<ARPTable entries={mockEntries} />);

  // Click column header to sort ascending
  await user.click(screen.getByText('IP Address'));

  const rows = container.querySelectorAll('tbody tr');
  const firstIP = rows[0].querySelector('td')?.textContent;
  expect(firstIP).toBe('10.0.0.1'); // Numerically lowest
});

it('should cycle sort states: asc → desc → none', async () => {
  const user = userEvent.setup();
  render(<ARPTable entries={mockEntries} />);

  const ipHeader = screen.getByText('IP Address');
  await user.click(ipHeader); // ascending
  await user.click(ipHeader); // descending
  await user.click(ipHeader); // no sort
});
```

### Expand/Collapse Interactions

```tsx
// InterfaceCard.test.tsx
it('should expand to show traffic statistics when clicked', async () => {
  const user = userEvent.setup();
  (queries.useInterfaceTraffic as ReturnType<typeof vi.fn>).mockReturnValue({
    data: {
      interfaceId: '*1',
      txBytes: 1024000,
      rxBytes: 2048000,
      txPackets: 1000,
      rxPackets: 2000,
      txErrors: 0,
      rxErrors: 0,
      txDrops: 0,
      rxDrops: 0,
    },
    isLoading: false,
    error: null,
  });

  render(<InterfaceCard interface={mockInterface} />);
  await user.click(screen.getByRole('button'));

  await waitFor(() => {
    expect(screen.getByText('Traffic Statistics')).toBeInTheDocument();
  });
});

it('should show loading state when fetching traffic stats', async () => {
  const user = userEvent.setup();
  (queries.useInterfaceTraffic as ReturnType<typeof vi.fn>).mockReturnValue({
    data: undefined,
    isLoading: true,
    error: null,
  });

  render(<InterfaceCard interface={mockInterface} />);
  await user.click(screen.getByRole('button'));

  await waitFor(() => {
    expect(screen.getByText('Loading traffic statistics...')).toBeInTheDocument();
  });
});
```

### Testing Error States

Override the default MSW handler in a specific test to simulate failure:

```tsx
import { server } from '@/mocks/server';
import { errorHandler } from '@/mocks/handlers/graphql';

it('should display error when router is unreachable', async () => {
  server.use(errorHandler);

  render(<RouterDashboard routerId="r1" />);

  expect(await screen.findByText(/router connection failed/i)).toBeInTheDocument();
});
```

---

## Storybook Component Testing

Stories serve as visual documentation and as test fixtures. Each story represents a distinct
component state. The connect app has 90+ story files across all components.

### Story Structure

```tsx
// InterfaceCard.stories.tsx
import type { Meta, StoryObj } from '@storybook/react';
import { InterfaceCard } from './InterfaceCard';

const meta: Meta<typeof InterfaceCard> = {
  title: 'App/Network/InterfaceCard',
  component: InterfaceCard,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
  },
};

export default meta;
type Story = StoryObj<typeof InterfaceCard>;

// Each export is a story — one per meaningful state
export const RunningLinkUp: Story = {
  args: {
    interface: makeInterface({ status: 'running', linkStatus: 'up' }),
  },
};

export const Disabled: Story = {
  args: {
    interface: makeInterface({ status: 'disabled', linkStatus: 'down' }),
  },
};

// Platform-specific stories
export const Mobile: Story = {
  ...RunningLinkUp,
  parameters: {
    viewport: { defaultViewport: 'mobile1' },
  },
};

export const Desktop: Story = {
  ...RunningLinkUp,
  parameters: {
    viewport: { defaultViewport: 'desktop' },
  },
};
```

### Story Conventions

- Use `makeInterface()` / factory functions for test data — avoid hard-coded objects duplicated
  across stories
- Each story covers exactly one meaningful state (running, disabled, loading, error, empty, etc.)
- Add `Mobile` and `Desktop` stories for components that have platform-specific rendering
- Use `tags: ['autodocs']` to auto-generate API documentation from JSDoc

### Running Storybook

```bash
# Connect app Storybook (port 4400)
npx nx run connect:storybook

# Build all Storybooks for deployment
npx nx run-many -t build-storybook
```

---

## Testing Responsive Behavior

### Platform Mock

Components use `usePlatform()` to select between mobile and desktop presenters. In tests, the
platform is controlled by mocking the media query:

```typescript
// In test setup (setup.ts), matchMedia returns { matches: false } by default
// This means isMobile = false, so desktop presenter is rendered

// To test mobile presenter, override in the test:
vi.mocked(window.matchMedia).mockImplementation((query) => ({
  matches: query.includes('max-width: 639px'), // mobile breakpoint
  media: query,
  onchange: null,
  addListener: vi.fn(),
  removeListener: vi.fn(),
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  dispatchEvent: vi.fn(),
}));
```

In Storybook, use viewport presets:

```typescript
export const Mobile: Story = {
  parameters: {
    viewport: { defaultViewport: 'mobile1' }, // 375×667
  },
};

export const Tablet: Story = {
  parameters: {
    viewport: { defaultViewport: 'tablet' }, // 768×1024
  },
};
```

---

## Testing Forms

Forms typically need React Hook Form context. Use the full wrapper from `test-utils.tsx`, or provide
a minimal form wrapper:

```tsx
import { useForm, FormProvider } from 'react-hook-form';

function FormWrapper({ children }: { children: ReactNode }) {
  const methods = useForm();
  return <FormProvider {...methods}>{children}</FormProvider>;
}

it('should validate required fields', async () => {
  const user = userEvent.setup();
  render(
    <FormWrapper>
      <InterfaceEditForm />
    </FormWrapper>
  );

  await user.click(screen.getByRole('button', { name: /save/i }));

  expect(await screen.findByText(/interface name is required/i)).toBeInTheDocument();
});
```

---

## Testing with Apollo

The `MockApolloProvider` (from `@nasnet/api-client/core`) is included in the test wrapper
automatically. It intercepts Apollo Client operations and forwards them to MSW handlers, so GraphQL
queries/mutations are mocked at the network level rather than the Apollo level.

For tests that need precise control over specific GraphQL responses, use `server.use()`:

```typescript
import { graphqlEndpoint } from '@/mocks/handlers/graphql';
import { graphql, HttpResponse } from 'msw';

it('should show empty state when no routers configured', () => {
  server.use(
    graphqlEndpoint.query('GetRouters', () =>
      HttpResponse.json({
        data: { routers: { edges: [], totalCount: 0 } },
      })
    )
  );

  render(<RouterListPage />);
  expect(screen.getByText(/no routers configured/i)).toBeInTheDocument();
});
```

---

## Accessibility in Component Tests

Use `axe-core` for automated accessibility checks in component tests:

```typescript
import { axe, toHaveNoViolations } from 'jest-axe';
expect.extend(toHaveNoViolations);

it('should have no accessibility violations', async () => {
  const { container } = render(<ARPTable entries={mockEntries} />);
  const results = await axe(container);
  expect(results).toHaveNoViolations();
});
```

---

## See Also

- `apps/connect/src/test/test-utils.tsx` — Custom render utilities
- `apps/connect/src/test/setup.ts` — Global test setup
- `10-testing/mocking.md` — MSW handler details
- `10-testing/unit-testing.md` — Hook testing, vi.mock patterns
- `../architecture/provider-stack.md` — Provider hierarchy for test wrapper context
- `../ui-system/overview.md` — Component architecture (Layer 1/2/3 dependency rules)
