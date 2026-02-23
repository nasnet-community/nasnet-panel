/**
 * ValidationStage Stories
 *
 * Storybook stories for the ValidationStage component.
 * Demonstrates every status variant, expandable error/warning details,
 * connector lines, and all 7 stage types in the validation pipeline.
 *
 * @module @nasnet/ui/patterns/validation-progress
 */
import { ValidationStage } from './ValidationStage';
import type { Meta, StoryObj } from '@storybook/react';
/**
 * ValidationStage
 *
 * Displays a single stage within the 7-stage configuration validation pipeline.
 * Each stage shows a status icon, stage label, description, duration, and an
 * optional expandable panel for errors and warnings.
 *
 * ## Status Variants
 *
 * | Status    | Icon         | Colour     | Behaviour |
 * |-----------|--------------|------------|-----------|
 * | `pending` | Circle       | Muted      | No timing shown |
 * | `running` | Loader (spin)| Primary    | No timing shown |
 * | `passed`  | CheckCircle  | Success    | Duration shown |
 * | `failed`  | XCircle      | Error      | Duration shown, expandable |
 * | `skipped` | SkipForward  | Muted      | No timing shown |
 *
 * ## Stage Types
 *
 * `schema` | `syntax` | `cross-resource` | `dependencies` | `network` | `platform` | `dry-run`
 *
 * ## Expand / Collapse
 *
 * Clicking the row toggles the error/warning detail panel. The button is
 * disabled (non-interactive) when there are no errors or warnings.
 */
declare const meta: Meta<typeof ValidationStage>;
export default meta;
type Story = StoryObj<typeof ValidationStage>;
/**
 * Pending
 *
 * Stage is queued but has not started yet. Circle icon with muted colour;
 * no duration is shown. The row is non-interactive (no expand toggle).
 */
export declare const Pending: Story;
/**
 * Running
 *
 * Stage is actively executing. Animated spinning Loader icon in primary colour.
 * No duration is shown while in progress.
 */
export declare const Running: Story;
/**
 * Passed
 *
 * Stage completed without errors. Green CheckCircle icon and duration badge.
 * Row is non-interactive because there are no details to expand.
 */
export declare const Passed: Story;
/**
 * Skipped
 *
 * Stage was intentionally bypassed (e.g., low-risk operation does not require
 * a dry-run). SkipForward icon in muted colour; no duration shown.
 */
export declare const Skipped: Story;
/**
 * Failed - Collapsed
 *
 * Stage failed with one error. The red XCircle icon and error count badge are
 * visible. The detail panel is collapsed; click to expand.
 */
export declare const FailedCollapsed: Story;
/**
 * Failed - Expanded
 *
 * Same failure as above but with the detail panel open. Shows the full error
 * message, field path, and suggested fix in a highlighted error card.
 */
export declare const FailedExpanded: Story;
/**
 * Passed with Warnings - Expanded
 *
 * Stage passed but produced non-blocking warnings. Yellow warning badge and
 * expandable detail panel shows the warning messages.
 */
export declare const PassedWithWarningsExpanded: Story;
/**
 * Multiple Errors - Expanded
 *
 * A dependencies stage failure with three distinct errors, simulating a case
 * where the router is missing required packages and firmware.
 */
export declare const MultipleErrorsExpanded: Story;
/**
 * Interactive Toggle
 *
 * Fully interactive story with local state so the expand/collapse toggle works
 * inside Storybook without requiring a parent container.
 */
export declare const InteractiveToggle: Story;
//# sourceMappingURL=ValidationStage.stories.d.ts.map