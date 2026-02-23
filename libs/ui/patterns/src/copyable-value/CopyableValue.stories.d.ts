/**
 * Storybook stories for CopyableValue component
 * @see NAS-4.23 - Implement Clipboard Integration
 */
import { CopyableValue } from './CopyableValue';
import type { Meta, StoryObj } from '@storybook/react';
declare const meta: Meta<typeof CopyableValue>;
export default meta;
type Story = StoryObj<typeof CopyableValue>;
/**
 * IP address - standard display
 */
export declare const IPAddress: Story;
/**
 * IP address with CIDR notation
 */
export declare const IPWithCIDR: Story;
/**
 * MAC address
 */
export declare const MACAddress: Story;
/**
 * Hostname
 */
export declare const Hostname: Story;
/**
 * Generic text
 */
export declare const GenericText: Story;
/**
 * API Key (masked by default)
 */
export declare const APIKey: Story;
/**
 * Password (masked)
 */
export declare const Password: Story;
/**
 * Token (masked)
 */
export declare const Token: Story;
/**
 * Always show icons (no hover)
 */
export declare const AlwaysShowIcons: Story;
/**
 * Different sizes
 */
export declare const Sizes: Story;
/**
 * In table context
 */
export declare const InTableContext: Story;
/**
 * In detail view context
 */
export declare const InDetailView: Story;
//# sourceMappingURL=CopyableValue.stories.d.ts.map