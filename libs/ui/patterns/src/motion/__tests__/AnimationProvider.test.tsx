/**
 * AnimationProvider Tests
 *
 * @see NAS-4.18: Implement Animation System (Framer Motion)
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { ReactNode } from 'react';
import { AnimationProvider, useAnimation, useAnimationOptional } from '../AnimationProvider';

// Mock the UI store
const mockAnimationsEnabled = vi.fn(() => true);

vi.mock('@nasnet/state/stores', () => ({
  useUIStore: (selector: (state: { animationsEnabled: boolean }) => boolean) =>
    selector({ animationsEnabled: mockAnimationsEnabled() }),
}));

// Wrapper component for tests
function createWrapper() {
  return function Wrapper({ children }: { children: ReactNode }) {
    return <AnimationProvider>{children}</AnimationProvider>;
  };
}

describe('AnimationProvider', () => {
  beforeEach(() => {
    mockAnimationsEnabled.mockReturnValue(true);
    // Mock window.innerWidth for platform detection
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 1200, // Desktop
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('useAnimation', () => {
    it('should provide animation context values', () => {
      const { result } = renderHook(() => useAnimation(), {
        wrapper: createWrapper(),
      });

      expect(result.current).toHaveProperty('reducedMotion');
      expect(result.current).toHaveProperty('platform');
      expect(result.current).toHaveProperty('tokens');
      expect(result.current).toHaveProperty('getVariant');
      expect(result.current).toHaveProperty('getTransition');
      expect(result.current).toHaveProperty('getDuration');
      expect(result.current).toHaveProperty('animationsEnabled');
    });

    it('should throw when used outside provider', () => {
      expect(() => {
        renderHook(() => useAnimation());
      }).toThrow('useAnimation must be used within AnimationProvider');
    });

    it('should detect desktop platform', () => {
      Object.defineProperty(window, 'innerWidth', { value: 1200 });

      const { result } = renderHook(() => useAnimation(), {
        wrapper: createWrapper(),
      });

      expect(result.current.platform).toBe('desktop');
    });

    it('should detect mobile platform', () => {
      Object.defineProperty(window, 'innerWidth', { value: 500 });

      const { result } = renderHook(() => useAnimation(), {
        wrapper: createWrapper(),
      });

      expect(result.current.platform).toBe('mobile');
    });

    it('should detect tablet platform', () => {
      Object.defineProperty(window, 'innerWidth', { value: 800 });

      const { result } = renderHook(() => useAnimation(), {
        wrapper: createWrapper(),
      });

      expect(result.current.platform).toBe('tablet');
    });
  });

  describe('reducedMotion', () => {
    it('should be false when animations are enabled', () => {
      mockAnimationsEnabled.mockReturnValue(true);

      const { result } = renderHook(() => useAnimation(), {
        wrapper: createWrapper(),
      });

      expect(result.current.reducedMotion).toBe(false);
      expect(result.current.animationsEnabled).toBe(true);
    });

    it('should be true when animations are disabled', () => {
      mockAnimationsEnabled.mockReturnValue(false);

      const { result } = renderHook(() => useAnimation(), {
        wrapper: createWrapper(),
      });

      expect(result.current.reducedMotion).toBe(true);
      expect(result.current.animationsEnabled).toBe(false);
    });
  });

  describe('getVariant', () => {
    it('should return full variant when animations enabled', () => {
      mockAnimationsEnabled.mockReturnValue(true);

      const { result } = renderHook(() => useAnimation(), {
        wrapper: createWrapper(),
      });

      const fullVariant = { initial: { opacity: 0 }, animate: { opacity: 1 } };
      const variant = result.current.getVariant(fullVariant);

      expect(variant).toBe(fullVariant);
    });

    it('should return reduced variant when animations disabled', () => {
      mockAnimationsEnabled.mockReturnValue(false);

      const { result } = renderHook(() => useAnimation(), {
        wrapper: createWrapper(),
      });

      const fullVariant = { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 } };
      const variant = result.current.getVariant(fullVariant);

      // Should return reduced motion fade (default)
      expect(variant).not.toBe(fullVariant);
      expect(variant.initial).toMatchObject({ opacity: 0 });
    });
  });

  describe('getTransition', () => {
    it('should return transition when animations enabled', () => {
      mockAnimationsEnabled.mockReturnValue(true);

      const { result } = renderHook(() => useAnimation(), {
        wrapper: createWrapper(),
      });

      const transition = result.current.getTransition('enter');

      expect(transition).toHaveProperty('duration');
      expect(transition).toHaveProperty('ease');
    });

    it('should return instant transition when animations disabled', () => {
      mockAnimationsEnabled.mockReturnValue(false);

      const { result } = renderHook(() => useAnimation(), {
        wrapper: createWrapper(),
      });

      const transition = result.current.getTransition('enter');

      expect(transition).toMatchObject({ duration: 0 });
    });
  });

  describe('getDuration', () => {
    it('should return duration when animations enabled', () => {
      mockAnimationsEnabled.mockReturnValue(true);

      const { result } = renderHook(() => useAnimation(), {
        wrapper: createWrapper(),
      });

      expect(result.current.getDuration(200)).toBe(200);
    });

    it('should return 0 when animations disabled', () => {
      mockAnimationsEnabled.mockReturnValue(false);

      const { result } = renderHook(() => useAnimation(), {
        wrapper: createWrapper(),
      });

      expect(result.current.getDuration(200)).toBe(0);
    });
  });

  describe('tokens', () => {
    it('should provide platform-adjusted tokens', () => {
      const { result } = renderHook(() => useAnimation(), {
        wrapper: createWrapper(),
      });

      expect(result.current.tokens).toHaveProperty('pageTransition');
      expect(result.current.tokens).toHaveProperty('modal');
      expect(result.current.tokens).toHaveProperty('listReorder');
      expect(result.current.tokens).toHaveProperty('microInteraction');
      expect(result.current.tokens).toHaveProperty('skeleton');
    });
  });
});

describe('useAnimationOptional', () => {
  it('should return null when used outside provider', () => {
    const { result } = renderHook(() => useAnimationOptional());

    expect(result.current).toBeNull();
  });

  it('should return context when used inside provider', () => {
    const { result } = renderHook(() => useAnimationOptional(), {
      wrapper: createWrapper(),
    });

    expect(result.current).not.toBeNull();
    expect(result.current).toHaveProperty('reducedMotion');
  });
});
