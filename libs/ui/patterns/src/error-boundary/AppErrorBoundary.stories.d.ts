/**
 * AppErrorBoundary Stories
 *
 * Demonstrates the outermost application error boundary that catches
 * catastrophic failures and displays a full-page recovery UI.
 *
 * Note: Because AppErrorBoundary is a React class-based error boundary,
 * stories use a "BrokenComponent" pattern to trigger the boundary and
 * showcase the AppErrorFallback UI directly via a test harness component.
 */
import { AppErrorBoundary } from './AppErrorBoundary';
import type { Meta, StoryObj } from '@storybook/react';
declare const meta: Meta<typeof AppErrorBoundary>;
export default meta;
type Story = StoryObj<typeof AppErrorBoundary>;
/**
 * Interactive demo: click the button to trigger a crash and see the fallback.
 */
export declare const Default: Story;
/**
 * Shows what the fallback looks like for a provider-initialisation failure.
 */
export declare const ProviderInitializationFailure: Story;
/**
 * Shows the fallback for a runtime chunk-load error (lazy import failure).
 */
export declare const ChunkLoadError: Story;
/**
 * Demonstrates the onError telemetry callback receiving the error.
 * Open the Actions panel to see the logged error details.
 */
export declare const WithTelemetryCallback: Story;
/**
 * Healthy state — no error is thrown, children render normally.
 */
export declare const HealthyChildren: Story;
//# sourceMappingURL=AppErrorBoundary.stories.d.ts.map