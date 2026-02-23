/**
 * ResourceCard Stories
 *
 * Storybook stories for the ResourceCard pattern component.
 * Demonstrates different variants, states, and platform presentations.
 */
import { ResourceCard } from './ResourceCard';
import type { Meta, StoryObj } from '@storybook/react';
declare const meta: Meta<typeof ResourceCard>;
export default meta;
type Story = StoryObj<typeof ResourceCard>;
export declare const Online: Story;
export declare const Offline: Story;
export declare const Pending: Story;
export declare const Error: Story;
export declare const WithoutActions: Story;
export declare const WithoutDescription: Story;
export declare const WithCustomContent: Story;
export declare const MobilePresenter: Story;
export declare const DesktopPresenter: Story;
export declare const Interactive: Story;
export declare const CardList: Story;
//# sourceMappingURL=ResourceCard.stories.d.ts.map