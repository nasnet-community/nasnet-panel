import { Tabs } from './tabs';
import type { Meta, StoryObj } from '@storybook/react';
declare const meta: Meta<typeof Tabs>;
export default meta;
type Story = StoryObj<typeof Tabs>;
/**
 * Default tabs showing account and password settings.
 * Happy path demonstrating basic two-tab layout with card content.
 * Keyboard: Tab to focus, Arrow Left/Right to navigate, Enter/Space to select.
 */
export declare const Default: Story;
/**
 * Tabs with icons and four columns showing icon+label pattern.
 * Demonstrates icon usage with text labels (never icon-only without tooltip).
 * Grid layout stretches tabs evenly across available width.
 */
export declare const WithIcons: Story;
/**
 * Controlled component showing programmatic tab selection.
 * Demonstrates external state management with onValueChange callback.
 * Buttons show external control of active tab state.
 */
export declare const Controlled: Story;
/**
 * Disabled tab state showing visual and behavioral disabled styling.
 * Disabled tab is skipped by keyboard navigation (Tab key).
 * Demonstrates proper disabled attribute usage and CSS applied state.
 */
export declare const Disabled: Story;
/**
 * Full-width tabs using flex-1 for equal width distribution.
 * Shows four tabs stretching across available container width.
 * Demonstrates desktop-style four-column navigation layout.
 */
export declare const FullWidth: Story;
/**
 * Mobile viewport (375px) showing two-column tab grid.
 * Tabs are full-width with 44px+ touch target height.
 * Content uses reduced padding (p-3) to maximize viewport usage.
 * Reduced form fields shown per progressive disclosure pattern.
 */
export declare const Mobile: Story;
/**
 * Tablet viewport (768px) showing three-column tab grid.
 * Balanced information density with medium padding.
 * Demonstrates hybrid approach between mobile simplicity and desktop density.
 */
export declare const Tablet: Story;
//# sourceMappingURL=tabs.stories.d.ts.map