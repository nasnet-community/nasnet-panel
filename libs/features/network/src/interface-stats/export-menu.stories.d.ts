/**
 * Storybook stories for ExportMenu
 *
 * ExportMenu is a pure presentational component: it accepts three callbacks
 * (CSV / JSON / PNG) and an optional disabled flag. All stories use Storybook
 * action spies so interaction testing can verify which handler fires.
 */
import { ExportMenu } from './export-menu';
import type { Meta, StoryObj } from '@storybook/react';
declare const meta: Meta<typeof ExportMenu>;
export default meta;
type Story = StoryObj<typeof ExportMenu>;
/**
 * Default enabled state – all three export handlers are wired to Storybook
 * action spies. Click "Export" to open the dropdown and select a format.
 */
export declare const Default: Story;
/**
 * Disabled state – the trigger button is greyed out and cannot be clicked.
 * Use this variant when data is still loading or when the interface has no
 * statistics available yet.
 */
export declare const Disabled: Story;
/**
 * Embedded inside a realistic card header toolbar alongside other controls.
 * Shows how ExportMenu composes with labels and sibling buttons.
 */
export declare const InsideCardHeader: Story;
/**
 * Loading state – disabled while a data fetch is in progress.
 * In a real panel this would be driven by Apollo loading state.
 */
export declare const LoadingData: Story;
/**
 * Multiple ExportMenu instances side-by-side – demonstrates each one is
 * independently clickable with separate handler scopes.
 */
export declare const MultipleMenus: Story;
//# sourceMappingURL=export-menu.stories.d.ts.map