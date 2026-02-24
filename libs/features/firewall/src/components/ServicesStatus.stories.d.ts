/**
 * Storybook stories for ServicesStatus
 *
 * ServicesStatus fetches router service data (API, SSH, Winbox, WWW, etc.)
 * via useServices() (Apollo) and reads the current router IP from Zustand.
 * Since those data sources are unavailable in Storybook, each story
 * reproduces the component's visual states directly using the same JSX
 * structure so the UI can be reviewed and tested in isolation.
 *
 * Covered states:
 *  - Full grid (all services, mix of enabled/disabled)
 *  - Compact sidebar mode
 *  - All services enabled
 *  - All services disabled
 *  - Loading skeleton (full and compact)
 *  - Empty state
 */
import type { Meta, StoryObj } from '@storybook/react';
declare function ServicesStatusPlaceholder(_props: {
    className?: string;
    compact?: boolean;
}): null;
declare namespace ServicesStatusPlaceholder {
    var displayName: string;
}
declare const meta: Meta<typeof ServicesStatusPlaceholder>;
export default meta;
type Story = StoryObj<typeof ServicesStatusPlaceholder>;
/**
 * Full grid — default 4-column layout showing all 8 standard MikroTik
 * services with a mix of enabled and disabled states.
 */
export declare const Default: Story;
/**
 * Compact sidebar mode — 2-row list with icon, description and port number.
 * Ideal for embedding in a collapsible sidebar panel.
 */
export declare const CompactMode: Story;
/**
 * All services enabled — entire grid shows green cards.
 */
export declare const AllEnabled: Story;
/**
 * All services disabled — entire grid renders in muted slate styling.
 */
export declare const AllDisabled: Story;
/**
 * Single service with an address restriction set — shows the "Allowed:" footer
 * inside the card.
 */
export declare const WithAddressRestriction: Story;
/**
 * Loading skeleton — full grid skeleton (8 cards) matching the real component's
 * loading state.
 */
export declare const LoadingState: Story;
/**
 * Compact loading skeleton — for sidebar placement.
 */
export declare const CompactLoadingState: Story;
//# sourceMappingURL=ServicesStatus.stories.d.ts.map