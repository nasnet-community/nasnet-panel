/**
 * Confidence Indicator Mobile Presenter
 *
 * Mobile-optimized presenter with tap-to-reveal bottom sheet.
 * Part of the Headless + Platform Presenter pattern (ADR-018).
 *
 * @module @nasnet/ui/patterns/confidence-indicator
 * @see NAS-4A.10: Build Confidence Indicator Component
 */
import type { ConfidenceIndicatorPresenterProps } from './confidence-indicator.types';
/**
 * Mobile Presenter for Confidence Indicator
 *
 * Features:
 * - Simple colored dot/icon indicator
 * - Tap to show bottom sheet with full details
 * - 44px minimum touch target
 * - Full override functionality in sheet
 *
 * @example
 * ```tsx
 * const state = useConfidenceIndicator({ confidence: 75, method: 'Inferred from DHCP' });
 *
 * <ConfidenceIndicatorMobile
 *   state={state}
 *   size="md"
 * />
 * ```
 */
export declare function ConfidenceIndicatorMobile({ state, size, showLabel: _showLabel, // Ignored on mobile - we show in sheet instead
className, id, }: ConfidenceIndicatorPresenterProps): import("react/jsx-runtime").JSX.Element;
/**
 * Compact mobile variant - just shows dot
 *
 * For very space-constrained mobile contexts where even
 * the icon is too large. Shows only a colored dot.
 */
export declare function ConfidenceIndicatorMobileCompact({ state, className, id, }: Omit<ConfidenceIndicatorPresenterProps, 'size' | 'showLabel'>): import("react/jsx-runtime").JSX.Element;
//# sourceMappingURL=confidence-indicator-mobile.d.ts.map