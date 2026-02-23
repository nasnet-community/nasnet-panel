/**
 * IPAddressForm Stories
 *
 * IPAddressForm is a headless + platform-presenter wrapper that renders
 * IPAddressFormDesktop (Card + Dialog) or IPAddressFormMobile (Sheet) based on
 * the active viewport.
 *
 * The form supports create and edit modes, validates CIDR notation via Zod,
 * displays live subnet calculations, and runs conflict detection against
 * existing addresses on the same router.
 */
import { IPAddressForm } from './IPAddressForm';
import type { Meta, StoryObj } from '@storybook/react';
declare const meta: Meta<typeof IPAddressForm>;
export default meta;
type Story = StoryObj<typeof IPAddressForm>;
/** Blank create form — all fields empty, ready for new input. */
export declare const CreateMode: Story;
/** Edit mode pre-populated with an existing static address. */
export declare const EditMode: Story;
/** Editing a disabled address — the "Disabled" toggle is pre-checked. */
export declare const EditDisabledAddress: Story;
/** Submission in progress — all controls disabled and the button shows a spinner. */
export declare const Submitting: Story;
/** No interfaces available — the interface selector renders empty. */
export declare const NoInterfaces: Story;
/** Mobile sheet layout — form renders inside a bottom sheet with 44 px touch targets. */
export declare const MobileView: Story;
//# sourceMappingURL=IPAddressForm.stories.d.ts.map