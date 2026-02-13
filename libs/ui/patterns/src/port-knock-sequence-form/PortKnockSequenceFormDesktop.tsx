/**
 * Port Knock Sequence Form (Desktop Presenter)
 *
 * Two-column layout with form on left and visualizer on right.
 * Features drag-drop reordering for knock ports.
 *
 * Story: NAS-7.12 - Implement Port Knocking - Task 3
 */

import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { cn } from '@nasnet/ui/utils';
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormDescription,
  FormMessage,
  Input,
  Button,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Alert,
  AlertDescription,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Badge,
  Card,
} from '@nasnet/ui/primitives';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Plus, Trash2, AlertTriangle } from 'lucide-react';
import { PortKnockVisualizer } from '../port-knock-visualizer';
import type { UsePortKnockSequenceFormReturn } from './use-port-knock-sequence-form';

// ============================================================================
// Types
// ============================================================================

export interface PortKnockSequenceFormDesktopProps {
  /** Headless hook return value */
  formState: UsePortKnockSequenceFormReturn;

  /** Whether form is in edit mode */
  isEditMode?: boolean;

  /** Whether form is submitting */
  isSubmitting?: boolean;

  /** Additional class names */
  className?: string;
}

// ============================================================================
// Common Service Suggestions
// ============================================================================

const COMMON_SERVICES = [
  { label: 'SSH (22)', port: 22, protocol: 'tcp' },
  { label: 'HTTP (80)', port: 80, protocol: 'tcp' },
  { label: 'HTTPS (443)', port: 443, protocol: 'tcp' },
  { label: 'RDP (3389)', port: 3389, protocol: 'tcp' },
  { label: 'VNC (5900)', port: 5900, protocol: 'tcp' },
  { label: 'Custom', port: 0, protocol: 'tcp' },
];

// ============================================================================
// Sortable Row Component
// ============================================================================

interface SortableRowProps {
  knockPort: { port: number; protocol: string; order: number };
  index: number;
  onRemove: () => void;
  onPortChange: (port: number) => void;
  onProtocolChange: (protocol: string) => void;
}

