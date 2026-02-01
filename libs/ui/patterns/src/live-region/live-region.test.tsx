/**
 * LiveRegion Tests
 *
 * @see NAS-4.17: Implement Accessibility (a11y) Foundation
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act, waitFor } from '@testing-library/react';
import { axe } from 'vitest-axe';
import { renderHook } from '@testing-library/react';
import {
  LiveRegion,
  useAnnounce,
  AnnouncerProvider,
  useAnnouncer,
  VisuallyHidden,
} from './live-region';

describe('LiveRegion', () => {
  describe('rendering', () => {
    it('should render children', () => {
      render(<LiveRegion>Status message</LiveRegion>);

      expect(screen.getByText('Status message')).toBeInTheDocument();
    });

    it('should have correct ARIA attributes for polite mode', () => {
      render(<LiveRegion mode="polite">Message</LiveRegion>);

      const region = screen.getByRole('status');
      expect(region).toHaveAttribute('aria-live', 'polite');
      expect(region).toHaveAttribute('aria-atomic', 'true');
    });

    it('should have correct ARIA attributes for assertive mode', () => {
      render(<LiveRegion mode="assertive">Urgent!</LiveRegion>);

      const region = screen.getByRole('status');
      expect(region).toHaveAttribute('aria-live', 'assertive');
    });

    it('should support different roles', () => {
      render(
        <LiveRegion role="alert" mode="assertive">
          Alert message
        </LiveRegion>
      );

      const region = screen.getByRole('alert');
      expect(region).toBeInTheDocument();
    });

    it('should be visually hidden by default', () => {
      render(<LiveRegion>Hidden message</LiveRegion>);

      const region = screen.getByRole('status');
      expect(region).toHaveClass('sr-only');
    });

    it('should be visible when visible prop is true', () => {
      render(<LiveRegion visible>Visible message</LiveRegion>);

      const region = screen.getByRole('status');
      expect(region).not.toHaveClass('sr-only');
    });

    it('should support non-atomic updates', () => {
      render(<LiveRegion atomic={false}>Message</LiveRegion>);

      const region = screen.getByRole('status');
      expect(region).toHaveAttribute('aria-atomic', 'false');
    });
  });

  describe('accessibility', () => {
    it('should have no accessibility violations', async () => {
      const { container } = render(<LiveRegion>Accessible message</LiveRegion>);

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have no violations with alert role', async () => {
      const { container } = render(
        <LiveRegion role="alert" mode="assertive">
          Alert!
        </LiveRegion>
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });
});

describe('useAnnounce', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should start with empty message', () => {
    const { result } = renderHook(() => useAnnounce());

    expect(result.current.message).toBe('');
    expect(result.current.priority).toBe('polite');
  });

  it('should announce polite messages', async () => {
    const { result } = renderHook(() => useAnnounce());

    await act(async () => {
      result.current.announce('Hello!');
      await new Promise((resolve) => requestAnimationFrame(resolve));
    });

    expect(result.current.message).toBe('Hello!');
    expect(result.current.priority).toBe('polite');
  });

  it('should announce assertive messages', async () => {
    const { result } = renderHook(() => useAnnounce());

    await act(async () => {
      result.current.announce('Error!', 'assertive');
      await new Promise((resolve) => requestAnimationFrame(resolve));
    });

    expect(result.current.message).toBe('Error!');
    expect(result.current.priority).toBe('assertive');
  });

  it('should auto-clear message after timeout', async () => {
    const { result } = renderHook(() => useAnnounce());

    await act(async () => {
      result.current.announce('Temporary message');
      await new Promise((resolve) => requestAnimationFrame(resolve));
    });

    expect(result.current.message).toBe('Temporary message');

    act(() => {
      vi.advanceTimersByTime(5000);
    });

    expect(result.current.message).toBe('');
  });

  it('should clear message manually', async () => {
    const { result } = renderHook(() => useAnnounce());

    await act(async () => {
      result.current.announce('Message');
      await new Promise((resolve) => requestAnimationFrame(resolve));
    });

    expect(result.current.message).toBe('Message');

    act(() => {
      result.current.clear();
    });

    expect(result.current.message).toBe('');
  });

  it('should handle multiple announcements', async () => {
    const { result } = renderHook(() => useAnnounce());

    await act(async () => {
      result.current.announce('First');
      await new Promise((resolve) => requestAnimationFrame(resolve));
    });

    expect(result.current.message).toBe('First');

    await act(async () => {
      result.current.announce('Second');
      await new Promise((resolve) => requestAnimationFrame(resolve));
    });

    expect(result.current.message).toBe('Second');
  });
});

describe('AnnouncerProvider', () => {
  it('should render children', () => {
    render(
      <AnnouncerProvider>
        <div data-testid="child">Content</div>
      </AnnouncerProvider>
    );

    expect(screen.getByTestId('child')).toBeInTheDocument();
  });

  it('should render a live region', () => {
    render(
      <AnnouncerProvider>
        <div>Content</div>
      </AnnouncerProvider>
    );

    expect(screen.getByRole('status')).toBeInTheDocument();
  });
});

describe('useAnnouncer', () => {
  it('should throw when used outside provider', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    expect(() => {
      renderHook(() => useAnnouncer());
    }).toThrow('useAnnouncer must be used within an AnnouncerProvider');

    consoleSpy.mockRestore();
  });

  it('should provide announce function when inside provider', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <AnnouncerProvider>{children}</AnnouncerProvider>
    );

    const { result } = renderHook(() => useAnnouncer(), { wrapper });

    expect(typeof result.current.announce).toBe('function');
  });

  it('should announce messages globally', async () => {
    function TestComponent() {
      const { announce } = useAnnouncer();
      return (
        <button onClick={() => announce('Global announcement')}>Announce</button>
      );
    }

    render(
      <AnnouncerProvider>
        <TestComponent />
      </AnnouncerProvider>
    );

    const button = screen.getByRole('button');

    await act(async () => {
      button.click();
      await new Promise((resolve) => requestAnimationFrame(resolve));
    });

    await waitFor(() => {
      expect(screen.getByRole('status')).toHaveTextContent('Global announcement');
    });
  });
});

describe('VisuallyHidden', () => {
  it('should render children', () => {
    render(<VisuallyHidden>Hidden text</VisuallyHidden>);

    expect(screen.getByText('Hidden text')).toBeInTheDocument();
  });

  it('should have sr-only class', () => {
    render(<VisuallyHidden>Hidden</VisuallyHidden>);

    expect(screen.getByText('Hidden')).toHaveClass('sr-only');
  });

  it('should render as span by default', () => {
    render(<VisuallyHidden>Text</VisuallyHidden>);

    expect(screen.getByText('Text').tagName).toBe('SPAN');
  });

  it('should render as div when specified', () => {
    render(<VisuallyHidden as="div">Text</VisuallyHidden>);

    expect(screen.getByText('Text').tagName).toBe('DIV');
  });

  it('should apply custom className', () => {
    render(<VisuallyHidden className="custom-class">Text</VisuallyHidden>);

    expect(screen.getByText('Text')).toHaveClass('custom-class');
    expect(screen.getByText('Text')).toHaveClass('sr-only');
  });

  it('should be accessible', async () => {
    const { container } = render(
      <button>
        <span aria-hidden="true">🗑️</span>
        <VisuallyHidden>Delete item</VisuallyHidden>
      </button>
    );

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
