/**
 * Port Input Component Stories
 *
 * Storybook stories demonstrating all modes and features of the PortInput component.
 *
 * @module @nasnet/ui/patterns/network-inputs/port-input
 */
import { PortInput } from './port-input';
import type { Meta, StoryObj } from '@storybook/react';
declare const meta: Meta<typeof PortInput>;
export default meta;
type Story = StoryObj<typeof PortInput>;
/**
 * Default single port input with empty state.
 */
export declare const Default: Story;
/**
 * Single port with a valid well-known port showing service name.
 */
export declare const WithValidPort: Story;
/**
 * Shows service name for well-known ports.
 */
export declare const ServiceLookup: Story;
/**
 * Invalid port number showing error state.
 */
export declare const ErrorState: Story;
/**
 * Disabled state.
 */
export declare const Disabled: Story;
/**
 * Port range mode for specifying start and end ports.
 */
export declare const RangeMode: Story;
/**
 * Range mode with a valid port range.
 */
export declare const RangeWithValue: Story;
/**
 * Range mode with validation error (start > end).
 */
export declare const RangeError: Story;
/**
 * Multi-port mode with tag-style chips.
 */
export declare const MultiMode: Story;
/**
 * Multi-port mode with existing ports.
 */
export declare const MultiWithPorts: Story;
/**
 * Port input with suggestions dropdown enabled.
 */
export declare const WithSuggestions: Story;
/**
 * Multi-mode with suggestions for quick port selection.
 */
export declare const MultiWithSuggestions: Story;
/**
 * Different protocol badges.
 */
export declare const ProtocolVariants: Story;
/**
 * Common MikroTik management ports.
 */
export declare const MikroTikPorts: Story;
/**
 * Desktop presenter directly.
 */
export declare const DesktopVariant: Story;
/**
 * Mobile presenter in a narrow viewport.
 */
export declare const MobileVariant: Story;
/**
 * Mobile range mode with stacked inputs.
 */
export declare const MobileRangeMode: Story;
/**
 * Mobile multi-port mode with add button.
 */
export declare const MobileMultiMode: Story;
/**
 * Edge case: Minimum and maximum valid ports.
 */
export declare const EdgeCases: Story;
/**
 * All three modes side by side for comparison.
 */
export declare const AllModes: Story;
/**
 * Multi-mode with service groups for quick bulk selection.
 * Service groups appear with folder icons in the suggestions dropdown.
 */
export declare const WithServiceGroups: Story;
/**
 * Service groups filtered by protocol context.
 * Only TCP groups are shown when protocol is TCP.
 */
export declare const ServiceGroupsFiltered: Story;
//# sourceMappingURL=port-input.stories.d.ts.map