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

import { DAYS_OF_WEEK, DAY_PRESETS, type DayPresetKey } from '@nasnet/core/types';
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
  Label,
} from '@nasnet/ui/primitives';

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
    <Sheet
      open={open}
      onOpenChange={onClose}
    >
      <SheetContent
        side="bottom"
        className="flex h-[90vh] flex-col"
      >
        <SheetHeader>
          <SheetTitle>{mode === 'create' ? 'Create Schedule' : 'Edit Schedule'}</SheetTitle>
          <SheetDescription>Set when routing should be automatically activated</SheetDescription>
        </SheetHeader>

        <div className="flex-1 space-y-4 overflow-y-auto pb-20">
          {/* Live Preview */}
          <Card className="bg-info-light border-info rounded-[var(--semantic-radius-card)] border p-4">
            <div className="flex items-start gap-3">
              <Info className="text-info-dark mt-0.5 h-5 w-5 flex-shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-info-dark mb-1 text-sm font-medium">Preview</p>
                <p className="text-muted-foreground whitespace-pre-wrap text-sm">{preview}</p>
              </div>
            </div>
            {schedule.enabled && (
              <Badge
                variant="success"
                className="mt-2"
              >
                <Zap className="mr-1 h-3 w-3" />
                Enabled
              </Badge>
            )}
          </Card>

          {/* Day Selection */}
          <Card className="space-y-4 p-4">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              <h3 className="text-sm font-semibold">Active Days</h3>
            </div>

            {/* Day Presets */}
            <div className="flex gap-2">
              {(
                Object.entries(DAY_PRESETS) as [DayPresetKey, (typeof DAY_PRESETS)[DayPresetKey]][]
              ).map(([key, preset]) => (
                <Button
                  key={key}
                  type="button"
                  variant={selectedPreset === key ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => applyPreset(key)}
                  className="h-9 flex-1"
                >
                  {preset.label}
                </Button>
              ))}
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
                          className={`flex h-11 min-w-[60px] flex-1 flex-col items-center justify-center rounded-md border-2 transition-colors ${
                            isSelected ?
                              'bg-primary border-primary text-primary-foreground'
                            : 'bg-background border-border hover:border-primary/50'
                          } `}
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
          <Card className="space-y-4 p-4">
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
                    className="h-11 font-mono text-base"
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
                    className="h-11 font-mono text-base"
                  />
                )}
              />
            </RHFFormField>
          </Card>

          {/* Timezone */}
          <Card className="space-y-4 p-4">
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
                    className="h-11 font-mono"
                  />
                )}
              />
            </RHFFormField>

            <div className="text-muted-foreground text-xs">
              Current timezone: {Intl.DateTimeFormat().resolvedOptions().timeZone}
            </div>
          </Card>
        </div>

        <SheetFooter className="bg-background fixed bottom-0 left-0 right-0 border-t p-4">
          <div className="flex w-full flex-col gap-2">
            {mode === 'edit' && onDelete && (
              <Button
                type="button"
                variant="destructive"
                size="lg"
                onClick={onDelete}
                disabled={isDeleting || isSaving}
                className="h-11"
              >
                <Trash2 className="mr-2 h-4 w-4" />
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
                className="h-11 flex-1"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="lg"
                onClick={editor.onSubmit}
                disabled={!formState.isValid || isSaving || isDeleting}
                className="h-11 flex-1"
              >
                {isSaving ?
                  'Saving...'
                : mode === 'create' ?
                  'Create'
                : 'Save'}
              </Button>
            </div>
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
});

ScheduleEditorMobile.displayName = 'ScheduleEditorMobile';
