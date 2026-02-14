/**
 * ScheduleEditor - Routing Schedule Editor Pattern
 *
 * Time-based schedule editor for automatic routing activation/deactivation.
 * Implements Headless + Platform Presenters architecture.
 *
 * @module @nasnet/ui/patterns/schedule-editor
 */

// Platform Dispatcher (use this in most cases)
export { ScheduleEditor } from './ScheduleEditor';

// Platform Presenters (use these for custom layouts)
export { ScheduleEditorMobile } from './ScheduleEditorMobile';
export { ScheduleEditorDesktop } from './ScheduleEditorDesktop';

// Headless Hook
export { useScheduleEditor } from './use-schedule-editor';
export type {
  UseScheduleEditorOptions,
  UseScheduleEditorReturn,
} from './use-schedule-editor';

// Types
export type { ScheduleEditorProps } from './types';
