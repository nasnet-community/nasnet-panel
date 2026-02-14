/**
 * ScheduleEditor Types
 *
 * TypeScript interfaces for schedule editor components.
 *
 * @module @nasnet/ui/patterns/schedule-editor
 */

import type { ScheduleInput } from '@nasnet/core/types/services/schedule.types';

/**
 * ScheduleEditor Props
 */
export interface ScheduleEditorProps {
  /** Routing ID to create schedule for */
  routingID: string;

  /** Initial schedule values for editing (undefined for creating new schedule) */
  initialSchedule?: Partial<ScheduleInput>;

  /** Is editor open */
  open: boolean;

  /** Callback when editor is closed */
  onClose: () => void;

  /** Callback when schedule is saved */
  onSave: (schedule: ScheduleInput) => void | Promise<void>;

  /** Callback when schedule is deleted (only for existing schedules) */
  onDelete?: () => void | Promise<void>;

  /** Is save operation in progress */
  isSaving?: boolean;

  /** Is delete operation in progress */
  isDeleting?: boolean;

  /** Editor mode */
  mode?: 'create' | 'edit';

  /** Default timezone (defaults to browser timezone) */
  defaultTimezone?: string;
}
