/**
 * Headless useScheduleEditor Hook
 *
 * Manages schedule form state using React Hook Form with Zod validation.
 * Provides day presets, time validation, and live preview generation.
 *
 * @module @nasnet/ui/patterns/schedule-editor
 */
import { type UseFormReturn } from 'react-hook-form';
import { type ScheduleInput, type DayPresetKey } from '@nasnet/core/types';
export interface UseScheduleEditorOptions {
    /** Routing ID to create schedule for */
    routingID: string;
    /** Initial schedule values for editing */
    initialSchedule?: Partial<ScheduleInput>;
    /** Callback when form is successfully submitted */
    onSubmit?: (schedule: ScheduleInput) => void | Promise<void>;
    /** Callback when form is cancelled */
    onCancel?: () => void;
    /** Default timezone (defaults to browser timezone) */
    defaultTimezone?: string;
}
export interface UseScheduleEditorReturn {
    /** React Hook Form instance */
    form: UseFormReturn<ScheduleInput>;
    /** Current schedule state (from form.watch()) */
    schedule: Partial<ScheduleInput>;
    /** Is form valid */
    isValid: boolean;
    /** Field errors */
    errors: Record<string, string>;
    /** Human-readable preview */
    preview: string;
    /** Next activation timestamp */
    nextActivation: Date | null;
    /** Currently selected preset (if any) */
    selectedPreset: DayPresetKey | null;
    /** Apply a day preset */
    applyPreset: (preset: DayPresetKey) => void;
    /** Toggle a single day */
    toggleDay: (day: number) => void;
    /** Reset form to initial state */
    reset: () => void;
    /** Handle form submission */
    onSubmit: (e?: React.BaseSyntheticEvent) => Promise<void>;
}
/**
 * Headless hook for schedule editor form logic.
 *
 * Manages React Hook Form integration, validation, day presets,
 * and preview generation.
 *
 * @example
 * ```tsx
 * const editor = useScheduleEditor({
 *   routingID: 'route-123',
 *   initialSchedule: { days: [1,2,3,4,5], startTime: '09:00', endTime: '17:00' },
 *   onSubmit: async (schedule) => {
 *     await createSchedule(schedule);
 *   }
 * });
 *
 * return (
 *   <form onSubmit={editor.onSubmit}>
 *     <Controller
 *       control={editor.form.control}
 *       name="days"
 *       render={({ field }) => <DaySelector {...field} />}
 *     />
 *   </form>
 * );
 * ```
 */
export declare function useScheduleEditor(options: UseScheduleEditorOptions): UseScheduleEditorReturn;
//# sourceMappingURL=use-schedule-editor.d.ts.map