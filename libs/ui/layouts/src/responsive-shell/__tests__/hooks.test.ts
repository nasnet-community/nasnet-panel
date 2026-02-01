/**
 * Tests for Responsive Shell Hooks
 * @see NAS-4.3: Build Responsive Layout System
 */

import { renderHook } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import {
  useBreakpoint,
  useViewportWidth,
  BREAKPOINTS,
  isBreakpointAtLeast,
  isBreakpointAtMost,
} from '../useBreakpoint';
import {
  usePlatform,
  usePlatformWithBreakpoint,
  useIsMobile,
  useIsTablet,
  useIsDesktop,
  useIsTouchPlatform,
  detectPlatform,
} from '../usePlatform';
import {
  useReducedMotion,
  useAnimationDuration,
  useMotionConfig,
  useMotionClasses,
  ANIMATION_DURATIONS,
} from '../useReducedMotion';

// Mock ResizeObserver
class MockResizeObserver {
  callback: ResizeObserverCallback;

  constructor(callback: ResizeObserverCallback) {
    this.callback = callback;
  }

  observe() {
    // Trigger callback on observe
    this.callback([], this as unknown as ResizeObserver);
  }

  unobserve() {}
  disconnect() {}
}

// Mock matchMedia
function createMockMatchMedia(matches: boolean) {
  return vi.fn().mockImplementation((query: string) => ({
    matches,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }));
}

describe('useBreakpoint', () => {
  let originalInnerWidth: number;
  let originalResizeObserver: typeof ResizeObserver;

  beforeEach(() => {
    originalInnerWidth = window.innerWidth;
    originalResizeObserver = window.ResizeObserver;
    window.ResizeObserver = MockResizeObserver as unknown as typeof ResizeObserver;
  });

  afterEach(() => {
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: originalInnerWidth,
    });
    window.ResizeObserver = originalResizeObserver;
    vi.clearAllMocks();
  });

  it('should return xs for viewport < 640px', () => {
    Object.defineProperty(window, 'innerWidth', { value: 500, writable: true });
    const { result } = renderHook(() => useBreakpoint());
    expect(result.current).toBe('xs');
  });

  it('should return sm for viewport >= 640px and < 768px', () => {
    Object.defineProperty(window, 'innerWidth', { value: 700, writable: true });
    const { result } = renderHook(() => useBreakpoint());
    expect(result.current).toBe('sm');
  });

  it('should return md for viewport >= 768px and < 1024px', () => {
    Object.defineProperty(window, 'innerWidth', { value: 900, writable: true });
    const { result } = renderHook(() => useBreakpoint());
    expect(result.current).toBe('md');
  });

  it('should return lg for viewport >= 1024px and < 1280px', () => {
    Object.defineProperty(window, 'innerWidth', { value: 1100, writable: true });
    const { result } = renderHook(() => useBreakpoint());
    expect(result.current).toBe('lg');
  });

  it('should return xl for viewport >= 1280px', () => {
    Object.defineProperty(window, 'innerWidth', { value: 1400, writable: true });
    const { result } = renderHook(() => useBreakpoint());
    expect(result.current).toBe('xl');
  });
});

describe('useViewportWidth', () => {
  let originalResizeObserver: typeof ResizeObserver;

  beforeEach(() => {
    originalResizeObserver = window.ResizeObserver;
    window.ResizeObserver = MockResizeObserver as unknown as typeof ResizeObserver;
  });

  afterEach(() => {
    window.ResizeObserver = originalResizeObserver;
    vi.clearAllMocks();
  });

  it('should return current viewport width', () => {
    Object.defineProperty(window, 'innerWidth', { value: 1024, writable: true });
    const { result } = renderHook(() => useViewportWidth());
    expect(result.current).toBe(1024);
  });
});

describe('isBreakpointAtLeast', () => {
  it('should correctly compare breakpoints', () => {
    expect(isBreakpointAtLeast('lg', 'sm')).toBe(true);
    expect(isBreakpointAtLeast('sm', 'lg')).toBe(false);
    expect(isBreakpointAtLeast('md', 'md')).toBe(true);
    expect(isBreakpointAtLeast('xs', 'xl')).toBe(false);
  });
});

describe('isBreakpointAtMost', () => {
  it('should correctly compare breakpoints', () => {
    expect(isBreakpointAtMost('sm', 'lg')).toBe(true);
    expect(isBreakpointAtMost('lg', 'sm')).toBe(false);
    expect(isBreakpointAtMost('md', 'md')).toBe(true);
    expect(isBreakpointAtMost('xl', 'xs')).toBe(false);
  });
});

