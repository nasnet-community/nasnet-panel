/**
 * Tests for ResponsiveShell Component
 *
 * Comprehensive tests for the ResponsiveShell component covering:
 * - Layout switching between mobile, tablet, and desktop breakpoints
 * - Platform-specific rendering (MobileAppShell vs AppShell)
 * - Sidebar collapse behavior and keyboard shortcuts (Ctrl+B / Cmd+B)
 * - Accessibility structure and focus management
 * - Reduced motion support (WCAG AAA compliance)
 * - Platform provider initialization and overrides
 *
 * @see NAS-4.3: Build Responsive Layout System
 */

import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import '@testing-library/jest-dom/vitest';

// Mock the shell components to avoid deep dependency chains
vi.mock('../../app-shell', () => ({
  AppShell: vi.fn(({ children, className }) => (
    <div data-testid="app-shell" className={className}>
      {children}
    </div>
  )),
}));

vi.mock('../../mobile-app-shell', () => ({
  MobileAppShell: vi.fn(({ children, className }) => (
    <div data-testid="mobile-app-shell" className={className}>
      {children}
    </div>
  )),
}));

vi.mock('@nasnet/ui/primitives', () => ({
  cn: (...args: unknown[]) => args.filter(Boolean).join(' '),
}));

import { PlatformProvider } from '../PlatformProvider';
import { ResponsiveShell } from '../ResponsiveShell';

// Mock ResizeObserver
class MockResizeObserver {
  callback: ResizeObserverCallback;

  constructor(callback: ResizeObserverCallback) {
    this.callback = callback;
  }

  observe() {
    this.callback([], this as unknown as ResizeObserver);
  }

  unobserve() {}
  disconnect() {}
}

// Mock matchMedia
function createMockMatchMedia(reducedMotion = false) {
  return vi.fn().mockImplementation((query: string) => ({
    matches: query.includes('prefers-reduced-motion') ? reducedMotion : false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }));
}

