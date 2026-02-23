/**
 * DHCPLeaseManagementPage Stories
 *
 * Because DHCPLeaseManagementPage is a thin orchestrator that wires the
 * useLeasePage() hook (which performs live GraphQL calls) to platform-specific
 * presenters, the stories here target the two concrete presenter components
 * directly – DHCPLeaseManagementDesktop and DHCPLeaseManagementMobile – using
 * fully inline mock data.  This approach keeps stories deterministic and free
 * of network dependencies while still covering the real rendering paths.
 */
import { DHCPLeaseManagementDesktop } from './DHCPLeaseManagementDesktop';
import type { Meta, StoryObj } from '@storybook/react';
declare const meta: Meta<typeof DHCPLeaseManagementDesktop>;
export default meta;
type Story = StoryObj<typeof DHCPLeaseManagementDesktop>;
export declare const Default: Story;
export declare const WithBulkSelection: Story;
export declare const Loading: Story;
export declare const ErrorState: Story;
export declare const EmptyState: Story;
export declare const SingleServerSingleLease: Story;
//# sourceMappingURL=DHCPLeaseManagementPage.stories.d.ts.map