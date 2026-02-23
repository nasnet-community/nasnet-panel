/**
 * ResourceProvider Storybook Stories
 *
 * Demonstrates the ResourceProvider context pattern for the Universal State v2
 * 8-layer resource model. Stories show consumer components using
 * useResourceContext() to access resource state and actions.
 *
 * @module @nasnet/ui/patterns/resource-provider
 */
import type { Meta, StoryObj } from '@storybook/react';
interface ResourceProviderDemoProps {
    /** Lifecycle state of the resource */
    state?: string;
    /** Show loading skeleton */
    loading?: boolean;
    /** Show error message */
    showError?: boolean;
    /** Resource has validation errors */
    hasErrors?: boolean;
    /** Resource is currently running */
    isRunning?: boolean;
}
declare function ResourceProviderDemo({ state, loading, showError, hasErrors, }: ResourceProviderDemoProps): import("react/jsx-runtime").JSX.Element;
declare const meta: Meta<typeof ResourceProviderDemo>;
export default meta;
type Story = StoryObj<typeof ResourceProviderDemo>;
/**
 * An ACTIVE resource running on the router with live runtime data.
 */
export declare const ActiveResource: Story;
/**
 * A DRAFT resource — not yet validated, editable.
 */
export declare const DraftResource: Story;
/**
 * A resource mid-validation — isPending=true, actions disabled.
 */
export declare const ValidatingResource: Story;
/**
 * A DEGRADED resource — running but with issues.
 */
export declare const DegradedResource: Story;
/**
 * An ERROR state resource with validation errors shown inline.
 */
export declare const ResourceWithErrors: Story;
/**
 * Loading state — ResourceLoading renders, ResourceLoaded does not.
 */
export declare const LoadingState: Story;
/**
 * Error state — ResourceError renders with the error message.
 */
export declare const ErrorState: Story;
//# sourceMappingURL=ResourceProvider.stories.d.ts.map