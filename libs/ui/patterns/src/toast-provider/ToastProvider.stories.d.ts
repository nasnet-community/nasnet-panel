/**
 * ToastProvider Stories
 *
 * Storybook stories demonstrating the toast notification system.
 * Shows all toast variants, queue behavior, and responsive positioning.
 *
 * @see NAS-4.19: Implement Notification/Toast System
 */
import type { Meta, StoryObj } from '@storybook/react';
import { ToastProvider } from './ToastProvider';
declare const meta: Meta<typeof ToastProvider>;
export default meta;
type Story = StoryObj<typeof ToastProvider>;
export declare const SuccessToast: Story;
export declare const ErrorToast: Story;
export declare const WarningToast: Story;
export declare const InfoToast: Story;
export declare const ProgressToast: Story;
export declare const QueueBehavior: Story;
export declare const Deduplication: Story;
export declare const PromiseToast: Story;
export declare const WithActionButton: Story;
export declare const MobilePositioning: Story;
export declare const Interactive: Story;
export declare const AllVariants: Story;
//# sourceMappingURL=ToastProvider.stories.d.ts.map