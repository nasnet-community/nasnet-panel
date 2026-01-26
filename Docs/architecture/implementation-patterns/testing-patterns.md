# Testing Patterns

## Unit Testing with Mocks

```typescript
// Mock adapter for testing
class MockMikroTikAdapter implements Adapter {
  private responses: Map<string, unknown> = new Map();
  private calls: Array<{ method: string; args: unknown[] }> = [];

  setResponse(command: string, response: unknown) {
    this.responses.set(command, response);
  }

  async execute(cmd: Command): Promise<Result> {
    this.calls.push({ method: 'execute', args: [cmd] });
    const response = this.responses.get(cmd.text);
    if (!response) {
      throw new Error(`No mock response for: ${cmd.text}`);
    }
    return response as Result;
  }

  assertCalled(method: string, times?: number) {
    const count = this.calls.filter(c => c.method === method).length;
    if (times !== undefined && count !== times) {
      throw new Error(`Expected ${method} to be called ${times} times, but was called ${count} times`);
    }
  }
}

// Test example
describe('InterfaceService', () => {
  let adapter: MockMikroTikAdapter;
  let service: InterfaceService;

  beforeEach(() => {
    adapter = new MockMikroTikAdapter();
    service = new InterfaceService(adapter);
  });

  it('should fetch interfaces', async () => {
    adapter.setResponse('/interface/print', [
      { name: 'ether1', type: 'ethernet', running: true },
      { name: 'ether2', type: 'ethernet', running: false },
    ]);

    const interfaces = await service.list();

    expect(interfaces).toHaveLength(2);
    expect(interfaces[0].name).toBe('ether1');
    adapter.assertCalled('execute', 1);
  });
});
```

## Integration Testing

```go
// Integration test with real router
func TestRouterIntegration(t *testing.T) {
    if testing.Short() {
        t.Skip("Skipping integration test")
    }

    // Use test router from environment
    host := os.Getenv("TEST_ROUTER_HOST")
    if host == "" {
        t.Skip("TEST_ROUTER_HOST not set")
    }

    client, err := NewClient(ClientConfig{
        Host:     host,
        Username: os.Getenv("TEST_ROUTER_USER"),
        Password: os.Getenv("TEST_ROUTER_PASS"),
    })
    require.NoError(t, err)
    defer client.Close()

    t.Run("list interfaces", func(t *testing.T) {
        interfaces, err := client.Interfaces().List(context.Background())
        require.NoError(t, err)
        assert.NotEmpty(t, interfaces)
    })

    t.Run("crud operations", func(t *testing.T) {
        // Create
        iface, err := client.Interfaces().Create(context.Background(), InterfaceInput{
            Name: "test-vlan-100",
            Type: "vlan",
            VLAN: &VLANConfig{ID: 100, Interface: "ether1"},
        })
        require.NoError(t, err)
        assert.Equal(t, "test-vlan-100", iface.Name)

        // Update
        iface, err = client.Interfaces().Update(context.Background(), iface.ID, InterfaceUpdate{
            Comment: ptr("Test interface"),
        })
        require.NoError(t, err)
        assert.Equal(t, "Test interface", *iface.Comment)

        // Delete
        err = client.Interfaces().Delete(context.Background(), iface.ID)
        require.NoError(t, err)
    })
}
```

## E2E Testing

```typescript
// Playwright E2E test
import { test, expect } from '@playwright/test';

test.describe('Device Management', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/devices');
  });

  test('should add and configure a device', async ({ page }) => {
    // Add device
    await page.click('[data-testid="add-device-button"]');
    await page.fill('[name="host"]', '192.168.1.1');
    await page.fill('[name="username"]', 'admin');
    await page.fill('[name="password"]', 'test123');
    await page.click('[data-testid="connect-button"]');

    // Wait for device detection
    await expect(page.locator('[data-testid="device-platform"]'))
      .toHaveText(/MikroTik|OpenWRT|VyOS/);

    // Verify device appears in list
    await page.click('[data-testid="save-device-button"]');
    await expect(page.locator('[data-testid="device-list"]'))
      .toContainText('192.168.1.1');
  });

  test('should show device interfaces', async ({ page }) => {
    // Click on existing device
    await page.click('[data-testid="device-192.168.1.1"]');

    // Navigate to interfaces
    await page.click('[data-testid="interfaces-tab"]');

    // Verify interface list loads
    await expect(page.locator('[data-testid="interface-list"]'))
      .toBeVisible();
    await expect(page.locator('[data-testid="interface-item"]'))
      .toHaveCount.greaterThan(0);
  });
});
```

---
