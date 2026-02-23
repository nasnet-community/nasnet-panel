/**
 * TemplatesBrowser Storybook Stories
 *
 * TemplatesBrowser is a platform-adaptive component that delegates to
 * TemplatesBrowserDesktop or TemplatesBrowserMobile based on the viewport.
 * Both presenters are driven by the `useTemplatesBrowser` headless hook which
 * calls the `useServiceTemplates` Apollo hook.
 *
 * These stories render each UI state (loading, empty, populated, error,
 * mobile, desktop) using inline mock shells that mirror the real component's
 * JSX without requiring a live Apollo provider.
 */
import type { Meta, StoryObj } from '@storybook/react';
declare const meta: Meta;
export default meta;
type Story = StoryObj;
/**
 * Desktop — populated with four templates across multiple categories.
 */
export declare const DesktopDefault: Story;
/**
 * Desktop — skeleton loading state while templates are fetched.
 */
export declare const DesktopLoading: Story;
/**
 * Desktop — empty state when no templates match the active filters.
 */
export declare const DesktopEmptyFiltered: Story;
/**
 * Desktop — error state when the API request fails.
 */
export declare const DesktopError: Story;
/**
 * Mobile — populated with the same four templates in a vertical list.
 */
export declare const MobileDefault: Story;
/**
 * Mobile — skeleton loading state.
 */
export declare const MobileLoading: Story;
//# sourceMappingURL=TemplatesBrowser.stories.d.ts.map