describe('usePlatform', () => {
  let originalResizeObserver: typeof ResizeObserver;

  beforeEach(() => {
    originalResizeObserver = window.ResizeObserver;
    window.ResizeObserver = MockResizeObserver as unknown as typeof ResizeObserver;
  });

  afterEach(() => {
    window.ResizeObserver = originalResizeObserver;
    vi.clearAllMocks();
  });

  it('should return mobile for viewport < 640px', () => {
    Object.defineProperty(window, 'innerWidth', { value: 500, writable: true });
    const { result } = renderHook(() => usePlatform());
    expect(result.current).toBe('mobile');
  });

  it('should return tablet for viewport 640-1024px', () => {
    Object.defineProperty(window, 'innerWidth', { value: 800, writable: true });
    const { result } = renderHook(() => usePlatform());
    expect(result.current).toBe('tablet');
  });

  it('should return desktop for viewport > 1024px', () => {
    Object.defineProperty(window, 'innerWidth', { value: 1200, writable: true });
    const { result } = renderHook(() => usePlatform());
    expect(result.current).toBe('desktop');
  });
});

describe('detectPlatform', () => {
  it('should detect mobile platform', () => {
    expect(detectPlatform(375)).toBe('mobile');
    expect(detectPlatform(639)).toBe('mobile');
  });

  it('should detect tablet platform', () => {
    expect(detectPlatform(640)).toBe('tablet');
    expect(detectPlatform(800)).toBe('tablet');
    expect(detectPlatform(1023)).toBe('tablet');
  });

  it('should detect desktop platform', () => {
    expect(detectPlatform(1024)).toBe('desktop');
    expect(detectPlatform(1440)).toBe('desktop');
    expect(detectPlatform(2560)).toBe('desktop');
  });
});

describe('usePlatformWithBreakpoint', () => {
  let originalResizeObserver: typeof ResizeObserver;

  beforeEach(() => {
    originalResizeObserver = window.ResizeObserver;
    window.ResizeObserver = MockResizeObserver as unknown as typeof ResizeObserver;
  });

  afterEach(() => {
    window.ResizeObserver = originalResizeObserver;
    vi.clearAllMocks();
  });

  it('should return both platform and breakpoint', () => {
    Object.defineProperty(window, 'innerWidth', { value: 800, writable: true });
    const { result } = renderHook(() => usePlatformWithBreakpoint());
    expect(result.current.platform).toBe('tablet');
    expect(['sm', 'md']).toContain(result.current.breakpoint);
  });
});

describe('Platform boolean hooks', () => {
  let originalResizeObserver: typeof ResizeObserver;

  beforeEach(() => {
    originalResizeObserver = window.ResizeObserver;
    window.ResizeObserver = MockResizeObserver as unknown as typeof ResizeObserver;
  });

  afterEach(() => {
    window.ResizeObserver = originalResizeObserver;
    vi.clearAllMocks();
  });

  it('useIsMobile should return true for mobile viewport', () => {
    Object.defineProperty(window, 'innerWidth', { value: 375, writable: true });
    const { result } = renderHook(() => useIsMobile());
    expect(result.current).toBe(true);
  });

  it('useIsTablet should return true for tablet viewport', () => {
    Object.defineProperty(window, 'innerWidth', { value: 768, writable: true });
    const { result } = renderHook(() => useIsTablet());
    expect(result.current).toBe(true);
  });

  it('useIsDesktop should return true for desktop viewport', () => {
    Object.defineProperty(window, 'innerWidth', { value: 1280, writable: true });
    const { result } = renderHook(() => useIsDesktop());
    expect(result.current).toBe(true);
  });

  it('useIsTouchPlatform should return true for mobile and tablet', () => {
    Object.defineProperty(window, 'innerWidth', { value: 768, writable: true });
    const { result: tabletResult } = renderHook(() => useIsTouchPlatform());
    expect(tabletResult.current).toBe(true);

    Object.defineProperty(window, 'innerWidth', { value: 375, writable: true });
    const { result: mobileResult } = renderHook(() => useIsTouchPlatform());
    expect(mobileResult.current).toBe(true);
  });
});

