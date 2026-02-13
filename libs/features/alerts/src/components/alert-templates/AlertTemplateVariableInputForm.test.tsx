/**
 * @vitest-environment jsdom
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  AlertTemplateVariableInputForm,
  type VariableValues,
} from './AlertTemplateVariableInputForm';
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
    {
      name: 'RETRY_COUNT',
      label: 'Retry Attempts',
      type: 'INTEGER',
      required: false,
      defaultValue: '3',
      min: 1,
      max: 10,
      description: 'Number of connection retries before considering offline',
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
  variables: [],
};

// =============================================================================
// Tests
// =============================================================================

describe('AlertTemplateVariableInputForm', () => {
  describe('Rendering', () => {
    it('renders form with all variable inputs', () => {
      const onSubmit = vi.fn();
      render(
        <AlertTemplateVariableInputForm
          template={mockTemplateWithVariables}
          onSubmit={onSubmit}
        />
      );

      // Check labels
      expect(screen.getByText('Offline Duration')).toBeInTheDocument();
      expect(screen.getByText('Retry Attempts')).toBeInTheDocument();

      // Check required badge
      expect(screen.getAllByText('Required')).toHaveLength(1);

      // Check type badges
      expect(screen.getByText('DURATION')).toBeInTheDocument();
      expect(screen.getByText('INTEGER')).toBeInTheDocument();

      // Check descriptions
      expect(
        screen.getByText('How long the device must be offline before alerting')
      ).toBeInTheDocument();
    });

    it('renders message when template has no variables', () => {
      const onSubmit = vi.fn();
      render(
        <AlertTemplateVariableInputForm
          template={mockTemplateNoVariables}
          onSubmit={onSubmit}
        />
      );

      expect(
        screen.getByText('This template has no configurable variables.')
      ).toBeInTheDocument();

      expect(screen.getByText('Apply Template')).toBeInTheDocument();
    });

    it('shows default values in inputs', () => {
      const onSubmit = vi.fn();
      render(
        <AlertTemplateVariableInputForm
          template={mockTemplateWithVariables}
          onSubmit={onSubmit}
        />
      );

      const durationInput = screen.getByLabelText(/Offline Duration/i);
      const retryInput = screen.getByLabelText(/Retry Attempts/i);

      expect(durationInput).toHaveValue(60);
      expect(retryInput).toHaveValue(3);
    });

    it('shows range information for constrained variables', () => {
      const onSubmit = vi.fn();
      render(
        <AlertTemplateVariableInputForm
          template={mockTemplateWithVariables}
          onSubmit={onSubmit}
        />
      );

      expect(screen.getByText('Range: 30 - 3600 seconds')).toBeInTheDocument();
      expect(screen.getByText('Range: 1 - 10')).toBeInTheDocument();
    });
  });

  describe('Form Interaction', () => {
    it('allows user to change input values', async () => {
      const user = userEvent.setup();
      const onSubmit = vi.fn();

      render(
        <AlertTemplateVariableInputForm
          template={mockTemplateWithVariables}
          onSubmit={onSubmit}
        />
      );

      const durationInput = screen.getByLabelText(/Offline Duration/i);

      await user.clear(durationInput);
      await user.type(durationInput, '120');

      expect(durationInput).toHaveValue(120);
    });

    it('submits form with user-entered values', async () => {
      const user = userEvent.setup();
      const onSubmit = vi.fn();

      render(
        <AlertTemplateVariableInputForm
          template={mockTemplateWithVariables}
          onSubmit={onSubmit}
        />
      );

      const durationInput = screen.getByLabelText(/Offline Duration/i);
      const retryInput = screen.getByLabelText(/Retry Attempts/i);

      await user.clear(durationInput);
      await user.type(durationInput, '180');

      await user.clear(retryInput);
      await user.type(retryInput, '5');

      const submitButton = screen.getByRole('button', { name: /Apply Template/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(onSubmit).toHaveBeenCalledWith({
          DURATION_SECONDS: 180,
          RETRY_COUNT: 5,
        });
      });
    });

    it('calls onCancel when cancel button clicked', async () => {
      const user = userEvent.setup();
      const onSubmit = vi.fn();
      const onCancel = vi.fn();

      render(
        <AlertTemplateVariableInputForm
          template={mockTemplateWithVariables}
          onSubmit={onSubmit}
          onCancel={onCancel}
        />
      );

      const cancelButton = screen.getByRole('button', { name: /Cancel/i });
      await user.click(cancelButton);

      expect(onCancel).toHaveBeenCalled();
      expect(onSubmit).not.toHaveBeenCalled();
    });

    it('submits empty values for template with no variables', async () => {
      const user = userEvent.setup();
      const onSubmit = vi.fn();

      render(
        <AlertTemplateVariableInputForm
          template={mockTemplateNoVariables}
          onSubmit={onSubmit}
        />
      );

      const submitButton = screen.getByRole('button', { name: /Apply Template/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(onSubmit).toHaveBeenCalledWith({});
      });
    });
  });

  describe('Validation', () => {
    it('shows error for required field left empty', async () => {
      const user = userEvent.setup();
      const onSubmit = vi.fn();

      render(
        <AlertTemplateVariableInputForm
          template={mockTemplateWithVariables}
          onSubmit={onSubmit}
        />
      );

      const durationInput = screen.getByLabelText(/Offline Duration/i);
      await user.clear(durationInput);

      const submitButton = screen.getByRole('button', { name: /Apply Template/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/Offline Duration is required/i)).toBeInTheDocument();
      });

      expect(onSubmit).not.toHaveBeenCalled();
    });

    it('shows error for value below minimum', async () => {
      const user = userEvent.setup();
      const onSubmit = vi.fn();

      render(
        <AlertTemplateVariableInputForm
          template={mockTemplateWithVariables}
          onSubmit={onSubmit}
        />
      );

      const durationInput = screen.getByLabelText(/Offline Duration/i);
      await user.clear(durationInput);
      await user.type(durationInput, '20');

      const submitButton = screen.getByRole('button', { name: /Apply Template/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/must be at least 30/i)).toBeInTheDocument();
      });

      expect(onSubmit).not.toHaveBeenCalled();
    });

    it('shows error for value above maximum', async () => {
      const user = userEvent.setup();
      const onSubmit = vi.fn();

      render(
        <AlertTemplateVariableInputForm
          template={mockTemplateWithVariables}
          onSubmit={onSubmit}
        />
      );

      const retryInput = screen.getByLabelText(/Retry Attempts/i);
      await user.clear(retryInput);
      await user.type(retryInput, '15');

      const submitButton = screen.getByRole('button', { name: /Apply Template/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/must be at most 10/i)).toBeInTheDocument();
      });

      expect(onSubmit).not.toHaveBeenCalled();
    });

    it('allows submission when all validations pass', async () => {
      const user = userEvent.setup();
      const onSubmit = vi.fn();

      render(
        <AlertTemplateVariableInputForm
          template={mockTemplateWithVariables}
          onSubmit={onSubmit}
        />
      );

      const submitButton = screen.getByRole('button', { name: /Apply Template/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(onSubmit).toHaveBeenCalledWith({
          DURATION_SECONDS: 60,
          RETRY_COUNT: 3,
        });
      });
    });
  });

  describe('Loading State', () => {
    it('disables submit button when isSubmitting is true', () => {
      const onSubmit = vi.fn();

      render(
        <AlertTemplateVariableInputForm
          template={mockTemplateWithVariables}
          onSubmit={onSubmit}
          isSubmitting={true}
        />
      );

      const submitButton = screen.getByRole('button', { name: /Applying/i });
      expect(submitButton).toBeDisabled();
      expect(submitButton).toHaveTextContent('Applying Template...');
    });

    it('disables cancel button when isSubmitting is true', () => {
      const onSubmit = vi.fn();
      const onCancel = vi.fn();

      render(
        <AlertTemplateVariableInputForm
          template={mockTemplateWithVariables}
          onSubmit={onSubmit}
          onCancel={onCancel}
          isSubmitting={true}
        />
      );

      const cancelButton = screen.getByRole('button', { name: /Cancel/i });
      expect(cancelButton).toBeDisabled();
    });
  });

  describe('Accessibility', () => {
    it('associates error messages with inputs using aria-describedby', async () => {
      const user = userEvent.setup();
      const onSubmit = vi.fn();

      render(
        <AlertTemplateVariableInputForm
          template={mockTemplateWithVariables}
          onSubmit={onSubmit}
        />
      );

      const durationInput = screen.getByLabelText(/Offline Duration/i);
      await user.clear(durationInput);

      const submitButton = screen.getByRole('button', { name: /Apply Template/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(durationInput).toHaveAttribute('aria-invalid', 'true');
        expect(durationInput).toHaveAttribute('aria-describedby');
      });
    });

    it('has proper form labels for all inputs', () => {
      const onSubmit = vi.fn();

      render(
        <AlertTemplateVariableInputForm
          template={mockTemplateWithVariables}
          onSubmit={onSubmit}
        />
      );

      const durationInput = screen.getByLabelText(/Offline Duration/i);
      const retryInput = screen.getByLabelText(/Retry Attempts/i);

      expect(durationInput).toHaveAccessibleName();
      expect(retryInput).toHaveAccessibleName();
    });
  });
});
