/**
 * WirelessInterfaceList Stories
 *
 * The list component fetches data via useWirelessInterfaces, navigates on
 * card click via useNavigate, and reads the current router IP from
 * useConnectionStore. All three hooks are runtime dependencies that require
 * providers (MSW, TanStack Router, Zustand) in a full Storybook setup.
 *
 * To keep stories self-contained we render the internal sub-components
 * directly so every visual state (loading, empty, error, populated grid) can
 * be demonstrated without network or store setup.
 */
import type { Meta, StoryObj } from '@storybook/react';
declare function LoadingGrid(): import("react/jsx-runtime").JSX.Element;
declare const meta: Meta<typeof LoadingGrid>;
export default meta;
type Story = StoryObj<typeof LoadingGrid>;
export declare const Loading: Story;
export declare const Empty: Story;
export declare const ErrorState_: Story;
export declare const TwoInterfaces: Story;
export declare const FourInterfaces: Story;
export declare const SingleInterface: Story;
//# sourceMappingURL=WirelessInterfaceList.stories.d.ts.map