/**
 * @vitest-environment jsdom
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AlertTemplateDetailPanel } from './AlertTemplateDetailPanel';
import type { AlertRuleTemplate } from '../../schemas/alert-rule-template.schema';

// =============================================================================
// Test Fixtures
// =============================================================================

const mockTemplateWithVariables: AlertRuleTemplate = {
  id: 'network-device-offline',
  name: 'Device Offline Alert',
  description: 'Alert when a device goes offline for extended period',
  category: 'NETWORK',
  severity: 'CRITICAL',
  eventType: 'device.offline',
  conditions: [
    {
      field: 'status',
      operator: 'EQUALS',
      value: 'offline',
    },
    {
      field: 'duration',
      operator: 'GREATER_THAN',
      value: '{{DURATION_SECONDS}}',
    },
  ],
  channels: ['email', 'inapp'],
  variables: [
    {
      name: 'DURATION_SECONDS',
      label: 'Offline Duration',
      type: 'DURATION',
      required: true,
      defaultValue: '60',
      min: 30,
      max: 3600,
      unit: 'seconds',
      description: 'How long the device must be offline before alerting',
    },
  ],
  throttle: {
    maxAlerts: 1,
    periodSeconds: 300,
    groupByField: 'device_id',
  },
  isBuiltIn: true,
  version: '1.0.0',
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
};

const mockTemplateNoVariables: AlertRuleTemplate = {
  ...mockTemplateWithVariables,
  id: 'simple-alert',
  name: 'Simple Alert',
  description: 'Simple alert with no customization',
  variables: [],
  throttle: undefined,
};

const mockCustomTemplate: AlertRuleTemplate = {
  ...mockTemplateNoVariables,
  id: 'custom-alert',
  name: 'Custom Alert',
  isBuiltIn: false,
};

// =============================================================================
// Tests
// =============================================================================

describe('AlertTemplateDetailPanel', () => {
  describe('Rendering - Details Tab', () => {
    it('renders template metadata correctly', () => {
      const onClose = vi.fn();
      render(
        <AlertTemplateDetailPanel
          template={mockTemplateWithVariables}
          onClose={onClose}
          open={true}
        />
      );

      expect(screen.getByText('Device Offline Alert')).toBeInTheDocument();
      expect(
        screen.getByText('Alert when a device goes offline for extended period')
      ).toBeInTheDocument();

      // Badges
      expect(screen.getByText('NETWORK')).toBeInTheDocument();
      expect(screen.getByText('CRITICAL')).toBeInTheDocument();
      expect(screen.getByText('Built-in')).toBeInTheDocument();
      expect(screen.getByText('v1.0.0')).toBeInTheDocument();
    });

    it('renders event type correctly', () => {
      const onClose = vi.fn();
      render(
        <AlertTemplateDetailPanel
          template={mockTemplateWithVariables}
          onClose={onClose}
          open={true}
        />
      );

      expect(screen.getByText('device.offline')).toBeInTheDocument();
    });

    it('renders conditions correctly', () => {
      const onClose = vi.fn();
      render(
        <AlertTemplateDetailPanel
          template={mockTemplateWithVariables}
          onClose={onClose}
          open={true}
        />
      );

      expect(screen.getByText('Conditions (2)')).toBeInTheDocument();
      expect(screen.getByText('status')).toBeInTheDocument();
      expect(screen.getByText('offline')).toBeInTheDocument();
      expect(screen.getByText('duration')).toBeInTheDocument();
      expect(screen.getByText('{{DURATION_SECONDS}}')).toBeInTheDocument();
    });

    it('renders notification channels correctly', () => {
      const onClose = vi.fn();
      render(
        <AlertTemplateDetailPanel
          template={mockTemplateWithVariables}
          onClose={onClose}
          open={true}
        />
      );

      expect(screen.getByText('Notification Channels (2)')).toBeInTheDocument();
      expect(screen.getByText('email')).toBeInTheDocument();
      expect(screen.getByText('inapp')).toBeInTheDocument();
    });

    it('renders variables section for templates with variables', () => {
      const onClose = vi.fn();
      render(
        <AlertTemplateDetailPanel
          template={mockTemplateWithVariables}
          onClose={onClose}
          open={true}
        />
      );

      expect(screen.getByText('Variables (1)')).toBeInTheDocument();
      expect(screen.getByText('Offline Duration')).toBeInTheDocument();
      expect(screen.getByText('DURATION')).toBeInTheDocument();
      expect(screen.getByText('Required')).toBeInTheDocument();
    });

    it('renders throttle configuration when present', () => {
      const onClose = vi.fn();
      render(
        <AlertTemplateDetailPanel
          template={mockTemplateWithVariables}
          onClose={onClose}
          open={true}
        />
      );

      expect(screen.getByText('Throttle Configuration')).toBeInTheDocument();
      expect(screen.getByText('Max Alerts:')).toBeInTheDocument();
      expect(screen.getByText('1')).toBeInTheDocument();
      expect(screen.getByText('Period:')).toBeInTheDocument();
      expect(screen.getByText('300s')).toBeInTheDocument();
      expect(screen.getByText('Group By:')).toBeInTheDocument();
      expect(screen.getByText('device_id')).toBeInTheDocument();
    });
  });

  describe('Tabs - Templates with Variables', () => {
    it('shows two tabs for templates with variables', () => {
      const onClose = vi.fn();
      render(
        <AlertTemplateDetailPanel
          template={mockTemplateWithVariables}
          onClose={onClose}
          open={true}
        />
      );

      expect(screen.getByRole('tab', { name: /Details/i })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: /Configure/i })).toBeInTheDocument();
    });

    it('shows variable count badge on Configure tab', () => {
      const onClose = vi.fn();
      render(
        <AlertTemplateDetailPanel
          template={mockTemplateWithVariables}
          onClose={onClose}
          open={true}
        />
      );

      const configureTab = screen.getByRole('tab', { name: /Configure/i });
      expect(configureTab).toHaveTextContent('1');
    });

    it('switches to Configure tab when clicked', async () => {
      const user = userEvent.setup();
      const onClose = vi.fn();

      render(
        <AlertTemplateDetailPanel
          template={mockTemplateWithVariables}
          onClose={onClose}
          open={true}
        />
      );

      const configureTab = screen.getByRole('tab', { name: /Configure/i });
      await user.click(configureTab);

      // Should show variable input form
      expect(screen.getByText('Configure Variables')).toBeInTheDocument();
    });

    it('no tabs for templates without variables', () => {
      const onClose = vi.fn();
      render(
        <AlertTemplateDetailPanel
          template={mockTemplateNoVariables}
          onClose={onClose}
          open={true}
        />
      );

      expect(screen.queryByRole('tab', { name: /Details/i })).not.toBeInTheDocument();
      expect(screen.queryByRole('tab', { name: /Configure/i })).not.toBeInTheDocument();
    });
  });

  describe('Actions', () => {
    it('calls onApply with template and empty variables for templates without variables', async () => {
      const user = userEvent.setup();
      const onClose = vi.fn();
      const onApply = vi.fn();

      render(
        <AlertTemplateDetailPanel
          template={mockTemplateNoVariables}
          onClose={onClose}
          onApply={onApply}
          open={true}
        />
      );

      const applyButton = screen.getByRole('button', { name: /Apply Template/i });
      await user.click(applyButton);

      expect(onApply).toHaveBeenCalledWith(mockTemplateNoVariables, {});
    });

    it('calls onApply with variable values from Configure tab', async () => {
      const user = userEvent.setup();
      const onClose = vi.fn();
      const onApply = vi.fn();

      render(
        <AlertTemplateDetailPanel
          template={mockTemplateWithVariables}
          onClose={onClose}
          onApply={onApply}
          open={true}
        />
      );

      // Switch to Configure tab
      const configureTab = screen.getByRole('tab', { name: /Configure/i });
      await user.click(configureTab);

      // Submit form with default values
      const applyButton = screen.getByRole('button', { name: /Apply Template/i });
      await user.click(applyButton);

      await waitFor(() => {
        expect(onApply).toHaveBeenCalledWith(mockTemplateWithVariables, {
          DURATION_SECONDS: 60,
        });
      });
    });

    it('calls onExport when Export button clicked', async () => {
      const user = userEvent.setup();
      const onClose = vi.fn();
      const onExport = vi.fn();

      render(
        <AlertTemplateDetailPanel
          template={mockTemplateNoVariables}
          onClose={onClose}
          onExport={onExport}
          open={true}
        />
      );

      const exportButton = screen.getByRole('button', { name: /Export/i });
      await user.click(exportButton);

      expect(onExport).toHaveBeenCalledWith(mockTemplateNoVariables);
    });

    it('shows Delete button only for custom templates', () => {
      const onClose = vi.fn();
      const onDelete = vi.fn();

      const { rerender } = render(
        <AlertTemplateDetailPanel
          template={mockTemplateNoVariables}
          onClose={onClose}
          onDelete={onDelete}
          open={true}
        />
      );

      // Built-in template should not show Delete button
      expect(screen.queryByRole('button', { name: /Delete/i })).not.toBeInTheDocument();

      // Custom template should show Delete button
      rerender(
        <AlertTemplateDetailPanel
          template={mockCustomTemplate}
          onClose={onClose}
          onDelete={onDelete}
          open={true}
        />
      );

      expect(screen.getByRole('button', { name: /Delete/i })).toBeInTheDocument();
    });

    it('calls onDelete when Delete button clicked', async () => {
      const user = userEvent.setup();
      const onClose = vi.fn();
      const onDelete = vi.fn();

      render(
        <AlertTemplateDetailPanel
          template={mockCustomTemplate}
          onClose={onClose}
          onDelete={onDelete}
          open={true}
        />
      );

      const deleteButton = screen.getByRole('button', { name: /Delete/i });
      await user.click(deleteButton);

      expect(onDelete).toHaveBeenCalledWith(mockCustomTemplate);
    });
  });

  describe('Loading State', () => {
    it('disables all action buttons when isSubmitting is true', () => {
      const onClose = vi.fn();
      const onApply = vi.fn();
      const onExport = vi.fn();
      const onDelete = vi.fn();

      render(
        <AlertTemplateDetailPanel
          template={mockCustomTemplate}
          onClose={onClose}
          onApply={onApply}
          onExport={onExport}
          onDelete={onDelete}
          open={true}
          isSubmitting={true}
        />
      );

      expect(screen.getByRole('button', { name: /Applying/i })).toBeDisabled();
      expect(screen.getByRole('button', { name: /Export/i })).toBeDisabled();
      expect(screen.getByRole('button', { name: /Delete/i })).toBeDisabled();
    });

    it('shows "Applying..." text on submit button when isSubmitting is true', () => {
      const onClose = vi.fn();
      const onApply = vi.fn();

      render(
        <AlertTemplateDetailPanel
          template={mockTemplateNoVariables}
          onClose={onClose}
          onApply={onApply}
          open={true}
          isSubmitting={true}
        />
      );

      expect(screen.getByText('Applying...')).toBeInTheDocument();
    });
  });

  describe('Dialog/Sheet Behavior', () => {
    it('calls onClose when dialog is closed', async () => {
      const user = userEvent.setup();
      const onClose = vi.fn();

      render(
        <AlertTemplateDetailPanel
          template={mockTemplateNoVariables}
          onClose={onClose}
          open={true}
        />
      );

      // Find close button (X button in dialog)
      const closeButton = screen.getByRole('button', { name: /close/i });
      await user.click(closeButton);

      expect(onClose).toHaveBeenCalled();
    });

    it('returns null when template is null', () => {
      const onClose = vi.fn();

      const { container } = render(
        <AlertTemplateDetailPanel
          template={null}
          onClose={onClose}
        />
      );

      expect(container.firstChild).toBeNull();
    });

    it('respects controlled open state', () => {
      const onClose = vi.fn();

      const { rerender } = render(
        <AlertTemplateDetailPanel
          template={mockTemplateNoVariables}
          onClose={onClose}
          open={false}
        />
      );

      // Dialog should not be visible
      expect(screen.queryByText('Simple Alert')).not.toBeInTheDocument();

      rerender(
        <AlertTemplateDetailPanel
          template={mockTemplateNoVariables}
          onClose={onClose}
          open={true}
        />
      );

      // Dialog should now be visible
      expect(screen.getByText('Simple Alert')).toBeInTheDocument();
    });
  });
});
