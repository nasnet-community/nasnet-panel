/**
 * Storybook Stories for LogSettingsDialog
 * Epic 0.8: System Logs — RouterOS Log Settings
 *
 * This component calls several hooks internally:
 *   - useConnectionStore (Zustand) → currentRouterIp
 *   - useLoggingRules / useLoggingActions (API query hooks)
 *   - useCreateLoggingRule / useUpdateLoggingRule / etc. (mutation hooks)
 *
 * Stories mock those hooks via vi.mocked() in beforeEach, matching the
 * project's established pattern (see RecentLogs.stories.tsx).
 */
import { LogSettingsDialog } from './LogSettingsDialog';
import type { Meta, StoryObj } from '@storybook/react';
declare const meta: Meta<typeof LogSettingsDialog>;
export default meta;
type Story = StoryObj<typeof LogSettingsDialog>;
/**
 * Default state — three rules configured, all destinations visible.
 * Click the "Log Settings" button (gear icon) to open the dialog.
 */
export declare const Default: Story;
/**
 * Opened with a custom trigger button instead of the default gear icon.
 */
export declare const CustomTrigger: Story;
/**
 * Rules tab in loading state — three skeleton placeholders rendered.
 */
export declare const RulesLoading: Story;
/**
 * Rules tab showing an API error with a Retry button.
 */
export declare const RulesError: Story;
/**
 * Empty rules tab — no rules configured yet. Shows the empty-state message.
 */
export declare const NoRules: Story;
/**
 * Destinations tab in loading state.
 */
export declare const DestinationsLoading: Story;
//# sourceMappingURL=LogSettingsDialog.stories.d.ts.map