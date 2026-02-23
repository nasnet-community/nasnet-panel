/**
 * TextArea Stories
 *
 * Storybook stories for the TextArea component — a multi-line textarea for
 * long-form text input, configuration data, and code snippets.
 * Used for TEXT_AREA type service config fields.
 */
import { TextArea } from './TextArea';
import type { Meta, StoryObj } from '@storybook/react';
declare const meta: Meta<typeof TextArea>;
export default meta;
type Story = StoryObj<typeof TextArea>;
/**
 * Default textarea with 4 rows (standard size).
 */
export declare const Default: Story;
/**
 * Configuration text field for storing custom configuration data.
 */
export declare const Configuration: Story;
/**
 * Custom script/code field showing how to store code snippets.
 */
export declare const CustomScript: Story;
/**
 * Description/notes field with smaller size.
 */
export declare const Notes: Story;
/**
 * Long-form content field with many rows.
 */
export declare const LongForm: Story;
/**
 * Disabled state — the textarea value is locked and cannot be changed.
 */
export declare const Disabled: Story;
/**
 * Error state — field validation failed.
 */
export declare const WithError: Story;
//# sourceMappingURL=TextArea.stories.d.ts.map