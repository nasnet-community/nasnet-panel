/**
 * MobileAppShell Storybook Stories
 *
 * Responsive app shell layout component stories covering:
 * - Default responsive layout (mobile frame by default)
 * - With/without header, navigation, status banner
 * - Desktop sidebar visibility
 * - Wizard layout (no navigation)
 * - Multi-viewport testing (mobile/tablet/desktop)
 *
 * **Stories cover:**
 * - Happy path (default dashboard layout)
 * - Time-based greeting integration
 * - Status banner states (warning, error)
 * - Desktop responsive behavior
 * - Wizard flows (no navigation)
 */
import { MobileAppShell } from './mobile-app-shell';
import type { Meta, StoryObj } from '@storybook/react';
declare const meta: Meta<typeof MobileAppShell>;
export default meta;
type Story = StoryObj<typeof MobileAppShell>;
export declare const Default: Story;
export declare const WithGreeting: Story;
export declare const WithStatusBanner: Story;
export declare const WithErrorBanner: Story;
export declare const WithDesktopSidebar: Story;
export declare const NoNavigation: Story;
export declare const Mobile375px: Story;
export declare const Tablet768px: Story;
export declare const Desktop1280px: Story;
export declare const WithLoadingState: Story;
export declare const WithErrorState: Story;
export declare const WithEmptyState: Story;
//# sourceMappingURL=mobile-app-shell.stories.d.ts.map