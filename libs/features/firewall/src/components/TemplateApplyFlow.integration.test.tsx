/**
 * Integration Tests for Template Apply Flow
 *
 * Tests the complete user flow from template selection to successful application,
 * including preview, confirmation, and rollback scenarios.
 *
 * Coverage:
 * - Full apply flow: select → configure → preview → confirm → apply → success
 * - Rollback flow: apply → rollback → success
 * - Error handling with auto-rollback
 * - High-risk operation confirmation
 * - Conflict detection and handling
 * - Variable validation and form errors
 *
 * @see libs/features/firewall/src/components/TemplateApplyFlow.tsx
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { TemplateApplyFlow } from './TemplateApplyFlow';
import {
  mockBasicSecurityTemplate,
  mockHomeNetworkTemplate,
  mockPreviewResult,
  mockPreviewResultWithConflicts,
  mockSuccessfulApplyResult,
  mockPartialFailureResult,
  mockHighImpactAnalysis,
  generateMockVariables,
} from '../../__test-utils__/firewall-templates/template-fixtures';
import type { TemplatePreviewResult } from '../schemas/templateSchemas';

// Mock API functions
const mockPreviewTemplate = vi.fn();
const mockApplyTemplate = vi.fn();
const mockRollbackTemplate = vi.fn();

// Mock TanStack Query hooks
vi.mock('@nasnet/api-client/queries', () => ({
  usePreviewTemplate: () => ({
    mutateAsync: mockPreviewTemplate,
    isPending: false,
  }),
  useApplyFirewallTemplate: () => ({
    mutateAsync: mockApplyTemplate,
    isPending: false,
  }),
  useRollbackTemplate: () => ({
    mutateAsync: mockRollbackTemplate,
    isPending: false,
  }),
}));

describe('TemplateApplyFlow - Integration Tests', () => {
  let queryClient: QueryClient;
  let user: ReturnType<typeof userEvent.setup>;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
    user = userEvent.setup();

    // Reset mocks
    mockPreviewTemplate.mockReset();
    mockApplyTemplate.mockReset();
    mockRollbackTemplate.mockReset();

    // Default mock responses
    mockPreviewTemplate.mockResolvedValue(mockPreviewResult);
    mockApplyTemplate.mockResolvedValue(mockSuccessfulApplyResult);
    mockRollbackTemplate.mockResolvedValue(true);
  });

  const renderApplyFlow = (routerId: string = 'router-1') => {
    return render(
      <QueryClientProvider client={queryClient}>
        <TemplateApplyFlow
          routerId={routerId}
          template={mockBasicSecurityTemplate}
          onPreview={async (params) => mockPreviewResult}
          onApply={async (params) => mockSuccessfulApplyResult}
          onRollback={async (params) => {}}
        />
      </QueryClientProvider>
    );
  };

  describe('Full Apply Flow - Happy Path', () => {
    it('should complete full apply flow successfully', async () => {
      renderApplyFlow();

      // Step 1: Select template
      const templateCard = screen.getByText(mockBasicSecurityTemplate.name);
      await user.click(templateCard);

      // Verify template is selected
      expect(screen.getByText(mockBasicSecurityTemplate.description)).toBeInTheDocument();

      // Step 2: Configure variables (default values should be pre-filled)
      const lanInterfaceInput = screen.getByLabelText(/LAN Interface/i);
      expect(lanInterfaceInput).toHaveValue('bridge1');

      // Step 3: Generate preview
      const previewButton = screen.getByRole('button', { name: /preview/i });
      await user.click(previewButton);

      // Wait for preview to complete
      await waitFor(() => {
        expect(mockPreviewTemplate).toHaveBeenCalledWith({
          routerId: 'router-1',
          templateId: mockBasicSecurityTemplate.id,
          variables: expect.any(Object),
        });
      });

      // Verify preview results are displayed
      expect(screen.getByText(/5 rules will be created/i)).toBeInTheDocument();
      expect(screen.getByText(/No conflicts detected/i)).toBeInTheDocument();

      // Step 4: Confirm and apply
      const applyButton = screen.getByRole('button', { name: /apply template/i });
      await user.click(applyButton);

      // Wait for apply to complete
      await waitFor(() => {
        expect(mockApplyTemplate).toHaveBeenCalledWith({
          routerId: 'router-1',
          templateId: mockBasicSecurityTemplate.id,
          variables: expect.any(Object),
        });
      });

      // Verify success message
      expect(screen.getByText(/template applied successfully/i)).toBeInTheDocument();
      expect(screen.getByText(/rollback available/i)).toBeInTheDocument();
    });

    it('should allow changing variables before preview', async () => {
      renderApplyFlow();

      // Select template
      const templateCard = screen.getByText(mockBasicSecurityTemplate.name);
      await user.click(templateCard);

      // Change LAN interface
      const lanInterfaceInput = screen.getByLabelText(/LAN Interface/i);
      await user.clear(lanInterfaceInput);
      await user.type(lanInterfaceInput, 'ether2');

      // Change LAN subnet
      const lanSubnetInput = screen.getByLabelText(/LAN Subnet/i);
      await user.clear(lanSubnetInput);
      await user.type(lanSubnetInput, '10.0.0.0/24');

      // Generate preview
      const previewButton = screen.getByRole('button', { name: /preview/i });
      await user.click(previewButton);

      await waitFor(() => {
        expect(mockPreviewTemplate).toHaveBeenCalledWith(
          expect.objectContaining({
            variables: expect.objectContaining({
              LAN_INTERFACE: 'ether2',
              LAN_SUBNET: '10.0.0.0/24',
            }),
          })
        );
      });
    });

    it('should display preview results in readable format', async () => {
      renderApplyFlow();

      const templateCard = screen.getByText(mockBasicSecurityTemplate.name);
      await user.click(templateCard);

      const previewButton = screen.getByRole('button', { name: /preview/i });
      await user.click(previewButton);

      await waitFor(() => {
        expect(screen.getByText(/5 rules will be created/i)).toBeInTheDocument();
      });

      // Check impact analysis
      expect(screen.getByText(/estimated apply time: 2 seconds/i)).toBeInTheDocument();
      expect(screen.getByText(/affected chains: input, forward/i)).toBeInTheDocument();

      // Check rule preview
      const rulesList = screen.getByRole('list', { name: /preview rules/i });
      const rules = within(rulesList).getAllByRole('listitem');
      expect(rules.length).toBe(3); // Based on mockPreviewResult
    });
  });

  describe('High-Risk Operation Flow', () => {
    it('should require confirmation for high-risk templates', async () => {
      const highRiskPreview: TemplatePreviewResult = {
        ...mockPreviewResult,
        impactAnalysis: mockHighImpactAnalysis,
      };

      mockPreviewTemplate.mockResolvedValue(highRiskPreview);

      renderApplyFlow();

      const templateCard = screen.getByText(mockBasicSecurityTemplate.name);
      await user.click(templateCard);

      const previewButton = screen.getByRole('button', { name: /preview/i });
      await user.click(previewButton);

      await waitFor(() => {
        expect(screen.getByText(/15 rules will be created/i)).toBeInTheDocument();
      });

      // Click apply
      const applyButton = screen.getByRole('button', { name: /apply template/i });
      await user.click(applyButton);

      // Verify confirmation dialog appears
      await waitFor(() => {
        expect(screen.getByText(/high-risk operation/i)).toBeInTheDocument();
      });

      expect(screen.getByText(/this operation affects multiple chains/i)).toBeInTheDocument();

      // Confirm high-risk operation
      const confirmButton = screen.getByRole('button', { name: /i understand, proceed/i });
      await user.click(confirmButton);

      // Verify apply is executed after confirmation
      await waitFor(() => {
        expect(mockApplyTemplate).toHaveBeenCalled();
      });
    });

    it('should allow canceling high-risk confirmation', async () => {
      const highRiskPreview: TemplatePreviewResult = {
        ...mockPreviewResult,
        impactAnalysis: mockHighImpactAnalysis,
      };

      mockPreviewTemplate.mockResolvedValue(highRiskPreview);

      renderApplyFlow();

      const templateCard = screen.getByText(mockBasicSecurityTemplate.name);
      await user.click(templateCard);

      const previewButton = screen.getByRole('button', { name: /preview/i });
      await user.click(previewButton);

      await waitFor(() => {
        expect(screen.getByText(/15 rules will be created/i)).toBeInTheDocument();
      });

      const applyButton = screen.getByRole('button', { name: /apply template/i });
      await user.click(applyButton);

      await waitFor(() => {
        expect(screen.getByText(/high-risk operation/i)).toBeInTheDocument();
      });

      // Cancel
      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      await user.click(cancelButton);

      // Verify we're back to reviewing state
      expect(screen.queryByText(/high-risk operation/i)).not.toBeInTheDocument();
      expect(mockApplyTemplate).not.toHaveBeenCalled();
    });
  });

  describe('Conflict Detection and Handling', () => {
    it('should display conflicts when detected', async () => {
      mockPreviewTemplate.mockResolvedValue(mockPreviewResultWithConflicts);

      renderApplyFlow();

      const templateCard = screen.getByText(mockHomeNetworkTemplate.name);
      await user.click(templateCard);

      const previewButton = screen.getByRole('button', { name: /preview/i });
      await user.click(previewButton);

      await waitFor(() => {
        expect(screen.getByText(/2 conflicts detected/i)).toBeInTheDocument();
      });

      // Auto-switch to conflicts tab
      expect(screen.getByRole('tab', { name: /conflicts/i, selected: true })).toBeInTheDocument();

      // Display conflict details
      expect(screen.getByText(/duplicate rule/i)).toBeInTheDocument();
      expect(screen.getByText(/ip overlap/i)).toBeInTheDocument();
    });

    it('should prevent apply when conflicts exist', async () => {
      mockPreviewTemplate.mockResolvedValue(mockPreviewResultWithConflicts);

      renderApplyFlow();

      const templateCard = screen.getByText(mockHomeNetworkTemplate.name);
      await user.click(templateCard);

      const previewButton = screen.getByRole('button', { name: /preview/i });
      await user.click(previewButton);

      await waitFor(() => {
        expect(screen.getByText(/2 conflicts detected/i)).toBeInTheDocument();
      });

      // Apply button should be disabled
      const applyButton = screen.getByRole('button', { name: /apply template/i });
      expect(applyButton).toBeDisabled();
    });

    it('should allow going back to edit variables after seeing conflicts', async () => {
      mockPreviewTemplate.mockResolvedValue(mockPreviewResultWithConflicts);

      renderApplyFlow();

      const templateCard = screen.getByText(mockHomeNetworkTemplate.name);
      await user.click(templateCard);

      const previewButton = screen.getByRole('button', { name: /preview/i });
      await user.click(previewButton);

      await waitFor(() => {
        expect(screen.getByText(/2 conflicts detected/i)).toBeInTheDocument();
      });

      // Click "Edit Variables" button
      const editButton = screen.getByRole('button', { name: /edit variables/i });
      await user.click(editButton);

      // Verify we're back to variable editing
      expect(screen.getByLabelText(/LAN Interface/i)).toBeInTheDocument();
    });
  });

  describe('Rollback Flow', () => {
    it('should execute rollback successfully', async () => {
      renderApplyFlow();

      // Complete apply flow
      const templateCard = screen.getByText(mockBasicSecurityTemplate.name);
      await user.click(templateCard);

      const previewButton = screen.getByRole('button', { name: /preview/i });
      await user.click(previewButton);

      await waitFor(() => {
        expect(mockPreviewTemplate).toHaveBeenCalled();
      });

      const applyButton = screen.getByRole('button', { name: /apply template/i });
      await user.click(applyButton);

      await waitFor(() => {
        expect(screen.getByText(/template applied successfully/i)).toBeInTheDocument();
      });

      // Execute rollback
      const rollbackButton = screen.getByRole('button', { name: /rollback/i });
      await user.click(rollbackButton);

      // Confirm rollback
      const confirmRollbackButton = screen.getByRole('button', { name: /confirm rollback/i });
      await user.click(confirmRollbackButton);

      await waitFor(() => {
        expect(mockRollbackTemplate).toHaveBeenCalledWith({
          routerId: 'router-1',
          rollbackId: mockSuccessfulApplyResult.rollbackId,
        });
      });

      // Verify rollback success message
      expect(screen.getByText(/changes rolled back successfully/i)).toBeInTheDocument();
    });

    it('should display rollback timer (5 minutes)', async () => {
      vi.useFakeTimers();

      renderApplyFlow();

      const templateCard = screen.getByText(mockBasicSecurityTemplate.name);
      await user.click(templateCard);

      const previewButton = screen.getByRole('button', { name: /preview/i });
      await user.click(previewButton);

      await waitFor(() => {
        expect(mockPreviewTemplate).toHaveBeenCalled();
      });

      const applyButton = screen.getByRole('button', { name: /apply template/i });
      await user.click(applyButton);

      await waitFor(() => {
        expect(screen.getByText(/template applied successfully/i)).toBeInTheDocument();
      });

      // Verify timer is displayed
      expect(screen.getByText(/rollback available for/i)).toBeInTheDocument();
      expect(screen.getByText(/4:59/i)).toBeInTheDocument(); // 5 minutes countdown

      // Fast-forward 2 minutes
      vi.advanceTimersByTime(2 * 60 * 1000);

      await waitFor(() => {
        expect(screen.getByText(/2:59/i)).toBeInTheDocument();
      });

      vi.restoreAllMocks();
    });
  });

  describe('Error Handling', () => {
    it('should display error message when preview fails', async () => {
      const errorMessage = 'Failed to connect to router';
      mockPreviewTemplate.mockRejectedValue(new Error(errorMessage));

      renderApplyFlow();

      const templateCard = screen.getByText(mockBasicSecurityTemplate.name);
      await user.click(templateCard);

      const previewButton = screen.getByRole('button', { name: /preview/i });
      await user.click(previewButton);

      await waitFor(() => {
        expect(screen.getByText(errorMessage)).toBeInTheDocument();
      });

      // Verify retry button is available
      expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
    });

    it('should allow retrying after preview error', async () => {
      let callCount = 0;
      mockPreviewTemplate.mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          return Promise.reject(new Error('Temporary error'));
        }
        return Promise.resolve(mockPreviewResult);
      });

      renderApplyFlow();

      const templateCard = screen.getByText(mockBasicSecurityTemplate.name);
      await user.click(templateCard);

      const previewButton = screen.getByRole('button', { name: /preview/i });
      await user.click(previewButton);

      await waitFor(() => {
        expect(screen.getByText(/temporary error/i)).toBeInTheDocument();
      });

      // Click retry
      const retryButton = screen.getByRole('button', { name: /retry/i });
      await user.click(retryButton);

      await waitFor(() => {
        expect(screen.getByText(/5 rules will be created/i)).toBeInTheDocument();
      });
    });

    it('should handle apply failure with auto-rollback', async () => {
      mockApplyTemplate.mockResolvedValue(mockPartialFailureResult);

      renderApplyFlow();

      const templateCard = screen.getByText(mockBasicSecurityTemplate.name);
      await user.click(templateCard);

      const previewButton = screen.getByRole('button', { name: /preview/i });
      await user.click(previewButton);

      await waitFor(() => {
        expect(mockPreviewTemplate).toHaveBeenCalled();
      });

      const applyButton = screen.getByRole('button', { name: /apply template/i });
      await user.click(applyButton);

      await waitFor(() => {
        expect(screen.getByText(/apply failed/i)).toBeInTheDocument();
      });

      // Display error details
      expect(screen.getByText(/failed to create rule in position 4/i)).toBeInTheDocument();

      // Verify rollback option is available
      expect(screen.getByRole('button', { name: /rollback/i })).toBeInTheDocument();
    });
  });

  describe('Form Validation', () => {
    it('should prevent preview with invalid variables', async () => {
      renderApplyFlow();

      const templateCard = screen.getByText(mockBasicSecurityTemplate.name);
      await user.click(templateCard);

      // Enter invalid subnet
      const lanSubnetInput = screen.getByLabelText(/LAN Subnet/i);
      await user.clear(lanSubnetInput);
      await user.type(lanSubnetInput, 'invalid-subnet');

      // Preview button should be disabled
      const previewButton = screen.getByRole('button', { name: /preview/i });
      await waitFor(() => {
        expect(previewButton).toBeDisabled();
      });

      // Display validation error
      expect(screen.getByText(/invalid subnet format/i)).toBeInTheDocument();
    });

    it('should validate required fields', async () => {
      renderApplyFlow();

      const templateCard = screen.getByText(mockBasicSecurityTemplate.name);
      await user.click(templateCard);

      // Clear required field
      const lanInterfaceInput = screen.getByLabelText(/LAN Interface/i);
      await user.clear(lanInterfaceInput);

      // Display validation error
      await waitFor(() => {
        expect(screen.getByText(/required/i)).toBeInTheDocument();
      });

      // Preview button should be disabled
      const previewButton = screen.getByRole('button', { name: /preview/i });
      expect(previewButton).toBeDisabled();
    });
  });

  describe('Cancel Flow', () => {
    it('should allow canceling from variable configuration', async () => {
      renderApplyFlow();

      const templateCard = screen.getByText(mockBasicSecurityTemplate.name);
      await user.click(templateCard);

      // Cancel
      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      await user.click(cancelButton);

      // Verify we're back to template selection
      expect(screen.queryByLabelText(/LAN Interface/i)).not.toBeInTheDocument();
    });

    it('should allow canceling from preview review', async () => {
      renderApplyFlow();

      const templateCard = screen.getByText(mockBasicSecurityTemplate.name);
      await user.click(templateCard);

      const previewButton = screen.getByRole('button', { name: /preview/i });
      await user.click(previewButton);

      await waitFor(() => {
        expect(screen.getByText(/5 rules will be created/i)).toBeInTheDocument();
      });

      // Cancel
      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      await user.click(cancelButton);

      // Verify we're back to template selection
      expect(screen.queryByText(/5 rules will be created/i)).not.toBeInTheDocument();
    });
  });
});
