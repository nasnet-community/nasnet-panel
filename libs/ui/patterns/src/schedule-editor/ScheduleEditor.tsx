/**
 * ScheduleEditor - Platform Dispatcher
 *
 * Auto-detects platform and renders the appropriate presenter.
 * - Mobile (<640px): Sheet with day chips and vertical layout
 * - Desktop (≥640px): Dialog with checkboxes and horizontal layout
 *
 * @module @nasnet/ui/patterns/schedule-editor
 */

import { memo } from 'react';

import { useMediaQuery } from '@nasnet/ui/primitives';

import { ScheduleEditorDesktop } from './ScheduleEditorDesktop';
import { ScheduleEditorMobile } from './ScheduleEditorMobile';

import type { ScheduleEditorProps } from './types';

/**
 * Platform-aware schedule editor dispatcher.
 *
 * Automatically selects the appropriate presenter based on viewport width:
 * - Mobile (<640px): Sheet-based form with day chips
 * - Desktop (≥640px): Dialog-based form with checkboxes
 *
 * @example
 * ```tsx
 * <ScheduleEditor
 *   routingID="route-123"
 *   open={isOpen}
 *   onClose={() => setIsOpen(false)}
 *   onSave={async (schedule) => {
 *     await createSchedule(schedule);
 *     setIsOpen(false);
 *   }}
 * />
 * ```
 */
export const ScheduleEditor = memo(function ScheduleEditor(props: ScheduleEditorProps) {
  const isMobile = useMediaQuery('(max-width: 640px)');

  return isMobile ? (
    <ScheduleEditorMobile {...props} />
  ) : (
    <ScheduleEditorDesktop {...props} />
  );
});

ScheduleEditor.displayName = 'ScheduleEditor';
