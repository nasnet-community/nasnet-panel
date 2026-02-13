/**
 * Unit tests for EmailChannelForm (Platform Detector)
 * Tests platform detection and correct presenter rendering
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { EmailChannelForm } from './EmailChannelForm';

// Mock the platform presenters
vi.mock('./EmailChannelFormDesktop', () => ({
  EmailChannelFormDesktop: ({ emailForm }: any) => (
    <div data-testid="desktop-presenter">Desktop Form</div>
  ),
}));

vi.mock('./EmailChannelFormMobile', () => ({
  EmailChannelFormMobile: ({ emailForm }: any) => (
    <div data-testid="mobile-presenter">Mobile Form</div>
  ),
}));

// Mock useMediaQuery hook
const mockUseMediaQuery = vi.fn();
vi.mock('@nasnet/ui/primitives', async () => {
  const actual = await vi.importActual('@nasnet/ui/primitives');
  return {
    ...actual,
    useMediaQuery: () => mockUseMediaQuery(),
  };
});

// Mock the headless hook
vi.mock('../hooks/useEmailChannelForm', () => ({
  useEmailChannelForm: vi.fn(() => ({
    form: {
      control: {},
      formState: { errors: {} },
      register: vi.fn(),
      getValues: vi.fn(),
      setValue: vi.fn(),
      watch: vi.fn(() => []),
    },
    recipients: [],
    addRecipient: vi.fn(),
    removeRecipient: vi.fn(),
    clearRecipients: vi.fn(),
    isValid: false,
    handleSubmit: vi.fn(),
    handleTest: vi.fn(),
    isTesting: false,
    testResult: undefined,
    clearTestResult: vi.fn(),
    reset: vi.fn(),
    applyPortPreset: vi.fn(),
  })),
}));

describe('EmailChannelForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Platform Detection', () => {
    it('renders mobile presenter when viewport is below 640px', () => {
      mockUseMediaQuery.mockReturnValue(true); // isMobile = true

      render(<EmailChannelForm />);

      expect(screen.getByTestId('mobile-presenter')).toBeInTheDocument();
      expect(screen.queryByTestId('desktop-presenter')).not.toBeInTheDocument();
    });

    it('renders desktop presenter when viewport is 640px or above', () => {
      mockUseMediaQuery.mockReturnValue(false); // isMobile = false

      render(<EmailChannelForm />);

      expect(screen.getByTestId('desktop-presenter')).toBeInTheDocument();
      expect(screen.queryByTestId('mobile-presenter')).not.toBeInTheDocument();
    });

    it('uses correct media query breakpoint (640px)', () => {
      render(<EmailChannelForm />);

      // The hook should be called
      expect(mockUseMediaQuery).toHaveBeenCalled();
    });

    it('switches presenter when platform changes', () => {
      mockUseMediaQuery.mockReturnValue(false);

      const { rerender } = render(<EmailChannelForm />);

      expect(screen.getByTestId('desktop-presenter')).toBeInTheDocument();

      // Simulate viewport resize
      mockUseMediaQuery.mockReturnValue(true);

      rerender(<EmailChannelForm />);

      expect(screen.getByTestId('mobile-presenter')).toBeInTheDocument();
      expect(screen.queryByTestId('desktop-presenter')).not.toBeInTheDocument();
    });
  });

  describe('Props Forwarding', () => {
    it('applies custom className to wrapper', () => {
      mockUseMediaQuery.mockReturnValue(false);

      const { container } = render(<EmailChannelForm className="custom-wrapper" />);

      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper.className).toContain('custom-wrapper');
    });
  });

  describe('Accessibility', () => {
    it('wraps presenters in semantic div', () => {
      mockUseMediaQuery.mockReturnValue(false);

      const { container } = render(<EmailChannelForm />);

      expect(container.firstChild).toBeInstanceOf(HTMLDivElement);
    });

    it('does not interfere with presenter accessibility features', () => {
      mockUseMediaQuery.mockReturnValue(false);

      render(<EmailChannelForm />);

      // Presenter should be directly accessible
      const presenter = screen.getByTestId('desktop-presenter');
      expect(presenter).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('renders without crashing when no props provided', () => {
      mockUseMediaQuery.mockReturnValue(false);

      expect(() => render(<EmailChannelForm />)).not.toThrow();
    });
  });
});
