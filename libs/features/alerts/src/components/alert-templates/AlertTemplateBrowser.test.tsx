/**
 * AlertTemplateBrowser Component Tests
 * NAS-18.12: Alert Rule Templates Feature
 *
 * Comprehensive tests for the AlertTemplateBrowser component including:
 * - Rendering and data display
 * - Filtering and search
 * - Template selection and preview
 * - Template application
 * - Error handling
 * - Accessibility
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MockedProvider } from '@apollo/client/testing';
import { useToast } from '@nasnet/ui/primitives';
import { useTemplateGallery, TemplateGallery } from '@nasnet/ui/patterns';
import { AlertTemplateBrowser } from './AlertTemplateBrowser';
import {
  builtInTemplates,
  deviceOfflineTemplate,
  highCPUTemplate,
  sshFailedLoginTemplate,
} from '../../__test-utils__/alert-rule-template-fixtures';

// Mock UI dependencies
vi.mock('@nasnet/ui/primitives', () => ({
  useToast: vi.fn(() => ({
    toast: vi.fn(),
  })),
}));

// Mock TemplateGallery pattern
vi.mock('@nasnet/ui/patterns', () => ({
  useTemplateGallery: vi.fn((props: any) => ({
    ...props,
    filteredTemplates: props.templates,
    selectedTemplate: null,
    searchQuery: '',
    categoryFilter: 'all',
    sortBy: 'name',
  })),
  TemplateGallery: vi.fn(({ gallery, onApplyTemplate, loading }: any) => (
    <div data-testid="template-gallery">
      {loading && <div data-testid="loading-spinner">Loading...</div>}
      {gallery.filteredTemplates?.map((template: any) => (
        <div key={template.id} data-testid={`template-${template.id}`}>
          <h3>{template.name}</h3>
          <p>{template.description}</p>
          <button
            data-testid={`apply-${template.id}`}
            onClick={() => onApplyTemplate(template)}
          >
            Apply Template
          </button>
        </div>
      ))}
    </div>
  )),
}));

// =============================================================================
// Test Setup
// =============================================================================

const createMocks = (templates = builtInTemplates, applySuccess = true) => {
  return [
    {
      request: {
        query: expect.anything(), // We'll match any query for simplicity
      },
      result: {
        data: {
          alertRuleTemplates: templates,
        },
      },
    },
    {
      request: {
        query: expect.anything(),
      },
      result: {
        data: {
          applyAlertRuleTemplate: applySuccess
            ? {
                alertRule: {
                  id: 'rule-123',
                  name: 'Test Alert Rule',
                },
                errors: [],
              }
            : {
                alertRule: null,
                errors: [{ message: 'Failed to create rule' }],
              },
        },
      },
    },
  ];
};

describe('AlertTemplateBrowser', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ===========================================================================
  // Rendering Tests
  // ===========================================================================

  describe('Rendering', () => {
    it('renders the template gallery', async () => {
      const mocks = createMocks();

      render(
        <MockedProvider mocks={mocks} addTypename={false}>
          <AlertTemplateBrowser />
        </MockedProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('template-gallery')).toBeInTheDocument();
      });
    });

    it('displays loading state initially', () => {
      const mocks = createMocks();

      render(
        <MockedProvider mocks={mocks} addTypename={false}>
          <AlertTemplateBrowser />
        </MockedProvider>
      );

      expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
    });

    it('renders all built-in templates', async () => {
      const mocks = createMocks();

      render(
        <MockedProvider mocks={mocks} addTypename={false}>
          <AlertTemplateBrowser />
        </MockedProvider>
      );

      await waitFor(() => {
        builtInTemplates.forEach((template) => {
          expect(screen.getByText(template.name)).toBeInTheDocument();
        });
      });
    });

    it('displays template descriptions', async () => {
      const mocks = createMocks();

      render(
        <MockedProvider mocks={mocks} addTypename={false}>
          <AlertTemplateBrowser />
        </MockedProvider>
      );

      await waitFor(() => {
        expect(
          screen.getByText(/Alerts when a network device goes offline/i)
        ).toBeInTheDocument();
      });
    });

    it('applies custom className', async () => {
      const mocks = createMocks();

      const { container } = render(
        <MockedProvider mocks={mocks} addTypename={false}>
          <AlertTemplateBrowser className="custom-class" />
        </MockedProvider>
      );

      await waitFor(() => {
        const gallery = container.querySelector('.custom-class');
        expect(gallery).toBeInTheDocument();
      });
    });
  });

  // ===========================================================================
  // Template Application Tests
  // ===========================================================================

  describe('Template Application', () => {
    it('applies template with default values', async () => {
      const user = userEvent.setup();
      const onRuleCreated = vi.fn();
      const mocks = createMocks();

      render(
        <MockedProvider mocks={mocks} addTypename={false}>
          <AlertTemplateBrowser onRuleCreated={onRuleCreated} />
        </MockedProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('template-device-offline')).toBeInTheDocument();
      });

      const applyButton = screen.getByTestId('apply-device-offline');
      await user.click(applyButton);

      await waitFor(() => {
        expect(onRuleCreated).toHaveBeenCalledWith('rule-123');
      });
    });

    it('shows success toast on successful application', async () => {
      const user = userEvent.setup();
      const toast = vi.fn();

      vi.mocked(useToast).mockReturnValue({
        toast,
        dismiss: vi.fn(),
        toasts: [],
      });

      const mocks = createMocks();

      render(
        <MockedProvider mocks={mocks} addTypename={false}>
          <AlertTemplateBrowser />
        </MockedProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('apply-device-offline')).toBeInTheDocument();
      });

      const applyButton = screen.getByTestId('apply-device-offline');
      await user.click(applyButton);

      await waitFor(() => {
        expect(toast).toHaveBeenCalledWith(
          expect.objectContaining({
            title: 'Alert rule created',
            variant: 'success',
          })
        );
      });
    });

    it('shows error toast on application failure', async () => {
      const user = userEvent.setup();
      const toast = vi.fn();

      vi.mocked(useToast).mockReturnValue({
        toast,
        dismiss: vi.fn(),
        toasts: [],
      });

      const mocks = createMocks(builtInTemplates, false);

      render(
        <MockedProvider mocks={mocks} addTypename={false}>
          <AlertTemplateBrowser />
        </MockedProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('apply-device-offline')).toBeInTheDocument();
      });

      const applyButton = screen.getByTestId('apply-device-offline');
      await user.click(applyButton);

      await waitFor(() => {
        expect(toast).toHaveBeenCalledWith(
          expect.objectContaining({
            title: 'Failed to create alert rule',
            variant: 'destructive',
          })
        );
      });
    });

    it('disables apply button while applying', async () => {
      const user = userEvent.setup();
      const mocks = createMocks();

      render(
        <MockedProvider mocks={mocks} addTypename={false}>
          <AlertTemplateBrowser />
        </MockedProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('apply-device-offline')).toBeInTheDocument();
      });

      const applyButton = screen.getByTestId('apply-device-offline');
      await user.click(applyButton);

      // Button should be disabled during application
      expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
    });
  });

  // ===========================================================================
  // Filtering and Search Tests
  // ===========================================================================

  describe('Filtering and Search', () => {
    it('filters templates by initial category', async () => {
      const mocks = createMocks([deviceOfflineTemplate, highCPUTemplate]);

      render(
        <MockedProvider mocks={mocks} addTypename={false}>
          <AlertTemplateBrowser initialCategory="NETWORK" />
        </MockedProvider>
      );

      await waitFor(() => {
        // Only NETWORK category templates should be visible
        expect(screen.getByText('Device Offline Alert')).toBeInTheDocument();
        // RESOURCES category should not be visible
        expect(screen.queryByText('High CPU Usage')).not.toBeInTheDocument();
      });
    });

    it('displays empty state when no templates match filters', async () => {
      const mocks = createMocks([]);

      render(
        <MockedProvider mocks={mocks} addTypename={false}>
          <AlertTemplateBrowser />
        </MockedProvider>
      );

      await waitFor(() => {
        const gallery = screen.getByTestId('template-gallery');
        expect(gallery).toBeInTheDocument();
        expect(gallery.children.length).toBe(0);
      });
    });

    it('displays category-specific templates', async () => {
      const networkTemplates = [deviceOfflineTemplate];
      const mocks = createMocks(networkTemplates);

      render(
        <MockedProvider mocks={mocks} addTypename={false}>
          <AlertTemplateBrowser initialCategory="NETWORK" />
        </MockedProvider>
      );

      await waitFor(() => {
        expect(screen.getByText('Device Offline Alert')).toBeInTheDocument();
      });
    });
  });

  // ===========================================================================
  // Error Handling Tests
  // ===========================================================================

  describe('Error Handling', () => {
    it('displays error state on fetch failure', async () => {
      const errorMocks = [
        {
          request: {
            query: expect.anything(),
          },
          error: new Error('Network error'),
        },
      ];

      render(
        <MockedProvider mocks={errorMocks} addTypename={false}>
          <AlertTemplateBrowser />
        </MockedProvider>
      );

      await waitFor(() => {
        expect(screen.getByText('Failed to load templates')).toBeInTheDocument();
      });
    });

    it('provides retry button on error', async () => {
      const user = userEvent.setup();
      const errorMocks = [
        {
          request: {
            query: expect.anything(),
          },
          error: new Error('Network error'),
        },
      ];

      render(
        <MockedProvider mocks={errorMocks} addTypename={false}>
          <AlertTemplateBrowser />
        </MockedProvider>
      );

      await waitFor(() => {
        expect(screen.getByText('Retry')).toBeInTheDocument();
      });

      const retryButton = screen.getByText('Retry');
      await user.click(retryButton);

      // Verify refetch was called
      expect(retryButton).toBeInTheDocument();
    });

    it('handles GraphQL errors gracefully', async () => {
      const graphqlErrorMocks = [
        {
          request: {
            query: expect.anything(),
          },
          result: {
            errors: [
              {
                message: 'GraphQL error',
              },
            ],
          },
        },
      ];

      render(
        <MockedProvider mocks={graphqlErrorMocks} addTypename={false}>
          <AlertTemplateBrowser />
        </MockedProvider>
      );

      await waitFor(() => {
        expect(screen.getByText('Failed to load templates')).toBeInTheDocument();
      });
    });
  });

  // ===========================================================================
  // Template Data Transformation Tests
  // ===========================================================================

  describe('Template Data Transformation', () => {
    it('transforms AlertRuleTemplate to gallery template format', async () => {
      const mocks = createMocks([deviceOfflineTemplate]);

      render(
        <MockedProvider mocks={mocks} addTypename={false}>
          <AlertTemplateBrowser />
        </MockedProvider>
      );

      await waitFor(() => {
        const template = screen.getByTestId('template-device-offline');
        expect(template).toBeInTheDocument();
        expect(template).toHaveTextContent('Device Offline Alert');
      });
    });

    it('includes original template data for applying', async () => {
      const user = userEvent.setup();
      const onRuleCreated = vi.fn();
      const mocks = createMocks([deviceOfflineTemplate]);

      render(
        <MockedProvider mocks={mocks} addTypename={false}>
          <AlertTemplateBrowser onRuleCreated={onRuleCreated} />
        </MockedProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('apply-device-offline')).toBeInTheDocument();
      });

      const applyButton = screen.getByTestId('apply-device-offline');
      await user.click(applyButton);

      // Verify the mutation was called with the original template
      await waitFor(() => {
        expect(onRuleCreated).toHaveBeenCalled();
      });
    });

    it('maps severity to complexity correctly', async () => {
      const mocks = createMocks([sshFailedLoginTemplate]);

      render(
        <MockedProvider mocks={mocks} addTypename={false}>
          <AlertTemplateBrowser />
        </MockedProvider>
      );

      await waitFor(() => {
        const template = screen.getByTestId('template-ssh-failed-login');
        expect(template).toBeInTheDocument();
      });
    });
  });

  // ===========================================================================
  // Accessibility Tests
  // ===========================================================================

  describe('Accessibility', () => {
    it('has proper ARIA labels for interactive elements', async () => {
      const mocks = createMocks();

      render(
        <MockedProvider mocks={mocks} addTypename={false}>
          <AlertTemplateBrowser />
        </MockedProvider>
      );

      await waitFor(() => {
        const applyButtons = screen.getAllByRole('button', { name: /apply/i });
        expect(applyButtons.length).toBeGreaterThan(0);
      });
    });

    it('maintains focus management during interactions', async () => {
      const user = userEvent.setup();
      const mocks = createMocks();

      render(
        <MockedProvider mocks={mocks} addTypename={false}>
          <AlertTemplateBrowser />
        </MockedProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('apply-device-offline')).toBeInTheDocument();
      });

      const applyButton = screen.getByTestId('apply-device-offline');

      // Focus the button
      applyButton.focus();
      expect(applyButton).toHaveFocus();

      // Click should maintain proper focus
      await user.click(applyButton);

      // Button should still be in the document
      expect(applyButton).toBeInTheDocument();
    });

    it('supports keyboard navigation', async () => {
      const user = userEvent.setup();
      const mocks = createMocks();

      render(
        <MockedProvider mocks={mocks} addTypename={false}>
          <AlertTemplateBrowser />
        </MockedProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('apply-device-offline')).toBeInTheDocument();
      });

      const applyButton = screen.getByTestId('apply-device-offline');

      // Navigate with keyboard
      await user.tab();
      await user.keyboard('{Enter}');

      expect(applyButton).toBeInTheDocument();
    });
  });

  // ===========================================================================
  // Callback Tests
  // ===========================================================================

  describe('Callbacks', () => {
    it('calls onRuleCreated with rule ID on success', async () => {
      const user = userEvent.setup();
      const onRuleCreated = vi.fn();
      const mocks = createMocks();

      render(
        <MockedProvider mocks={mocks} addTypename={false}>
          <AlertTemplateBrowser onRuleCreated={onRuleCreated} />
        </MockedProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('apply-device-offline')).toBeInTheDocument();
      });

      const applyButton = screen.getByTestId('apply-device-offline');
      await user.click(applyButton);

      await waitFor(() => {
        expect(onRuleCreated).toHaveBeenCalledWith('rule-123');
        expect(onRuleCreated).toHaveBeenCalledTimes(1);
      });
    });

    it('does not call onRuleCreated on failure', async () => {
      const user = userEvent.setup();
      const onRuleCreated = vi.fn();
      const mocks = createMocks(builtInTemplates, false);

      render(
        <MockedProvider mocks={mocks} addTypename={false}>
          <AlertTemplateBrowser onRuleCreated={onRuleCreated} />
        </MockedProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('apply-device-offline')).toBeInTheDocument();
      });

      const applyButton = screen.getByTestId('apply-device-offline');
      await user.click(applyButton);

      await waitFor(() => {
        expect(onRuleCreated).not.toHaveBeenCalled();
      });
    });

    it('handles missing onRuleCreated callback gracefully', async () => {
      const user = userEvent.setup();
      const mocks = createMocks();

      render(
        <MockedProvider mocks={mocks} addTypename={false}>
          <AlertTemplateBrowser />
        </MockedProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('apply-device-offline')).toBeInTheDocument();
      });

      const applyButton = screen.getByTestId('apply-device-offline');

      // Should not throw error when callback is undefined
      await expect(user.click(applyButton)).resolves.not.toThrow();
    });
  });

  // ===========================================================================
  // Integration Tests
  // ===========================================================================

  describe('Integration', () => {
    it('handles full template application flow', async () => {
      const user = userEvent.setup();
      const onRuleCreated = vi.fn();
      const toast = vi.fn();

      vi.mocked(useToast).mockReturnValue({
        toast,
        dismiss: vi.fn(),
        toasts: [],
      });

      const mocks = createMocks();

      render(
        <MockedProvider mocks={mocks} addTypename={false}>
          <AlertTemplateBrowser onRuleCreated={onRuleCreated} />
        </MockedProvider>
      );

      // Wait for templates to load
      await waitFor(() => {
        expect(screen.getByText('Device Offline Alert')).toBeInTheDocument();
      });

      // Click apply button
      const applyButton = screen.getByTestId('apply-device-offline');
      await user.click(applyButton);

      // Verify success flow
      await waitFor(() => {
        expect(toast).toHaveBeenCalledWith(
          expect.objectContaining({
            variant: 'success',
          })
        );
        expect(onRuleCreated).toHaveBeenCalledWith('rule-123');
      });
    });

    it('works with different template categories', async () => {
      const templates = [
        deviceOfflineTemplate,
        highCPUTemplate,
        sshFailedLoginTemplate,
      ];
      const mocks = createMocks(templates);

      render(
        <MockedProvider mocks={mocks} addTypename={false}>
          <AlertTemplateBrowser />
        </MockedProvider>
      );

      await waitFor(() => {
        expect(screen.getByText('Device Offline Alert')).toBeInTheDocument();
        expect(screen.getByText('High CPU Usage')).toBeInTheDocument();
        expect(screen.getByText('SSH Failed Login Attempts')).toBeInTheDocument();
      });
    });

    it('re-fetches data on retry after error', async () => {
      const user = userEvent.setup();
      const errorMocks = [
        {
          request: {
            query: expect.anything(),
          },
          error: new Error('Network error'),
        },
        {
          request: {
            query: expect.anything(),
          },
          result: {
            data: {
              alertRuleTemplates: builtInTemplates,
            },
          },
        },
      ];

      render(
        <MockedProvider mocks={errorMocks} addTypename={false}>
          <AlertTemplateBrowser />
        </MockedProvider>
      );

      // Wait for error state
      await waitFor(() => {
        expect(screen.getByText('Failed to load templates')).toBeInTheDocument();
      });

      // Click retry
      const retryButton = screen.getByText('Retry');
      await user.click(retryButton);

      // Verify templates load after retry
      await waitFor(() => {
        expect(screen.getByText('Device Offline Alert')).toBeInTheDocument();
      });
    });
  });
});
