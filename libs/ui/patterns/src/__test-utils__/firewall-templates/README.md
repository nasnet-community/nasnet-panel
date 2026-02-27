# Test Infrastructure for Firewall Templates

This directory contains test utilities, fixtures, and templates for comprehensive testing of the
Firewall Templates feature (NAS-7.6).

## Overview

The test infrastructure has been prepared in advance to enable rapid test implementation once the
pattern components and backend services are created. All files are ready to use with minimal
modifications.

## Story Reference

**Story:** NAS-7.6 - Implement Firewall Templates **Location:**
`Docs/sprint-artifacts/Epic7-Security-Firewall/NAS-7-6-implement-firewall-templates.md`

## Files Included

### Mock Data & Fixtures

**`template-fixtures.ts`**

- Complete mock data for FirewallTemplate, TemplateVariable, TemplateRule types
- 5 built-in templates (Basic Security, Home Network, Gaming Optimized, IoT Isolation, Guest
  Network)
- 1 custom template example
- Mock conflicts (DUPLICATE_RULE, IP_OVERLAP, CHAIN_CONFLICT, POSITION_CONFLICT)
- Mock impact analysis (safe, moderate, high impact scenarios)
- Mock preview results with/without conflicts
- Mock apply results (success, partial failure, complete failure)
- GraphQL mock responses for all queries and mutations
- Helper functions for variable resolution, validation, filtering, and searching

## Test Coverage Requirements

Per NAS-7.6 Task 7 specification:

- **Line coverage:** 80% minimum
- **Branch coverage:** 75% minimum
- **Zero accessibility violations:** WCAG AAA (7:1 contrast, 44px touch targets)

## Testing Strategy

Following the **Testing Trophy** pattern (from `Docs/test-design-system/test-levels-strategy.md`):

```
┌─────────────────────────────────────────────────────┐
│                    E2E Tests                        │ ← 10%
├─────────────────────────────────────────────────────┤
│              Integration Tests                       │ ← 50%
├─────────────────────────────────────────────────────┤
│                  Unit Tests                          │ ← 30%
├─────────────────────────────────────────────────────┤
│                 Static Analysis                      │ ← 10%
└─────────────────────────────────────────────────────┘
```

### Unit Tests (30%)

- **Template transformation logic** - Variable substitution, rule resolution
- **Conflict detection algorithm** - Duplicate rules, IP overlaps, chain conflicts
- **Template validation** - Zod schemas, variable validation
- **Helper functions** - Filtering, searching, categorization

### Integration Tests (50%)

- **Apply/rollback flow** - Complete template application lifecycle
- **IndexedDB operations** - Custom template CRUD via localforage
- **GraphQL operations** - Query/mutation integration with Apollo Client
- **State management** - XState machine transitions, Zustand store updates

### E2E Tests (10%)

- **Browse gallery → Select template → Preview → Apply → Verify rules created**
- **Create custom template → Export JSON → Import → Verify identical**
- **Apply template → Click undo → Verify rollback**
- **Filter templates by category and search**
- **Variable autocomplete from router interfaces**

### Accessibility Tests (Required for all components)

- **axe-core automated testing** - Zero violations
- **Keyboard navigation** - Tab order, Enter/Space activation, Escape to cancel
- **Screen reader announcements** - Template selection, validation errors, success messages
- **Focus indicators** - 3px ring with proper contrast
- **Touch targets** - 44x44px minimum for all interactive elements
- **Reduced motion** - Respect prefers-reduced-motion for countdown animations

## Testing Tools

| Layer         | Tool                      | Purpose                           |
| ------------- | ------------------------- | --------------------------------- |
| Unit          | Vitest                    | Fast unit testing (NOT Jest)      |
| Component     | React Testing Library     | Component behavior testing        |
| Integration   | MSW (Mock Service Worker) | API mocking                       |
| E2E           | Playwright                | Multi-browser E2E testing         |
| Accessibility | axe-core                  | WCAG AAA compliance               |
| Visual        | Chromatic/Percy           | Visual regression (if configured) |

## Mock Data Reference

### Built-in Templates

1. **Basic Security** (SIMPLE)

   - 5 rules: Allow established, drop invalid, allow ICMP, allow LAN, drop all
   - Variables: LAN_INTERFACE, LAN_SUBNET

