/**
 * RouteForm Storybook Stories
 * NAS-6.5: Task 9.7 - Static Route Management
 *
 * Demonstrates the RouteForm component in create/edit modes with validation,
 * gateway reachability checking, and platform-specific presenters.
 */
import { RouteForm } from './RouteForm';
import type { Meta, StoryObj } from '@storybook/react';
/**
 * Storybook Meta Configuration
 */
declare const meta: Meta<typeof RouteForm>;
export default meta;
type Story = StoryObj<typeof RouteForm>;
/**
 * Create mode - empty form for adding new static route.
 * All fields start empty with default values (distance: 1, routing table: main).
 */
export declare const CreateMode: Story;
/**
 * Edit mode - form pre-populated with existing route data.
 * Gateway reachability is checked automatically on load.
 */
export declare const EditMode: Story;
/**
 * Create mode submitting - form in loading state during submission.
 * Submit button shows loading spinner, all fields disabled.
 */
export declare const CreateModeSubmitting: Story;
/**
 * Edit mode submitting - edit form during save operation.
 */
export declare const EditModeSubmitting: Story;
/**
 * Validation errors - demonstrates multiple validation failures.
 * Invalid CIDR, invalid IPv4, distance out of range, missing gateway+interface.
 */
export declare const ValidationErrors: Story;
/**
 * Gateway reachable - shows green success badge with latency info.
 * Gateway responds successfully with 2ms latency via ether1.
 */
export declare const GatewayReachable: Story;
/**
 * Gateway unreachable - shows amber warning (non-blocking).
 * Gateway does not respond, but user can still save the route.
 */
export declare const GatewayUnreachable: Story;
/**
 * Mobile presenter - mobile viewport with full-width layout.
 * 44px touch targets, vertical stacking, full-width buttons.
 */
export declare const MobilePresenter: Story;
/**
 * VPN route example - demonstrates routing mark and custom table.
 * Shows policy-based routing configuration.
 */
export declare const VpnRoute: Story;
/**
 * Interface-only route - no gateway specified.
 * Valid for directly connected networks.
 */
export declare const InterfaceOnlyRoute: Story;
//# sourceMappingURL=RouteForm.stories.d.ts.map