/**
 * NumberField Stories
 *
 * Storybook stories for the NumberField component — a thin wrapper around
 * the Input primitive that enforces numeric input with optional min/max bounds.
 * Used for NUMBER and PORT type service config fields.
 */
import { NumberField } from './NumberField';
import type { Meta, StoryObj } from '@storybook/react';
declare const meta: Meta<typeof NumberField>;
export default meta;
type Story = StoryObj<typeof NumberField>;
/**
 * Default numeric field with no bounds constraints.
 */
export declare const Default: Story;
/**
 * Port number field bounded to the valid TCP/UDP port range (1-65535).
 */
export declare const PortNumber: Story;
/**
 * Connection limit field with a small bounded range (1-1000).
 */
export declare const ConnectionLimit: Story;
/**
 * Timeout value field in seconds, unbounded on the high end.
 */
export declare const TimeoutSeconds: Story;
/**
 * Disabled state — the value is locked and cannot be edited.
 */
export declare const Disabled: Story;
/**
 * MTU field showing a network-specific range (576-9000).
 */
export declare const MTUField: Story;
//# sourceMappingURL=NumberField.stories.d.ts.map