# ADR-015: Testing Trophy with CHR Docker Foundation

**Date:** 2026-01-20  
**Status:** Accepted  
**Deciders:** Technical Architect, BMad  
**Category:** Architecture / Testing / Quality  
**Source Session:** brainstorming-session-testing-strategy-2026-01-05.md  
**Related ADRs:** ADR-011 (GraphQL Architecture)

---

## Context

NasNetConnect requires comprehensive testing across multiple dimensions:

1. **Multi-Protocol:** SSH, API (binary), REST, Telnet - all with different response formats
2. **Router Hardware:** Real RouterOS behavior, firmware quirks, version differences
3. **Complex State:** GraphQL with 8-layer resource model, event sourcing, subscriptions
4. **Safety-Critical:** Network infrastructure - errors can break connectivity
5. **Resource Constraints:** <10MB image, <200MB RAM must be validated

**Testing Challenges:**
- **Physical Hardware:** Expensive ($50-500/device), unreliable (hardware failures, state drift), slow to reset
- **Version Matrix:** Need to test RouterOS 7.0, 7.1, 7.12+ but can't afford multiple devices
- **CI Reliability:** Physical hardware in CI is unreliable (network issues, power failures)
- **Developer Access:** Not every developer has physical MikroTik hardware

**Traditional Testing Pyramid Problems:**
- Unit tests don't catch integration issues (mocks diverge from reality)
- E2E tests too slow for rapid feedback
- Heavy reliance on manual testing

---

## Decision

Adopt a **Testing Trophy Architecture** with **CHR Docker as the reliable foundation** for automated testing:

### Testing Trophy Shape

```
        ┌─────────────────┐
        │   E2E Tests     │  ← Few, focused on critical paths
        │  (Playwright +  │
        │   CHR Docker)   │
        ├─────────────────┤
        │                 │
        │  Integration    │  ← PRIMARY LAYER (most tests here)
        │     Tests       │
        │  (RTL + MSW +   │
        │ Testify+Ginkgo) │
        │                 │
        ├─────────────────┤
        │   Unit Tests    │  ← Supporting layer (logic, utils)
        │ (Vitest + Go)   │
        ├─────────────────┤
        │ Static Analysis │  ← Foundation (TypeScript, ESLint)
        └─────────────────┘
```

**Emphasis:** More integration tests than unit tests (opposite of traditional pyramid)

### Three-Tier Router Testing

