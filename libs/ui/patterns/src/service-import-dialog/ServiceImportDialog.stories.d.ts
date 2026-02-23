/**
 * ServiceImportDialog Storybook Stories
 */
import { ServiceImportDialog } from './ServiceImportDialog';
import type { Meta, StoryObj } from '@storybook/react';
declare const meta: Meta<typeof ServiceImportDialog>;
export default meta;
type Story = StoryObj<typeof ServiceImportDialog>;
/**
 * Default state with automatic platform detection
 */
export declare const Default: Story;
/**
 * Desktop presenter (>1024px)
 * Shows multi-step wizard with detailed validation
 */
export declare const Desktop: Story;
/**
 * Tablet presenter (640-1024px)
 * Shows hybrid layout with touch-friendly controls
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
 * Valid JSON pre-filled
 * Shows dialog with valid JSON already pasted
 */
export declare const ValidJSON: Story;
/**
 * Redacted secrets example
 * Shows dialog handling redacted sensitive fields
 */
export declare const RedactedSecrets: Story;
/**
 * Invalid JSON example
 * Shows validation error handling
 */
export declare const InvalidJSON: Story;
/**
 * Custom trigger button
 * Demonstrates using a custom trigger element
 */
export declare const CustomTrigger: Story;
/**
 * Import Flow Interaction Test
 * Tests complete import flow with file upload and validation
 */
export declare const ImportFlowInteraction: Story;
/**
 * Import with Redacted Fields Interaction Test
 * Tests handling of redacted secrets with user input
 */
export declare const ImportRedactedFieldsInteraction: Story;
/**
 * Import with Conflict Resolution Interaction Test
 * Tests conflict detection and resolution flow
 */
export declare const ImportConflictResolutionInteraction: Story;
//# sourceMappingURL=ServiceImportDialog.stories.d.ts.map