/**
 * CStepper Storybook Stories
 *
 * Interactive stories for the Content Stepper (Desktop with Preview) component.
 *
 * @see NAS-4A.17: Build Content Stepper (Desktop with Preview)
 */
import { CStepper } from './c-stepper';
import type { Meta, StoryObj } from '@storybook/react';
declare const meta: Meta<typeof CStepper>;
export default meta;
type Story = StoryObj<typeof CStepper>;
/**
 * Default story - Full three-column layout
 */
export declare const Default: Story;
/**
 * With preview collapsed
 */
export declare const PreviewCollapsed: Story;
/**
 * Without preview content
 */
export declare const NoPreview: Story;
/**
 * Custom widths
 */
export declare const CustomWidths: Story;
/**
 * With validation errors
 */
export declare const WithErrors: Story;
/**
 * Dark theme
 */
export declare const DarkTheme: Story;
/**
 * Custom navigation labels
 */
export declare const CustomNavigationLabels: Story;
/**
 * Interactive story with keyboard shortcuts
 */
export declare const Interactive: Story;
/**
 * Responsive behavior (resize viewport to see auto-collapse)
 */
export declare const ResponsiveBehavior: Story;
//# sourceMappingURL=c-stepper.stories.d.ts.map