```
┌─────────────────────────────────────────────────────────────┐
│              ROUTER TESTING TIERS                            │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Tier 1: MOCKS (Fast - Development)                         │
│  ┌─────────────────────────────────────────────────────────┐│
│  │  • MSW for GraphQL (frontend)                           ││
│  │  • Testify mocks for Go interfaces (backend)           ││
│  │  • Recorded responses for protocol testing             ││
│  │  • Speed: Milliseconds                                  ││
│  │  • Use: Unit tests, component tests                    ││
│  └─────────────────────────────────────────────────────────┘│
│                                                              │
│  Tier 2: CHR DOCKER (Reliable - CI)                         │
│  ┌─────────────────────────────────────────────────────────┐│
│  │  • RouterOS CHR in Docker container                     ││
│  │  • Real RouterOS behavior (not mocked)                  ││
│  │  • Predictable starting state (fresh each run)         ││
│  │  • Multi-version matrix (7.0, 7.1, 7.12+)              ││
│  │  • Speed: Seconds                                       ││
│  │  • Use: E2E tests, integration tests, PR validation    ││
│  └─────────────────────────────────────────────────────────┘│
│                                                              │
│  Tier 3: PHYSICAL HARDWARE (Validation - Release)           │
│  ┌─────────────────────────────────────────────────────────┐│
│  │  • Real MikroTik devices (hAP, RB4011, CCR)            ││
│  │  • Hardware quirks, real-world conditions              ││
│  │  • Different RouterOS versions in wild                  ││
│  │  • Speed: Minutes                                       ││
│  │  • Use: Manual smoke tests before major releases       ││
│  └─────────────────────────────────────────────────────────┘│
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## Rationale

### Why Testing Trophy Over Pyramid?

**Traditional Pyramid (Rejected):**
- 70% unit tests - Fast but low confidence (mocks diverge from reality)
- 20% integration tests - Some confidence
- 10% E2E tests - High confidence but slow and flaky

**Testing Trophy (Adopted):**
- 20% unit tests - Pure logic, utilities, calculations
- 60% integration tests - Component + API integration, high confidence
- 15% E2E tests - Critical user paths only
- 5% static analysis - TypeScript, ESLint, type checking

**Why Trophy Better for NasNetConnect:**
- **GraphQL Integration:** Apollo Client + real GraphQL queries catch issues mocks miss
- **Protocol Complexity:** Multi-protocol adapter testing needs real responses
- **State Complexity:** 8-layer resource model needs integration-level testing
- **Confidence:** Integration tests provide better confidence per test written

### Why CHR Docker as Foundation?

**Benefits Over Physical Hardware:**

| Factor | CHR Docker | Physical Hardware | Winner |
|--------|------------|-------------------|--------|
| **CI Reliability** | Predictable, fresh state per run | Hardware failures, state drift | CHR |
| **Reset Speed** | Seconds (delete container) | Minutes (manual commands) | CHR |
| **Cost** | Free (with license) | $50-500 per device | CHR |
| **Multi-Version Testing** | Easy matrix testing | Need multiple devices | CHR |
| **Developer Access** | Every developer can run | Not everyone has hardware | CHR |
| **Parallel Execution** | Unlimited parallel tests | Limited by hardware count | CHR |

**When Physical Hardware Still Needed:**
- Release validation (sanity check on real hardware)
- Hardware-specific quirks (PoE, switch chips)
- Performance validation under load
- Customer environment simulation

**Verdict:** CHR Docker for 95% of tests, physical for final 5% validation

### Why MSW + Mirage?

**MSW Strengths:**
- Service Worker approach (no code changes)
- GraphQL support (matches our architecture)
- Reusable across Vitest + Playwright + Storybook
- Schema-first (generate from GraphQL schema)

**Mirage Strengths:**
- Stateful mocking (database-like)
- Relationship handling (dependencies, cascades)
- Complex scenarios (multi-step workflows)

**Decision:** Use both - MSW for simple GraphQL mocking, Mirage for complex stateful scenarios

---

## Implementation

### CHR Docker Setup

```yaml
# docker-compose.test.yml
services:
  chr-test:
    image: mikrotik/chr:7.12
    container_name: test-router
    ports:
      - "8728:8728"  # API
      - "8729:8729"  # API-SSL
      - "22:22"      # SSH
      - "8080:80"    # HTTP
      - "8443:443"   # HTTPS
    volumes:
      - ./fixtures/chr-init.rsc:/init.rsc:ro
    environment:
      - ROUTER_PASSWORD=admin
    networks:
      - test-network
  
  app:
    build: .
    depends_on:
      - chr-test
    environment:
      - ROUTER_HOST=chr-test
      - ROUTER_PORT=8728
      - ROUTER_USER=admin
      - ROUTER_PASS=admin
    networks:
      - test-network

networks:
  test-network:
    driver: bridge