2. **Home Network** (MODERATE)

   - 8 rules: NAT, basic protection, LAN to WAN forwarding
   - Variables: LAN_INTERFACE, WAN_INTERFACE, LAN_SUBNET

3. **Gaming Optimized** (ADVANCED)

   - 12 rules: Low-latency, UPnP, traffic prioritization
   - Variables: LAN_INTERFACE, WAN_INTERFACE, LAN_SUBNET

4. **IoT Isolation** (ADVANCED)

   - 10 rules: VLAN isolation, internet-only access
   - Variables: LAN_INTERFACE, WAN_INTERFACE, LAN_SUBNET, VLAN_ID

5. **Guest Network** (MODERATE)
   - 7 rules: Isolated guest access, no LAN access
   - Variables: LAN_INTERFACE, WAN_INTERFACE, LAN_SUBNET

### Custom Template

**VPN Server Rules** (MODERATE)

- 4 rules: OpenVPN port forwarding and firewall rules
- Variables: WAN_INTERFACE

### Variable Types

| Type      | Example         | Validation                         |
| --------- | --------------- | ---------------------------------- |
| INTERFACE | bridge1         | Must be in router's interface list |
| SUBNET    | 192.168.88.0/24 | Valid CIDR notation                |
| IP        | 192.168.88.1    | Valid IPv4 address                 |
| PORT      | 8080            | 1-65535                            |
| VLAN_ID   | 10              | 1-4094                             |
| STRING    | any-text        | Free-form string                   |

### Conflict Types

| Type              | Description            | Example                                |
| ----------------- | ---------------------- | -------------------------------------- |
| DUPLICATE_RULE    | Similar rule exists    | Allow established on input chain       |
| IP_OVERLAP        | Subnet overlaps        | 192.168.88.0/24 overlaps with existing |
| CHAIN_CONFLICT    | Chain config conflicts | Default drop rule already exists       |
| POSITION_CONFLICT | Position occupied      | Position 0 already has a rule          |

### Impact Analysis Scenarios

| Scenario | Rules | Chains                 | Time | Warnings                   |
| -------- | ----- | ---------------------- | ---- | -------------------------- |
| Safe     | 5     | input, forward         | 2s   | None                       |
| Moderate | 8     | input, forward, srcnat | 3s   | NAT added to end           |
| High     | 15    | 7 chains               | 8s   | Performance impact warning |

## Helper Functions

### Variable Resolution

```typescript
// Resolve {{VARIABLE}} syntax in strings
resolveVariables(text: string, variables: Record<string, string>): string

// Resolve all variables in template rules
resolveTemplateRules(rules: TemplateRule[], variables: Record<string, string>): TemplateRule[]
```

### Variable Validation

```typescript
// Validate provided variables against template requirements
validateTemplateVariables(
  template: FirewallTemplate,
  providedVariables: Record<string, string>
): { valid: boolean; errors: string[] }
```

### Template Filtering

```typescript
// Filter by category
filterTemplatesByCategory(templates: FirewallTemplate[], category?: TemplateCategory): FirewallTemplate[]

// Filter by complexity
filterTemplatesByComplexity(templates: FirewallTemplate[], complexity?: TemplateComplexity): FirewallTemplate[]

// Search by name/description
searchTemplates(templates: FirewallTemplate[], query: string): FirewallTemplate[]
```

### Mock Data Generation

```typescript
// Generate complete variable set for testing
generateMockVariables(): Record<string, string>
```

## Usage After Implementation

### Step 1: Wait for Implementation

The test infrastructure is ready, but requires actual implementation from:

- **backend-dev**: Resolvers, built-in templates, conflict detection (Tasks 1.4-1.9, Task 2)
- **frontend-dev**: UI components, hooks, XState machines (Tasks 3-6)

### Step 2: Uncomment Import Statements

Once implementation is complete, uncomment imports in test files:

```typescript
// BEFORE (template)
// import { TemplateGallery } from './TemplateGallery';
// import { useFirewallTemplates } from '@nasnet/api-client/queries';

// AFTER (ready to use)
import { TemplateGallery } from './TemplateGallery';
import { useFirewallTemplates } from '@nasnet/api-client/queries';
```

### Step 3: Run Tests

