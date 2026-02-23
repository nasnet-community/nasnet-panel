/**
 * Stories for CommandPalette component
 *
 * The real CommandPalette connects to Zustand stores (`useUIStore`,
 * `useCommandRegistry`) and TanStack Router navigation, which are unavailable
 * in Storybook. This file provides a self-contained MockCommandPalette that
 * duplicates the visual shell so every story renders without external providers.
 */
import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
type CommandCategory = 'navigation' | 'action' | 'resource' | 'recent';
interface MockCommand {
    /** Unique identifier for the command */
    id: string;
    /** Display label */
    label: string;
    /** Brief description of what the command does */
    description?: string;
    /** Icon component (from lucide-react) */
    icon: React.ElementType;
    /** Command category for grouping */
    category: CommandCategory;
    /** Keyboard shortcut (e.g., 'cmd+k' or 'g h') */
    shortcut?: string;
    /** Whether this command requires network connectivity */
    requiresNetwork?: boolean;
    /** Search keywords for matching */
    keywords?: string[];
}
interface MockCommandPaletteProps {
    /** Initial list of commands to display */
    commands: MockCommand[];
    /** Start with specific query text pre-filled */
    initialQuery?: string;
    /** Show recent or results section header */
    mode?: 'recent' | 'results';
    /** Whether the device is online (affects network-dependent commands) */
    isOnline?: boolean;
    /** Render as mobile bottom-sheet instead of centered modal */
    mobile?: boolean;
}
declare function MockCommandPalette({ commands, initialQuery, mode, isOnline, mobile, }: MockCommandPaletteProps): import("react/jsx-runtime").JSX.Element;
declare const meta: Meta<typeof MockCommandPalette>;
export default meta;
type Story = StoryObj<typeof MockCommandPalette>;
export declare const Default: Story;
export declare const WithSearchResults: Story;
export declare const EmptyState: Story;
export declare const OfflineState: Story;
export declare const MobileBottomSheet: Story;
export declare const MobileWithSearch: Story;
export declare const MobileOfflineState: Story;
export declare const KeyboardNavigation: Story;
export declare const AllCommandsDisabledOffline: Story;
//# sourceMappingURL=CommandPalette.stories.d.ts.map