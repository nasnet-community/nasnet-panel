import type { Meta, StoryObj } from '@storybook/react';
type ThemeMode = 'light' | 'dark' | 'system';
interface MockThemeToggleProps {
    initialTheme?: ThemeMode;
    className?: string;
}
declare function MockThemeToggle({ initialTheme, className }: MockThemeToggleProps): import("react/jsx-runtime").JSX.Element;
declare const meta: Meta<typeof MockThemeToggle>;
export default meta;
type Story = StoryObj<typeof MockThemeToggle>;
export declare const Default: Story;
export declare const DarkMode: Story;
export declare const SystemMode: Story;
export declare const Interactive: Story;
export declare const InHeader: Story;
export declare const AllStates: Story;
export declare const WithLabel: Story;
//# sourceMappingURL=ThemeToggle.stories.d.ts.map