import { CredentialDialog } from './CredentialDialog';
import type { Meta, StoryObj } from '@storybook/react';
declare const meta: Meta<typeof CredentialDialog>;
export default meta;
type Story = StoryObj<typeof CredentialDialog>;
/**
 * Default idle state — dialog open with IP address only (no router name).
 * Pre-filled with MikroTik defaults (admin / empty password).
 */
export declare const Default: Story;
/**
 * When the router has a known hostname or label, it is shown alongside the IP.
 */
export declare const WithRouterName: Story;
/**
 * Connecting state — spinner inside the Connect button; all inputs are disabled.
 */
export declare const Validating: Story;
/**
 * Bad credentials — the error banner appears below the form fields.
 */
export declare const WithValidationError: Story;
/**
 * Network / proxy failure scenario.
 */
export declare const WithNetworkError: Story;
/**
 * Pre-populated for a retry scenario — initial credentials are already filled in
 * from a previous attempt so the user only needs to correct the password.
 */
export declare const PrePopulatedForRetry: Story;
/**
 * Closed state — nothing renders; useful for testing AnimatePresence exit.
 */
export declare const Closed: Story;
//# sourceMappingURL=CredentialDialog.stories.d.ts.map