/**
 * Confidence Indicator Component
 *
 * Main component that auto-detects platform and renders the appropriate presenter.
 * Part of the Headless + Platform Presenter pattern (ADR-018).
 *
 * @module @nasnet/ui/patterns/confidence-indicator
 * @see NAS-4A.10: Build Confidence Indicator Component
 */
import * as React from 'react';
import type { ConfidenceIndicatorProps } from './confidence-indicator.types';
/**
 * Confidence Indicator Component
 *
 * Displays a visual indicator for auto-detected values with confidence scoring.
 * Auto-detects platform (mobile/desktop) and renders the appropriate presenter.
 *
 * Features:
 * - Three confidence levels: high (green), medium (amber), low (red)
 * - Tooltip/sheet with detection details
 * - Override action support
 * - Platform-responsive (mobile = sheet, desktop = tooltip)
 * - WCAG AAA accessible
 * - Reduced motion support
 *
 * @example
 * ```tsx
 * // Basic usage
 * <ConfidenceIndicator confidence={95} />
 *
 * // With detection method and override
 * <ConfidenceIndicator
 *   confidence={87}
 *   method="Auto-detected via DHCP response"
 *   onOverride={() => setIsEditing(true)}
 * />
 *
 * // Force mobile variant
 * <ConfidenceIndicator
 *   confidence={45}
 *   variant="mobile"
 * />
 *
 * // Desktop with inline label
 * <ConfidenceIndicator
 *   confidence={92}
 *   variant="desktop"
 *   showLabel
 * />
 * ```
 *
 * @see ADR-018: Platform Presenter Pattern
 * @see DESIGN_TOKENS.md: Confidence indicator color tokens
 */
declare const ConfidenceIndicator: React.NamedExoticComponent<ConfidenceIndicatorProps>;
export { ConfidenceIndicator };
//# sourceMappingURL=confidence-indicator.d.ts.map