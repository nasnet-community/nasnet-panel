/**
 * Port Knock Sequence Form (Mobile Presenter)
 *
 * Card-based layout with collapsible sections for mobile devices.
 * Optimized for 44px touch targets.
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
  Badge,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@nasnet/ui/primitives';
import { Plus, Trash2, AlertTriangle, ChevronUp, ChevronDown } from 'lucide-react';
import { PortKnockVisualizer } from '../port-knock-visualizer';
import type { UsePortKnockSequenceFormReturn } from './use-port-knock-sequence-form';

// ============================================================================
// Types
// ============================================================================

export interface PortKnockSequenceFormMobileProps {
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
// Knock Port Card Component
// ============================================================================

interface KnockPortCardProps {
  knockPort: { port: number; protocol: string; order: number };
  index: number;
  totalPorts: number;
  onRemove: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onPortChange: (port: number) => void;
  onProtocolChange: (protocol: string) => void;
}

function KnockPortCard({
  knockPort,
  index,
  totalPorts,
  onRemove,
  onMoveUp,
  onMoveDown,
  onPortChange,
  onProtocolChange,
}: KnockPortCardProps) {
  const canMoveUp = index > 0;
  const canMoveDown = index < totalPorts - 1;
  const canRemove = totalPorts > 2;

  return (
    <Card className="mb-3">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Badge variant="secondary">Stage {knockPort.order}</Badge>
            <CardTitle className="text-base">Knock Port {knockPort.order}</CardTitle>
          </div>
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={onMoveUp}
              disabled={!canMoveUp}
              className="h-11 w-11"
            >
              <ChevronUp className="h-5 w-5" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onMoveDown}
              disabled={!canMoveDown}
              className="h-11 w-11"
            >
              <ChevronDown className="h-5 w-5" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onRemove}
              disabled={!canRemove}
              className="h-11 w-11"
            >
              <Trash2 className="h-5 w-5 text-destructive" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div>
          <label className="text-sm font-medium mb-1.5 block">Port</label>
          <Input
            type="number"
            min={1}
            max={65535}
            value={knockPort.port}
            onChange={(e) => onPortChange(parseInt(e.target.value, 10))}
            className="h-11"
          />
        </div>
        <div>
          <label className="text-sm font-medium mb-1.5 block">Protocol</label>
          <Select value={knockPort.protocol} onValueChange={onProtocolChange}>
            <SelectTrigger className="h-11">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="tcp">TCP</SelectItem>
              <SelectItem value="udp">UDP</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export function PortKnockSequenceFormMobile({
  formState,
  isEditMode = false,
  isSubmitting = false,
  className,
}: PortKnockSequenceFormMobileProps) {
  const { t } = useTranslation('firewall');
  const { form, knockPorts, addKnockPort, removeKnockPort, reorderKnockPorts, preview, isLockoutRisk } = formState;

  const handleMoveUp = (index: number) => {
    if (index > 0) {
      reorderKnockPorts(index, index - 1);
    }
  };

  const handleMoveDown = (index: number) => {
    if (index < knockPorts.length - 1) {
      reorderKnockPorts(index, index + 1);
    }
  };

  return (
    <div className={cn('space-y-4', className)} data-testid="knock-sequence-form">
      <Form {...form}>
        <form onSubmit={formState.onSubmit} className="space-y-4">
          {/* Basic Info Section */}
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Sequence Name</FormLabel>
                    <FormControl>
                      <Input placeholder="ssh-protection" {...field} className="h-11" />
                    </FormControl>
                    <FormDescription>
                      Unique identifier for this knock sequence
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
                    Warning: This sequence protects SSH (port 22). Test before logging out to avoid lockout.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>

          {/* Knock Sequence Section */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Knock Sequence</CardTitle>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addKnockPort}
                  disabled={knockPorts.length >= 8}
                  className="h-9"
                  data-testid="add-knock-port-button"
                  aria-label="Add knock port to sequence"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add
                </Button>
              </div>
            </CardHeader>
            <CardContent data-testid="knock-ports-table">
              <p className="text-sm text-muted-foreground mb-4">
                Define the sequence of ports to knock. Minimum 2 ports required.
              </p>
              {knockPorts.map((knockPort, index) => (
                <KnockPortCard
                  key={`knock-port-${index}`}
                  knockPort={knockPort}
                  index={index}
                  totalPorts={knockPorts.length}
                  onRemove={() => removeKnockPort(index)}
                  onMoveUp={() => handleMoveUp(index)}
                  onMoveDown={() => handleMoveDown(index)}
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
            </CardContent>
          </Card>

          {/* Protected Service Section */}
          <Card>
            <CardHeader>
              <CardTitle>Protected Service</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="protectedPort"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Service</FormLabel>
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
                      <SelectTrigger className="h-11">
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
                      <SelectTrigger className="h-11">
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
            </CardContent>
          </Card>

          {/* Timeouts Section */}
          <Card>
            <CardHeader>
              <CardTitle>Timeouts</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="knockTimeout"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Knock Timeout</FormLabel>
                    <FormControl>
                      <Input placeholder="10s" {...field} className="h-11" />
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
                      <Input placeholder="1h" {...field} className="h-11" />
                    </FormControl>
                    <FormDescription>Access duration after successful knock</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Preview Section (Collapsible) */}
          <Accordion type="single" collapsible defaultValue="preview">
            <AccordionItem value="preview">
              <AccordionTrigger>Preview Knock Sequence</AccordionTrigger>
              <AccordionContent>
                <div className="space-y-4 pt-2">
                  <PortKnockVisualizer
                    knockPorts={knockPorts}
                    protectedPort={form.watch('protectedPort')}
                    protectedProtocol={form.watch('protectedProtocol')}
                    knockTimeout={form.watch('knockTimeout')}
                    accessTimeout={form.watch('accessTimeout')}
                    compact
                  />
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="rules">
              <AccordionTrigger>Generated Rules</AccordionTrigger>
              <AccordionContent>
                <div className="space-y-2 text-sm pt-2">
                  {preview.map((rule, index) => (
                    <div key={index} className="flex items-start gap-2 p-3 rounded bg-muted">
                      <Badge variant={rule.ruleType === 'accept' ? 'success' : 'default'}>
                        {rule.stage}
                      </Badge>
                      <span className="text-muted-foreground flex-1">{rule.description}</span>
                    </div>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>

          {/* Submit Button */}
          <div className="sticky bottom-0 bg-background pt-4 pb-2">
            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full h-11"
              data-testid="submit-button"
              aria-label={isEditMode ? 'Update knock sequence' : 'Create knock sequence'}
            >
              {isSubmitting ? 'Saving...' : isEditMode ? 'Update Sequence' : 'Create Sequence'}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}

PortKnockSequenceFormMobile.displayName = 'PortKnockSequenceFormMobile';