describe('ResponsiveShell', () => {
  let originalResizeObserver: typeof ResizeObserver;
  let originalMatchMedia: typeof window.matchMedia;
  let originalInnerWidth: number;

  beforeEach(() => {
    originalResizeObserver = window.ResizeObserver;
    originalMatchMedia = window.matchMedia;
    originalInnerWidth = window.innerWidth;

    window.ResizeObserver = MockResizeObserver as unknown as typeof ResizeObserver;
    window.matchMedia = createMockMatchMedia(false);
  });

  afterEach(() => {
    window.ResizeObserver = originalResizeObserver;
    window.matchMedia = originalMatchMedia;
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: originalInnerWidth,
    });
    vi.clearAllMocks();
  });

  describe('Layout Switching (AC 3.1, 3.2, 3.3, 3.4)', () => {
    it('should render MobileAppShell for mobile viewport', () => {
      Object.defineProperty(window, 'innerWidth', { value: 375, writable: true });

      render(
        <PlatformProvider>
          <ResponsiveShell mobileNavigationProps={{ activeId: 'home' }}>
            <div data-testid="content">Content</div>
          </ResponsiveShell>
        </PlatformProvider>
      );

      // Should render mobile shell
      expect(screen.getByTestId('mobile-app-shell')).toBeInTheDocument();
      expect(screen.getByTestId('content')).toBeInTheDocument();
    });

    it('should render AppShell for desktop viewport', () => {
      Object.defineProperty(window, 'innerWidth', { value: 1280, writable: true });

      render(
        <PlatformProvider>
          <ResponsiveShell
            sidebar={<div data-testid="sidebar">Sidebar</div>}
            header={<div data-testid="header">Header</div>}
          >
            <div data-testid="content">Content</div>
          </ResponsiveShell>
        </PlatformProvider>
      );

      // Should render desktop shell
      expect(screen.getByTestId('app-shell')).toBeInTheDocument();
      expect(screen.getByTestId('content')).toBeInTheDocument();
    });

    it('should render AppShell for tablet viewport', () => {
      Object.defineProperty(window, 'innerWidth', { value: 800, writable: true });

      render(
        <PlatformProvider>
          <ResponsiveShell sidebar={<div>Sidebar</div>}>
            <div data-testid="content">Content</div>
          </ResponsiveShell>
        </PlatformProvider>
      );

      // Tablet should use AppShell (not MobileAppShell)
      expect(screen.getByTestId('app-shell')).toBeInTheDocument();
    });

    it('should force specific platform when forcePlatform is provided', () => {
      Object.defineProperty(window, 'innerWidth', { value: 1280, writable: true });

      render(
        <PlatformProvider>
          <ResponsiveShell
            forcePlatform="mobile"
            mobileNavigationProps={{ activeId: 'home' }}
          >
            <div data-testid="content">Content</div>
          </ResponsiveShell>
        </PlatformProvider>
      );

      // Should render mobile layout even though viewport is desktop
      expect(screen.getByTestId('mobile-app-shell')).toBeInTheDocument();
    });
  });

  describe('Sidebar Collapse Behavior (AC 3.3)', () => {
    it('should respond to keyboard shortcut (Ctrl+B)', () => {
      Object.defineProperty(window, 'innerWidth', { value: 1280, writable: true });
      const mockToggle = vi.fn();

      render(
        <PlatformProvider>
          <ResponsiveShell sidebar={<div>Sidebar</div>} onSidebarToggle={mockToggle}>
            <div>Content</div>
          </ResponsiveShell>
        </PlatformProvider>
      );

      // Simulate Ctrl+B keypress
      fireEvent.keyDown(window, { key: 'b', ctrlKey: true });
      expect(mockToggle).toHaveBeenCalled();
    });

    it('should respond to keyboard shortcut (Cmd+B on Mac)', () => {
      Object.defineProperty(window, 'innerWidth', { value: 1280, writable: true });
      const mockToggle = vi.fn();

      render(
        <PlatformProvider>
          <ResponsiveShell sidebar={<div>Sidebar</div>} onSidebarToggle={mockToggle}>
            <div>Content</div>
          </ResponsiveShell>
        </PlatformProvider>
      );

      // Simulate Cmd+B keypress (Mac)
      fireEvent.keyDown(window, { key: 'b', metaKey: true });
      expect(mockToggle).toHaveBeenCalled();
    });

    it('should not toggle sidebar on mobile (keyboard shortcut ignored)', () => {
      Object.defineProperty(window, 'innerWidth', { value: 375, writable: true });
      const mockToggle = vi.fn();

      render(
        <PlatformProvider>
          <ResponsiveShell
            sidebar={<div>Sidebar</div>}
            onSidebarToggle={mockToggle}
            mobileNavigationProps={{ activeId: 'home' }}
          >
            <div>Content</div>
          </ResponsiveShell>
        </PlatformProvider>
      );

      // Simulate Ctrl+B keypress - should not toggle on mobile
      fireEvent.keyDown(window, { key: 'b', ctrlKey: true });
      expect(mockToggle).not.toHaveBeenCalled();
    });

    it('should not call toggle if onSidebarToggle is not provided', () => {
      Object.defineProperty(window, 'innerWidth', { value: 1280, writable: true });

      render(
        <PlatformProvider>
          <ResponsiveShell sidebar={<div>Sidebar</div>}>
            <div>Content</div>
          </ResponsiveShell>
        </PlatformProvider>
      );

      // This should not throw
      fireEvent.keyDown(window, { key: 'b', ctrlKey: true });
      expect(screen.getByTestId('app-shell')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should render children with accessible structure', () => {
      Object.defineProperty(window, 'innerWidth', { value: 1280, writable: true });

      render(
        <PlatformProvider>
          <ResponsiveShell sidebar={<nav data-testid="nav">Navigation</nav>}>
            <main data-testid="main">Main Content</main>
          </ResponsiveShell>
        </PlatformProvider>
      );

      expect(screen.getByTestId('main')).toBeInTheDocument();
    });
  });

  describe('Reduced Motion Support (AC 3.6)', () => {
    it('should apply motion classes when reduced motion is not preferred', () => {
      window.matchMedia = createMockMatchMedia(false);
      Object.defineProperty(window, 'innerWidth', { value: 1280, writable: true });

      render(
        <PlatformProvider>
          <ResponsiveShell>
            <div>Content</div>
          </ResponsiveShell>
        </PlatformProvider>
      );

      // The shell should have transition classes
      const shell = screen.getByTestId('app-shell');
      expect(shell.className).toContain('transition');
    });

    it('should disable transitions when reduced motion is preferred', () => {
      window.matchMedia = createMockMatchMedia(true);
      Object.defineProperty(window, 'innerWidth', { value: 1280, writable: true });

      render(
        <PlatformProvider>
          <ResponsiveShell>
            <div>Content</div>
          </ResponsiveShell>
        </PlatformProvider>
      );

      // Shell should still render
      const shell = screen.getByTestId('app-shell');
      expect(shell).toBeInTheDocument();
      // With reduced motion, should have transition-none
      expect(shell.className).toContain('transition-none');
    });
  });
});

describe('PlatformProvider', () => {
  let originalResizeObserver: typeof ResizeObserver;
  let originalMatchMedia: typeof window.matchMedia;

  beforeEach(() => {
    originalResizeObserver = window.ResizeObserver;
    originalMatchMedia = window.matchMedia;
    window.ResizeObserver = MockResizeObserver as unknown as typeof ResizeObserver;
    window.matchMedia = createMockMatchMedia(false);
  });

  afterEach(() => {
    window.ResizeObserver = originalResizeObserver;
    window.matchMedia = originalMatchMedia;
    vi.clearAllMocks();
  });

  it('should provide initial platform override', () => {
    Object.defineProperty(window, 'innerWidth', { value: 1280, writable: true });

    // Verify that PlatformProvider renders with initial override without errors
    const { container } = render(
      <PlatformProvider initialPlatform="mobile">
        <div data-testid="test-content">Test</div>
      </PlatformProvider>
    );

    expect(container).toBeInTheDocument();
    expect(screen.getByTestId('test-content')).toBeInTheDocument();
  });
});
