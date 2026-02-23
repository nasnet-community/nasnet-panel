import { InterfaceToggle } from './InterfaceToggle';
import type { Meta, StoryObj } from '@storybook/react';
/**
 * NOTE: InterfaceToggle depends on two hooks at runtime:
 *   - useToggleInterface (from @nasnet/api-client/queries)
 *   - useConnectionStore  (from @nasnet/state/stores)
 *
 * In a full Storybook setup these would be mocked via MSW or decorator
 * providers. The stories below demonstrate the visual states driven by
 * the `interface` prop; interaction stories require those providers.
 */
declare const meta: Meta<typeof InterfaceToggle>;
export default meta;
type Story = StoryObj<typeof InterfaceToggle>;
export declare const Enabled: Story;
export declare const Disabled: Story;
export declare const EnabledNoClients: Story;
export declare const EnabledManyClients: Story;
export declare const GuestInterface: Story;
//# sourceMappingURL=InterfaceToggle.stories.d.ts.map