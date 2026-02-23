/**
 * ErrorPage Stories
 *
 * Demonstrates all variants of the full-page error display component,
 * covering generic errors, 404, 403, server crashes, and network failures.
 */
import { ErrorPage } from './ErrorPage';
import type { Meta, StoryObj } from '@storybook/react';
declare const meta: Meta<typeof ErrorPage>;
export default meta;
type Story = StoryObj<typeof ErrorPage>;
/**
 * Generic unexpected error — the default variant shown when no specific type
 * is known.
 */
export declare const Default: Story;
/**
 * 404 Not Found — shown when navigating to a page or resource that no longer
 * exists.
 */
export declare const NotFound: Story;
/**
 * 403 Unauthorized — shown when the user lacks permission to access a page
 * or feature.
 */
export declare const Unauthorized: Story;
/**
 * 500 Server Error — shown when the backend encountered an unhandled error.
 */
export declare const ServerError: Story;
/**
 * Network connectivity failure — used when the frontend cannot reach the
 * backend or router.
 */
export declare const NetworkError: Story;
/**
 * Custom title and description override the variant defaults, showing how
 * the component adapts to application-specific error messages.
 */
export declare const CustomMessage: Story;
/**
 * With children — arbitrary content (e.g. a quick-link list) rendered below
 * the main error block.
 */
export declare const WithChildren: Story;
//# sourceMappingURL=ErrorPage.stories.d.ts.map