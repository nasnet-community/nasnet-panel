/**
 * Storybook stories for the Bridge Detail presenter components.
 *
 * `BridgeDetail` is the main container that wires Apollo hooks (useBridgeDetail,
 * useCreateBridge, useUpdateBridge). Because those hooks require a live Apollo
 * client, the stories use the lower-level presenter components directly:
 *   - BridgeDetailDesktop (Sheet slide-over, used on tablet/desktop)
 *   - BridgeDetailMobile  (full-screen Dialog, used on mobile)
 *
 * All presenter props are plain TypeScript – no provider setup needed.
 */
import { BridgeDetailDesktop } from './BridgeDetailDesktop';
import type { Meta, StoryObj } from '@storybook/react';
declare const meta: Meta<typeof BridgeDetailDesktop>;
export default meta;
type Story = StoryObj<typeof BridgeDetailDesktop>;
export declare const DesktopEditExisting: Story;
export declare const DesktopEditVlanBridge: Story;
export declare const DesktopCreateNew: Story;
export declare const DesktopLoading: Story;
export declare const DesktopError: Story;
export declare const DesktopSubmitting: Story;
export declare const MobileCreateNew: Story;
export declare const MobileEditExisting: Story;
export declare const MobileLoading: Story;
//# sourceMappingURL=BridgeDetail.stories.d.ts.map