```

### E2E Test Example

```typescript
// e2e/firewall-rules.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Firewall Rule Management', () => {
  test.beforeEach(async ({ page }) => {
    // CHR Docker provides clean state
    await resetCHR();  // Script resets router to known state
    await page.goto('http://localhost:3000');
    await login(page, 'admin', 'admin');
  });
  
  test('should create firewall rule and apply to router', async ({ page }) => {
    // Navigate to firewall
    await page.click('[data-testid="nav-firewall"]');
    
    // Create rule via UI
    await page.click('[data-testid="add-rule"]');
    await page.fill('[name="chain"]', 'input');
    await page.fill('[name="action"]', 'accept');
    await page.fill('[name="protocol"]', 'tcp');
    await page.fill('[name="dstPort"]', '443');
    
    // Apply configuration
    await page.click('[data-testid="apply"]');
    
    // Wait for confirmation
    await expect(page.locator('[data-testid="success-toast"]')).toBeVisible();
    
    // Verify rule exists on actual router (via GraphQL)
    const rules = await queryFirewallRules(page);
    expect(rules).toContainEqual(
      expect.objectContaining({
        chain: 'input',
        action: 'accept',
        protocol: 'tcp',
        dstPort: '443',
      })
    );
    
    // Verify rule exists on CHR via SSH (double-check)
    const sshResult = await execOnCHR('ip firewall filter print');
    expect(sshResult).toContain('protocol=tcp dst-port=443 action=accept');
  });
});
```

### Integration Test Example

```typescript
// Router adapter integration test
describe('MikroTik Adapter - Protocol Fallback', () => {
  let adapter: MikroTikAdapter;
  let chr: CHRDocker;
  
  beforeAll(async () => {
    // Start CHR container
    chr = await CHRDocker.start({
      version: '7.12',
      initConfig: './fixtures/chr-init.rsc',
    });
  });
  
  afterAll(async () => {
    await chr.stop();
  });
  
  it('should fallback from REST → SSH when REST unavailable', async () => {
    adapter = new MikroTikAdapter({
      host: chr.host,
      port: chr.port,
      username: 'admin',
      password: 'admin',
    });
    
    // Disable REST API on CHR
    await chr.exec('ip service disable api-ssl');
    await chr.exec('ip service disable www-ssl');
    
    // Adapter should fallback to SSH
    await adapter.connect();
    
    expect(adapter.currentProtocol).toBe('SSH');
    
    // Execute command via SSH
    const result = await adapter.getSystemInfo();
    
    expect(result).toMatchObject({
      platform: 'mikrotik',
      version: expect.stringMatching(/^7\./),
    });
  });
});
```

---

## Testing Stack

### Frontend

| Tool | Purpose | Usage |
|------|---------|-------|
| **Vitest** | Unit testing | Pure functions, hooks, utilities (4x faster than Jest) |
| **React Testing Library** | Component testing | User-centric, integration-focused |
| **Playwright** | E2E testing | Critical paths with CHR Docker |
| **MSW** | API mocking | GraphQL queries/mutations (schema-driven) |
| **Mirage** | Stateful mocking | Complex scenarios with relationships |
| **Storybook** | Component development | Visual development, interaction testing |
| **Chromatic** | Visual regression | Catch visual bugs in CI |
| **axe-core** | Accessibility | WCAG AAA compliance (runtime checks) |
| **Pa11y** | Accessibility | WCAG AAA compliance (CI pipeline) |

### Backend (Go)

| Tool | Purpose | Usage |
|------|---------|-------|
| **Testify** | Assertions & Mocking | Rich assertions, mock generation |
| **Ginkgo** | BDD Framework | Expressive test structure (Describe/Context/It) |
| **go cover** | Coverage | Line, branch, statement tracking |
| **go-mutesting** | Mutation testing | Validate test quality (baseline 60%) |

### Performance & Security

| Tool | Purpose | Frequency |
|------|---------|-----------|
| **k6** | Load testing | Weekly, self-hosted |
| **Artillery** | API performance | Per-release |
| **Lighthouse** | Frontend performance | Every PR |
| **OWASP ZAP** | Security scanning | Weekly + pre-release |
| **Snyk** | Dependency scanning | Every PR |

---

## Consequences

### Positive

- **CI Reliability:** CHR Docker provides predictable test environment
- **Fast Feedback:** Integration tests run in seconds vs minutes with physical hardware
- **Coverage:** Testing Trophy catches more real issues than pyramid
- **Developer Productivity:** Every developer can run full E2E tests locally
- **Multi-Version Testing:** Easy to test against RouterOS 7.0, 7.1, 7.12+ in parallel
- **Cost Effective:** No need for multiple physical devices
- **Confidence:** Real RouterOS behavior, not mocked

### Negative

- **CHR Licensing:** Need to verify licensing for CI use (typically free for testing)
- **Potential Divergence:** CHR virtual vs physical hardware might have differences
- **Docker Dependency:** Requires Docker available in CI
- **Learning Curve:** Team must learn CHR Docker management

### Mitigations

- **Physical Validation:** Manual smoke tests on physical hardware before major releases
- **Nightly Matrix:** Test against multiple RouterOS versions nightly to catch divergence
- **Documentation:** CHR Docker setup guide for contributors
- **Fallback:** Can fall back to mocks if CHR unavailable (with warnings)

---

## Testing Strategy

### Coverage Targets

| Metric | Target | Enforcement |
|--------|--------|-------------|
| **Line Coverage** | 80% | Warning mode (trend tracked) |
| **Branch Coverage** | 75% | Warning mode |
| **Mutation Score** | 60% baseline | Warning → Gate (future) |
| **Accessibility** | WCAG AAA | Blocking (axe-core + Pa11y) |
| **Security (High)** | 0 issues | Blocking |
| **E2E (Critical Paths)** | 100% | Blocking |

### Quality Gates

```yaml
# PR Quality Gates
gates:
  - name: Unit Tests
    command: nx affected --target=test
    blocking: true
  
  - name: Integration Tests
    command: nx affected --target=test:integration
    blocking: true
  
  - name: E2E Tests (CHR Docker)
    command: nx affected --target=e2e
    blocking: false  # Warning only (can be slow)
  
  - name: Accessibility
    command: nx affected --target=test:a11y
    blocking: true
  
  - name: Security Scan
    command: snyk test --severity-threshold=high
    blocking: true