function SortableRow({
  knockPort,
  index,
  onRemove,
  onPortChange,
  onProtocolChange,
}: SortableRowProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: `knock-port-${index}`,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <TableRow ref={setNodeRef} style={style}>
      <TableCell className="w-12">
        <Button
          variant="ghost"
          size="sm"
          className="cursor-grab active:cursor-grabbing"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="h-4 w-4 text-muted-foreground" />
        </Button>
      </TableCell>
      <TableCell className="w-16">
        <Badge variant="secondary">{knockPort.order}</Badge>
      </TableCell>
      <TableCell>
        <Input
          type="number"
          min={1}
          max={65535}
          value={knockPort.port}
          onChange={(e) => onPortChange(parseInt(e.target.value, 10))}
          className="w-32"
        />
      </TableCell>
      <TableCell>
        <Select value={knockPort.protocol} onValueChange={onProtocolChange}>
          <SelectTrigger className="w-24">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="tcp">TCP</SelectItem>
            <SelectItem value="udp">UDP</SelectItem>
          </SelectContent>
        </Select>
      </TableCell>
      <TableCell className="w-16">
        <Button
          variant="ghost"
          size="sm"
          onClick={onRemove}
          disabled={index < 2}
          title={index < 2 ? 'At least 2 knock ports required' : 'Remove port'}
        >
          <Trash2 className="h-4 w-4 text-destructive" />
        </Button>
      </TableCell>
    </TableRow>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export function PortKnockSequenceFormDesktop({
  formState,
  isEditMode = false,
  isSubmitting = false,
  className,
}: PortKnockSequenceFormDesktopProps) {
  const { t } = useTranslation('firewall');
  const { form, knockPorts, addKnockPort, removeKnockPort, reorderKnockPorts, preview, isLockoutRisk } = formState;

  // Drag and drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = knockPorts.findIndex((_, i) => `knock-port-${i}` === active.id);
      const newIndex = knockPorts.findIndex((_, i) => `knock-port-${i}` === over.id);

      if (oldIndex !== -1 && newIndex !== -1) {
        reorderKnockPorts(oldIndex, newIndex);
      }
    }
  };

  return (
    <div className={cn('grid grid-cols-2 gap-6', className)} data-testid="knock-sequence-form">
      {/* Left Column: Form */}
      <div className="space-y-6">
        <Form {...form}>
          <form onSubmit={formState.onSubmit} className="space-y-6">
            {/* Sequence Name */}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Sequence Name</FormLabel>
                  <FormControl>
                    <Input placeholder="ssh-protection" {...field} />
                  </FormControl>
                  <FormDescription>
                    Unique identifier for this knock sequence (used in address list names)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* SSH Lockout Warning */}
            {isLockoutRisk && (
              <Alert variant="destructive" data-testid="ssh-lockout-warning">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Warning: This sequence protects SSH (port 22). Ensure you test the knock sequence
                  before logging out to avoid being locked out.
                </AlertDescription>
              </Alert>
            )}

            {/* Knock Ports Table */}
            <div className="space-y-2">
              <FormLabel>Knock Sequence</FormLabel>
              <FormDescription>
                Define the sequence of ports to knock. Drag rows to reorder. Minimum 2 ports.
              </FormDescription>
              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                <SortableContext
                  items={knockPorts.map((_, i) => `knock-port-${i}`)}
                  strategy={verticalListSortingStrategy}
                >
                  <Table data-testid="knock-ports-table">
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-12"></TableHead>
                        <TableHead className="w-16">Order</TableHead>
                        <TableHead>Port</TableHead>
                        <TableHead>Protocol</TableHead>
                        <TableHead className="w-16"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {knockPorts.map((knockPort, index) => (
                        <SortableRow
                          key={`knock-port-${index}`}
                          knockPort={knockPort}
                          index={index}
                          onRemove={() => removeKnockPort(index)}
                          onPortChange={(port) => {
                            const updatedPorts = [...knockPorts];
                            updatedPorts[index] = { ...updatedPorts[index], port };
                            form.setValue('knockPorts', updatedPorts, { shouldValidate: true });
                          }}
                          onProtocolChange={(protocol) => {
                            const updatedPorts = [...knockPorts];
                            updatedPorts[index] = { ...updatedPorts[index], protocol: protocol as 'tcp' | 'udp' };
                            form.setValue('knockPorts', updatedPorts, { shouldValidate: true });
                          }}
                        />
                      ))}
                    </TableBody>
                  </Table>
                </SortableContext>
              </DndContext>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addKnockPort}
                disabled={knockPorts.length >= 8}
                data-testid="add-knock-port-button"
                aria-label="Add knock port to sequence"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Knock Port
              </Button>
            </div>

            {/* Protected Service */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="protectedPort"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Protected Port</FormLabel>
                    <Select
                      value={field.value?.toString()}
                      onValueChange={(val) => {
                        const selected = COMMON_SERVICES.find((s) => s.port === parseInt(val, 10));
                        if (selected) {
                          field.onChange(selected.port);
                          form.setValue('protectedProtocol', selected.protocol);
                        }
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select service" />
                      </SelectTrigger>
                      <SelectContent>
                        {COMMON_SERVICES.map((service) => (
                          <SelectItem key={service.label} value={service.port.toString()}>
                            {service.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>Service to protect behind knock sequence</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="protectedProtocol"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Protocol</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="tcp">TCP</SelectItem>
                        <SelectItem value="udp">UDP</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Timeouts */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="knockTimeout"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Knock Timeout</FormLabel>
                    <FormControl>
                      <Input placeholder="10s" {...field} />
                    </FormControl>
                    <FormDescription>Time allowed between knocks</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="accessTimeout"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Access Timeout</FormLabel>
                    <FormControl>
                      <Input placeholder="1h" {...field} />
                    </FormControl>
                    <FormDescription>Access duration after successful knock</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Submit Button */}
            <div className="flex justify-end gap-3">
              <Button
                type="submit"
                disabled={isSubmitting}
                data-testid="submit-button"
                aria-label={isEditMode ? 'Update knock sequence' : 'Create knock sequence'}
              >
                {isSubmitting ? 'Saving...' : isEditMode ? 'Update Sequence' : 'Create Sequence'}
              </Button>
            </div>
          </form>
        </Form>
      </div>

      {/* Right Column: Visualizer */}
      <div className="space-y-4">
        <Card className="p-4">
          <h3 className="text-lg font-semibold mb-4">Preview</h3>
          <PortKnockVisualizer
            knockPorts={knockPorts}
            protectedPort={form.watch('protectedPort')}
            protectedProtocol={form.watch('protectedProtocol')}
            knockTimeout={form.watch('knockTimeout')}
            accessTimeout={form.watch('accessTimeout')}
          />
        </Card>

        {/* Rule Preview */}
        <Card className="p-4">
          <h3 className="text-lg font-semibold mb-4">Generated Rules</h3>
          <div className="space-y-2 text-sm">
            {preview.map((rule, index) => (
              <div key={index} className="flex items-start gap-2 p-2 rounded bg-muted">
                <Badge variant={rule.ruleType === 'accept' ? 'success' : 'default'}>{rule.stage}</Badge>
                <span className="text-muted-foreground">{rule.description}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}

PortKnockSequenceFormDesktop.displayName = 'PortKnockSequenceFormDesktop';
