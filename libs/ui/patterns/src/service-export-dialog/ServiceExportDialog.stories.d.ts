/**
 * ServiceExportDialog Storybook Stories
 */
import { ServiceExportDialog } from './ServiceExportDialog';
import type { Meta, StoryObj } from '@storybook/react';
declare const meta: Meta<typeof ServiceExportDialog>;
export default meta;
type Story = StoryObj<typeof ServiceExportDialog>;
/**
 * Default state with automatic platform detection
 */
export declare const Default: Story;
/**
 * Desktop presenter (>1024px)
 * Shows dense layout with horizontal actions
 */
export declare const Desktop: Story;
/**
 * Tablet presenter (640-1024px)
 * Shows hybrid layout with touch-friendly spacing
 */
export declare const Tablet: Story;
/**
 * Mobile presenter (<640px)
 * Shows full-screen sheet with 44px touch targets
 */
export declare const Mobile: Story;
/**
 * Controlled state example
 * Demonstrates programmatic control of dialog open state
 */
export declare const ControlledState: Story;
/**
 * Complex service configuration
 * Shows export dialog with a more complex service (sing-box)
 */
export declare const ComplexService: Story;
/**
 * Service with routing rules
 * Demonstrates export with device routing assignments
 */
export declare const WithRoutingRules: Story;
/**
 * QR Code export format
 * Shows QR code generation for mobile sharing
 */
export declare const QRCodeFormat: Story;
/**
 * Custom trigger button
 * Demonstrates using a custom trigger element
 */
export declare const CustomTrigger: Story;
/**
 * Export Flow Interaction Test
 * Tests complete export flow with user interactions
 */
export declare const ExportFlowInteraction: Story;
/**
 * QR Code Generation Interaction Test
 * Tests QR code format selection and generation
 */
export declare const QRCodeGenerationInteraction: Story;
//# sourceMappingURL=ServiceExportDialog.stories.d.ts.map