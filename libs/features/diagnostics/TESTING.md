# Testing Guide - Diagnostics Feature

**Feature**: NAS-5.11 No Internet Troubleshooting Wizard
**Test Count**: 120 component tests
**Status**: Tests written, vitest configuration in progress

## Test Structure

### Component Tests (120 total)

**TroubleshootWizard.test.tsx** (28 tests)
- State rendering (idle, initializing, running, completed)
- User interactions (start, apply fix, skip, restart)
- Auto-start behavior
- ISP information
- Accessibility (ARIA labels, keyboard navigation)
- Error handling

**DiagnosticStep.test.tsx** (42 tests)
- Status rendering (pending, running, passed, failed)
- Result display with execution time
- Active state highlighting
- Click interactions
- Step number badge
- Keyboard accessibility (Enter/Space)
- Edge cases

**FixSuggestion.test.tsx** (50 tests)
- Basic rendering (title, description, confidence badge)
- Automated vs manual fixes
- Manual steps rendering
- Command preview
- ISP information display
- Button states (idle, applying, applied, failed)
- 44px touch targets (WCAG AAA)

---

## Running Tests

### Individual Test Files

```bash
# Run specific test file
cd libs/features/diagnostics
npx vitest run src/components/TroubleshootWizard/DiagnosticStep.test.tsx

# Run with coverage
npx vitest run --coverage

# Watch mode
npx vitest watch
```

### All Diagnostics Tests

```bash
# From project root
npm run test -- diagnostics

# Or with Nx
npx nx test diagnostics
```

---

## Vitest Configuration

### Current Setup

