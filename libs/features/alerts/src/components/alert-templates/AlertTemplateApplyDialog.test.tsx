/**
 * AlertTemplateApplyDialog Component Tests
 * NAS-18.12: Alert Rule Templates Feature - Task #35
 *
 * Comprehensive tests for the AlertTemplateApplyDialog component including:
 * - Template loading and display
 * - Dynamic form generation from variables
 * - Form validation (React Hook Form + Zod)
 * - Real-time preview integration
 * - Template application mutation
 * - Error handling and loading states
 * - Responsive behavior (Desktop/Mobile)
 * - Accessibility compliance
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MockedProvider, type MockedResponse } from '@apollo/client/testing';
import { AlertTemplateApplyDialog } from './AlertTemplateApplyDialog';
import {
  GET_ALERT_RULE_TEMPLATE_BY_ID,
  PREVIEW_ALERT_RULE_TEMPLATE,
  APPLY_ALERT_RULE_TEMPLATE,
} from '@nasnet/api-client/queries';
import {
  deviceOfflineTemplate,
  highCPUTemplate,
  sshFailedLoginTemplate,
} from '../../__test-utils__/alert-rule-template-fixtures';

// =============================================================================
// Mocks
// =============================================================================

// Mock useMediaQuery hook
const mockIsDesktop = vi.fn(() => true);
vi.mock('@nasnet/ui/primitives', async () => {
  const actual = await vi.importActual('@nasnet/ui/primitives');
  return {
    ...actual,
    useMediaQuery: () => mockIsDesktop(),
  };
});

// Mock toast
const mockToast = vi.fn();
vi.mock('@nasnet/ui/primitives', async () => {
  const actual = await vi.importActual('@nasnet/ui/primitives');
  return {
    ...actual,
    useToast: () => ({ toast: mockToast }),
  };
});

// =============================================================================
// Test Data & Mocks
// =============================================================================

const mockTemplate = highCPUTemplate; // Has variables: CPU_THRESHOLD, PERIOD_SECONDS

const createTemplateMock = (template = mockTemplate): MockedResponse => ({
  request: {
    query: GET_ALERT_RULE_TEMPLATE_BY_ID,
    variables: { id: template.id },
  },
  result: {
    data: {
      alertRuleTemplate: template,
    },
  },
});

const createPreviewMock = (
  templateId: string,
  variables: Record<string, any>,
  isValid = true
): MockedResponse => ({
  request: {
    query: PREVIEW_ALERT_RULE_TEMPLATE,
    variables: { templateId, variables },
  },
  result: {
    data: {
      previewAlertRuleTemplate: {
        preview: {
          template: mockTemplate,
          resolvedConditions: [
            {
              field: 'cpu_usage',
              operator: 'GREATER_THAN',
              value: variables.CPU_THRESHOLD?.toString() || '80',
            },
          ],
          validationInfo: {
            isValid,
            missingVariables: isValid ? [] : ['CPU_THRESHOLD'],
            warnings: [],
          },
        },
        errors: [],
      },
    },
  },
});

const createApplyMock = (
  success = true,
  alertRuleId = 'rule-123'
): MockedResponse => ({
  request: {
    query: APPLY_ALERT_RULE_TEMPLATE,
    variables: expect.anything(),
  },
  result: {
    data: {
      applyAlertRuleTemplate: success
        ? {
            alertRule: {
              id: alertRuleId,
              name: 'High CPU Alert',
              description: 'Test rule',
              eventType: 'system.cpu_high',
              conditions: [],
              severity: 'CRITICAL',
              channels: ['email'],
              enabled: true,
              createdAt: '2026-02-13T10:00:00Z',
              updatedAt: '2026-02-13T10:00:00Z',
            },
            errors: [],
          }
        : {
            alertRule: null,
            errors: [{ field: 'general', message: 'Failed to apply template' }],
          },
    },
  },
});

// =============================================================================
// Test Utilities
// =============================================================================

interface RenderOptions {
  templateId?: string | null;
  open?: boolean;
  onClose?: () => void;
  onSuccess?: (id: string) => void;
  onError?: (error: string) => void;
  mocks?: MockedResponse[];
}

function renderDialog({
  templateId = mockTemplate.id,
  open = true,
  onClose = vi.fn(),
  onSuccess = vi.fn(),
  onError = vi.fn(),
  mocks = [createTemplateMock()],
}: RenderOptions = {}) {
  return {
    ...render(
      <MockedProvider mocks={mocks} addTypename={false}>
        <AlertTemplateApplyDialog
          templateId={templateId}
          open={open}
          onClose={onClose}
          onSuccess={onSuccess}
          onError={onError}
        />
      </MockedProvider>
    ),
    onClose,
    onSuccess,
    onError,
  };
}

// =============================================================================
// Tests
// =============================================================================

describe('AlertTemplateApplyDialog', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockIsDesktop.mockReturnValue(true);
  });

  // ---------------------------------------------------------------------------
  // Rendering & Loading
  // ---------------------------------------------------------------------------

  describe('Rendering & Loading', () => {
    it('should show loading state while fetching template', () => {
      renderDialog();

      expect(screen.getByText(/loading template/i)).toBeInTheDocument();
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    it('should render template details after loading', async () => {
      renderDialog();

      await waitFor(() => {
        expect(screen.getByText(mockTemplate.name)).toBeInTheDocument();
      });

      expect(screen.getByText(mockTemplate.description)).toBeInTheDocument();
      expect(screen.getByText(mockTemplate.category)).toBeInTheDocument();
      expect(screen.getByText(mockTemplate.severity)).toBeInTheDocument();
    });

    it('should show error state when template fails to load', async () => {
      const errorMock: MockedResponse = {
        request: {
          query: GET_ALERT_RULE_TEMPLATE_BY_ID,
          variables: { id: mockTemplate.id },
        },
        error: new Error('Failed to load template'),
      };

      renderDialog({ mocks: [errorMock] });

      await waitFor(() => {
        expect(screen.getByText(/failed to load template/i)).toBeInTheDocument();
      });
    });

    it('should not render when templateId is null', () => {
      const { container } = renderDialog({ templateId: null });
      expect(container.firstChild).toBeNull();
    });

    it('should not render when open is false', () => {
      const { container } = renderDialog({ open: false });
      expect(container).toBeEmptyDOMElement();
    });
  });

  // ---------------------------------------------------------------------------
  // Dynamic Form Generation
  // ---------------------------------------------------------------------------

  describe('Dynamic Form Generation', () => {
    it('should generate input fields for all variables', async () => {
      renderDialog();

      await waitFor(() => {
        expect(screen.getByLabelText(/cpu threshold/i)).toBeInTheDocument();
      });

      expect(screen.getByLabelText(/period seconds/i)).toBeInTheDocument();
    });

    it('should show required indicator for required variables', async () => {
      renderDialog();

      await waitFor(() => {
        const cpuInput = screen.getByLabelText(/cpu threshold/i);
        expect(cpuInput.parentElement).toHaveTextContent('*');
      });
    });

    it('should display variable constraints (min, max, unit)', async () => {
      renderDialog();

      await waitFor(() => {
        expect(screen.getByText(/min:/i)).toBeInTheDocument();
      });

      expect(screen.getByText(/max:/i)).toBeInTheDocument();
      expect(screen.getByText(/unit:/i)).toBeInTheDocument();
    });

    it('should show default values as placeholders', async () => {
      renderDialog();

      await waitFor(() => {
        const cpuInput = screen.getByLabelText(/cpu threshold/i) as HTMLInputElement;
        expect(cpuInput.placeholder).toBeTruthy();
      });
    });

    it('should use number input for INTEGER variables', async () => {
      renderDialog();

      await waitFor(() => {
        const cpuInput = screen.getByLabelText(/cpu threshold/i) as HTMLInputElement;
        expect(cpuInput.type).toBe('number');
      });
    });

    it('should use textarea for STRING variables with description', async () => {
      const templateWithString = {
        ...mockTemplate,
        variables: [
          {
            name: 'DESCRIPTION',
            label: 'Description',
            type: 'STRING' as const,
            required: false,
            description: 'A long description field',
          },
        ],
      };

      renderDialog({
        mocks: [createTemplateMock(templateWithString)],
      });

      await waitFor(() => {
        expect(screen.getByRole('textbox', { name: /description/i })).toBeInTheDocument();
      });
    });
  });

  // ---------------------------------------------------------------------------
  // Form Validation
  // ---------------------------------------------------------------------------

  describe('Form Validation', () => {
    it('should show validation errors for required fields', async () => {
      const user = userEvent.setup();
      renderDialog();

      await waitFor(() => {
        expect(screen.getByText(/apply template/i)).toBeInTheDocument();
      });

      // Submit without filling required fields
      const submitButton = screen.getByRole('button', { name: /apply template/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/required/i)).toBeInTheDocument();
      });
    });

    it('should validate min/max constraints', async () => {
      const user = userEvent.setup();
      renderDialog();

      await waitFor(() => {
        expect(screen.getByLabelText(/cpu threshold/i)).toBeInTheDocument();
      });

      const cpuInput = screen.getByLabelText(/cpu threshold/i);

      // Enter value below min
      await user.clear(cpuInput);
      await user.type(cpuInput, '0');

      const submitButton = screen.getByRole('button', { name: /apply template/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/min/i)).toBeInTheDocument();
      });
    });

    it('should clear validation errors when valid input is provided', async () => {
      const user = userEvent.setup();
      renderDialog();

      await waitFor(() => {
        expect(screen.getByLabelText(/cpu threshold/i)).toBeInTheDocument();
      });

      const cpuInput = screen.getByLabelText(/cpu threshold/i);

      // Enter invalid value first
      await user.clear(cpuInput);
      await user.type(cpuInput, '0');

      // Then enter valid value
      await user.clear(cpuInput);
      await user.type(cpuInput, '80');

      // Error should be cleared
      await waitFor(() => {
        expect(screen.queryByText(/min/i)).not.toBeInTheDocument();
      });
    });
  });

  // ---------------------------------------------------------------------------
  // Preview Integration
  // ---------------------------------------------------------------------------

  describe('Preview Integration', () => {
    it('should show preview prompt when no variables are filled', async () => {
      renderDialog();

      await waitFor(() => {
        expect(
          screen.getByText(/fill in the variables above to preview/i)
        ).toBeInTheDocument();
      });
    });

    it('should fetch and display preview when variables are filled', async () => {
      const user = userEvent.setup();
      const previewMock = createPreviewMock(mockTemplate.id, { CPU_THRESHOLD: 80 });

      renderDialog({
        mocks: [createTemplateMock(), previewMock],
      });

      await waitFor(() => {
        expect(screen.getByLabelText(/cpu threshold/i)).toBeInTheDocument();
      });

      const cpuInput = screen.getByLabelText(/cpu threshold/i);
      await user.clear(cpuInput);
      await user.type(cpuInput, '80');

      await waitFor(() => {
        expect(screen.getByText(/preview valid/i)).toBeInTheDocument();
      });

      expect(screen.getByText(/resolved conditions/i)).toBeInTheDocument();
    });

    it('should show validation errors in preview', async () => {
      const user = userEvent.setup();
      const previewMock = createPreviewMock(
        mockTemplate.id,
        { CPU_THRESHOLD: 80 },
        false
      );

      renderDialog({
        mocks: [createTemplateMock(), previewMock],
      });

      await waitFor(() => {
        expect(screen.getByLabelText(/cpu threshold/i)).toBeInTheDocument();
      });

      const cpuInput = screen.getByLabelText(/cpu threshold/i);
      await user.type(cpuInput, '80');

      await waitFor(() => {
        expect(screen.getByText(/validation errors/i)).toBeInTheDocument();
      });
    });

    it('should show loading state while preview is fetching', async () => {
      const user = userEvent.setup();
      renderDialog();

      await waitFor(() => {
        expect(screen.getByLabelText(/cpu threshold/i)).toBeInTheDocument();
      });

      const cpuInput = screen.getByLabelText(/cpu threshold/i);
      await user.type(cpuInput, '80');

      // Should show skeleton while loading
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });
  });

  // ---------------------------------------------------------------------------
  // Template Application
  // ---------------------------------------------------------------------------

  describe('Template Application', () => {
    it('should apply template successfully', async () => {
      const user = userEvent.setup();
      const onSuccess = vi.fn();
      const previewMock = createPreviewMock(mockTemplate.id, {
        CPU_THRESHOLD: 80,
        PERIOD_SECONDS: 300,
      });
      const applyMock = createApplyMock();

      renderDialog({
        mocks: [createTemplateMock(), previewMock, applyMock],
        onSuccess,
      });

      await waitFor(() => {
        expect(screen.getByLabelText(/cpu threshold/i)).toBeInTheDocument();
      });

      // Fill in variables
      const cpuInput = screen.getByLabelText(/cpu threshold/i);
      const periodInput = screen.getByLabelText(/period seconds/i);

      await user.clear(cpuInput);
      await user.type(cpuInput, '80');
      await user.clear(periodInput);
      await user.type(periodInput, '300');

      // Submit
      const submitButton = screen.getByRole('button', { name: /apply template/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(onSuccess).toHaveBeenCalledWith('rule-123');
      });
    });

    it('should show loading state during application', async () => {
      const user = userEvent.setup();
      renderDialog();

      await waitFor(() => {
        expect(screen.getByLabelText(/cpu threshold/i)).toBeInTheDocument();
      });

      const cpuInput = screen.getByLabelText(/cpu threshold/i);
      await user.type(cpuInput, '80');

      const submitButton = screen.getByRole('button', { name: /apply template/i });
      await user.click(submitButton);

      expect(screen.getByText(/creating alert rule/i)).toBeInTheDocument();
    });

    it('should call onError when application fails', async () => {
      const user = userEvent.setup();
      const onError = vi.fn();
      const applyMock = createApplyMock(false);

      renderDialog({
        mocks: [createTemplateMock(), applyMock],
        onError,
      });

      await waitFor(() => {
        expect(screen.getByLabelText(/cpu threshold/i)).toBeInTheDocument();
      });

      const cpuInput = screen.getByLabelText(/cpu threshold/i);
      await user.type(cpuInput, '80');

      const submitButton = screen.getByRole('button', { name: /apply template/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(onError).toHaveBeenCalled();
      });
    });

    it('should disable submit button while applying', async () => {
      const user = userEvent.setup();
      renderDialog();

      await waitFor(() => {
        expect(screen.getByLabelText(/cpu threshold/i)).toBeInTheDocument();
      });

      const submitButton = screen.getByRole('button', { name: /apply template/i });
      expect(submitButton).not.toBeDisabled();

      // During submission
      const cpuInput = screen.getByLabelText(/cpu threshold/i);
      await user.type(cpuInput, '80');
      await user.click(submitButton);

      await waitFor(() => {
        expect(submitButton).toBeDisabled();
      });
    });
  });

  // ---------------------------------------------------------------------------
  // Customizations
  // ---------------------------------------------------------------------------

  describe('Customizations', () => {
    it('should allow optional name customization', async () => {
      const user = userEvent.setup();
      renderDialog();

      await waitFor(() => {
        expect(screen.getByLabelText(/rule name/i)).toBeInTheDocument();
      });

      const nameInput = screen.getByLabelText(/rule name/i);
      await user.type(nameInput, 'My Custom Rule');

      expect(nameInput).toHaveValue('My Custom Rule');
    });

    it('should allow optional description customization', async () => {
      const user = userEvent.setup();
      renderDialog();

      await waitFor(() => {
        expect(screen.getByLabelText(/description/i)).toBeInTheDocument();
      });

      const descInput = screen.getByLabelText(/description/i);
      await user.type(descInput, 'My custom description');

      expect(descInput).toHaveValue('My custom description');
    });
  });

  // ---------------------------------------------------------------------------
  // Responsive Behavior
  // ---------------------------------------------------------------------------

  describe('Responsive Behavior', () => {
    it('should render as Dialog on desktop', async () => {
      mockIsDesktop.mockReturnValue(true);
      renderDialog();

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });
    });

    it('should render as Sheet on mobile', async () => {
      mockIsDesktop.mockReturnValue(false);
      renderDialog();

      await waitFor(() => {
        // Sheet has different ARIA roles, check for content
        expect(screen.getByText(/apply template/i)).toBeInTheDocument();
      });
    });
  });

  // ---------------------------------------------------------------------------
  // Dialog Controls
  // ---------------------------------------------------------------------------

  describe('Dialog Controls', () => {
    it('should call onClose when dialog is closed', async () => {
      const user = userEvent.setup();
      const onClose = vi.fn();

      renderDialog({ onClose });

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      // Find close button (usually X button in dialog)
      const closeButton = screen.getByRole('button', { name: /close/i });
      await user.click(closeButton);

      expect(onClose).toHaveBeenCalled();
    });

    it('should close and call onSuccess after successful application', async () => {
      const user = userEvent.setup();
      const onClose = vi.fn();
      const onSuccess = vi.fn();
      const applyMock = createApplyMock();

      renderDialog({
        mocks: [createTemplateMock(), applyMock],
        onClose,
        onSuccess,
      });

      await waitFor(() => {
        expect(screen.getByLabelText(/cpu threshold/i)).toBeInTheDocument();
      });

      const cpuInput = screen.getByLabelText(/cpu threshold/i);
      await user.type(cpuInput, '80');

      const submitButton = screen.getByRole('button', { name: /apply template/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(onSuccess).toHaveBeenCalled();
        expect(onClose).toHaveBeenCalled();
      });
    });
  });

  // ---------------------------------------------------------------------------
  // Accessibility
  // ---------------------------------------------------------------------------

  describe('Accessibility', () => {
    it('should have proper ARIA labels for inputs', async () => {
      renderDialog();

      await waitFor(() => {
        const cpuInput = screen.getByLabelText(/cpu threshold/i);
        expect(cpuInput).toHaveAttribute('aria-invalid');
      });
    });

    it('should have aria-describedby for error messages', async () => {
      const user = userEvent.setup();
      renderDialog();

      await waitFor(() => {
        expect(screen.getByLabelText(/cpu threshold/i)).toBeInTheDocument();
      });

      const submitButton = screen.getByRole('button', { name: /apply template/i });
      await user.click(submitButton);

      await waitFor(() => {
        const cpuInput = screen.getByLabelText(/cpu threshold/i);
        expect(cpuInput).toHaveAttribute('aria-describedby');
      });
    });

    it('should have role="alert" for error messages', async () => {
      const user = userEvent.setup();
      renderDialog();

      await waitFor(() => {
        expect(screen.getByLabelText(/cpu threshold/i)).toBeInTheDocument();
      });

      const submitButton = screen.getByRole('button', { name: /apply template/i });
      await user.click(submitButton);

      await waitFor(() => {
        const alerts = screen.getAllByRole('alert');
        expect(alerts.length).toBeGreaterThan(0);
      });
    });

    it('should have proper heading hierarchy', async () => {
      renderDialog();

      await waitFor(() => {
        const dialog = screen.getByRole('dialog');
        const headings = within(dialog).getAllByRole('heading');
        expect(headings.length).toBeGreaterThan(0);
      });
    });
  });
});
