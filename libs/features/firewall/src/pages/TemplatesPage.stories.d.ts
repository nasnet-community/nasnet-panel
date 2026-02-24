/**
 * TemplatesPage Storybook Stories
 *
 * Interactive stories for the Firewall Templates page domain component.
 * Demonstrates template browsing, apply flow, custom template management, and empty states.
 *
 * @module @nasnet/features/firewall/pages
 */
import type { TemplatesPageProps } from './TemplatesPage';
import type { StoryObj } from '@storybook/react';
/**
 * TemplatesPage - Firewall template management page
 *
 * The TemplatesPage provides a two-tab interface for browsing and applying pre-configured
 * firewall rule templates — both built-in and custom (saved to IndexedDB).
 *
 * ## Features
 *
 * - **Browse Tab**: TemplateGallery with filtering by category/complexity/search
 * - **Configure & Apply Tab**: TemplateApplyFlow (disabled until a template is selected)
 * - **Import Template**: Upload JSON template file via ImportTemplateDialog
 * - **Create Template**: SaveTemplateDialog to save current rules as a template
 * - **Export Custom**: Download all custom templates as JSON (shown when custom templates exist)
 * - **Safety Pipeline**: Apply → Preview → Confirm → Undo within 10s
 * - **Rollback**: Full undo support if apply causes issues
 * - **Toast Notifications**: Success/error feedback via Sonner
 * - **Error State**: Graceful display when built-in templates fail to load
 * - **Empty State**: Settings icon + guidance when no templates available
 *
 * ## Props
 *
 * - `routerId` (required): Router ID for template apply/rollback API calls
 * - `currentRules` (optional): Existing firewall rules for "Create Template" feature
 *
 * ## Usage
 *
 * ```tsx
 * import { TemplatesPage } from '@nasnet/features/firewall/pages';
 *
 * function FirewallApp() {
 *   return <TemplatesPage routerId="192.168.88.1" currentRules={rules} />;
 * }
 * ```
 */
declare const meta: {
    title: string;
    component: import("react").NamedExoticComponent<TemplatesPageProps>;
    parameters: {
        layout: string;
        docs: {
            description: {
                component: string;
            };
        };
        a11y: {
            config: {
                rules: {
                    id: string;
                    enabled: boolean;
                }[];
            };
        };
    };
    tags: string[];
    args: {
        routerId: string;
        currentRules: never[];
    };
    decorators: ((Story: import("storybook/internal/csf").PartialStoryFn<import("@storybook/react").ReactRenderer, {
        routerId: string;
        currentRules?: any[] | undefined;
        className?: string | undefined;
    }>) => import("react/jsx-runtime").JSX.Element)[];
};
export default meta;
type Story = StoryObj<typeof meta>;
/**
 * Empty State - No Templates
 *
 * No built-in templates loaded and no custom templates saved.
 * Shows the empty state with a Settings icon, heading, and context-aware description.
 * "Create Your First Template" button only appears if currentRules.length > 0.
 */
export declare const EmptyNoTemplates: Story;
/**
 * Empty State - With Current Rules
 *
 * No templates loaded but current firewall rules are available.
 * The "Create Template" button appears in the header and the "Create Your First Template"
 * CTA appears in the empty state body.
 */
export declare const EmptyWithCurrentRules: Story;
/**
 * Browse Tab - With Built-In Templates
 *
 * Fully populated Browse tab with built-in templates: Basic Security, DDoS Protection,
 * and VoIP QoS. Shows the TemplateGallery with category/complexity filters and search.
 */
export declare const BrowseWithBuiltInTemplates: Story;
/**
 * With Custom Templates - Export Button Visible
 *
 * Built-in and custom templates shown together. The "Export Custom (1)" button appears
 * in the header when customTemplates.length > 0.
 */
export declare const WithCustomTemplates: Story;
//# sourceMappingURL=TemplatesPage.stories.d.ts.map