/**
 * FormSection Component Tests
 *
 * Comprehensive tests for the FormSection component system including:
 * - Hook tests for collapse state and localStorage persistence
 * - Component rendering tests
 * - Collapsible behavior tests
 * - Error display tests
 * - Accessibility tests with axe-core
 *
 * @module @nasnet/ui/patterns/form-section
 * @see NAS-4A.13: Build Form Section Component
 */

import { render, screen, waitFor, act , renderHook } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { axe } from 'vitest-axe';

import { FormSection } from './FormSection';
import { FormSectionErrors } from './FormSectionErrors';
import { useFormSection, slugify } from './useFormSection';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] ?? null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    }),
  };
})();

Object.defineProperty(window, 'localStorage', { value: localStorageMock });

// Mock matchMedia for reduced motion tests
const mockMatchMedia = (matches: boolean) => {
  window.matchMedia = vi.fn().mockImplementation((query: string) => ({
    matches,
    media: query,
    onchange: null,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }));
};

describe('slugify utility', () => {
  it('converts to lowercase', () => {
    expect(slugify('Hello World')).toBe('hello-world');
  });

  it('replaces spaces with hyphens', () => {
    expect(slugify('network settings')).toBe('network-settings');
  });

  it('removes special characters', () => {
    expect(slugify('IP & DNS (Config)')).toBe('ip--dns-config');
  });

  it('handles multiple spaces by collapsing them', () => {
    // \s+ replaces one or more spaces with single hyphen
    expect(slugify('multiple   spaces')).toBe('multiple-spaces');
  });
});

describe('useFormSection hook', () => {
  beforeEach(() => {
    localStorageMock.clear();
    vi.clearAllMocks();
  });

  describe('initial state', () => {
    it('initializes with defaultOpen when no stored value exists', () => {
      const { result } = renderHook(() =>
        useFormSection({
          storageKey: 'test-section',
          defaultOpen: true,
          collapsible: true,
        })
      );

      expect(result.current.isExpanded).toBe(true);
    });

    it('initializes collapsed when defaultOpen is false', () => {
      const { result } = renderHook(() =>
        useFormSection({
          storageKey: 'test-section',
          defaultOpen: false,
          collapsible: true,
        })
      );

      expect(result.current.isExpanded).toBe(false);
    });

    it('always returns expanded when not collapsible', () => {
      const { result } = renderHook(() =>
        useFormSection({
          storageKey: 'test-section',
          defaultOpen: false,
          collapsible: false,
        })
      );

      expect(result.current.isExpanded).toBe(true);
    });
  });

  describe('toggle functionality', () => {
    it('toggles between expanded and collapsed', () => {
      const { result } = renderHook(() =>
        useFormSection({
          storageKey: 'test-section',
          defaultOpen: true,
          collapsible: true,
        })
      );

      expect(result.current.isExpanded).toBe(true);

      act(() => {
        result.current.toggle();
      });

      expect(result.current.isExpanded).toBe(false);

      act(() => {
        result.current.toggle();
      });

      expect(result.current.isExpanded).toBe(true);
    });

    it('toggle does nothing when not collapsible', () => {
      const { result } = renderHook(() =>
        useFormSection({
          storageKey: 'test-section',
          collapsible: false,
        })
      );

      expect(result.current.isExpanded).toBe(true);

      act(() => {
        result.current.toggle();
      });

      expect(result.current.isExpanded).toBe(true);
    });
  });

  describe('expand and collapse functions', () => {
    it('expand() expands a collapsed section', () => {
      const { result } = renderHook(() =>
        useFormSection({
          storageKey: 'test-section',
          defaultOpen: false,
          collapsible: true,
        })
      );

      expect(result.current.isExpanded).toBe(false);

      act(() => {
        result.current.expand();
      });

      expect(result.current.isExpanded).toBe(true);
    });

    it('collapse() collapses an expanded section', () => {
      const { result } = renderHook(() =>
        useFormSection({
          storageKey: 'test-section',
          defaultOpen: true,
          collapsible: true,
        })
      );

      expect(result.current.isExpanded).toBe(true);

      act(() => {
        result.current.collapse();
      });

      expect(result.current.isExpanded).toBe(false);
    });
  });

  describe('localStorage persistence', () => {
    it('saves state to localStorage on toggle', () => {
      const { result } = renderHook(() =>
        useFormSection({
          storageKey: 'test-section',
          defaultOpen: true,
          collapsible: true,
        })
      );

      act(() => {
        result.current.toggle();
      });

      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'nasnet:form-section:test-section',
        'false'
      );
    });

    it('loads saved state from localStorage on mount', () => {
      // Pre-populate localStorage
      localStorageMock.getItem.mockReturnValueOnce('false');

      const { result } = renderHook(() =>
        useFormSection({
          storageKey: 'test-section',
          defaultOpen: true,
          collapsible: true,
        })
      );

      // Should use stored value (false) not defaultOpen (true)
      expect(result.current.isExpanded).toBe(false);
    });

    it('different storage keys maintain independent state', () => {
      const { result: result1 } = renderHook(() =>
        useFormSection({
          storageKey: 'section-1',
          defaultOpen: true,
          collapsible: true,
        })
      );

      const { result: result2 } = renderHook(() =>
        useFormSection({
          storageKey: 'section-2',
          defaultOpen: true,
          collapsible: true,
        })
      );

      act(() => {
        result1.current.collapse();
      });

      expect(result1.current.isExpanded).toBe(false);
      expect(result2.current.isExpanded).toBe(true);
    });
  });
});

