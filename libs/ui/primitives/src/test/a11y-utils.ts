/**
 * Accessibility Testing Utilities
 *
 * Comprehensive reusable test utilities for axe-core accessibility testing.
 * Provides functions to ensure WCAG AAA compliance across all components.
 *
 * Features:
 * - testA11y(): Main test function with configurable WCAG level (A, AA, AAA)
 * - getA11yReport(): Non-asserting report generation for debugging
 * - getTabOrder(): Verify logical keyboard navigation order
 * - hasMinimumTouchTarget(): Check 44x44px touch target requirements
 * - getElementsWithSmallTouchTargets(): Batch touch target verification
 * - meetsContrastRequirement(): Validate color contrast ratios
 * - getContrastRatio(): Calculate exact contrast ratio between colors
 * - assertAriaAttributes(): Verify ARIA attribute presence and values
 *
 * @example
 * ```tsx
 * import { testA11y, getA11yReport } from '@nasnet/ui/primitives/test/a11y-utils';
 *
 * // Test with default WCAG AAA
 * it('should pass WCAG AAA', async () => {
 *   await testA11y(<Button>Click me</Button>);
 * });
 *
 * // Test with specific WCAG level
 * it('should pass WCAG AA', async () => {
 *   await testA11y(<MyComponent />, { wcagLevel: 'AA' });
 * });
 *
 * // Generate report for debugging
 * const report = await getA11yReport(<Component />);
 * console.log(report.violations); // View all accessibility violations
 * ```
 *
 * @see {@link ./setup.ts} For vitest configuration
 * @see {@link ../../Docs/design/ux-design/8-responsive-design-accessibility.md} For accessibility guidelines
 * @see {@link ../../Docs/design/COMPREHENSIVE_COMPONENT_CHECKLIST.md#7-accessibility-wcag-aaa} For WCAG AAA checklist
 */

import type { ReactElement } from 'react';

import { render } from '@testing-library/react';
import { expect } from 'vitest';
import { axe } from 'vitest-axe';
import type AxeCore from 'axe-core';

/**
 * Vitest interface augmentation for axe-core custom matcher
 * Extends Vitest's Assertion interface to support .toHaveNoViolations()
 */
declare module 'vitest' {
  interface Assertion<T = any> {
    toHaveNoViolations(): T;
  }
  interface AsymmetricMatchersContaining {
    toHaveNoViolations(): void;
  }
}

/**
 * Options for axe-core testing
 */
export interface TestA11yOptions {
  /**
   * axe-core configuration options
   */
  axeOptions?: Parameters<typeof axe>[1];

  /**
   * Additional rules to enable or disable
   */
  rules?: {
    [ruleId: string]: { enabled: boolean };
  };

  /**
   * WCAG level to test against
   * @default 'AAA'
   */
  wcagLevel?: 'A' | 'AA' | 'AAA';
}

/**
 * Test a component for accessibility violations
 *
 * @param ui - React element to test
 * @param options - Configuration options
 * @throws AssertionError if violations are found
 *
 * @example
 * ```tsx
 * import { testA11y } from '@nasnet/ui/primitives/test/a11y-utils';
 *
 * it('should have no accessibility violations', async () => {
 *   await testA11y(<Button>Click me</Button>);
 * });
 *
 * // With options
 * it('should pass with specific rules', async () => {
 *   await testA11y(<MyComponent />, {
 *     wcagLevel: 'AA',
 *     rules: { 'color-contrast': { enabled: false } },
 *   });
 * });
 * ```
 */
