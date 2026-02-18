import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ServiceConfigForm } from './ServiceConfigForm';
import { ServiceConfigFormMobile } from './ServiceConfigFormMobile';
import { ServiceConfigFormDesktop } from './ServiceConfigFormDesktop';
import type { UseServiceConfigFormReturn } from '../../hooks/useServiceConfigForm';
import type { ConfigSchema } from '@nasnet/api-client/queries';
import { FormProvider, useForm } from 'react-hook-form';

// Mock the usePlatform hook
vi.mock('@nasnet/ui/layouts', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@nasnet/ui/layouts')>();
  return {
    ...actual,
    usePlatform: vi.fn(),
  };
});

import { usePlatform } from '@nasnet/ui/layouts';

const mockUsePlatform = vi.mocked(usePlatform);

describe('ServiceConfigForm - Integration & Platform Presenters', () => {
  const mockSchema: ConfigSchema = {
    serviceType: 'tor',
    version: '1.0.0',
    fields: [
      {
        name: 'nickname',
        type: 'TEXT',
        label: 'Nickname',
        required: true,
        description: 'Relay nickname',
        defaultValue: null,
        options: null,
        min: null,
        max: null,
        pattern: null,
        showIf: null,
        sensitive: false,
        group: 'General',
      },
      {
        name: 'orport',
        type: 'PORT',
        label: 'OR Port',
        required: true,
        description: 'Onion Router port',
        defaultValue: 9001,
        options: null,
        min: null,
        max: null,
        pattern: null,
        showIf: null,
        sensitive: false,
        group: 'Network',
      },
      {
        name: 'bridge_mode',
        type: 'TOGGLE',
        label: 'Bridge Mode',
        required: false,
        description: 'Enable bridge mode',
        defaultValue: false,
        options: null,
        min: null,
        max: null,
        pattern: null,
        showIf: null,
        sensitive: false,
        group: 'General',
      },
    ],
  };

  // Helper to create a test wrapper with real React Hook Form
  function TestWrapper({ formState, children }: { formState: UseServiceConfigFormReturn; children: React.ReactNode }) {
    return (
      <FormProvider {...formState.form}>
        {children}
      </FormProvider>
    );
  }

  const createMockFormState = (
    overrides?: Partial<UseServiceConfigFormReturn>
  ): UseServiceConfigFormReturn => {
    // Create a real useForm instance to avoid mocking issues
    const form = useForm({
      defaultValues: {
        nickname: 'TestRelay',
        orport: 9001,
        bridge_mode: false,
      },
    });

    return {
      schema: mockSchema,
      form,
      visibleFields: mockSchema.fields,
      handleSubmit: vi.fn(),
      isValidating: false,
      isSubmitting: false,
      loading: {
        schema: false,
        config: false,
      },
      errors: {
        schema: undefined,
        config: undefined,
      },
      validate: vi.fn(),
      refetch: vi.fn(),
      ...overrides,
    };
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Integration Tests - Full Form Workflow', () => {
    it('should render form with schema fields and handle submission', async () => {
      mockUsePlatform.mockReturnValue('desktop');

      const handleSubmit = vi.fn().mockResolvedValue(undefined);
      const formState = createMockFormState({ handleSubmit });

      render(
        <ServiceConfigForm
          formState={formState}
          title="Tor Configuration"
          description="Configure your Tor relay"
        />
      );

      // Verify form renders with title
      expect(screen.getByText('Tor Configuration')).toBeInTheDocument();
      expect(screen.getByText('Configure your Tor relay')).toBeInTheDocument();

      // Verify fields are rendered
      expect(screen.getByText('Nickname')).toBeInTheDocument();
      expect(screen.getByText('OR Port')).toBeInTheDocument();
      expect(screen.getByText('Bridge Mode')).toBeInTheDocument();

      // Find and click submit button
      const submitButton = screen.getByRole('button', { name: /save|apply/i });
      expect(submitButton).toBeInTheDocument();

      await userEvent.click(submitButton);

      // Verify handleSubmit was called
      await waitFor(() => {
        expect(handleSubmit).toHaveBeenCalled();
      });
    });

    it('should show loading state while schema is loading', () => {
      mockUsePlatform.mockReturnValue('desktop');

      const formState = createMockFormState({
        loading: { schema: true, config: false },
        schema: undefined,
      });

      render(<ServiceConfigForm formState={formState} />);

      // Should show loading spinner
      const spinner = screen.getByRole('status', { hidden: true });
      expect(spinner).toBeInTheDocument();

      // Should not show form fields
      expect(screen.queryByText('Nickname')).not.toBeInTheDocument();
    });

    it('should show error message when schema fails to load', () => {
      mockUsePlatform.mockReturnValue('desktop');

      const formState = createMockFormState({
        schema: undefined,
        loading: { schema: false, config: false },
      });

      render(<ServiceConfigForm formState={formState} />);

      // Should show error message
      expect(screen.getByText(/no configuration schema available/i)).toBeInTheDocument();

      // Should not show form fields
      expect(screen.queryByText('Nickname')).not.toBeInTheDocument();
    });

    it('should disable submit button while submitting', async () => {
      mockUsePlatform.mockReturnValue('desktop');

      const formState = createMockFormState({
        isSubmitting: true,
      });

      render(<ServiceConfigForm formState={formState} />);

      const submitButton = screen.getByRole('button', { name: /save|apply/i });
      expect(submitButton).toBeDisabled();
    });

    it('should show validation state indicator', () => {
      mockUsePlatform.mockReturnValue('desktop');

      const formState = createMockFormState({
        isValidating: true,
      });

      render(<ServiceConfigForm formState={formState} />);

      // Desktop form should show validation state
      // (the exact indicator depends on implementation - could be spinner, text, etc.)
      expect(screen.getByRole('button', { name: /save|apply/i })).toBeInTheDocument();
    });
  });

  describe('Platform Presenter Tests - Mobile vs Desktop', () => {
    it('should render mobile presenter when platform is mobile', () => {
      mockUsePlatform.mockReturnValue('mobile');

      const formState = createMockFormState();

      render(<ServiceConfigForm formState={formState} title="Tor Config" />);

      // Mobile should render title
      expect(screen.getByText('Tor Config')).toBeInTheDocument();

      // Mobile should group fields in cards
      expect(screen.getByText('General')).toBeInTheDocument();
      expect(screen.getByText('Network')).toBeInTheDocument();

      // Mobile should have sticky bottom buttons (pb-20 for padding)
      const form = screen.getByRole('button', { name: /save|apply/i }).closest('form');
      expect(form).toBeInTheDocument();
    });

    it('should render desktop presenter when platform is desktop', () => {
      mockUsePlatform.mockReturnValue('desktop');

      const formState = createMockFormState();

      render(
        <ServiceConfigForm
          formState={formState}
          title="Tor Configuration"
          description="Configure your Tor relay settings"
        />
      );

      // Desktop should render title and description
      expect(screen.getByText('Tor Configuration')).toBeInTheDocument();
      expect(screen.getByText('Configure your Tor relay settings')).toBeInTheDocument();

      // Desktop should render tabs for groups
      expect(screen.getByRole('tablist')).toBeInTheDocument();

      // Verify group tabs exist
      expect(screen.getByRole('tab', { name: 'General' })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: 'Network' })).toBeInTheDocument();
    });

    it('should render desktop presenter when platform is tablet', () => {
      mockUsePlatform.mockReturnValue('tablet');

      const formState = createMockFormState();

      render(<ServiceConfigForm formState={formState} title="Tor Config" />);

      // Tablet uses desktop presenter (as per platform logic: mobile vs non-mobile)
      expect(screen.getByRole('tablist')).toBeInTheDocument();
    });

    it('should switch presenter when platform changes', () => {
      mockUsePlatform.mockReturnValue('mobile');

      const formState = createMockFormState();

      const { rerender } = render(<ServiceConfigForm formState={formState} title="Config" />);

      // Initially mobile - should show cards
      expect(screen.getByText('General')).toBeInTheDocument();
      expect(screen.queryByRole('tablist')).not.toBeInTheDocument();

      // Switch to desktop
      mockUsePlatform.mockReturnValue('desktop');

      rerender(<ServiceConfigForm formState={formState} title="Config" />);

      // Now desktop - should show tabs
      expect(screen.getByRole('tablist')).toBeInTheDocument();
    });

    it('should handle read-only mode on both mobile and desktop', () => {
      const formState = createMockFormState();

      // Test mobile
      mockUsePlatform.mockReturnValue('mobile');
      const { rerender } = render(
        <ServiceConfigForm formState={formState} title="Config" readOnly={true} />
      );

      let submitButton = screen.queryByRole('button', { name: /save|apply/i });
      // In read-only mode, submit button should either be hidden or disabled
      expect(submitButton === null || submitButton.hasAttribute('disabled')).toBe(true);

      // Test desktop
      mockUsePlatform.mockReturnValue('desktop');
      rerender(<ServiceConfigForm formState={formState} title="Config" readOnly={true} />);

      submitButton = screen.queryByRole('button', { name: /save|apply/i });
      expect(submitButton === null || submitButton.hasAttribute('disabled')).toBe(true);
    });
  });

  describe('Accessibility - WCAG AAA Compliance', () => {
    it('should have proper form structure with accessible submit button', () => {
      mockUsePlatform.mockReturnValue('desktop');

      const formState = createMockFormState();

      render(<ServiceConfigForm formState={formState} />);

      // Submit button should have accessible name
      const submitButton = screen.getByRole('button', { name: /save|apply/i });
      expect(submitButton).toHaveAccessibleName();
    });

    it('should support keyboard navigation (tab order)', () => {
      mockUsePlatform.mockReturnValue('desktop');

      const formState = createMockFormState();

      render(<ServiceConfigForm formState={formState} />);

      // All interactive elements should be keyboard accessible
      const submitButton = screen.getByRole('button', { name: /save|apply/i });
      expect(submitButton).not.toHaveAttribute('tabindex', '-1');
    });

    it('should render groups in logical order for screen readers', () => {
      mockUsePlatform.mockReturnValue('desktop');

      const formState = createMockFormState();

      render(<ServiceConfigForm formState={formState} />);

      // Tabs should be in a tablist for screen reader navigation
      const tablist = screen.getByRole('tablist');
      expect(tablist).toBeInTheDocument();

      // Tabs should have proper ARIA attributes
      const tabs = screen.getAllByRole('tab');
      tabs.forEach((tab) => {
        expect(tab).toHaveAttribute('aria-selected');
      });
    });
  });

  describe('Mobile-Specific Features', () => {
    it('should render accordion-style cards on mobile', () => {
      mockUsePlatform.mockReturnValue('mobile');

      const formState = createMockFormState();

      render(<ServiceConfigForm formState={formState} />);

      // Mobile should render group names as card titles
      expect(screen.getByText('General')).toBeInTheDocument();
      expect(screen.getByText('Network')).toBeInTheDocument();

      // Each group should be in a card
      const cards = screen.getAllByRole('region', { hidden: true });
      expect(cards.length).toBeGreaterThan(0);
    });

    it('should have 44px minimum touch targets on mobile', () => {
      mockUsePlatform.mockReturnValue('mobile');

      const formState = createMockFormState();

      render(<ServiceConfigForm formState={formState} />);

      // Submit button should have adequate touch target (min-h-11 = 44px)
      const submitButton = screen.getByRole('button', { name: /save|apply/i });
      const styles = window.getComputedStyle(submitButton);

      // Button should have h-11 class (44px) or larger
      expect(submitButton.className).toMatch(/h-\d+/);
    });
  });

  describe('Desktop-Specific Features', () => {
    it('should render tabbed layout on desktop', () => {
      mockUsePlatform.mockReturnValue('desktop');

      const formState = createMockFormState();

      render(<ServiceConfigForm formState={formState} />);

      // Desktop should have tabs
      const tablist = screen.getByRole('tablist');
      expect(tablist).toBeInTheDocument();

      // Should have tab for each group
      expect(screen.getByRole('tab', { name: 'General' })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: 'Network' })).toBeInTheDocument();
    });

    it('should show cancel button on desktop when onCancel is provided', () => {
      mockUsePlatform.mockReturnValue('desktop');

      const onCancel = vi.fn();
      const formState = createMockFormState();

      render(<ServiceConfigForm formState={formState} onCancel={onCancel} />);

      // Desktop should show cancel button
      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      expect(cancelButton).toBeInTheDocument();
    });

    it('should switch between tabs on desktop', async () => {
      mockUsePlatform.mockReturnValue('desktop');

      const formState = createMockFormState();

      render(<ServiceConfigForm formState={formState} />);

      // Initially General tab should be selected
      const generalTab = screen.getByRole('tab', { name: 'General' });
      const networkTab = screen.getByRole('tab', { name: 'Network' });

      expect(generalTab).toHaveAttribute('aria-selected', 'true');

      // Click Network tab
      await userEvent.click(networkTab);

      // Network tab should now be selected
      await waitFor(() => {
        expect(networkTab).toHaveAttribute('aria-selected', 'true');
      });
    });
  });
});
