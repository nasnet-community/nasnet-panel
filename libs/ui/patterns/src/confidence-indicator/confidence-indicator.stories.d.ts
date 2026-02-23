/**
 * Confidence Indicator Storybook Stories
 *
 * Demonstrates the ConfidenceIndicator component and its variants.
 *
 * @module @nasnet/ui/patterns/confidence-indicator
 * @see NAS-4A.10: Build Confidence Indicator Component
 */
import { ConfidenceIndicator } from './index';
import type { Meta, StoryObj } from '@storybook/react';
/**
 * Confidence Indicator displays a visual indicator for auto-detected values with confidence scoring.
 *
 * **Confidence Levels:**
 * - **High (Green):** 90%+ confidence - solid checkmark, strong visual signal
 * - **Medium (Amber):** 60-89% confidence - caution indicator, moderate signal
 * - **Low (Red):** <60% confidence - warning indicator, suggests manual verification
 *
 * **Features:**
 * - Three confidence levels with distinct visual styles
 * - Tooltip/sheet with detection details
 * - Override action support
 * - Platform-responsive (mobile = bottom sheet, desktop = tooltip)
 * - WCAG AAA accessible
 * - Reduced motion support
 *
 * @see ADR-018: Headless + Platform Presenters
 */
declare const meta: Meta<typeof ConfidenceIndicator>;
export default meta;
type Story = StoryObj<typeof ConfidenceIndicator>;
/**
 * High confidence (95%) - Green checkmark indicating strong detection reliability.
 */
export declare const HighConfidence: Story;
/**
 * Medium confidence (75%) - Amber warning indicating moderate reliability.
 */
export declare const MediumConfidence: Story;
/**
 * Low confidence (45%) - Red warning indicating manual verification recommended.
 */
export declare const LowConfidence: Story;
/**
 * With override action - Shows "Edit manually" button in tooltip/sheet.
 */
export declare const WithOverrideAction: Story;
/**
 * Without override action - No override button shown.
 */
export declare const WithoutOverrideAction: Story;
/**
 * Mobile variant - Tap to open bottom sheet with details.
 */
export declare const MobileVariant: Story;
/**
 * Desktop variant - Hover to show tooltip with details.
 */
export declare const DesktopVariant: Story;
/**
 * Desktop with inline label - Shows "High confidence" text next to indicator.
 */
export declare const DesktopWithLabel: Story;
/**
 * All sizes comparison - sm, md, lg variants.
 */
export declare const AllSizes: Story;
/**
 * Dark theme - Verify colors work correctly in dark mode.
 */
export declare const DarkTheme: Story;
/**
 * All confidence levels - Shows all three levels side by side.
 */
export declare const AllLevels: Story;
/**
 * Boundary values - Tests exact threshold boundaries (90, 60).
 */
export declare const BoundaryValues: Story;
/**
 * With form field - Shows how the indicator integrates with an input field.
 */
export declare const WithFormField: Story;
/**
 * Setup wizard use case - Shows typical confidence values in setup wizard context.
 */
export declare const SetupWizardUseCase: Story;
/**
 * Base component - Shows the internal ConfidenceIndicatorBase component.
 */
export declare const BaseComponent: Story;
/**
 * Dot variant - Shows the compact dot-only variant.
 */
export declare const DotVariant: Story;
//# sourceMappingURL=confidence-indicator.stories.d.ts.map