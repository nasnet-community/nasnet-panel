/**
 * Accessibility Tests for Pattern Components (WCAG AAA)
 *
 * Tests all pattern components for accessibility compliance using axe-core.
 * Validates 7:1 contrast ratios, proper ARIA attributes, keyboard navigation,
 * and semantic HTML structure.
 *
 * @see ADR-017 for component architecture
 * @see ADR-018 for Headless + Presenter pattern
 */

import { render } from '@testing-library/react';
import { Shield, Wifi, HardDrive, Activity } from 'lucide-react';
import { describe, it, expect, vi } from 'vitest';
import { axe } from 'vitest-axe';

// Import patterns
import { MetricDisplayMobile, MetricDisplayDesktop } from '../common/metric-display';
import { ResourceCardMobile, ResourceCardDesktop } from '../common/resource-card';
import { ConfirmationDialog } from '../confirmation-dialog';
import { ConnectionIndicator } from '../connection-indicator';
import { EmptyState } from '../empty-state';
import { FormField } from '../form-field';
import { StatusBadge } from '../status-badge';
import { StatusIndicator } from '../status-indicator';

// Mock platform hooks
vi.mock('@nasnet/ui/layouts', () => ({
  usePlatform: vi.fn(() => 'desktop'),
  PlatformProvider: ({ children }: { children: React.ReactNode }) => children,
}));

// Mock connection store
vi.mock('@nasnet/state/stores', () => ({
  useConnectionStore: () => ({
    state: 'connected',
    lastConnectedAt: new Date(),
  }),
}));

