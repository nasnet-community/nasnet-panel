# Test Infrastructure for Connection Tracking

This directory contains test utilities, fixtures, and templates for comprehensive testing of the
Connection Tracking feature (NAS-7.4).

## Overview

The test infrastructure has been prepared in advance to enable rapid test implementation once the
pattern components are created. All files are ready to use with minimal modifications.

## Files Included

### Mock Data & Fixtures

**`connection-tracking-fixtures.ts`**

- Complete mock data for Connection and ConnectionTrackingSettings types
- Helper functions for filtering and duration conversion
- GraphQL mock responses for queries and mutations
- Performance testing utilities (generate 1000+ connections)

### Unit Test Templates

**`../connection-list/use-connection-list.test.ts`**

- 15+ test cases for the useConnectionList hook
- Tests for wildcard IP filtering (`192.168.1.*`, `*.*.*.1`, etc.)
- Port, protocol, and state filtering tests
- Sorting and pause/resume functionality tests

**`../connection-tracking-settings/use-connection-tracking-settings.test.ts`**

- 10+ test cases for the useConnectionTrackingSettings hook
- Zod schema validation tests
- Duration parsing/formatting tests
- Form state management tests

### Component Test Templates

**`../connection-list/ConnectionList.test.tsx`**

- React Testing Library tests with MockedProvider
- Loading, empty, error state tests
- Filtering UI tests (debounced input)
- Kill connection flow tests
- Accessibility tests (axe-core, keyboard navigation)
- Platform presenter tests (Mobile vs Desktop)

**`../connection-tracking-settings/ConnectionTrackingSettings.test.tsx`**

- Settings form rendering tests
- Validation error tests
- Dangerous level confirmation dialog tests
- Accessibility tests

### Storybook Stories

**`../connection-list/ConnectionList.stories.tsx`**

- Empty state
- Loading state
- Few connections (6 entries)
- Many connections (1500 entries)
- Filtered state
- Paused refresh state
- Mobile vs Desktop presenters
- Accessibility test story

**`../connection-tracking-settings/ConnectionTrackingSettings.stories.tsx`**

- Default state
- Modified state
- Disabled tracking
- With validation errors
- Saving state
- Max entries slider
- Mobile vs Desktop presenters
- Dangerous confirmation dialog
- Accessibility test story

### E2E Test Template

**`../../../apps/connect-e2e/src/firewall-connections.spec.ts`**

- Playwright E2E tests for complete user workflows
- Connection list view tests
- Auto-refresh behavior tests
- Filtering tests (IP, port, protocol, state)
- Kill connection flow tests
- Connection tracking settings tests
- Keyboard navigation tests
- Accessibility tests
- Performance tests (1000+ connections)

## Usage

### Step 1: Pattern Components Ready

Once the frontend-pattern-agent completes Tasks 3-7, the following components will be available:

- `libs/ui/patterns/src/connection-list/use-connection-list.ts`
- `libs/ui/patterns/src/connection-list/ConnectionList.tsx`
- `libs/ui/patterns/src/connection-tracking-settings/use-connection-tracking-settings.ts`
- `libs/ui/patterns/src/connection-tracking-settings/ConnectionTrackingSettings.tsx`

### Step 2: Uncomment Import Statements

In each test file, uncomment the import statements:

```typescript
// BEFORE (template)
// import { ConnectionList } from './ConnectionList';
// import { GET_CONNECTIONS } from '@nasnet/api-client/queries';

// AFTER (ready to use)
import { ConnectionList } from './ConnectionList';
import { GET_CONNECTIONS } from '@nasnet/api-client/queries';
```

### Step 3: Uncomment Test Code

Each test has complete describe blocks and test cases commented out with `// TODO:` markers. Simply
uncomment the code and run the tests.

### Step 4: Run Tests

```bash
# Unit tests for hooks
npx nx test ui-patterns --testPathPattern=use-connection-list.test.ts

# Component tests
npx nx test ui-patterns --testPathPattern=ConnectionList.test.tsx

# E2E tests
npx nx e2e connect-e2e --spec=firewall-connections.spec.ts

# All tests
npx nx run-many -t test
```

### Step 5: Run Storybook

```bash
npx nx run ui-patterns:storybook
```

Navigate to "Patterns > Connection Tracking" to view the stories.

## Mock Data Reference

### Sample Connections

- `mockEstablishedConnection` - Established TCP connection (192.168.1.100 → 203.0.113.10:443)
- `mockUdpConnection` - UDP DNS query (192.168.1.50 → 8.8.8.8:53)
- `mockIcmpConnection` - ICMP ping (192.168.1.1 → 1.1.1.1)
- `mockTimeWaitConnection` - TIME-WAIT TCP connection
- `mockSynSentConnection` - SYN-SENT new connection attempt
- `mockNatConnection` - Connection with NAT translation
- `mockConnections` - Array of 6 diverse connections
- `generateMockConnections(count)` - Generate N connections for performance testing

### Sample Settings

- `mockDefaultSettings` - Default connection tracking settings
- `mockModifiedSettings` - Modified settings with custom timeouts
- `mockDisabledSettings` - Tracking disabled

### Filter Examples

- `mockIpFilter` - Filter by exact IP (192.168.1.100)
- `mockWildcardFilter` - Wildcard IP (192.168.1.\*)
- `mockProtocolFilter` - Filter by TCP
- `mockPortFilter` - Filter by port 443
- `mockStateFilter` - Filter by established state
- `mockCombinedFilters` - Multiple filters combined

## Test Coverage Goals

Per NAS-7.4 specification:

- **Line coverage:** 80% minimum
- **Branch coverage:** 75% minimum
- **Zero accessibility violations:** WCAG AAA (7:1 contrast, 44px touch targets)

## Testing Standards

- **Unit tests:** Vitest (NOT Jest)
- **Component tests:** React Testing Library + MockedProvider
- **E2E tests:** Playwright (Chromium, Firefox, WebKit)
- **Accessibility:** axe-core + manual keyboard testing
- **Performance:** Virtualization tests with 1000+ entries

## Wildcard IP Filter Test Cases

The `use-connection-list.test.ts` includes comprehensive wildcard filter tests:

1. **Exact match:** `192.168.1.100` - Matches exact IP
2. **Last octet wildcard:** `192.168.1.*` - Matches 192.168.1.0/24
3. **Two octets wildcard:** `192.168.*.*` - Matches 192.168.0.0/16
4. **Fixed last octet:** `*.*.*.1` - Matches all .1 addresses (gateways)
5. **Full wildcard:** `*.*.*.*` - Matches all IPs

## Helper Functions

### Filtering

- `filterConnectionsByIP(connections, ipPattern)` - IP filter with wildcard support
- `filterConnectionsByPort(connections, port)` - Port filter (src or dst)
- `filterConnectionsByProtocol(connections, protocol)` - Protocol filter
- `filterConnectionsByState(connections, state)` - State filter
- `applyConnectionFilters(connections, filters)` - Apply all filters

### Duration Conversion

- `formatDuration(seconds)` - Convert seconds to "1d", "10m", "30s"
- `parseDuration(duration)` - Convert "1d" to 86400 seconds

## Next Steps

1. ✅ Test infrastructure prepared
2. ⏳ Wait for pattern components (frontend-pattern-agent)
3. ⏳ Uncomment import statements and test code
4. ⏳ Run tests and verify coverage
5. ⏳ Fix any test failures
6. ⏳ Generate coverage report

## Questions or Issues

Contact the test-engineer-agent or team-lead for assistance.
