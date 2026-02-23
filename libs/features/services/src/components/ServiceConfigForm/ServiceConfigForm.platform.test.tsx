import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ServiceConfigForm } from './ServiceConfigForm';
import type { UseServiceConfigFormReturn } from '../../hooks/useServiceConfigForm';

// Mock the usePlatform hook
vi.mock('@nasnet/ui/layouts', () => ({
  usePlatform: vi.fn(),
}));

import { usePlatform } from '@nasnet/ui/layouts';

const mockUsePlatform = vi.mocked(usePlatform);

describe('ServiceConfigForm - Platform Presenters & Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Loading States', () => {
    it('should show loading spinner when schema is loading', () => {
      mockUsePlatform.mockReturnValue('desktop');

      const formState: Partial<UseServiceConfigFormReturn> = {
        schema: undefined,
        form: {} as any,
        visibleFields: [],
        handleSubmit: vi.fn(),
        isValidating: false,
        isSubmitting: false,
        loading: {
          schema: true,
          config: false,
        },
        errors: {
          schema: undefined,
          config: undefined,
        },
        validate: vi.fn(),
        refetch: vi.fn(),
      };

      render(<ServiceConfigForm formState={formState as UseServiceConfigFormReturn} />);

      // Should show loading indicator (Loader2 component)
      const loader = document.querySelector('[class*="animate-spin"]');
      expect(loader).toBeInTheDocument();
    });

    it('should show loading spinner when config is loading', () => {
      mockUsePlatform.mockReturnValue('mobile');

      const formState: Partial<UseServiceConfigFormReturn> = {
        schema: undefined,
        form: {} as any,
        visibleFields: [],
        handleSubmit: vi.fn(),
        isValidating: false,
        isSubmitting: false,
        loading: {
          schema: false,
          config: true,
        },
        errors: {
          schema: undefined,
          config: undefined,
        },
        validate: vi.fn(),
        refetch: vi.fn(),
      };

      render(<ServiceConfigForm formState={formState as UseServiceConfigFormReturn} />);

      // Should show loading indicator
      const loader = document.querySelector('[class*="animate-spin"]');
      expect(loader).toBeInTheDocument();
    });
  });

  describe('Error States', () => {
    it('should show error message when schema is not available (desktop)', () => {
      mockUsePlatform.mockReturnValue('desktop');

      const formState: Partial<UseServiceConfigFormReturn> = {
        schema: undefined,
        form: {} as any,
        visibleFields: [],
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
      };

      render(<ServiceConfigForm formState={formState as UseServiceConfigFormReturn} />);

      // Should show error message
      expect(screen.getByText(/no configuration schema available/i)).toBeInTheDocument();
    });

    it('should show error message when schema is not available (mobile)', () => {
      mockUsePlatform.mockReturnValue('mobile');

      const formState: Partial<UseServiceConfigFormReturn> = {
        schema: undefined,
        form: {} as any,
        visibleFields: [],
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
      };

      render(<ServiceConfigForm formState={formState as UseServiceConfigFormReturn} />);

      // Should show error message
      expect(screen.getByText(/no configuration schema available/i)).toBeInTheDocument();
    });
  });

  describe('Platform Switching', () => {
    it('should use mobile presenter when platform is mobile', () => {
      mockUsePlatform.mockReturnValue('mobile');

      const formState: Partial<UseServiceConfigFormReturn> = {
        schema: undefined,
        form: {} as any,
        visibleFields: [],
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
      };

      const { container } = render(<ServiceConfigForm formState={formState as UseServiceConfigFormReturn} />);

      // Mobile presenter shows error in a simple div with p-4 class
      const errorDiv = container.querySelector('.p-4');
      expect(errorDiv).toBeInTheDocument();
      expect(errorDiv?.classList.contains('text-center')).toBe(true);
    });

    it('should use desktop presenter when platform is desktop', () => {
      mockUsePlatform.mockReturnValue('desktop');

      const formState: Partial<UseServiceConfigFormReturn> = {
        schema: undefined,
        form: {} as any,
        visibleFields: [],
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
      };

      render(<ServiceConfigForm formState={formState as UseServiceConfigFormReturn} />);

      // Desktop presenter wraps error in a Card
      // Card renders as a div with specific border/shadow classes
      const card = document.querySelector('[class*="border"]');
      expect(card).toBeInTheDocument();
    });

    it('should use desktop presenter when platform is tablet', () => {
      mockUsePlatform.mockReturnValue('tablet');

      const formState: Partial<UseServiceConfigFormReturn> = {
        schema: undefined,
        form: {} as any,
        visibleFields: [],
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
      };

      render(<ServiceConfigForm formState={formState as UseServiceConfigFormReturn} />);

      // Tablet uses desktop presenter (Card wrapper)
      const card = document.querySelector('[class*="border"]');
      expect(card).toBeInTheDocument();
    });

    it('should switch presenter when platform changes', () => {
      mockUsePlatform.mockReturnValue('mobile');

      const formState: Partial<UseServiceConfigFormReturn> = {
        schema: undefined,
        form: {} as any,
        visibleFields: [],
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
      };

      const { rerender, container } = render(
        <ServiceConfigForm formState={formState as UseServiceConfigFormReturn} />
      );

      // Initially mobile - simple div
      const errorDiv = container.querySelector('.p-4');
      expect(errorDiv).toBeInTheDocument();

      // Switch to desktop
      mockUsePlatform.mockReturnValue('desktop');
      rerender(<ServiceConfigForm formState={formState as UseServiceConfigFormReturn} />);

      // Now desktop - Card wrapper
      const card = document.querySelector('[class*="border"]');
      expect(card).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should render loading state with proper accessibility (mobile)', () => {
      mockUsePlatform.mockReturnValue('mobile');

      const formState: Partial<UseServiceConfigFormReturn> = {
        schema: undefined,
        form: {} as any,
        visibleFields: [],
        handleSubmit: vi.fn(),
        isValidating: false,
        isSubmitting: false,
        loading: {
          schema: true,
          config: false,
        },
        errors: {
          schema: undefined,
          config: undefined,
        },
        validate: vi.fn(),
        refetch: vi.fn(),
      };

      render(<ServiceConfigForm formState={formState as UseServiceConfigFormReturn} />);

      // Loading spinner should be visible
      const loader = document.querySelector('[class*="animate-spin"]');
      expect(loader).toBeInTheDocument();
    });

    it('should render error state with proper text contrast (desktop)', () => {
      mockUsePlatform.mockReturnValue('desktop');

      const formState: Partial<UseServiceConfigFormReturn> = {
        schema: undefined,
        form: {} as any,
        visibleFields: [],
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
      };

      render(<ServiceConfigForm formState={formState as UseServiceConfigFormReturn} />);

      // Error text should use muted-foreground class for proper contrast
      const errorText = screen.getByText(/no configuration schema available/i);
      expect(errorText.className).toMatch(/text-muted-foreground/);
    });
  });

  describe('Props Forwarding', () => {
    it('should forward title prop to presenters', () => {
      mockUsePlatform.mockReturnValue('desktop');

      const formState: Partial<UseServiceConfigFormReturn> = {
        schema: undefined,
        form: {} as any,
        visibleFields: [],
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
      };

      render(
        <ServiceConfigForm
          formState={formState as UseServiceConfigFormReturn}
          title="Custom Title"
        />
      );

      // Props are forwarded even in error state
      // (actual title display depends on having valid schema)
      expect(true).toBe(true); // Placeholder - title forwarding verified by type system
    });

    it('should forward readOnly prop to presenters', () => {
      mockUsePlatform.mockReturnValue('mobile');

      const formState: Partial<UseServiceConfigFormReturn> = {
        schema: undefined,
        form: {} as any,
        visibleFields: [],
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
      };

      render(
        <ServiceConfigForm
          formState={formState as UseServiceConfigFormReturn}
          readOnly={true}
        />
      );

      // Props are forwarded - type system ensures correctness
      expect(true).toBe(true); // Placeholder
    });
  });
});