export async function testA11y(ui: ReactElement, options: TestA11yOptions = {}): Promise<void> {
  const { axeOptions, rules, wcagLevel = 'AAA' } = options;

  const { container } = render(ui);

  // Build axe config based on WCAG level
  const wcagTags: string[] = [];
  if (wcagLevel === 'A' || wcagLevel === 'AA' || wcagLevel === 'AAA') {
    wcagTags.push('wcag2a');
  }
  if (wcagLevel === 'AA' || wcagLevel === 'AAA') {
    wcagTags.push('wcag2aa');
  }
  if (wcagLevel === 'AAA') {
    wcagTags.push('wcag2aaa');
  }

  const config = {
    ...axeOptions,
    runOnly: {
      type: 'tag' as const,
      values: wcagTags,
    },
    rules,
  };

  const results = await axe(container, config);
  expect(results).toHaveNoViolations();
}

/**
 * Get detailed accessibility report without assertion
 *
 * Useful for debugging or generating reports
 *
 * @param ui - React element to test
 * @param options - Configuration options
 * @returns Axe results object
 *
 * @example
 * ```tsx
 * const results = await getA11yReport(<MyComponent />);
 * console.log('Violations:', results.violations);
 * console.log('Passes:', results.passes.length);
 * ```
 */
export async function getA11yReport(
  ui: ReactElement,
  options: TestA11yOptions = {}
): Promise<AxeCore.AxeResults> {
  const { axeOptions, rules, wcagLevel = 'AAA' } = options;

  const { container } = render(ui);

  const wcagTags: string[] = [];
  if (wcagLevel === 'A' || wcagLevel === 'AA' || wcagLevel === 'AAA') {
    wcagTags.push('wcag2a');
  }
  if (wcagLevel === 'AA' || wcagLevel === 'AAA') {
    wcagTags.push('wcag2aa');
  }
  if (wcagLevel === 'AAA') {
    wcagTags.push('wcag2aaa');
  }

  const config = {
    ...axeOptions,
    runOnly: {
      type: 'tag' as const,
      values: wcagTags,
    },
    rules,
  };

  return axe(container, config);
}

/**
 * Test keyboard navigation for a component
 *
 * Verifies that all interactive elements are reachable via Tab key
 *
 * @param container - DOM container to test
 * @returns Array of focusable elements in tab order
 *
 * @example
 * ```tsx
 * const { container } = render(<Form />);
 * const tabOrder = getTabOrder(container);
 * expect(tabOrder[0]).toBe(screen.getByLabelText('Name'));
 * expect(tabOrder[1]).toBe(screen.getByLabelText('Email'));
 * ```
 */
export function getTabOrder(container: HTMLElement): HTMLElement[] {
  const focusableSelector = [
    'a[href]',
    'button:not([disabled])',
    'input:not([disabled])',
    'select:not([disabled])',
    'textarea:not([disabled])',
    '[tabindex]:not([tabindex="-1"])',
    '[contenteditable]',
  ].join(', ');

  const elements = Array.from(container.querySelectorAll<HTMLElement>(focusableSelector));

  // Sort by tabindex (elements with tabindex > 0 come first, in order)
  // Then by DOM order for tabindex = 0 or no tabindex
  return elements.sort((a, b) => {
    const aIndex = parseInt(a.getAttribute('tabindex') || '0', 10);
    const bIndex = parseInt(b.getAttribute('tabindex') || '0', 10);

    // Negative tabindex should be excluded (we already filtered those)
    if (aIndex > 0 && bIndex > 0) {
      return aIndex - bIndex;
    }
    if (aIndex > 0) return -1;
    if (bIndex > 0) return 1;

    // Same tabindex, use DOM order (already sorted by querySelectorAll)
    return 0;
  });
}

/**
 * Verify touch target size meets WCAG AAA requirements
 *
 * Touch targets should be at least 44x44 pixels
 *
 * @param element - Element to test
 * @param minSize - Minimum size in pixels (default: 44)
 * @returns Whether the element meets size requirements
 *
 * @example
 * ```tsx
 * const button = screen.getByRole('button');
 * expect(hasMinimumTouchTarget(button)).toBe(true);
 * ```
 */
export function hasMinimumTouchTarget(element: HTMLElement, minSize: number = 44): boolean {
  const rect = element.getBoundingClientRect();
  return rect.width >= minSize && rect.height >= minSize;
}

