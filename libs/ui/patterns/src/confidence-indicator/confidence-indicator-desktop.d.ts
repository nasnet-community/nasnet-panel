/**
 * Confidence Indicator Desktop Presenter
 *
 * Desktop-optimized presenter with hover tooltips and inline labels.
 * Part of the Headless + Platform Presenter pattern (ADR-018).
 *
 * @module @nasnet/ui/patterns/confidence-indicator
 * @see NAS-4A.10: Build Confidence Indicator Component
 */
import * as React from 'react';
import type { ConfidenceIndicatorPresenterProps } from './confidence-indicator.types';
/**
 * Desktop Presenter for Confidence Indicator
 *
 * Features:
 * - Hover to show tooltip with details
 * - Optional inline label display
 * - Keyboard accessible (Tab to focus, Enter/Space for details)
 * - WCAG AAA compliant
 *
 * @example
 * ```tsx
 * const state = useConfidenceIndicator({ confidence: 95, method: 'Auto-detected' });
 *
 * <ConfidenceIndicatorDesktop
 *   state={state}
 *   size="md"
 *   showLabel
 * />
 * ```
 *
 * @see confidence-indicator.tsx
 * @see ConfidenceIndicatorDesktopExtended for extended variant
 */
declare const ConfidenceIndicatorDesktop: React.NamedExoticComponent<ConfidenceIndicatorPresenterProps>;
export { ConfidenceIndicatorDesktop };
/**
 * Desktop presenter with extended information display
 *
 * Shows more details inline without requiring hover interaction.
 * Useful in contexts where users need to see confidence info at a glance.
 */
export declare function ConfidenceIndicatorDesktopExtended({ state, size, className, id, }: Omit<ConfidenceIndicatorPresenterProps, 'showLabel'>): import("react/jsx-runtime").JSX.Element;
//# sourceMappingURL=confidence-indicator-desktop.d.ts.map