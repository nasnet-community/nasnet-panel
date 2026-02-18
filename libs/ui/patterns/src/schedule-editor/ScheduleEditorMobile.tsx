/**
 * ScheduleEditorMobile - Mobile Platform Presenter
 *
 * Sheet-based schedule form with 44px touch targets and day chips.
 * Optimized for touch interaction and vertical scrolling.
 *
 * @module @nasnet/ui/patterns/schedule-editor
 */

import { memo } from 'react';

import { Clock, Calendar, Info, Trash2, Zap } from 'lucide-react';
import { Controller } from 'react-hook-form';

import {
  DAYS_OF_WEEK,
  DAY_PRESETS,
  type DayPresetKey,
} from '@nasnet/core/types';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,

  Button,
  Card,
  Input,
  Badge,
  Label} from '@nasnet/ui/primitives';

import { RHFFormField } from '../rhf-form-field';
import { useScheduleEditor } from './use-schedule-editor';

import type { ScheduleEditorProps } from './types';

/**
 * Mobile presenter for schedule editor.
 *
 * Features:
 * - Sheet with card-based form sections
 * - 44px minimum touch targets
 * - Day chips for easy selection
 * - Preset buttons (Weekdays, Weekends, Every Day)
 * - Time pickers with HH:MM format
 * - Live preview with next activation
 * - Bottom action bar
 */
export const ScheduleEditorMobile = memo(function ScheduleEditorMobile({
  routingID,
  initialSchedule,
  open,
  onClose,
  onSave,
  onDelete,
  isSaving = false,
  isDeleting = false,
  mode = initialSchedule?.days ? 'edit' : 'create',
  defaultTimezone,
}: ScheduleEditorProps) {
  const editor = useScheduleEditor({
    routingID,
    initialSchedule,
    onSubmit: onSave,
    defaultTimezone,
  });

  const { form, schedule, preview, nextActivation, selectedPreset, applyPreset, toggleDay } =
    editor;
  const { control, formState } = form;

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent side="bottom" className="h-[90vh] flex flex-col">
        <SheetHeader>
          <SheetTitle>
            {mode === 'create' ? 'Create Schedule' : 'Edit Schedule'}
          </SheetTitle>
          <SheetDescription>
            Set when routing should be automatically activated
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto space-y-4 pb-20">
          {/* Live Preview */}
          <Card className="p-4 bg-info/10 border-info/20">
            <div className="flex items-start gap-3">
              <Info className="h-5 w-5 text-info mt-0.5 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-info mb-1">Preview</p>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {preview}
                </p>
              </div>
            </div>
            {schedule.enabled && (
              <Badge variant="success" className="mt-2">
                <Zap className="h-3 w-3 mr-1" />
                Enabled
              </Badge>
            )}
          </Card>

          {/* Day Selection */}
          <Card className="p-4 space-y-4">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              <h3 className="text-sm font-semibold">Active Days</h3>
            </div>

            {/* Day Presets */}
            <div className="flex gap-2">
              {(Object.entries(DAY_PRESETS) as [DayPresetKey, typeof DAY_PRESETS[DayPresetKey]][]).map(
                ([key, preset]) => (
                  <Button
                    key={key}
                    type="button"
                    variant={selectedPreset === key ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => applyPreset(key)}
                    className="flex-1 h-9"
                  >
                    {preset.label}
                  </Button>
                )
              )}
            </div>

            {/* Individual Days */}
            <RHFFormField
              name="days"
              label="Select Days"
              description="Tap days to toggle"
              required
            >
              <Controller
                name="days"
                control={control}
                render={({ field }) => (
                  <div className="flex flex-wrap gap-2">
                    {DAYS_OF_WEEK.map((day: { value: number; label: string; short: string }) => {
                      const isSelected = field.value?.includes(day.value) || false;
                      return (
                        <button
                          key={day.value}
                          type="button"
                          onClick={() => toggleDay(day.value)}
                          className={`
                            flex-1 min-w-[60px] h-11 rounded-md border-2 transition-colors
                            flex flex-col items-center justify-center
                            ${
                              isSelected
                                ? 'bg-primary border-primary text-primary-foreground'
                                : 'bg-background border-border hover:border-primary/50'
                            }
                          `}
                        >
                          <span className="text-xs font-semibold">{day.short}</span>
                        </button>
                      );
                    })}
                  </div>
                )}
              />
            </RHFFormField>
          </Card>

          {/* Time Range */}
          <Card className="p-4 space-y-4">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              <h3 className="text-sm font-semibold">Active Time</h3>
            </div>

            <RHFFormField
              name="startTime"
              label="Start Time"
              description="When to activate routing"
              required
            >
              <Controller
                name="startTime"
                control={control}
                render={({ field }) => (
                  <Input
                    {...field}
                    type="time"
                    value={field.value || ''}
                    className="h-11 text-base"
                  />
                )}
              />
            </RHFFormField>

            <RHFFormField
              name="endTime"
              label="End Time"
              description="When to deactivate routing"
              required
            >
              <Controller
                name="endTime"
                control={control}
                render={({ field }) => (
                  <Input
                    {...field}
                    type="time"
                    value={field.value || ''}
                    className="h-11 text-base"
                  />
                )}
              />
            </RHFFormField>
          </Card>

          {/* Timezone */}
          <Card className="p-4 space-y-4">
            <RHFFormField
              name="timezone"
              label="Timezone"
              description="IANA timezone identifier"
              required
            >
              <Controller
                name="timezone"
                control={control}
                render={({ field }) => (
                  <Input
                    {...field}
                    placeholder="America/New_York"
                    value={field.value || ''}
                    className="h-11"
                  />
                )}
              />
            </RHFFormField>

            <div className="text-xs text-muted-foreground">
              Current timezone: {Intl.DateTimeFormat().resolvedOptions().timeZone}
            </div>
          </Card>
        </div>

        <SheetFooter className="fixed bottom-0 left-0 right-0 p-4 bg-background border-t">
          <div className="flex flex-col gap-2 w-full">
            {mode === 'edit' && onDelete && (
              <Button
                type="button"
                variant="destructive"
                size="lg"
                onClick={onDelete}
                disabled={isDeleting || isSaving}
                className="h-11"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Schedule
              </Button>
            )}

            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="lg"
                onClick={onClose}
                disabled={isSaving || isDeleting}
                className="flex-1 h-11"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="lg"
                onClick={editor.onSubmit}
                disabled={!formState.isValid || isSaving || isDeleting}
                className="flex-1 h-11"
              >
                {isSaving ? 'Saving...' : mode === 'create' ? 'Create' : 'Save'}
              </Button>
            </div>
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
});

ScheduleEditorMobile.displayName = 'ScheduleEditorMobile';
