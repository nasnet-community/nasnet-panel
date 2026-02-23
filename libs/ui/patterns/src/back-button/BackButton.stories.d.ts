import type { Meta, StoryObj } from '@storybook/react';
interface MockBackButtonProps {
    to?: string;
    ariaLabel?: string;
    className?: string;
    onClick?: () => void;
}
declare function MockBackButton({ to, ariaLabel, className, onClick, }: MockBackButtonProps): import("react/jsx-runtime").JSX.Element;
declare const meta: Meta<typeof MockBackButton>;
export default meta;
type Story = StoryObj<typeof MockBackButton>;
export declare const Default: Story;
export declare const WithCustomLabel: Story;
export declare const InPageHeader: Story;
export declare const InBreadcrumb: Story;
export declare const InMobileHeader: Story;
export declare const Variants: Story;
export declare const Interactive: Story;
//# sourceMappingURL=BackButton.stories.d.ts.map