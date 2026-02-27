/**
 * Animation System Tests
 * Tests for animation tokens, presets, and utilities
 *
 * @see NAS-4.18: Implement Animation System (Framer Motion)
 */

import { describe, it, expect } from 'vitest';

import {
  durations,
  easings,
  springs,
  getAnimationTokens,
  transitions,
  getReducedMotionTransition,
  getReducedMotionDuration,
  msToSeconds,
} from '@nasnet/ui/tokens';

import { fadeIn, slideUp, scaleIn, reducedMotionFade, getVariant } from '../presets';

// ============================================================================
// Animation Tokens Tests
// ============================================================================

describe('Animation Tokens', () => {
  describe('durations', () => {
    it('should have correct duration values', () => {
      expect(durations.instant).toBe(0);
      expect(durations.fast).toBe(100);
      expect(durations.normal).toBe(200);
      expect(durations.slow).toBe(300);
      expect(durations.slower).toBe(500);
    });

    it('should have durations in ascending order', () => {
      expect(durations.instant).toBeLessThan(durations.fast);
      expect(durations.fast).toBeLessThan(durations.normal);
      expect(durations.normal).toBeLessThan(durations.slow);
      expect(durations.slow).toBeLessThan(durations.slower);
    });
  });

  describe('easings', () => {
    it('should have correct easing arrays', () => {
      expect(easings.enter).toEqual([0, 0, 0.2, 1]);
      expect(easings.exit).toEqual([0.4, 0, 1, 1]);
      expect(easings.move).toEqual([0.4, 0, 0.2, 1]);
      expect(easings.linear).toEqual([0, 0, 1, 1]);
    });

    it('should have 4-value bezier curves', () => {
      expect(easings.enter).toHaveLength(4);
      expect(easings.exit).toHaveLength(4);
      expect(easings.move).toHaveLength(4);
      expect(easings.linear).toHaveLength(4);
    });
  });

  describe('springs', () => {
    it('should have correct spring configurations', () => {
      expect(springs.default).toMatchObject({
        type: 'spring',
        stiffness: 300,
        damping: 30,
      });
    });

    it('should have all spring variants', () => {
      expect(springs).toHaveProperty('default');
      expect(springs).toHaveProperty('gentle');
      expect(springs).toHaveProperty('bouncy');
      expect(springs).toHaveProperty('stiff');
    });
  });
});

// ============================================================================
// Platform-Aware Tokens Tests
// ============================================================================

describe('getAnimationTokens', () => {
  it('should return desktop tokens', () => {
    const tokens = getAnimationTokens('desktop');

    expect(tokens.pageTransition.enter).toBe(300);
    expect(tokens.pageTransition.exit).toBe(225); // 25% faster
    expect(tokens.modal.enter).toBe(200);
    expect(tokens.modal.exit).toBe(150);
  });

  it('should return mobile tokens with 25% faster animations', () => {
    const tokens = getAnimationTokens('mobile');

    // Mobile animations are 25% faster (0.75 factor)
    expect(tokens.pageTransition.enter).toBe(225); // 300 * 0.75
    expect(tokens.pageTransition.exit).toBeCloseTo(168.75, 2); // 225 * 0.75
    expect(tokens.microInteraction).toBe(75); // 100 * 0.75
  });

  it('should return tablet tokens same as desktop', () => {
    const tabletTokens = getAnimationTokens('tablet');
    const desktopTokens = getAnimationTokens('desktop');

    expect(tabletTokens.pageTransition.enter).toBe(desktopTokens.pageTransition.enter);
  });

  it('should have skeleton animation with infinite repeat', () => {
    const tokens = getAnimationTokens('desktop');

    expect(tokens.skeleton.duration).toBe(1.5);
    expect(tokens.skeleton.repeat).toBe(Infinity);
  });
});

// ============================================================================
// Transitions Tests
// ============================================================================

describe('transitions', () => {
  it('should have correct enter transition', () => {
    expect(transitions.enter).toMatchObject({
      duration: 0.2, // 200ms in seconds
      ease: easings.enter,
    });
  });

  it('should have exit transition 25% faster than enter', () => {
    const exitTransition = transitions.exit as any;
    const enterTransition = transitions.enter as any;
    expect(exitTransition.duration).toBe(0.15); // 150ms in seconds
    expect(enterTransition.duration).toBe(0.2);
  });

  it('should have instant transition with zero duration', () => {
    const instantTransition = transitions.instant as any;
    expect(instantTransition.duration).toBe(0);
  });

  it('should have spring transition', () => {
    expect(transitions.spring).toMatchObject({
      type: 'spring',
      stiffness: 300,
      damping: 30,
    });
  });
});

