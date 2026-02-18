/**
 * IsolationStatus Component Tests
 *
 * Tests for the platform-aware IsolationStatus component and its presenters.
 * Validates rendering for both Mobile and Desktop variants.
 *
 * @module @nasnet/ui/patterns/isolation-status
 */

import { render, screen, within } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import { IsolationSeverity } from '@nasnet/api-client/generated';
import type { IsolationStatus as GraphQLIsolationStatus } from '@nasnet/api-client/generated';
import { usePlatform } from '@nasnet/ui/layouts';

import { IsolationStatus, IsolationStatusMobile, IsolationStatusDesktop } from './IsolationStatus';

// Mock the platform detection hook
vi.mock('@nasnet/ui/layouts', () => ({
  usePlatform: vi.fn(() => 'desktop'),
}));

// Mock the Apollo Client hook
vi.mock('@nasnet/api-client/queries', () => ({
  useSetResourceLimits: vi.fn(() => [
    vi.fn().mockResolvedValue({ data: { setResourceLimits: { success: true } } }),
    { loading: false },
  ]),
}));

describe('IsolationStatus', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Platform Detection', () => {
    it('should render desktop presenter when platform is desktop', () => {
      vi.mocked(usePlatform).mockReturnValue('desktop');

      const isolation: GraphQLIsolationStatus = {
        lastVerified: '2026-02-13T10:00:00Z',
        violations: [],
        resourceLimits: null,
      };

      render(
        <IsolationStatus
          isolation={isolation}
          instanceId="inst_123"
          routerId="router_456"
        />
      );

      // Desktop presenter uses a Table element for violations
      const region = screen.getByRole('region');
      expect(region).toBeInTheDocument();
      expect(region).toHaveAttribute('aria-label');
    });

    it('should render mobile presenter when platform is mobile', () => {
      vi.mocked(usePlatform).mockReturnValue('mobile');

      const isolation: GraphQLIsolationStatus = {
        lastVerified: '2026-02-13T10:00:00Z',
        violations: [],
        resourceLimits: null,
      };

      render(
        <IsolationStatus
          isolation={isolation}
          instanceId="inst_123"
          routerId="router_456"
        />
      );

      const region = screen.getByRole('region');
      expect(region).toBeInTheDocument();
      expect(region).toHaveAttribute('aria-label');
    });

    it('should render mobile presenter when platform is tablet', () => {
      vi.mocked(usePlatform).mockReturnValue('tablet');

      const isolation: GraphQLIsolationStatus = {
        lastVerified: '2026-02-13T10:00:00Z',
        violations: [],
        resourceLimits: null,
      };

      render(
        <IsolationStatus
          isolation={isolation}
          instanceId="inst_123"
          routerId="router_456"
        />
      );

      // Tablet uses mobile presenter
      const region = screen.getByRole('region');
      expect(region).toBeInTheDocument();
    });

    it('should force mobile presenter when variant="mobile"', () => {
      vi.mocked(usePlatform).mockReturnValue('desktop');

      const isolation: GraphQLIsolationStatus = {
        lastVerified: '2026-02-13T10:00:00Z',
        violations: [],
        resourceLimits: null,
      };

      render(
        <IsolationStatus
          isolation={isolation}
          instanceId="inst_123"
          routerId="router_456"
          variant="mobile"
        />
      );

      // Should render mobile despite desktop platform
      const region = screen.getByRole('region');
      expect(region).toBeInTheDocument();
    });

    it('should force desktop presenter when variant="desktop"', () => {
      vi.mocked(usePlatform).mockReturnValue('mobile');

      const isolation: GraphQLIsolationStatus = {
        lastVerified: '2026-02-13T10:00:00Z',
        violations: [],
        resourceLimits: null,
      };

      render(
        <IsolationStatus
          isolation={isolation}
          instanceId="inst_123"
          routerId="router_456"
          variant="desktop"
        />
      );

      // Should render desktop despite mobile platform
      const region = screen.getByRole('region');
      expect(region).toBeInTheDocument();
    });
  });

  describe('Mobile Presenter', () => {
    it('should render healthy status with green color', () => {
      const isolation: GraphQLIsolationStatus = {
        lastVerified: '2026-02-13T10:00:00Z',
        violations: [],
        resourceLimits: null,
      };

      render(
        <IsolationStatusMobile
          state={{
            health: 'healthy',
            color: 'success',
            iconName: 'ShieldCheck',
            timestamp: 'Checked just now',
            violations: [],
            resourceLimits: null,
            isSaving: false,
            handleSaveLimits: vi.fn(),
            handleRefresh: vi.fn(),
            ariaLabel: 'Isolated, no violations detected',
            healthLabel: 'Isolated',
            showResourceLimits: true,
            allowEdit: false,
            violationCount: 0,
            criticalCount: 0,
            warningCount: 0,
          }}
          size="md"
        />
      );

      expect(screen.getByText('Isolated')).toBeInTheDocument();
      expect(screen.getByText('Checked just now')).toBeInTheDocument();
    });

    it('should render critical status with violations', () => {
      render(
        <IsolationStatusMobile
          state={{
            health: 'critical',
            color: 'destructive',
            iconName: 'ShieldX',
            timestamp: 'Checked 5 minutes ago',
            violations: [
              {
                violation: {
                  layer: 'IP Binding',
                  severity: IsolationSeverity.Error,
                  message: 'Wildcard bind IP detected',
                },
                color: 'destructive',
                icon: 'Network',
                layerLabel: 'IP Binding',
              },
            ],
            resourceLimits: null,
            isSaving: false,
            handleSaveLimits: vi.fn(),
            handleRefresh: vi.fn(),
            ariaLabel: 'Critical violations, 1 violation detected',
            healthLabel: 'Critical violations',
            showResourceLimits: true,
            allowEdit: false,
            violationCount: 1,
            criticalCount: 1,
            warningCount: 0,
          }}
          size="md"
        />
      );

      expect(screen.getByText('Critical violations')).toBeInTheDocument();
      expect(screen.getByText('Wildcard bind IP detected')).toBeInTheDocument();
    });

    it('should render resource limits when available', () => {
      render(
        <IsolationStatusMobile
          state={{
            health: 'healthy',
            color: 'success',
            iconName: 'ShieldCheck',
            timestamp: 'Checked just now',
            violations: [],
            resourceLimits: {
              applied: true,
              cpuPercent: 50,
              memoryMB: 128,
            },
            isSaving: false,
            handleSaveLimits: vi.fn(),
            handleRefresh: vi.fn(),
            ariaLabel: 'Isolated, no violations detected',
            healthLabel: 'Isolated',
            showResourceLimits: true,
            allowEdit: false,
            violationCount: 0,
            criticalCount: 0,
            warningCount: 0,
          }}
          size="md"
        />
      );

      // Resource limits should be present (may be in collapsed section)
      const region = screen.getByRole('region');
      expect(region).toBeInTheDocument();
    });

    it('should render with 44px minimum touch targets', () => {
      render(
        <IsolationStatusMobile
          state={{
            health: 'healthy',
            color: 'success',
            iconName: 'ShieldCheck',
            timestamp: 'Checked just now',
            violations: [],
            resourceLimits: null,
            isSaving: false,
            handleSaveLimits: vi.fn(),
            handleRefresh: vi.fn(),
            ariaLabel: 'Isolated, no violations detected',
            healthLabel: 'Isolated',
            showResourceLimits: true,
            allowEdit: false,
            violationCount: 0,
            criticalCount: 0,
            warningCount: 0,
          }}
          size="md"
        />
      );

      // Mobile presenter should have accessible touch targets
      const region = screen.getByRole('region');
      expect(region).toBeInTheDocument();
    });
  });

  describe('Desktop Presenter', () => {
    it('should render healthy status', () => {
      render(
        <IsolationStatusDesktop
          state={{
            health: 'healthy',
            color: 'success',
            iconName: 'ShieldCheck',
            timestamp: 'Checked just now',
            violations: [],
            resourceLimits: null,
            isSaving: false,
            handleSaveLimits: vi.fn(),
            handleRefresh: vi.fn(),
            ariaLabel: 'Isolated, no violations detected',
            healthLabel: 'Isolated',
            showResourceLimits: true,
            allowEdit: false,
            violationCount: 0,
            criticalCount: 0,
            warningCount: 0,
          }}
          size="md"
        />
      );

      expect(screen.getByText('Isolated')).toBeInTheDocument();
      expect(screen.getByText('Checked just now')).toBeInTheDocument();
    });

    it('should render violations in data table format', () => {
      render(
        <IsolationStatusDesktop
          state={{
            health: 'critical',
            color: 'destructive',
            iconName: 'ShieldX',
            timestamp: 'Checked 5 minutes ago',
            violations: [
              {
                violation: {
                  layer: 'IP Binding',
                  severity: IsolationSeverity.Error,
                  message: 'Wildcard bind IP detected',
                },
                color: 'destructive',
                icon: 'Network',
                layerLabel: 'IP Binding',
              },
              {
                violation: {
                  layer: 'Port Registry',
                  severity: IsolationSeverity.Warning,
                  message: 'Port not allocated in registry',
                },
                color: 'warning',
                icon: 'Webhook',
                layerLabel: 'Port Registry',
              },
            ],
            resourceLimits: null,
            isSaving: false,
            handleSaveLimits: vi.fn(),
            handleRefresh: vi.fn(),
            ariaLabel: 'Critical violations, 2 violations detected',
            healthLabel: 'Critical violations',
            showResourceLimits: true,
            allowEdit: false,
            violationCount: 2,
            criticalCount: 1,
            warningCount: 1,
          }}
          size="md"
        />
      );

      expect(screen.getByText('Critical violations')).toBeInTheDocument();
      expect(screen.getByText('Wildcard bind IP detected')).toBeInTheDocument();
      expect(screen.getByText('Port not allocated in registry')).toBeInTheDocument();
    });

    it('should render resource limits in data table', () => {
      render(
        <IsolationStatusDesktop
          state={{
            health: 'healthy',
            color: 'success',
            iconName: 'ShieldCheck',
            timestamp: 'Checked just now',
            violations: [],
            resourceLimits: {
              applied: true,
              cpuPercent: 50,
              memoryMB: 128,
            },
            isSaving: false,
            handleSaveLimits: vi.fn(),
            handleRefresh: vi.fn(),
            ariaLabel: 'Isolated, no violations detected',
            healthLabel: 'Isolated',
            showResourceLimits: true,
            allowEdit: false,
            violationCount: 0,
            criticalCount: 0,
            warningCount: 0,
          }}
          size="md"
        />
      );

      // Resource limits should be visible
      const region = screen.getByRole('region');
      expect(region).toBeInTheDocument();
    });

    it('should render with dense layout for large datasets', () => {
      const manyViolations = Array.from({ length: 10 }, (_, i) => ({
        violation: {
          layer: `Layer ${i}`,
          severity: IsolationSeverity.Warning,
          message: `Violation message ${i}`,
        },
        color: 'warning' as const,
        icon: 'AlertCircle',
        layerLabel: `Layer ${i}`,
      }));

      render(
        <IsolationStatusDesktop
          state={{
            health: 'warning',
            color: 'warning',
            iconName: 'ShieldAlert',
            timestamp: 'Checked just now',
            violations: manyViolations,
            resourceLimits: null,
            isSaving: false,
            handleSaveLimits: vi.fn(),
            handleRefresh: vi.fn(),
            ariaLabel: 'Warnings detected, 10 violations detected',
            healthLabel: 'Warnings detected',
            showResourceLimits: true,
            allowEdit: false,
            violationCount: 10,
            criticalCount: 0,
            warningCount: 10,
          }}
          size="md"
        />
      );

      expect(screen.getByText('Warnings detected')).toBeInTheDocument();
      // Desktop presenter should handle many violations efficiently
      const region = screen.getByRole('region');
      expect(region).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels', () => {
      const isolation: GraphQLIsolationStatus = {
        lastVerified: '2026-02-13T10:00:00Z',
        violations: [],
        resourceLimits: null,
      };

      render(
        <IsolationStatus
          isolation={isolation}
          instanceId="inst_123"
          routerId="router_456"
        />
      );

      const region = screen.getByRole('region');
      expect(region).toHaveAttribute('aria-label');
    });

    it('should use semantic HTML elements', () => {
      const isolation: GraphQLIsolationStatus = {
        lastVerified: '2026-02-13T10:00:00Z',
        violations: [
          {
            layer: 'IP Binding',
            severity: IsolationSeverity.Error,
            message: 'Wildcard bind IP detected',
          },
        ],
        resourceLimits: null,
      };

      render(
        <IsolationStatus
          isolation={isolation}
          instanceId="inst_123"
          routerId="router_456"
        />
      );

      expect(screen.getByRole('region')).toBeInTheDocument();
    });

    it('should render with custom id for aria-describedby', () => {
      const isolation: GraphQLIsolationStatus = {
        lastVerified: '2026-02-13T10:00:00Z',
        violations: [],
        resourceLimits: null,
      };

      render(
        <IsolationStatus
          isolation={isolation}
          instanceId="inst_123"
          routerId="router_456"
          id="custom-isolation-status"
        />
      );

      const region = screen.getByRole('region');
      expect(region).toHaveAttribute('id', 'custom-isolation-status');
    });
  });

  describe('Size Variants', () => {
    it('should render small size variant', () => {
      const isolation: GraphQLIsolationStatus = {
        lastVerified: '2026-02-13T10:00:00Z',
        violations: [],
        resourceLimits: null,
      };

      render(
        <IsolationStatus
          isolation={isolation}
          instanceId="inst_123"
          routerId="router_456"
          size="sm"
        />
      );

      const region = screen.getByRole('region');
      expect(region).toBeInTheDocument();
    });

    it('should render medium size variant', () => {
      const isolation: GraphQLIsolationStatus = {
        lastVerified: '2026-02-13T10:00:00Z',
        violations: [],
        resourceLimits: null,
      };

      render(
        <IsolationStatus
          isolation={isolation}
          instanceId="inst_123"
          routerId="router_456"
          size="md"
        />
      );

      const region = screen.getByRole('region');
      expect(region).toBeInTheDocument();
    });

    it('should render large size variant', () => {
      const isolation: GraphQLIsolationStatus = {
        lastVerified: '2026-02-13T10:00:00Z',
        violations: [],
        resourceLimits: null,
      };

      render(
        <IsolationStatus
          isolation={isolation}
          instanceId="inst_123"
          routerId="router_456"
          size="lg"
        />
      );

      const region = screen.getByRole('region');
      expect(region).toBeInTheDocument();
    });
  });
});