describe('useReducedMotion', () => {
  let originalMatchMedia: typeof window.matchMedia;

  beforeEach(() => {
    originalMatchMedia = window.matchMedia;
  });

  afterEach(() => {
    window.matchMedia = originalMatchMedia;
    vi.clearAllMocks();
  });

  it('should return false when reduced motion is not preferred', () => {
    window.matchMedia = createMockMatchMedia(false);
    const { result } = renderHook(() => useReducedMotion());
    expect(result.current).toBe(false);
  });

  it('should return true when reduced motion is preferred', () => {
    window.matchMedia = createMockMatchMedia(true);
    const { result } = renderHook(() => useReducedMotion());
    expect(result.current).toBe(true);
  });
});

describe('useAnimationDuration', () => {
  let originalMatchMedia: typeof window.matchMedia;

  beforeEach(() => {
    originalMatchMedia = window.matchMedia;
  });

  afterEach(() => {
    window.matchMedia = originalMatchMedia;
    vi.clearAllMocks();
  });

  it('should return normal duration when motion is allowed', () => {
    window.matchMedia = createMockMatchMedia(false);
    const { result } = renderHook(() => useAnimationDuration(200));
    expect(result.current).toBe(200);
  });

  it('should return reduced duration when motion is reduced', () => {
    window.matchMedia = createMockMatchMedia(true);
    const { result } = renderHook(() => useAnimationDuration(200));
    expect(result.current).toBe(0);
  });

  it('should return custom reduced duration', () => {
    window.matchMedia = createMockMatchMedia(true);
    const { result } = renderHook(() => useAnimationDuration(200, 50));
    expect(result.current).toBe(50);
  });
});

describe('useMotionConfig', () => {
  let originalMatchMedia: typeof window.matchMedia;

  beforeEach(() => {
    originalMatchMedia = window.matchMedia;
  });

  afterEach(() => {
    window.matchMedia = originalMatchMedia;
    vi.clearAllMocks();
  });

  it('should return animation config when motion is allowed', () => {
    window.matchMedia = createMockMatchMedia(false);
    const { result } = renderHook(() => useMotionConfig(200));

    expect(result.current.shouldAnimate).toBe(true);
    expect(result.current.duration).toBe(200);
    expect(result.current.durationSeconds).toBe(0.2);
    expect(result.current.transition.duration).toBe(0.2);
  });

  it('should return disabled animation config when motion is reduced', () => {
    window.matchMedia = createMockMatchMedia(true);
    const { result } = renderHook(() => useMotionConfig(200));

    expect(result.current.shouldAnimate).toBe(false);
    expect(result.current.duration).toBe(0);
    expect(result.current.durationSeconds).toBe(0);
    expect(result.current.transition.duration).toBe(0);
  });
});

describe('useMotionClasses', () => {
  let originalMatchMedia: typeof window.matchMedia;

  beforeEach(() => {
    originalMatchMedia = window.matchMedia;
  });

  afterEach(() => {
    window.matchMedia = originalMatchMedia;
    vi.clearAllMocks();
  });

  it('should return animation classes when motion is allowed', () => {
    window.matchMedia = createMockMatchMedia(false);
    const { result } = renderHook(() => useMotionClasses());

    expect(result.current.transitionClass).toBe('transition-all');
    expect(result.current.durationClass).toBe('duration-200');
    expect(result.current.motionClass).toContain('transition-all');
  });

  it('should return disabled classes when motion is reduced', () => {
    window.matchMedia = createMockMatchMedia(true);
    const { result } = renderHook(() => useMotionClasses());

    expect(result.current.transitionClass).toBe('transition-none');
    expect(result.current.durationClass).toBe('duration-0');
    expect(result.current.motionClass).toBe('transition-none');
  });
});

describe('ANIMATION_DURATIONS', () => {
  it('should have correct duration values', () => {
    expect(ANIMATION_DURATIONS.SIDEBAR).toBe(200);
    expect(ANIMATION_DURATIONS.LAYOUT).toBe(150);
    expect(ANIMATION_DURATIONS.DRAWER).toBe(200);
    expect(ANIMATION_DURATIONS.QUICK).toBe(100);
    expect(ANIMATION_DURATIONS.DEFAULT).toBe(200);
    expect(ANIMATION_DURATIONS.SLOW).toBe(300);
  });
});

describe('BREAKPOINTS', () => {
  it('should have correct breakpoint values matching design spec', () => {
    expect(BREAKPOINTS.SM).toBe(640);
    expect(BREAKPOINTS.MD).toBe(768);
    expect(BREAKPOINTS.LG).toBe(1024);
    expect(BREAKPOINTS.XL).toBe(1280);
  });
});