// ============================================================================
// Utility Functions Tests
// ============================================================================

describe('utility functions', () => {
  describe('msToSeconds', () => {
    it('should convert milliseconds to seconds', () => {
      expect(msToSeconds(1000)).toBe(1);
      expect(msToSeconds(200)).toBe(0.2);
      expect(msToSeconds(0)).toBe(0);
    });
  });

  describe('getReducedMotionDuration', () => {
    it('should return 0 when reduced motion is enabled', () => {
      expect(getReducedMotionDuration(200, true)).toBe(0);
      expect(getReducedMotionDuration(500, true)).toBe(0);
    });

    it('should return original duration when reduced motion is disabled', () => {
      expect(getReducedMotionDuration(200, false)).toBe(200);
      expect(getReducedMotionDuration(500, false)).toBe(500);
    });
  });

  describe('getReducedMotionTransition', () => {
    it('should return instant transition when reduced motion is enabled', () => {
      const result = getReducedMotionTransition(transitions.enter, true);
      expect((result as any).duration).toBe(0);
    });

    it('should return original transition when reduced motion is disabled', () => {
      const result = getReducedMotionTransition(transitions.enter, false);
      expect(result).toBe(transitions.enter);
    });
  });
});

// ============================================================================
// Animation Presets Tests
// ============================================================================

describe('Animation Presets', () => {
  describe('fadeIn', () => {
    it('should have correct initial state', () => {
      expect(fadeIn.initial).toMatchObject({ opacity: 0 });
    });

    it('should have correct animate state', () => {
      expect(fadeIn.animate).toMatchObject({ opacity: 1 });
    });

    it('should have exit state', () => {
      expect(fadeIn.exit).toMatchObject({ opacity: 0 });
    });
  });

  describe('slideUp', () => {
    it('should have correct initial state', () => {
      expect(slideUp.initial).toMatchObject({ opacity: 0, y: 20 });
    });

    it('should animate to zero position', () => {
      expect(slideUp.animate).toMatchObject({ opacity: 1, y: 0 });
    });
  });

  describe('scaleIn', () => {
    it('should start slightly smaller', () => {
      expect(scaleIn.initial).toMatchObject({ opacity: 0, scale: 0.95 });
    });

    it('should animate to full scale', () => {
      expect(scaleIn.animate).toMatchObject({ opacity: 1, scale: 1 });
    });
  });

  describe('reducedMotionFade', () => {
    it('should have very short durations', () => {
      const animate = reducedMotionFade.animate as any;
      const exit = reducedMotionFade.exit as any;

      expect(animate?.transition?.duration).toBe(0.1);
      expect(exit?.transition?.duration).toBe(0.05);
    });
  });

  describe('getVariant', () => {
    it('should return full variant when reduced motion is false', () => {
      const result = getVariant(fadeIn, false);
      expect(result).toBe(fadeIn);
    });

    it('should return reduced variant when reduced motion is true', () => {
      const result = getVariant(fadeIn, true);
      expect(result).toBe(reducedMotionFade);
    });

    it('should use custom reduced variant when provided', () => {
      const customReduced = { initial: {}, animate: {}, exit: {} };
      const result = getVariant(fadeIn, true, customReduced);
      expect(result).toBe(customReduced);
    });
  });
});

// ============================================================================
// Performance Tests
// ============================================================================

describe('Performance Guidelines', () => {
  it('should use GPU-accelerated properties only in presets', () => {
    // Check that presets only use transform, opacity, scale (GPU-accelerated)
    const gpuSafeProps = ['opacity', 'x', 'y', 'scale', 'rotate', 'transition'];

    const checkVariant = (variant: Record<string, unknown>, name: string) => {
      Object.entries(variant).forEach(([state, props]) => {
        if (typeof props === 'object' && props !== null) {
          Object.keys(props).forEach((prop) => {
            // Allow transition prop
            if (prop !== 'transition') {
              expect(gpuSafeProps).toContain(prop);
            }
          });
        }
      });
    };

    checkVariant(fadeIn, 'fadeIn');
    checkVariant(slideUp, 'slideUp');
    checkVariant(scaleIn, 'scaleIn');
  });

  it('should have exit animations 25% faster than enter', () => {
    expect((transitions.exit as any).duration).toBe((transitions.enter as any).duration * 0.75);
  });
});
