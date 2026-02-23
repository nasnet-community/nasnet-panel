/**
 * BogonFilterDialog Storybook Stories
 *
 * Interactive stories for bogon filter dialog component.
 * Demonstrates the Headless + Platform Presenters pattern with
 * responsive layouts for Mobile, Tablet, and Desktop platforms.
 *
 * @see [Component Library Catalog](../../../../../../Docs/design/ux-design/6-component-library.md)
 * @see [Responsive Design Guide](../../../../../../Docs/design/ux-design/8-responsive-design-accessibility.md)
 */
import type { StoryObj } from '@storybook/react';
declare const meta: {
    title: string;
    component: import("react").NamedExoticComponent<import("./bogon-filter-dialog.types").BogonFilterDialogProps>;
    parameters: {
        layout: string;
        docs: {
            description: {
                component: string;
            };
        };
    };
    tags: string[];
    argTypes: {
        routerId: {
            control: "text";
            description: string;
        };
        open: {
            control: "boolean";
            description: string;
        };
        onClose: {
            action: string;
            description: string;
        };
        onSuccess: {
            action: string;
            description: string;
        };
        availableInterfaces: {
            control: "object";
            description: string;
        };
    };
    args: {
        routerId: string;
        open: true;
        onClose: import("storybook/test").Mock<(...args: any[]) => any>;
        onSuccess: import("storybook/test").Mock<(...args: any[]) => any>;
        availableInterfaces: string[];
    };
};
export default meta;
type Story = StoryObj<typeof meta>;
/**
 * Default story: Desktop view with open dialog.
 * Shows full feature set with checkbox grid and detailed descriptions.
 */
export declare const Default: Story;
/**
 * Mobile view: Sheet-based presentation with 44px touch targets.
 * Optimized for thumb navigation with card-based layout.
 */
export declare const MobileView: Story;
/**
 * Tablet view: Hybrid layout with balanced information density.
 */
export declare const TabletView: Story;
/**
 * Desktop view: Full-featured dialog with dense checkbox grid.
 */
export declare const DesktopView: Story;
/**
 * Closed state: Dialog not visible.
 */
export declare const Closed: Story;
/**
 * Single interface available (minimal options).
 */
export declare const SingleInterface: Story;
/**
 * Many interfaces available (many WAN connections).
 */
export declare const ManyInterfaces: Story;
//# sourceMappingURL=BogonFilterDialog.stories.d.ts.map