describe('FormSectionErrors component', () => {
  it('renders nothing when errors is empty', () => {
    const { container } = render(<FormSectionErrors errors={[]} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders nothing when errors is undefined', () => {
    const { container } = render(
      <FormSectionErrors errors={undefined} />
    );
    expect(container.firstChild).toBeNull();
  });

  it('displays error count for single error', () => {
    render(<FormSectionErrors errors={['Test error']} />);
    expect(screen.getByText('1 error in this section')).toBeInTheDocument();
  });

  it('displays error count for multiple errors', () => {
    render(<FormSectionErrors errors={['Error 1', 'Error 2', 'Error 3']} />);
    expect(screen.getByText('3 errors in this section')).toBeInTheDocument();
  });

  it('lists all error messages', () => {
    const errors = ['First error', 'Second error', 'Third error'];
    render(<FormSectionErrors errors={errors} />);

    errors.forEach((error) => {
      expect(screen.getByText(error)).toBeInTheDocument();
    });
  });

  it('has role="alert" for accessibility', () => {
    render(<FormSectionErrors errors={['Test error']} />);
    expect(screen.getByRole('alert')).toBeInTheDocument();
  });

  it('has aria-live="polite" for screen readers', () => {
    render(<FormSectionErrors errors={['Test error']} />);
    expect(screen.getByRole('alert')).toHaveAttribute('aria-live', 'polite');
  });
});

describe('FormSection component', () => {
  beforeEach(() => {
    localStorageMock.clear();
    vi.clearAllMocks();
    mockMatchMedia(false); // Default to no reduced motion
  });

  describe('rendering', () => {
    it('renders title', () => {
      render(
        <FormSection title="Network Settings">
          <div>Content</div>
        </FormSection>
      );

      // Title appears in both legend (sr-only) and h3 (visible)
      // Query the visible h3 specifically
      expect(screen.getByRole('heading', { name: 'Network Settings' })).toBeInTheDocument();
    });

    it('renders description when provided', () => {
      render(
        <FormSection title="Test" description="Test description">
          <div>Content</div>
        </FormSection>
      );

      expect(screen.getByText('Test description')).toBeInTheDocument();
    });

    it('renders children', () => {
      render(
        <FormSection title="Test">
          <div data-testid="child">Child content</div>
        </FormSection>
      );

      expect(screen.getByTestId('child')).toBeInTheDocument();
    });

    it('renders as fieldset by default for non-collapsible sections', () => {
      const { container } = render(
        <FormSection title="Test" collapsible={false}>
          <div>Content</div>
        </FormSection>
      );

      expect(container.querySelector('fieldset')).toBeInTheDocument();
    });

    it('renders as section for collapsible sections', () => {
      const { container } = render(
        <FormSection title="Test" collapsible>
          <div>Content</div>
        </FormSection>
      );

      expect(container.querySelector('section')).toBeInTheDocument();
    });

    it('renders sr-only legend for fieldset', () => {
      render(
        <FormSection title="Test Section" collapsible={false}>
          <div>Content</div>
        </FormSection>
      );

      const legend = document.querySelector('legend');
      expect(legend).toBeInTheDocument();
      expect(legend).toHaveClass('sr-only');
    });
  });

  describe('collapsible behavior', () => {
    it('shows content when expanded', () => {
      render(
        <FormSection title="Test" collapsible defaultOpen>
          <div data-testid="content">Content</div>
        </FormSection>
      );

      expect(screen.getByTestId('content')).toBeInTheDocument();
    });

    it('hides content when collapsed', async () => {
      render(
        <FormSection title="Test" collapsible defaultOpen={false}>
          <div data-testid="content">Content</div>
        </FormSection>
      );

      expect(screen.queryByTestId('content')).not.toBeInTheDocument();
    });

    it('toggles content on header click', async () => {
      const user = userEvent.setup();

      render(
        <FormSection title="Test" collapsible defaultOpen>
          <div data-testid="content">Content</div>
        </FormSection>
      );

      // Content is visible
      expect(screen.getByTestId('content')).toBeInTheDocument();

      // Click header to collapse
      const header = screen.getByRole('button', { name: /test/i });
      await user.click(header);

      // Content should be hidden after animation
      await waitFor(() => {
        expect(screen.queryByTestId('content')).not.toBeInTheDocument();
      });
    });

    it('rotates chevron on expand/collapse', async () => {
      const user = userEvent.setup();

      render(
        <FormSection title="Test" collapsible defaultOpen>
          <div>Content</div>
        </FormSection>
      );

      const header = screen.getByRole('button', { name: /test/i });
      const chevron = header.querySelector('svg');

      // Expanded state - chevron rotated
      expect(chevron).toHaveClass('rotate-180');

      // Click to collapse
      await user.click(header);

      // Collapsed state - chevron not rotated
      await waitFor(() => {
        expect(chevron).not.toHaveClass('rotate-180');
      });
    });
  });

  describe('error display', () => {
    it('shows error summary when errors provided', () => {
      render(
        <FormSection title="Test" errors={['Error 1', 'Error 2']}>
          <div>Content</div>
        </FormSection>
      );

      expect(screen.getByText('2 errors in this section')).toBeInTheDocument();
    });

    it('shows error count badge in header', () => {
      render(
        <FormSection title="Test" errors={['Error 1']}>
          <div>Content</div>
        </FormSection>
      );

      expect(screen.getByText('1 error')).toBeInTheDocument();
    });

    it('does not show error badge when no errors', () => {
      render(
        <FormSection title="Test" errors={[]}>
          <div>Content</div>
        </FormSection>
      );

      expect(screen.queryByText(/error/i)).not.toBeInTheDocument();
    });
  });

  describe('help integration', () => {
    it('shows help icon when helpId provided', () => {
      render(
        <FormSection title="Test" helpId="test-help">
          <div>Content</div>
        </FormSection>
      );

      expect(
        screen.getByRole('button', { name: /help for test/i })
      ).toBeInTheDocument();
    });

    it('does not show help icon when helpId not provided', () => {
      render(
        <FormSection title="Test">
          <div>Content</div>
        </FormSection>
      );

      expect(
        screen.queryByRole('button', { name: /help/i })
      ).not.toBeInTheDocument();
    });
  });

  describe('reduced motion', () => {
    it('respects prefers-reduced-motion', async () => {
      mockMatchMedia(true); // Enable reduced motion

      const { container } = render(
        <FormSection title="Test" collapsible defaultOpen>
          <div>Content</div>
        </FormSection>
      );

      const header = screen.getByRole('button', { name: /test/i });
      const chevron = header.querySelector('svg');

      // Chevron should not have transition class when reduced motion is enabled
      expect(chevron).not.toHaveClass('transition-transform');
    });
  });

  describe('accessibility', () => {
    it('has aria-expanded on collapsible header', () => {
      render(
        <FormSection title="Test" collapsible defaultOpen>
          <div>Content</div>
        </FormSection>
      );

      const header = screen.getByRole('button', { name: /test/i });
      expect(header).toHaveAttribute('aria-expanded', 'true');
    });

    it('updates aria-expanded when toggled', async () => {
      const user = userEvent.setup();

      render(
        <FormSection title="Test" collapsible defaultOpen>
          <div>Content</div>
        </FormSection>
      );

      const header = screen.getByRole('button', { name: /test/i });
      expect(header).toHaveAttribute('aria-expanded', 'true');

      await user.click(header);

      expect(header).toHaveAttribute('aria-expanded', 'false');
    });

    it('has aria-controls pointing to content', () => {
      render(
        <FormSection title="Test" collapsible defaultOpen>
          <div>Content</div>
        </FormSection>
      );

      const header = screen.getByRole('button', { name: /test/i });
      const controlsId = header.getAttribute('aria-controls');

      expect(controlsId).toBeTruthy();
      expect(document.getElementById(controlsId!)).toBeInTheDocument();
    });

    it('passes axe accessibility check for basic section', async () => {
      const { container } = render(
        <FormSection title="Network Settings" description="Configure network">
          <div>
            <label htmlFor="ip">IP Address</label>
            <input id="ip" type="text" />
          </div>
        </FormSection>
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('passes axe accessibility check for collapsible section', async () => {
      const { container } = render(
        <FormSection
          title="Advanced Options"
          collapsible
          defaultOpen
        >
          <div>
            <label htmlFor="mtu">MTU</label>
            <input id="mtu" type="number" />
          </div>
        </FormSection>
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('passes axe accessibility check for section with errors', async () => {
      const { container } = render(
        <FormSection
          title="Test Section"
          errors={['IP address is invalid']}
        >
          <div>
            <label htmlFor="ip">IP Address</label>
            <input id="ip" type="text" aria-invalid="true" />
          </div>
        </FormSection>
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });

  describe('custom className', () => {
    it('applies custom className to wrapper', () => {
      const { container } = render(
        <FormSection title="Test" className="custom-class">
          <div>Content</div>
        </FormSection>
      );

      expect(container.firstChild).toHaveClass('custom-class');
    });
  });

  describe('custom storageKey', () => {
    it('uses custom storageKey for localStorage', () => {
      render(
        <FormSection title="Test" collapsible storageKey="custom-key">
          <div>Content</div>
        </FormSection>
      );

      const header = screen.getByRole('button', { name: /test/i });

      act(() => {
        header.click();
      });

      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'nasnet:form-section:custom-key',
        'false'
      );
    });

    it('generates storageKey from title when not provided', () => {
      render(
        <FormSection title="Network Settings" collapsible>
          <div>Content</div>
        </FormSection>
      );

      const header = screen.getByRole('button', { name: /network settings/i });

      act(() => {
        header.click();
      });

      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'nasnet:form-section:network-settings',
        'false'
      );
    });
  });
});
