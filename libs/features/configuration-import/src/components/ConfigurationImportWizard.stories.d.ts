import { ConfigurationImportWizard } from './ConfigurationImportWizard';
import type { Meta, StoryObj } from '@storybook/react';
/**
 * NOTE: ConfigurationImportWizard relies on several API hooks at runtime:
 *   - useEnabledProtocols  (from @nasnet/api-client/queries)
 *   - useCreateBatchJob    (from @nasnet/api-client/queries)
 *   - useBatchJob          (from @nasnet/api-client/queries)
 *   - useCancelBatchJob    (from @nasnet/api-client/queries)
 *
 * In a full Storybook setup these would be satisfied via MSW handlers or
 * Apollo MockedProvider decorators. The stories below document the full
 * prop surface and each dialog entry point.
 */
declare const meta: Meta<typeof ConfigurationImportWizard>;
export default meta;
type Story = StoryObj<typeof ConfigurationImportWizard>;
export declare const OpenOnInputStep: Story;
export declare const Closed: Story;
export declare const WithCustomRouterIp: Story;
export declare const WithSkipCallback: Story;
export declare const NoSkipOption: Story;
//# sourceMappingURL=ConfigurationImportWizard.stories.d.ts.map