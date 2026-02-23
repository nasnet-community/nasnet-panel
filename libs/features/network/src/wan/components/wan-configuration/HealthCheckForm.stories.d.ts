/**
 * Health Check Form Storybook Stories
 *
 * Interactive documentation and visual testing for the WAN health monitoring
 * configuration form (netwatch integration).
 */
import { HealthCheckForm } from './HealthCheckForm';
import type { Meta, StoryObj } from '@storybook/react';
declare const meta: Meta<typeof HealthCheckForm>;
export default meta;
type Story = StoryObj<typeof HealthCheckForm>;
/**
 * Default - empty form with monitoring disabled.
 */
export declare const Default: Story;
/**
 * MonitoringEnabled - form with health check active and standard defaults.
 */
export declare const MonitoringEnabled: Story;
/**
 * WithGatewayPreset - gateway IP shown as a target preset button.
 */
export declare const WithGatewayPreset: Story;
/**
 * FastChecks - aggressive health check for mission-critical WAN links.
 */
export declare const FastChecks: Story;
/**
 * ConservativeChecks - low-frequency checks for metered or constrained links.
 */
export declare const ConservativeChecks: Story;
/**
 * MonitoringDisabledWarning - form in disabled state showing the warning banner.
 */
export declare const MonitoringDisabledWarning: Story;
//# sourceMappingURL=HealthCheckForm.stories.d.ts.map