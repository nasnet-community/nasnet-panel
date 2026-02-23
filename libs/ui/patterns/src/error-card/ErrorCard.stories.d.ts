/**
 * ErrorCard Stories
 *
 * Demonstrates all variants, error types, and interactive states of the
 * inline ErrorCard component used throughout the application.
 */
import { ErrorCard } from './ErrorCard';
import type { Meta, StoryObj } from '@storybook/react';
declare const meta: Meta<typeof ErrorCard>;
export default meta;
type Story = StoryObj<typeof ErrorCard>;
/**
 * Default card with retry and report actions.
 */
export declare const Default: Story;
/**
 * Compact variant — suitable for sidebars, toolbars, and list items.
 */
export declare const Compact: Story;
/**
 * Minimal single-line variant for inline use inside cards or tables.
 */
export declare const Minimal: Story;
/**
 * Warning type — for degraded states that are not full failures.
 */
export declare const Warning: Story;
/**
 * Network type — for connectivity failures reaching the router.
 */
export declare const NetworkError: Story;
/**
 * Auth type — for authentication or authorization failures.
 */
export declare const AuthError: Story;
/**
 * Not-found type — for missing resources such as a deleted rule or lease.
 */
export declare const NotFound: Story;
/**
 * Full-featured default card with all optional props populated.
 */
export declare const FullFeatured: Story;
//# sourceMappingURL=ErrorCard.stories.d.ts.map