```bash
# Unit tests for template transformation
npx nx test ui-patterns --testPathPattern=template-transformer.test.ts

# Unit tests for conflict detection
npx nx test ui-patterns --testPathPattern=template-validator.test.ts

# Integration tests for hooks
npx nx test api-client-queries --testPathPattern=useFirewallTemplates.test.ts

# Component tests
npx nx test ui-patterns --testPathPattern=TemplateGallery.test.tsx

# E2E tests
npx nx e2e connect-e2e --spec=firewall-templates.spec.ts

# All tests
npx nx run-many -t test

# With coverage
npm run test:coverage
```

### Step 4: Run Storybook

```bash
npx nx run ui-patterns:storybook
```

Navigate to "Patterns > Firewall Templates" to view the stories.

## Test File Structure

```
libs/
├── features/firewall/src/
│   ├── utils/
│   │   ├── template-transformer.test.ts       # Unit: Variable resolution
│   │   └── template-validator.test.ts         # Unit: Conflict detection
│   ├── machines/
│   │   └── template-apply.machine.test.ts     # Unit: XState machine
│   └── hooks/
│       ├── useCustomTemplates.test.ts         # Integration: IndexedDB
│       └── useApplyTemplate.test.ts           # Integration: Apply flow
├── ui/patterns/src/
│   ├── template-gallery/
│   │   ├── use-template-gallery.test.ts       # Unit: Headless hook
│   │   ├── TemplateGallery.test.tsx           # Component: Platform detection
│   │   ├── TemplateGallery.stories.tsx        # Storybook: Visual testing
│   │   └── TemplateGallery.a11y.test.tsx      # Accessibility: axe-core
│   └── template-preview/
│       ├── use-template-preview.test.ts       # Unit: Preview logic
│       ├── TemplatePreview.test.tsx           # Component: Rendering
│       ├── TemplatePreview.stories.tsx        # Storybook: Visual testing
│       └── TemplatePreview.a11y.test.tsx      # Accessibility: axe-core
├── api-client/queries/src/firewall/
│   └── templates.test.ts                      # Integration: GraphQL hooks
└── __test-utils__/firewall-templates/
    ├── README.md                              # This file
    └── template-fixtures.ts                   # Mock data and helpers

apps/connect-e2e/src/
└── firewall-templates.spec.ts                 # E2E: Complete user flows

apps/backend/
├── internal/firewall/
│   ├── template_service_test.go               # Go unit tests
│   └── template_validator_test.go             # Go unit tests
└── templates/firewall/
    ├── basic-security.json                    # Built-in template
    ├── home-network.json
    ├── gaming-optimized.json
    ├── iot-isolation.json
    └── guest-network.json
```

## GraphQL Mock Responses

All GraphQL operations have mock responses ready:

```typescript
// Queries
mockFirewallTemplatesResponse; // Get all templates
mockFirewallTemplatesByCategory(category); // Filter by category
mockPreviewTemplateResponse; // Preview without conflicts
mockPreviewTemplateWithConflictsResponse; // Preview with conflicts
mockRouterInterfacesResponse; // Interface autocomplete

// Mutations
mockApplyTemplateResponse; // Successful application
mockApplyTemplateErrorResponse; // Partial failure
mockRollbackTemplateResponse; // Successful rollback
mockSaveTemplateResponse; // Save custom template
mockDeleteTemplateResponse; // Delete custom template
```

## Next Steps

1. ✅ Test infrastructure prepared
2. ⏳ Wait for backend implementation (backend-dev)
3. ⏳ Wait for frontend implementation (frontend-dev)
4. ⏳ Create unit tests for implemented utilities
5. ⏳ Create integration tests for hooks and flows
6. ⏳ Create component tests with RTL
7. ⏳ Create E2E tests with Playwright
8. ⏳ Run accessibility tests with axe-core
9. ⏳ Generate coverage report
10. ⏳ Verify 80% line / 75% branch coverage

## Questions or Issues

Contact the test-engineer-agent or team-lead for assistance.

## References

- [Story: NAS-7.6 Implement Firewall Templates](../../../../../../../Docs/sprint-artifacts/Epic7-Security-Firewall/NAS-7-6-implement-firewall-templates.md)
- [Testing Strategy](../../../../../../../Docs/test-design-system/test-levels-strategy.md)
- [GraphQL Schema](../../../../../../../schema/firewall.graphql)
- [CLAUDE.md Testing Standards](../../../../../../../CLAUDE.md#Testing)
