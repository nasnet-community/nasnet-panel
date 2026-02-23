import { DiagnosticsPanel } from './DiagnosticsPanel';
import type { Meta, StoryObj } from '@storybook/react';
/**
 * DiagnosticsPanel is a platform-adaptive component backed by several Apollo
 * hooks (useDiagnosticHistory, useRunDiagnostics, useDiagnosticsProgressSubscription).
 * Wire up Apollo mocks or MSW handlers to see fully-populated diagnostic history
 * and real-time progress updates in Storybook.
 */
declare const meta: Meta<typeof DiagnosticsPanel>;
export default meta;
type Story = StoryObj<typeof DiagnosticsPanel>;
/**
 * Default view for a Tor service instance.
 * Without a mocked Apollo provider the panel shows in its loading state.
 */
export declare const Default: Story;
/**
 * sing-box instance — exercises a different serviceName which controls
 * which diagnostic tests the backend offers.
 */
export declare const SingBox: Story;
/**
 * Small history window — only the last 3 runs are fetched and displayed,
 * useful for dashboards with limited vertical space.
 */
export declare const SmallHistory: Story;
/**
 * Demonstrates the onDiagnosticsComplete callback, logged to the
 * Storybook Actions panel when a run completes.
 */
export declare const WithCompletionCallback: Story;
/**
 * Custom container width — verifies the component handles constrained layouts.
 */
export declare const NarrowContainer: Story;
//# sourceMappingURL=DiagnosticsPanel.stories.d.ts.map