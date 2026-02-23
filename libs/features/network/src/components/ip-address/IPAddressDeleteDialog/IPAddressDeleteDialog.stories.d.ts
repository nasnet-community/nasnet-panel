/**
 * Storybook stories for IPAddressDeleteDialog
 * NAS-6.2: IP Address Management
 *
 * Covers all dialog states: dependency check loading, safe to delete,
 * has dependencies (DHCP servers, routes, NAT rules, firewall rules),
 * cannot delete, and the deletion-in-progress loading state.
 *
 * IPAddressDeleteDialog calls useIPAddressDependencies internally (Apollo).
 * Each story wraps the component in a MockedProvider so dependency states
 * can be rendered deterministically without a live backend.
 */
import { IPAddressDeleteDialog } from './IPAddressDeleteDialog';
import type { Meta, StoryObj } from '@storybook/react';
declare const meta: Meta<typeof IPAddressDeleteDialog>;
export default meta;
type Story = StoryObj<typeof IPAddressDeleteDialog>;
/**
 * Safe to delete — dependency check completes with no dependent resources.
 * The Delete button is enabled and a green "No Dependencies" info alert is shown.
 */
export declare const NoDependencies: Story;
/**
 * Has dependencies but still deletable — shows the amber warning list with
 * DHCP server, route, and NAT rule entries.  Delete button remains enabled.
 */
export declare const WithDependencies: Story;
/**
 * Cannot delete — too many critical dependencies, canDelete=false.
 * The Delete button is permanently disabled.
 */
export declare const CannotDelete: Story;
/**
 * Deletion in progress — loading=true shows spinner in the Delete button
 * and disables all controls while the mutation executes.
 */
export declare const DeletingInProgress: Story;
/**
 * Public WAN address with a long interface name — exercises layout with
 * longer address and interface strings.
 */
export declare const PublicWanAddress: Story;
/**
 * IPv6 address variant — verifies the dialog handles non-IPv4 address strings.
 */
export declare const IPv6Address: Story;
//# sourceMappingURL=IPAddressDeleteDialog.stories.d.ts.map