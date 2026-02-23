/**
 * ConfigPreview Storybook Stories
 *
 * Stories demonstrating ConfigPreview component features:
 * - Syntax highlighting for RouterOS
 * - Diff view with additions/deletions
 * - Collapsible sections
 * - Copy and download actions
 * - Platform presenters (desktop/mobile)
 *
 * @see NAS-4A.21 - Build Config Preview Component
 */
import { ConfigPreview } from './config-preview';
import { ConfigPreviewDesktop } from './config-preview-desktop';
import { ConfigPreviewMobile } from './config-preview-mobile';
import type { Meta, StoryObj } from '@storybook/react';
declare const meta: Meta<typeof ConfigPreview>;
export default meta;
type Story = StoryObj<typeof ConfigPreview>;
/**
 * Default configuration preview with syntax highlighting.
 */
export declare const Default: Story;
/**
 * Full configuration with multiple sections.
 * Each section starts with a command path (e.g., /interface, /ip address)
 * and can be collapsed/expanded.
 */
export declare const WithSections: Story;
/**
 * Diff view showing changes between two configurations.
 * Green lines indicate additions, red lines indicate deletions.
 */
export declare const DiffView: Story;
/**
 * Long script demonstrating scrolling behavior.
 * maxHeight limits the visible area with overflow scroll.
 */
export declare const LongScript: Story;
/**
 * Without line numbers for a cleaner look.
 */
export declare const WithoutLineNumbers: Story;
/**
 * Mobile presenter with simplified controls.
 * Buttons are stacked vertically with 44px touch targets.
 */
export declare const MobileVariant: Story;
/**
 * Desktop presenter with full feature set.
 * Card layout with header toolbar and collapsible sections.
 */
export declare const DesktopVariant: Story;
/**
 * Empty script edge case.
 */
export declare const EmptyScript: Story;
/**
 * No changes diff - when previous equals current.
 * Shows all lines as unchanged.
 */
export declare const NoChangesDiff: Story;
/**
 * Dark theme variant - styles adapt to dark mode.
 */
export declare const DarkTheme: Story;
/**
 * Script with variables and special characters.
 * Tests syntax highlighting for complex RouterOS syntax.
 */
export declare const ComplexSyntax: Story;
/**
 * Interactive example with all callbacks wired up.
 */
export declare const Interactive: Story;
/**
 * Desktop presenter standalone story.
 */
export declare const DesktopPresenter: StoryObj<typeof ConfigPreviewDesktop>;
/**
 * Mobile presenter standalone story.
 */
export declare const MobilePresenter: StoryObj<typeof ConfigPreviewMobile>;
//# sourceMappingURL=config-preview.stories.d.ts.map