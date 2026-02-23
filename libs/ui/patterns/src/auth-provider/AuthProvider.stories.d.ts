/**
 * AuthProvider Storybook Stories
 * Demonstrates authentication context and related components
 */
import { AuthProvider } from './AuthProvider';
import type { Meta, StoryObj } from '@storybook/react';
declare const meta: Meta<typeof AuthProvider>;
export default meta;
type Story = StoryObj<typeof AuthProvider>;
/**
 * Basic Auth Provider with minimal configuration
 */
export declare const Default: Story;
/**
 * With session warning enabled
 */
export declare const WithSessionWarning: Story;
/**
 * RequireAuth - Content shown when authenticated
 */
export declare const RequireAuthShown: Story;
/**
 * RequireAuth - With permissions check
 */
export declare const RequireAuthWithPermissions: Story;
/**
 * Auto refresh enabled
 */
export declare const WithAutoRefresh: Story;
//# sourceMappingURL=AuthProvider.stories.d.ts.map