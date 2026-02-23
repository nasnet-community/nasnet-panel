/**
 * RateLimitRuleEditor Storybook Stories
 *
 * Interactive stories for rate limit rule editor pattern component.
 * Demonstrates all action types, validation states, and platform variants.
 *
 * @module @nasnet/ui/patterns/rate-limit-rule-editor
 * @see NAS-7.11: Implement Connection Rate Limiting
 */
import type { StoryObj } from '@storybook/react';
/**
 * RateLimitRuleEditor - Rate limiting rule creation and editing dialog
 *
 * The RateLimitRuleEditor component provides a comprehensive form for creating and editing
 * connection rate limiting firewall rules. It automatically adapts to platform (mobile/tablet/desktop)
 * and shows/hides fields based on the selected action type.
 *
 * ## Features
 *
 * - **Action-specific fields**: Only shows relevant fields for each action type
 * - **Live validation**: Real-time feedback for invalid inputs
 * - **Address list suggestions**: Autocomplete for existing address lists
 * - **Time window presets**: Quick selection for per-second, per-minute, per-hour
 * - **Platform adaptive**: Desktop dialog vs mobile sheet
 * - **Accessibility**: WCAG AAA compliant, keyboard navigation, screen reader support
 *
 * ## Action Types
 *
 * - **drop**: Immediately drops excess connections (most aggressive)
 * - **tarpit**: Slows down attackers with delayed responses (subtle defense)
 * - **add-to-list**: Adds offenders to address list with timeout (dynamic blocking)
 *
 * ## Usage
 *
 * ```tsx
 * import { RateLimitRuleEditor } from '@nasnet/ui/patterns/rate-limit-rule-editor';
 *
 * function MyComponent() {
 *   const [open, setOpen] = useState(false);
 *
 *   return (
 *     <RateLimitRuleEditor
 *       routerId="router-123"
 *       open={open}
 *       onClose={() => setOpen(false)}
 *       onSave={async (rule) => {
 *         await createRateLimitRule({ routerId, rule });
 *       }}
 *     />
 *   );
 * }
 * ```
 */
declare const meta: {
    title: string;
    component: import("react").NamedExoticComponent<import("./types").RateLimitRuleEditorProps>;
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
    argTypes: {
        routerId: {
            control: "text";
            description: string;
        };
        open: {
            control: "boolean";
            description: string;
        };
        mode: {
            control: "radio";
            options: string[];
            description: string;
        };
        isSaving: {
            control: "boolean";
            description: string;
        };
        isDeleting: {
            control: "boolean";
            description: string;
        };
        onClose: {
            action: string;
        };
        onSave: {
            action: string;
        };
        onDelete: {
            action: string;
        };
    };
    args: {
        routerId: string;
        open: true;
        onClose: import("storybook/test").Mock<(...args: any[]) => any>;
        onSave: import("storybook/test").Mock<(...args: any[]) => any>;
        isSaving: false;
        mode: "create";
        addressLists: string[];
    };
};
export default meta;
type Story = StoryObj<typeof meta>;
/**
 * Create Drop Rule
 *
 * Create a new drop action rule that immediately blocks excess connections.
 * Most aggressive rate limiting strategy.
 */
export declare const CreateDrop: Story;
/**
 * Create Tarpit Rule
 *
 * Create a tarpit rule that slows down attackers instead of blocking.
 * More subtle defense mechanism.
 */
export declare const CreateTarpit: Story;
/**
 * Create Add-to-List Rule
 *
 * Create a rule that adds rate limit violators to an address list.
 * Dynamic blocking with automatic timeout.
 */
export declare const CreateAddToList: Story;
/**
 * Edit Existing Rule
 *
 * Edit mode with pre-populated form data.
 * Shows delete button and rule statistics.
 */
export declare const EditExisting: Story;
/**
 * With Validation Errors
 *
 * Shows form validation feedback for invalid inputs.
 * Connection limit too low, invalid IP address format.
 */
export declare const WithErrors: Story;
/**
 * With Whitelist Exclusion
 *
 * Shows rule with negated address list (exclude whitelist from rate limiting).
 * Uses "!" prefix to negate match.
 */
export declare const WithWhitelist: Story;
/**
 * Very Strict Rate Limit
 *
 * Per-second time window for very aggressive rate limiting.
 * Useful for preventing rapid-fire attacks.
 */
export declare const VeryStrict: Story;
/**
 * Mobile Variant
 *
 * Forces mobile presenter (Sheet instead of Dialog).
 * Card-based form sections, 44px touch targets, bottom action buttons.
 */
export declare const MobileVariant: Story;
/**
 * Desktop Variant
 *
 * Forces desktop presenter (Dialog).
 * Inline form layout, grouped fields, keyboard shortcuts.
 */
export declare const DesktopVariant: Story;
/**
 * Saving State
 *
 * Shows loading state when save operation is in progress.
 * Save button is disabled and shows loading spinner.
 */
export declare const SavingState: Story;
/**
 * Deleting State
 *
 * Shows loading state when delete operation is in progress.
 * Delete button is disabled and shows loading spinner.
 */
export declare const DeletingState: Story;
/**
 * Empty Form
 *
 * Default state when creating a new rule.
 * All fields are empty with sensible defaults.
 */
export declare const EmptyForm: Story;
/**
 * Complex Rule with Multiple Matchers
 *
 * Shows a rule with many matchers configured.
 * Demonstrates comprehensive matching capabilities.
 */
export declare const ComplexRule: Story;
/**
 * Accessibility Validation
 *
 * Validates WCAG AAA compliance.
 * Check Storybook a11y addon for zero violations.
 */
export declare const AccessibilityTest: Story;
//# sourceMappingURL=RateLimitRuleEditor.stories.d.ts.map