**vitest.config.ts** includes:
- JSDOM environment
- Path aliases for all @nasnet/* imports
- 90% coverage thresholds
- Test file patterns

**vitest.setup.ts** includes:
- @testing-library/jest-dom matchers
- window.matchMedia mock
- IntersectionObserver mock
- ResizeObserver mock
- Console warning suppressors (Zustand, Apollo, i18next)

### Known Configuration Challenges

**Complex Monorepo Dependencies**
The diagnostics feature has deep dependency chains:
```
TroubleshootWizard
  → useTroubleshootWizard (hook)
    → @xstate/react
    → troubleshoot-machine
      → @nasnet/api-client/queries
        → @apollo/client
        → @nasnet/features/router-discovery (circular?)
          → @nasnet/ui/patterns
            → @nasnet/ui/tokens
              → (generated CSS tokens)
```

**Resolution Issues**:
1. `@nasnet/ui/tokens` imports from `dist/` (build artifact)
2. Some patterns import from features (potential circular dependency)
3. Apollo Client initialization warnings
4. i18next initialization in test environment

### Workarounds

**Option 1: Mock Complex Dependencies**

Add to test files that use wizard:

```typescript
// Mock the useTroubleshootWizard hook
vi.mock('../../hooks/useTroubleshootWizard', () => ({
  useTroubleshootWizard: vi.fn(),
}));

// Mock Apollo hooks
vi.mock('@apollo/client', () => ({
  useQuery: vi.fn(),
  useMutation: vi.fn(),
  useSubscription: vi.fn(),
}));
```

**Option 2: Test Components in Isolation**

Test DiagnosticStep and FixSuggestion independently (fewer dependencies):

```bash
npx vitest run src/components/TroubleshootWizard/DiagnosticStep.test.tsx
npx vitest run src/components/TroubleshootWizard/FixSuggestion.test.tsx
```

These have minimal dependencies and should pass with current configuration.

**Option 3: Integration Tests Instead**

Test the full wizard via E2E (Playwright) instead of unit tests:
- Faster to set up
- Tests real behavior
- Avoids mock complexity

---

## Test Best Practices

### Writing New Tests

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

describe('MyComponent', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render', () => {
    render(<MyComponent />);
    expect(screen.getByText('Expected Text')).toBeInTheDocument();
  });

  it('should handle user interaction', async () => {
    const user = userEvent.setup();
    const handleClick = vi.fn();

    render(<MyComponent onClick={handleClick} />);

    await user.click(screen.getByRole('button'));

    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});
```

### Mocking GraphQL

```typescript
import { MockedProvider } from '@apollo/client/testing';

const mocks = [
  {
    request: {
      query: START_TROUBLESHOOT,
      variables: { routerId: 'test' },
    },
    result: {
      data: {
        startTroubleshoot: {
          session: { id: '123', status: 'RUNNING' },
        },
      },
    },
  },
];

render(
  <MockedProvider mocks={mocks}>
    <MyComponent />
  </MockedProvider>
);
```

### Accessibility Testing

```typescript
import { axe, toHaveNoViolations } from 'jest-axe';

expect.extend(toHaveNoViolations);

it('should have no accessibility violations', async () => {
  const { container } = render(<MyComponent />);
  const results = await axe(container);
  expect(results).toHaveNoViolations();
});
```

---

## Troubleshooting

### Error: "Failed to resolve import @nasnet/..."

**Cause**: Missing alias in vitest.config.ts

**Fix**: Add to `resolve.alias`:
```typescript
'@nasnet/your-package': path.resolve(__dirname, '../../path/to/package/src')
```

### Error: "window.matchMedia is not a function"

**Cause**: JSDOM doesn't implement matchMedia

**Fix**: Already added to vitest.setup.ts ✅

### Error: Multiple exports with same name

**Cause**: Duplicate exports in index.ts files

**Fix**: Search for duplicate exports:
```bash
grep -n "export.*ComponentName" libs/ui/patterns/src/index.ts
```

Remove duplicates.

### Tests Hang or Timeout

**Cause**: Async operations not properly awaited

**Fix**: Use `waitFor` for async assertions:
```typescript
await waitFor(() => {
  expect(screen.getByText('Expected')).toBeInTheDocument();
});
```

---

## Future Improvements

### Short Term
1. **Resolve Token Import**: Build tokens before running tests or mock them
2. **Add MSW**: Mock API calls at network level instead of mocking hooks
3. **Component Test Coverage**: Aim for 80%+ coverage on all components

### Long Term
1. **Visual Regression**: Add Chromatic or Percy for visual testing
2. **Performance Testing**: Add performance benchmarks for wizard flow
3. **Mutation Testing**: Use Stryker to verify test quality

---

## CI/CD Integration

### GitHub Actions Workflow

```yaml
name: Test Diagnostics Feature

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Install dependencies
        run: npm ci

      - name: Build tokens (prerequisite)
        run: npx nx build ui-tokens

      - name: Run tests
        run: npx nx test diagnostics --coverage

      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage/lcov.info
```

---

## Test Metrics

### Current Status

| Metric | Target | Actual | Status |
|--------|--------|--------|--------|
| Tests Written | 100+ | 120 | ✅ |
| Test Files | 3+ | 3 | ✅ |
| Coverage Target | 80% | TBD* | ⏳ |
| Passing Tests | 100% | Config in progress | ⏳ |

*Coverage will be measured once vitest configuration is complete

### Coverage Goals

- **Statements**: 80%
- **Branches**: 75%
- **Functions**: 80%
- **Lines**: 80%

Excluded from coverage:
- `*.test.tsx` files
- `*.stories.tsx` files
- `index.ts` barrel files

---

## Manual Testing Checklist

Until automated tests are fully running, use this manual testing checklist:

### Happy Path
- [ ] Wizard renders in idle state
- [ ] Click "Start Diagnostic" starts wizard
- [ ] Network detection succeeds
- [ ] All 5 steps execute sequentially
- [ ] Steps show correct status (pending → running → passed/failed)
- [ ] Execution time displays for completed steps
- [ ] Fix suggestions appear for failed steps
- [ ] Apply fix button works
- [ ] Skip fix button works
- [ ] Summary shows at completion

### Error Scenarios
- [ ] Network detection failure shows error
- [ ] Failed step shows fix suggestion
- [ ] Manual fix shows steps instead of apply button
- [ ] ISP info displays for internet issues
- [ ] Keyboard navigation works (Tab, Enter, Space)
- [ ] Screen reader announces step progress

### Accessibility
- [ ] All buttons have accessible labels
- [ ] ARIA live regions announce changes
- [ ] Focus visible on keyboard navigation
- [ ] Touch targets minimum 44px
- [ ] Color contrast meets WCAG AAA (7:1)

---

## Resources

- [Vitest Documentation](https://vitest.dev/)
- [Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
- [Jest Axe (Accessibility)](https://github.com/nickcolley/jest-axe)
- [MSW (API Mocking)](https://mswjs.io/)

---

## Support

For issues with tests:
1. Check this guide for common errors
2. Review test file examples in `router-discovery/` feature
3. Ask in #testing Slack channel
4. Create issue in GitHub repo

---

**Last Updated**: 2025-02-05
**Maintainer**: NasNetConnect Team
