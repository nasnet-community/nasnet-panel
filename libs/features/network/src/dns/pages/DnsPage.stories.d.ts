/**
 * DnsPage Storybook Stories
 *
 * Page-level stories for the DNS Configuration page (NAS-6.4).
 *
 * NOTE: DnsPage reads the router ID from the URL via `useParams({ from: '/router/$id' })` and
 * fetches data through Apollo Client. In Storybook these dependencies are provided by global
 * decorators (MockedProvider + router stub). The stories below focus on the visual states
 * that are possible once data has resolved or failed.
 *
 * For interactive E2E testing of the full data-fetch flow, see the integration test file
 * `DnsPage.integration.test.tsx` which uses MSW + MockedProvider.
 */
import type { Meta, StoryObj } from '@storybook/react';
/**
 * We export the loading stand-in as the Storybook component so that simple
 * states (Loading, Error) can be documented without needing Apollo context.
 * The Default story links to the live component as a usage reference.
 */
declare const meta: Meta;
export default meta;
type Story = StoryObj;
/**
 * Loading – skeleton layout shown while both GraphQL queries are pending.
 */
export declare const Loading: Story;
/**
 * Error – destructive alert shown when a query fails or settings are null.
 */
export declare const Error: Story;
/**
 * ErrorGeneric – same error UI with the default fallback message.
 */
export declare const ErrorGeneric: Story;
/**
 * MobileLoadingViewport – loading state at 375 px to confirm skeleton layout is
 * responsive (full-width stacked cards, no overflow).
 */
export declare const MobileLoadingViewport: Story;
//# sourceMappingURL=DnsPage.stories.d.ts.map