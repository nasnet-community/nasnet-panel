/**
 * ResourceLimitsForm Stories
 *
 * Storybook stories for the ResourceLimitsForm component which allows
 * configuring memory and CPU resource constraints for service instances.
 */
import { ResourceLimitsForm } from './ResourceLimitsForm';
import type { Meta, StoryObj } from '@storybook/react';
declare const meta: Meta<typeof ResourceLimitsForm>;
export default meta;
type Story = StoryObj<typeof ResourceLimitsForm>;
/**
 * Default state with minimum memory (64 MB) and no CPU weight set.
 * The Reset and Save buttons are disabled until the form is dirty.
 */
export declare const Default: Story;
/**
 * Form with both memory and CPU weight configured.
 * Shows the "Applied" status badge in the footer.
 */
export declare const WithCPUWeight: Story;
/**
 * Shows the "Not applied" status when cgroups are unavailable on the router.
 */
export declare const CgroupsUnavailable: Story;
/**
 * Form initialized with high resource limits (512 MB RAM, CPU weight 1000).
 * Represents a resource-intensive service like AdGuard Home.
 */
export declare const HighResourceLimits: Story;
/**
 * Form without any current limits — uses default values (64 MB, no CPU weight).
 * Suitable for a newly created service instance.
 */
export declare const NoCurrentLimits: Story;
/**
 * Server-side error response after form submission.
 * The form displays the error message inline below the fields.
 */
export declare const ServerError: Story;
/**
 * Dark mode variant showing the form in a dark background context.
 */
export declare const DarkMode: Story;
//# sourceMappingURL=ResourceLimitsForm.stories.d.ts.map