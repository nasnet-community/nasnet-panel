/**
 * DynamicField Storybook Stories
 *
 * DynamicField selects the appropriate form input based on the ConfigSchemaField
 * `type` property. All variants require a React Hook Form context, supplied here
 * by a FormProvider decorator.
 *
 * Supported types:
 *   TEXT, EMAIL, URL, IP, PATH, TEXT_AREA, PASSWORD,
 *   NUMBER, PORT, TOGGLE, SELECT, MULTI_SELECT, TEXT_ARRAY
 */
import { DynamicField } from './DynamicField';
import type { Meta, StoryObj } from '@storybook/react';
declare const meta: Meta<typeof DynamicField>;
export default meta;
type Story = StoryObj<typeof DynamicField>;
/**
 * TEXT field — generic single-line text input.
 */
export declare const TextInput: Story;
/**
 * EMAIL field — uses type="email" for keyboard hint on mobile.
 */
export declare const EmailInput: Story;
/**
 * URL field — intended for remote config or API endpoints.
 */
export declare const UrlInput: Story;
/**
 * PATH field — file path on the router filesystem.
 */
export declare const PathInput: Story;
/**
 * TEXT_AREA field — multi-line free-form text (e.g., exit policy).
 */
export declare const TextAreaInput: Story;
/**
 * PASSWORD field — masked input with reveal toggle.
 */
export declare const PasswordInput: Story;
/**
 * NUMBER field with min/max constraints.
 */
export declare const NumberInput: Story;
/**
 * TOGGLE field — boolean switch for feature flags.
 */
export declare const ToggleSwitch: Story;
/**
 * SELECT field — single-choice dropdown.
 */
export declare const SelectDropdown: Story;
/**
 * MULTI_SELECT field — multiple choice checkboxes.
 */
export declare const MultiSelectField: Story;
/**
 * TEXT_ARRAY field — dynamic list of text entries.
 */
export declare const TextArrayField: Story;
/**
 * Required field — shows the asterisk and aria-label for screen readers.
 */
export declare const RequiredField: Story;
/**
 * Disabled field — entire input is read-only (readOnly prop passed as disabled).
 */
export declare const DisabledField: Story;
//# sourceMappingURL=DynamicField.stories.d.ts.map