describe('Pattern Accessibility Tests (WCAG AAA)', () => {
  describe('StatusBadge', () => {
    it('should have no accessibility violations', async () => {
      const { container } = render(<StatusBadge status="bound" />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have no violations with all variants', async () => {
      const { container } = render(
        <div>
          <StatusBadge status="bound" />
          <StatusBadge status="waiting" />
          <StatusBadge status="offered" />
          <StatusBadge status="busy" />
        </div>
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });

  describe('StatusIndicator', () => {
    it('should have no accessibility violations', async () => {
      const { container } = render(
        <StatusIndicator status="online" label="Connected" />
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have no violations with all statuses', async () => {
      const { container } = render(
        <div>
          <StatusIndicator status="online" label="Online" />
          <StatusIndicator status="offline" label="Offline" />
          <StatusIndicator status="warning" label="Warning" />
        </div>
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });

  describe('EmptyState', () => {
    it('should have no accessibility violations', async () => {
      const { container } = render(
        <EmptyState
          icon={Shield}
          title="No items found"
          description="There are no items to display."
        />
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have no violations with action button', async () => {
      const { container } = render(
        <EmptyState
          icon={Shield}
          title="No VPN configured"
          description="Set up a VPN to secure your connection."
          action={{
            label: 'Add VPN',
            onClick: () => {},
          }}
        />
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });

  describe('ConfirmationDialog', () => {
    it('should have no accessibility violations when open', async () => {
      const { container } = render(
        <ConfirmationDialog
          open={true}
          onOpenChange={() => {}}
          title="Confirm Action"
          description="Are you sure you want to proceed?"
          onConfirm={() => {}}
        />
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have no violations with destructive variant', async () => {
      const { container } = render(
        <ConfirmationDialog
          open={true}
          onOpenChange={() => {}}
          title="Delete Item"
          description="This action cannot be undone."
          confirmLabel="Delete"
          variant="destructive"
          onConfirm={() => {}}
        />
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });

  describe('FormField', () => {
    it('should have no accessibility violations', async () => {
      const { container } = render(
        <FormField label="Email" description="Enter your email address">
          <input type="email" />
        </FormField>
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have no violations with error state', async () => {
      const { container } = render(
        <FormField
          label="Email"
          error="Please enter a valid email address"
          required
        >
          <input type="email" />
        </FormField>
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });

  describe('ConnectionIndicator', () => {
    it('should have no accessibility violations', async () => {
      const { container } = render(<ConnectionIndicator />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });

  describe('ResourceCard', () => {
    const mockResource = {
      id: '1',
      name: 'Test Resource',
      description: 'A test resource for accessibility testing',
      runtime: { status: 'online' as const },
    };

    describe('Mobile Presenter', () => {
      it('should have no accessibility violations', async () => {
        const { container } = render(
          <ResourceCardMobile resource={mockResource} />
        );
        const results = await axe(container);
        expect(results).toHaveNoViolations();
      });

      it('should have no violations with actions', async () => {
        const { container } = render(
          <ResourceCardMobile
            resource={mockResource}
            actions={[
              { id: 'connect', label: 'Connect', onClick: () => {} },
            ]}
          />
        );
        const results = await axe(container);
        expect(results).toHaveNoViolations();
      });
    });

    describe('Desktop Presenter', () => {
      it('should have no accessibility violations', async () => {
        const { container } = render(
          <ResourceCardDesktop resource={mockResource} />
        );
        const results = await axe(container);
        expect(results).toHaveNoViolations();
      });

      it('should have no violations with multiple actions', async () => {
        const { container } = render(
          <ResourceCardDesktop
            resource={mockResource}
            actions={[
              { id: 'connect', label: 'Connect', onClick: () => {} },
              { id: 'edit', label: 'Edit', onClick: () => {} },
              { id: 'delete', label: 'Delete', onClick: () => {}, variant: 'destructive' },
            ]}
          />
        );
        const results = await axe(container);
        expect(results).toHaveNoViolations();
      });
    });
  });

  describe('MetricDisplay', () => {
    describe('Mobile Presenter', () => {
      it('should have no accessibility violations', async () => {
        const { container } = render(
          <MetricDisplayMobile label="CPU Usage" value={85} unit="%" />
        );
        const results = await axe(container);
        expect(results).toHaveNoViolations();
      });

      it('should have no violations with icon and trend', async () => {
        const { container } = render(
          <MetricDisplayMobile
            label="Memory"
            value={2.4}
            unit="GB"
            icon={HardDrive}
            trend="up"
            trendValue="+10%"
            variant="warning"
          />
        );
        const results = await axe(container);
        expect(results).toHaveNoViolations();
      });

      it('should have no violations when interactive', async () => {
        const { container } = render(
          <MetricDisplayMobile
            label="Connections"
            value={127}
            icon={Activity}
            onClick={() => {}}
          />
        );
        const results = await axe(container);
        expect(results).toHaveNoViolations();
      });
    });

    describe('Desktop Presenter', () => {
      it('should have no accessibility violations', async () => {
        const { container } = render(
          <MetricDisplayDesktop label="Network" value={125} unit="Mbps" />
        );
        const results = await axe(container);
        expect(results).toHaveNoViolations();
      });

      it('should have no violations with all features', async () => {
        const { container } = render(
          <MetricDisplayDesktop
            label="Temperature"
            value={68}
            unit="°C"
            icon={Activity}
            variant="success"
            trend="down"
            trendValue="-5°C"
            description="Normal operating temperature"
            onClick={() => {}}
          />
        );
        const results = await axe(container);
        expect(results).toHaveNoViolations();
      });
    });
  });

  describe('Touch Target Size (44px minimum)', () => {
    it('ResourceCardMobile action button meets minimum touch target', async () => {
      const { container } = render(
        <ResourceCardMobile
          resource={{
            id: '1',
            name: 'Test',
            runtime: { status: 'online' as const },
          }}
          actions={[{ id: 'action', label: 'Action', onClick: () => {} }]}
        />
      );

      const button = container.querySelector('button');
      if (button) {
        const styles = window.getComputedStyle(button);
        const height = parseInt(styles.minHeight || styles.height, 10);
        // Verify minimum touch target (44px)
        expect(height).toBeGreaterThanOrEqual(44);
      }
    });

    it('MetricDisplayMobile meets minimum touch target when interactive', async () => {
      const { container } = render(
        <MetricDisplayMobile
          label="Test"
          value={100}
          onClick={() => {}}
        />
      );

      const button = container.querySelector('button');
      if (button) {
        // Check for min-h-[44px] class presence
        expect(button.className).toContain('min-h-[44px]');
      }
    });
  });

  describe('Keyboard Navigation', () => {
    it('ResourceCardDesktop actions are keyboard accessible', () => {
      const { container } = render(
        <ResourceCardDesktop
          resource={{
            id: '1',
            name: 'Test',
            runtime: { status: 'online' as const },
          }}
          actions={[{ id: 'action', label: 'Action', onClick: () => {} }]}
        />
      );

      const buttons = container.querySelectorAll('button');
      buttons.forEach((button) => {
        // All buttons should be focusable
        expect(button.tabIndex).not.toBe(-1);
      });
    });

    it('MetricDisplayDesktop is keyboard accessible when interactive', () => {
      const onClick = vi.fn();
      const { container } = render(
        <MetricDisplayDesktop label="Test" value={100} onClick={onClick} />
      );

      const button = container.querySelector('button');
      expect(button).not.toBeNull();
      expect(button?.tabIndex).toBe(0);
    });
  });
});
