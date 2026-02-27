/**
 * ScheduleEditorDesktop - Desktop Platform Presenter
 *
 * Dialog-based schedule form with inline layout and checkboxes.
 * Optimized for mouse/keyboard interaction and horizontal layout.
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,

  Button,
  Card,
  Input,
  Checkbox,
  Badge,
  Label} from '@nasnet/ui/primitives';

import { RHFFormField } from '../rhf-form-field';
import { useScheduleEditor } from './use-schedule-editor';

import type { ScheduleEditorProps } from './types';

/**
 * Desktop presenter for schedule editor.
 *
 * Features:
 * - Dialog with two-column layout
 * - Checkboxes for day selection
 * - Preset buttons (Weekdays, Weekends, Every Day)
 * - Time pickers with HH:MM format
 * - Live preview with next activation
 * - Action buttons in footer
 */
export const ScheduleEditorDesktop = memo(function ScheduleEditorDesktop({
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
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {mode === 'create' ? 'Create Schedule' : 'Edit Schedule'}
          </DialogTitle>
          <DialogDescription>
            Set when routing should be automatically activated
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Live Preview */}
          <Card className="p-4 bg-info-light border border-info rounded-[var(--semantic-radius-card)]">
            <div className="flex items-start gap-3">
              <Info className="h-5 w-5 text-info-dark mt-0.5 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-info-dark mb-1">Preview</p>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap font-mono">
                  {preview}
                </p>
              </div>
              {schedule.enabled && (
                <Badge variant="success">
                  <Zap className="h-3 w-3 mr-1" />
                  Enabled
                </Badge>
              )}
            </div>
          </Card>

          {/* Day Selection */}
          <div className="space-y-4">
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
              description="Check days when schedule should be active"
              required
            >
              <Controller
                name="days"
                control={control}
                render={({ field }) => (
                  <div className="grid grid-cols-7 gap-3">
                    {DAYS_OF_WEEK.map((day: { value: number; label: string; short: string }) => {
                      const isSelected = field.value?.includes(day.value) || false;
                      return (
                        <div
                          key={day.value}
                          className="flex flex-col items-center gap-2"
                        >
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={() => toggleDay(day.value)}
                            id={`day-${day.value}`}
                          />
                          <Label
                            htmlFor={`day-${day.value}`}
                            className="text-xs font-medium cursor-pointer"
                          >
                            {day.short}
                          </Label>
                        </div>
                      );
                    })}
                  </div>
                )}
              />
            </RHFFormField>
          </div>

          {/* Time Range */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                <h3 className="text-sm font-semibold">Start Time</h3>
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
                      className="font-mono rounded-[var(--semantic-radius-input)]"
                    />
                  )}
                />
              </RHFFormField>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                <h3 className="text-sm font-semibold">End Time</h3>
              </div>

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
                      className="font-mono rounded-[var(--semantic-radius-input)]"
                    />
                  )}
                />
              </RHFFormField>
            </div>
          </div>

          {/* Timezone */}
          <RHFFormField
            name="timezone"
            label="Timezone"
            description="IANA timezone identifier (e.g., America/New_York, UTC)"
            required
          >
            <Controller
              name="timezone"
              control={control}
              render={({ field }) => (
                <div className="space-y-2">
                  <Input
                    {...field}
                    placeholder="America/New_York"
                    value={field.value || ''}
                    className="font-mono rounded-[var(--semantic-radius-input)]"
                  />
                  <p className="text-xs text-muted-foreground">
                    Current timezone: {Intl.DateTimeFormat().resolvedOptions().timeZone}
                  </p>
                </div>
              )}
            />
          </RHFFormField>
        </div>

        <DialogFooter className="flex justify-between items-center">
          <div>
            {mode === 'edit' && onDelete && (
              <Button
                type="button"
                variant="destructive"
                onClick={onDelete}
                disabled={isDeleting || isSaving}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </Button>
            )}
          </div>

          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSaving || isDeleting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              onClick={editor.onSubmit}
              disabled={!formState.isValid || isSaving || isDeleting}
            >
              {isSaving ? 'Saving...' : mode === 'create' ? 'Create' : 'Save'}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
});

ScheduleEditorDesktop.displayName = 'ScheduleEditorDesktop';
