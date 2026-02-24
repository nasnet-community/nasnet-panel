/**
 * ServiceGroupDialog Storybook Stories
 *
 * Interactive stories demonstrating:
 * - Create mode (empty form)
 * - Edit mode (pre-populated with existing group)
 * - Validation errors
 * - Conflict errors
 * - Large groups (10+ services)
 *
 * @module @nasnet/features/firewall/components
 */
import { ServiceGroupDialog } from './ServiceGroupDialog';
import type { Meta, StoryObj } from '@storybook/react';
declare const meta: Meta<typeof ServiceGroupDialog>;
export default meta;
type Story = StoryObj<typeof ServiceGroupDialog>;
/**
 * Create Mode
 *
 * Empty form for creating a new service group.
 * User can select multiple services, set protocol, and add description.
 */
export declare const CreateMode: Story;
/**
 * Edit Mode - Small Group
 *
 * Editing an existing service group with 3 services.
 * Form is pre-populated with group data.
 */
export declare const EditModeSmallGroup: Story;
/**
 * Edit Mode - Database Group
 *
 * Editing a service group containing database services.
 * Shows 4 selected services.
 */
export declare const EditModeDatabaseGroup: Story;
/**
 * Large Group
 *
 * Editing a large group with 13 services.
 * Tests UI with many selected chips.
 */
export declare const LargeGroup: Story;
/**
 * With UDP Protocol
 *
 * Create mode with UDP protocol selected.
 * Filters services to show only UDP-compatible services.
 */
export declare const WithUDPProtocol: Story;
/**
 * With "Both" Protocol
 *
 * Create mode with "both" protocol selected.
 * Shows all available services regardless of protocol.
 */
export declare const WithBothProtocol: Story;
/**
 * Validation Error - Empty Fields
 *
 * Shows validation errors when required fields are empty.
 * Demonstrates form validation feedback.
 */
export declare const ValidationErrorEmptyFields: Story;
/**
 * Conflict Error
 *
 * Shows error when group name already exists.
 * Demonstrates conflict detection.
 */
export declare const ConflictError: Story;
/**
 * Loading State
 *
 * Shows loading state during form submission.
 * Demonstrates disabled buttons and loading text.
 */
export declare const LoadingState: Story;
/**
 * Interactive Playground
 *
 * Fully interactive story for testing all features.
 */
export declare const Playground: Story;
//# sourceMappingURL=ServiceGroupDialog.stories.d.ts.map