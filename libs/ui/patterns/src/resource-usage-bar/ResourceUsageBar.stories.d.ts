/**
 * ResourceUsageBar Storybook Stories
 *
 * Comprehensive stories demonstrating all ResourceUsageBar states and variants.
 */
import { ResourceUsageBar } from './ResourceUsageBar';
import type { Meta, StoryObj } from '@storybook/react';
declare const meta: Meta<typeof ResourceUsageBar>;
export default meta;
type Story = StoryObj<typeof ResourceUsageBar>;
/**
 * Idle state (0% usage)
 * Gray color indicates no resource usage
 */
export declare const Idle: Story;
/**
 * Normal state (<60% usage)
 * Green color indicates healthy resource usage
 */
export declare const Normal: Story;
/**
 * Warning state (60-79% usage)
 * Amber color indicates elevated resource usage
 */
export declare const Warning: Story;
/**
 * Critical state (80-94% usage)
 * Orange color indicates high resource usage
 */
export declare const Critical: Story;
/**
 * Danger state (≥95% usage)
 * Red color indicates resource exhaustion
 */
export declare const Danger: Story;
/**
 * CPU Resource Type
 * Shows CPU usage with percentage unit
 */
export declare const CPUResource: Story;
/**
 * Disk Resource Type
 * Shows disk usage in GB
 */
export declare const DiskResource: Story;
/**
 * Custom Label
 * Shows usage with a custom label
 */
export declare const CustomLabel: Story;
/**
 * Custom Thresholds
 * Demonstrates custom threshold configuration
 */
export declare const CustomThresholds: Story;
/**
 * Percentage Only
 * Shows only the percentage without numeric values
 */
export declare const PercentageOnly: Story;
/**
 * Values Only
 * Shows numeric values without percentage
 */
export declare const ValuesOnly: Story;
/**
 * Mobile Variant
 * Forces mobile presentation (vertical layout, 44px touch targets)
 */
export declare const MobileVariant: Story;
/**
 * Desktop Variant
 * Forces desktop presentation (horizontal layout, compact)
 */
export declare const DesktopVariant: Story;
/**
 * All Status States
 * Shows all threshold states side by side
 */
export declare const AllStates: Story;
/**
 * Multiple Resources
 * Real-world example showing multiple resource types
 */
export declare const MultipleResources: Story;
//# sourceMappingURL=ResourceUsageBar.stories.d.ts.map