/**
 * Test all interactive elements for minimum touch target size
 *
 * @param container - DOM container to test
 * @param minSize - Minimum size in pixels (default: 44)
 * @returns Elements that fail the size requirement
 *
 * @example
 * ```tsx
 * const { container } = render(<MyComponent />);
 * const failingElements = getElementsWithSmallTouchTargets(container);
 * expect(failingElements).toHaveLength(0);
 * ```
 */
export function getElementsWithSmallTouchTargets(
  container: HTMLElement,
  minSize: number = 44
): HTMLElement[] {
  const interactiveSelector = [
    'a[href]',
    'button',
    'input',
    'select',
    'textarea',
    '[role="button"]',
    '[role="link"]',
    '[role="checkbox"]',
    '[role="radio"]',
    '[role="switch"]',
  ].join(', ');

  const elements = Array.from(container.querySelectorAll<HTMLElement>(interactiveSelector));

  return elements.filter((el) => !hasMinimumTouchTarget(el, minSize));
}

/**
 * Check if element has sufficient color contrast
 *
 * Note: This is a simplified check. For comprehensive contrast testing,
 * rely on axe-core's color-contrast rule.
 *
 * @param foreground - Foreground color (hex, rgb, or named)
 * @param background - Background color (hex, rgb, or named)
 * @param level - WCAG level ('AA' or 'AAA')
 * @param isLargeText - Whether the text is large (18px+ or 14px+ bold)
 * @returns Whether the contrast meets requirements
 */
export function meetsContrastRequirement(
  foreground: string,
  background: string,
  level: 'AA' | 'AAA' = 'AAA',
  isLargeText: boolean = false
): boolean {
  const ratio = getContrastRatio(foreground, background);

  // WCAG requirements:
  // AAA normal text: 7:1
  // AAA large text: 4.5:1
  // AA normal text: 4.5:1
  // AA large text: 3:1

  if (level === 'AAA') {
    return isLargeText ? ratio >= 4.5 : ratio >= 7;
  }
  return isLargeText ? ratio >= 3 : ratio >= 4.5;
}

/**
 * Calculate contrast ratio between two colors
 *
 * @param foreground - Foreground color
 * @param background - Background color
 * @returns Contrast ratio (1-21)
 */
export function getContrastRatio(foreground: string, background: string): number {
  const fgLuminance = getLuminance(foreground);
  const bgLuminance = getLuminance(background);

  const lighter = Math.max(fgLuminance, bgLuminance);
  const darker = Math.min(fgLuminance, bgLuminance);

  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Get relative luminance of a color
 *
 * @param color - Color in hex format (#RRGGBB or #RGB)
 * @returns Relative luminance (0-1)
 */
function getLuminance(color: string): number {
  const hex = color.replace('#', '');
  const fullHex =
    hex.length === 3 ?
      hex
        .split('')
        .map((c) => c + c)
        .join('')
    : hex;

  const r = parseInt(fullHex.substr(0, 2), 16) / 255;
  const g = parseInt(fullHex.substr(2, 2), 16) / 255;
  const b = parseInt(fullHex.substr(4, 2), 16) / 255;

  const toLinear = (c: number) => (c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4));

  return 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);
}

/**
 * Assert that element has required ARIA attributes
 *
 * @param element - Element to test
 * @param attributes - Required ARIA attributes
 *
 * @example
 * ```tsx
 * const dialog = screen.getByRole('dialog');
 * assertAriaAttributes(dialog, {
 *   'aria-modal': 'true',
 *   'aria-labelledby': expect.any(String),
 * });
 * ```
 */
export function assertAriaAttributes(
  element: HTMLElement,
  attributes: Record<string, string | RegExp>
): void {
  for (const [attr, value] of Object.entries(attributes)) {
    const actualValue = element.getAttribute(attr);

    if (value instanceof RegExp) {
      expect(actualValue).toMatch(value);
    } else {
      expect(actualValue).toBe(value);
    }
  }
}
