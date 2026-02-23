/**
 * ServiceConfigForm Storybook Stories
 *
 * ServiceConfigForm is a headless + platform presenter component:
 * - Desktop/Tablet (≥640px): tabbed card layout with 2-column field grid
 * - Mobile (<640px): accordion card layout with sticky bottom submit button
 *
 * The component accepts a `formState` prop that mirrors the return value of
 * `useServiceConfigForm`. Stories supply a fully-typed mock formState so
 * the form renders without a live GraphQL backend.
 */
import { ServiceConfigForm } from './ServiceConfigForm';
import type { Meta, StoryObj } from '@storybook/react';
declare const meta: Meta<typeof ServiceConfigForm>;
export default meta;
type Story = StoryObj<typeof ServiceConfigForm>;
/**
 * Tor service configuration with two groups (Network + Relay + Advanced tabs).
 * Demonstrates the multi-group tabbed desktop layout.
 */
export declare const TorConfiguration: Story;
/**
 * AdGuard Home configuration demonstrating PASSWORD and TEXT_ARRAY field types.
 */
export declare const AdGuardConfiguration: Story;
/**
 * Loading state — schema is still being fetched from the backend.
 * Desktop presenter shows a centered spinner inside the Card.
 */
export declare const LoadingSchema: Story;
/**
 * Empty schema — the backend returned no schema for this service type.
 * Desktop presenter renders the "No configuration schema available" fallback.
 */
export declare const NoSchema: Story;
/**
 * Read-only mode — all fields are disabled and the action buttons are hidden.
 * Useful for auditing or viewing config without risk of accidental changes.
 */
export declare const ReadOnly: Story;
/**
 * Submitting state — save button shows spinner while the mutation is in-flight.
 */
export declare const Submitting: Story;
/**
 * Mobile viewport — forces the mobile accordion layout with sticky bottom button.
 */
export declare const MobileLayout: Story;
//# sourceMappingURL=ServiceConfigForm.stories.d.ts.map