```

### Flaky Test Handling

**Three-Strategy Hybrid:**

1. **Retry:** E2E tests retry up to 3 times (network transient failures)
2. **Quarantine:** Tests failing >3 times in 7 days moved to quarantine (run but don't block CI)
3. **Fail Fast:** Critical path tests fail immediately (no retry)

---

## Alternatives Considered

### Traditional Testing Pyramid (Rejected)

**Approach:** 70% unit, 20% integration, 10% E2E

**Why rejected:**
- Unit tests with mocks don't catch GraphQL integration issues
- Mocks diverge from real API responses over time
- Low confidence for complex state management
- Testing Trophy better for modern GraphQL apps

### Physical Hardware Only (Rejected)

**Approach:** All E2E tests on physical MikroTik devices

**Why rejected:**
- Too expensive (need multiple devices for parallel testing)
- Unreliable in CI (hardware failures, network issues)
- Slow to reset between tests
- Not every developer has hardware

### Mock-Only Testing (Rejected)

**Approach:** Mock all router communication, no real RouterOS testing

**Why rejected:**
- Low confidence (mocks don't catch real protocol issues)
- False positives (tests pass but production fails)
- Missing protocol quirks (SSH encoding, API response formats)
- Can't validate multi-protocol fallback chain

### Cypress Instead of Playwright (Rejected)

**Why rejected:**
- No WebKit/Safari support (Playwright has Safari)
- Limited multi-tab/multi-domain support
- JavaScript-only (Playwright supports multiple languages)
- Playwright has better auto-wait (fewer flaky tests)

---

## Performance Metrics

**After Implementation:**
- Local test run (smoke): <5 minutes
- CI test run (full suite): <15 minutes
- E2E tests with CHR: ~30 seconds per test
- CHR Docker startup: ~10 seconds
- Test parallelization: 4x concurrent

---

## Review Date

Review after 3 months of usage:
- Assess CHR Docker reliability in CI
- Check if physical hardware validation frequency adequate
- Evaluate if Testing Trophy ratio optimal (currently 20/60/15/5)
- Measure actual E2E test flakiness rate
- Consider if mutation testing should become blocking gate

---

## References

- Brainstorming Session: `Docs/brainstorming-sessions/brainstorming-session-testing-strategy-2026-01-05.md`
- Research Report: `Docs/researchs/research-nasnetconnect-comprehensive-2026-01-10.md`
- Testing Guide: [To be created in implementation]

---
