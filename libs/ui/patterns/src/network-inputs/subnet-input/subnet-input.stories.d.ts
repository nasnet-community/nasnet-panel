/**
 * SubnetInput Stories
 * Storybook stories for the Subnet/CIDR Input component
 */
import { SubnetInput } from './index';
import type { Meta, StoryObj } from '@storybook/react';
declare const meta: Meta<typeof SubnetInput>;
export default meta;
type Story = StoryObj<typeof SubnetInput>;
/**
 * Default state with no value
 */
export declare const Default: Story;
/**
 * With a valid CIDR value showing calculations
 */
export declare const WithValidCIDR: Story;
/**
 * With calculations panel hidden
 */
export declare const CalculationsHidden: Story;
/**
 * With overlap warning displayed
 */
export declare const WithOverlapWarning: Story;
/**
 * With validation error
 */
export declare const WithError: Story;
/**
 * Disabled state
 */
export declare const Disabled: Story;
/**
 * Required field
 */
export declare const Required: Story;
/**
 * Desktop presenter specifically
 */
export declare const DesktopVariant: Story;
/**
 * Mobile presenter specifically
 */
export declare const MobileVariant: Story;
/**
 * Various prefix examples
 */
export declare const PrefixExamples: Story;
/**
 * Dark mode support
 */
export declare const DarkMode: Story;
//# sourceMappingURL=subnet-input.stories.d.ts.map