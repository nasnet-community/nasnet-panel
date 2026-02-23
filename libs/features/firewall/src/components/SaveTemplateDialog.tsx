/**
 * SaveTemplateDialog - Create custom firewall templates
 *
 * Features:
 * - Name, description, category form
 * - Variable parameterization with checkboxes
 * - Auto-generate template from current rules
 * - Version control
 *
 * @module @nasnet/features/firewall/components
 */

import React, { useState, useCallback, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Save, FileText, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { cn } from '@nasnet/ui/utils';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@nasnet/ui/primitives/dialog';
import { Button } from '@nasnet/ui/primitives/button';
import { Input } from '@nasnet/ui/primitives/input';
import { Textarea } from '@nasnet/ui/primitives/textarea';
import { Label } from '@nasnet/ui/primitives/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@nasnet/ui/primitives/select';
import { Checkbox } from '@nasnet/ui/primitives/checkbox';
import { Alert, AlertDescription } from '@nasnet/ui/primitives/alert';
import { ScrollArea } from '@nasnet/ui/primitives/scroll-area';
import { Badge } from '@nasnet/ui/primitives/badge';
import {
  FirewallTemplateSchema,
  TemplateCategorySchema,
  TemplateComplexitySchema,
  type FirewallTemplate,
  type TemplateRule,
  type TemplateVariable,
  type TemplateCategory,
  type TemplateComplexity,
} from '../schemas/templateSchemas';
import { generateTemplateId } from '../utils/template-export';
import { validateTemplateNameUniqueness } from '../utils/template-validator';

// ============================================
// FORM SCHEMA
// ============================================

const SaveTemplateFormSchema = z.object({
  name: z
    .string()
    .min(1, 'Template name is required')
    .max(100, 'Name must be 100 characters or less')
    .regex(/^[a-zA-Z0-9\s-]+$/, 'Name can only contain letters, numbers, spaces, and hyphens'),
  description: z
    .string()
    .min(10, 'Description must be at least 10 characters')
    .max(1000, 'Description must be 1000 characters or less'),
  category: TemplateCategorySchema,
  complexity: TemplateComplexitySchema,
  version: z
    .string()
    .regex(/^\d+\.\d+\.\d+$/, 'Version must be in format X.Y.Z (e.g., 1.0.0)')
    .default('1.0.0'),
});

type SaveTemplateFormData = z.infer<typeof SaveTemplateFormSchema>;

// ============================================
// COMPONENT PROPS
// ============================================

export interface SaveTemplateDialogProps {
  /** Current firewall rules to use as template source */
  rules: TemplateRule[];
  /** Existing template names (for uniqueness validation) */
  existingNames?: string[];
  /** Callback when template is saved */
  onSave: (template: FirewallTemplate) => Promise<void>;
  /** Trigger element */
  trigger?: React.ReactNode;
  /** Whether dialog is open (controlled mode) */
  open?: boolean;
  /** Callback when open state changes (controlled mode) */
  onOpenChange?: (open: boolean) => void;
  /** Optional CSS class for styling */
  className?: string;
}

// ============================================
// COMPONENT
// ============================================

/**
 * SaveTemplateDialog Component
 *
 * @description Provides a dialog for saving firewall rules as reusable templates
 * with variable parameterization and version control.
 *
 * @example
 * ```tsx
 * <SaveTemplateDialog
 *   rules={selectedRules}
 *   onSave={handleSaveTemplate}
 *   existingNames={templateNames}
 * />
 * ```
 */
export const SaveTemplateDialog = React.memo(function SaveTemplateDialogComponent({
  rules,
  existingNames = [],
  onSave,
  trigger,
  open: controlledOpen,
  onOpenChange,
  className,
}: SaveTemplateDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [selectedVariables, setSelectedVariables] = useState<Set<string>>(new Set());

  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;
  const setOpen = isControlled ? onOpenChange || (() => {}) : setInternalOpen;

  // Extract potential variables from rules
  const potentialVariables = useMemo(() => {
    const variables = new Map<string, TemplateVariable>();

    // Analyze rule properties for common patterns
    for (const rule of rules) {
      const propsJson = JSON.stringify(rule.properties);

      // Look for IP addresses
      const ipMatches = propsJson.match(/\b(?:\d{1,3}\.){3}\d{1,3}\b/g);
      if (ipMatches) {
        for (const ip of ipMatches) {
          if (!variables.has('WAN_IP')) {
            variables.set('WAN_IP', {
              name: 'WAN_IP',
              label: 'WAN IP Address',
              type: 'IP',
              defaultValue: ip,
              isRequired: true,
              description: 'External/WAN interface IP address',
            });
          }
        }
      }

      // Look for subnets
      const subnetMatches = propsJson.match(/\b(?:\d{1,3}\.){3}\d{1,3}\/\d{1,2}\b/g);
      if (subnetMatches) {
        for (const subnet of subnetMatches) {
          if (!variables.has('LAN_SUBNET')) {
            variables.set('LAN_SUBNET', {
              name: 'LAN_SUBNET',
              label: 'LAN Subnet',
              type: 'SUBNET',
              defaultValue: subnet,
              isRequired: true,
              description: 'Local network subnet in CIDR notation',
            });
          }
        }
      }

      // Look for interface references
      if (rule.properties.inInterface || rule.properties.outInterface) {
        const iface = rule.properties.inInterface || rule.properties.outInterface;
        if (!variables.has('LAN_INTERFACE')) {
          variables.set('LAN_INTERFACE', {
            name: 'LAN_INTERFACE',
            label: 'LAN Interface',
            type: 'INTERFACE',
            defaultValue: iface as string,
            isRequired: true,
            description: 'LAN-facing network interface',
          });
        }
      }

      // Look for port numbers
      if (rule.properties.dstPort || rule.properties.srcPort) {
        const port = rule.properties.dstPort || rule.properties.srcPort;
        if (!variables.has('SERVICE_PORT')) {
          variables.set('SERVICE_PORT', {
            name: 'SERVICE_PORT',
            label: 'Service Port',
            type: 'PORT',
            defaultValue: port as string,
            isRequired: false,
            description: 'Service port number',
          });
        }
      }
    }

    return Array.from(variables.values());
  }, [rules]);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
  } = useForm<SaveTemplateFormData>({
    resolver: zodResolver(SaveTemplateFormSchema) as any,
    defaultValues: {
      name: '',
      description: '',
      category: 'CUSTOM',
      complexity: 'MODERATE',
      version: '1.0.0',
    },
  });

  const templateName = watch('name');

  // Validate name uniqueness
  const nameError = useMemo(() => {
    if (!templateName) return null;
    return validateTemplateNameUniqueness(templateName, existingNames);
  }, [templateName, existingNames]);

  const toggleVariable = useCallback((varName: string) => {
    setSelectedVariables((prev) => {
      const next = new Set(prev);
      if (next.has(varName)) {
        next.delete(varName);
      } else {
        next.add(varName);
      }
      return next;
    });
  }, []);

  const handleSaveTemplate = useCallback(
    async (formData: SaveTemplateFormData) => {
      if (nameError) {
        setSaveError(nameError.message);
        return;
      }

      setSaving(true);
      setSaveError(null);

      try {
        // Generate template ID
        const existingIds = existingNames.map((name) =>
          name.toLowerCase().replace(/\s+/g, '-')
        );
        const templateId = generateTemplateId(formData.name, existingIds);

        // Build variables array from selected checkboxes
        const variables = potentialVariables.filter((v) => selectedVariables.has(v.name));

        // Create template object
        const template: FirewallTemplate = {
          id: templateId,
          name: formData.name,
          description: formData.description,
          category: formData.category,
          complexity: formData.complexity,
          ruleCount: rules.length,
          variables,
          rules,
          isBuiltIn: false,
          version: formData.version,
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        // Validate template structure
        const validated = FirewallTemplateSchema.parse(template);

        // Save template
        await onSave(validated);

        // Reset form and close
        reset();
        setSelectedVariables(new Set());
        setOpen(false);
      } catch (error) {
        setSaveError(
          error instanceof Error ? error.message : 'Failed to save template'
        );
      } finally {
        setSaving(false);
      }
    },
    [
      nameError,
      potentialVariables,
      selectedVariables,
      rules,
      onSave,
      existingNames,
      reset,
      setOpen,
    ]
  );

  const handleOpenChange = useCallback(
    (newOpen: boolean) => {
      if (!newOpen && !saving) {
        // Reset on close
        reset();
        setSelectedVariables(new Set());
        setSaveError(null);
      }
      setOpen(newOpen);
    },
    [saving, reset, setOpen]
  );

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      {trigger}
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Save as Template
          </DialogTitle>
          <DialogDescription>
            Create a reusable template from {rules.length} firewall rule{rules.length !== 1 ? 's' : ''}.
            Add variables to make this template customizable.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(handleSaveTemplate as any)}>
          <ScrollArea className="max-h-[60vh] pr-4">
            <div className="space-y-4">
              {/* Name */}
              <div className="space-y-2">
                <Label htmlFor="name">Template Name *</Label>
                <Input
                  id="name"
                  placeholder="e.g., Home Network Security"
                  {...register('name')}
                  aria-invalid={!!errors.name || !!nameError}
                />
                {errors.name && (
                  <p className="text-sm text-destructive">{errors.name.message}</p>
                )}
                {nameError && (
                  <p className="text-sm text-destructive">{nameError.message}</p>
                )}
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description">Description *</Label>
                <Textarea
                  id="description"
                  placeholder="Describe what this template does and when to use it..."
                  rows={4}
                  {...register('description')}
                  aria-invalid={!!errors.description}
                />
                {errors.description && (
                  <p className="text-sm text-destructive">{errors.description.message}</p>
                )}
              </div>

              {/* Category and Complexity */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="category">Category *</Label>
                  <Select
                    defaultValue="CUSTOM"
                    onValueChange={(value) => register('category').onChange({ target: { value } })}
                  >
                    <SelectTrigger id="category">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="CUSTOM">Custom</SelectItem>
                      <SelectItem value="HOME">Home Network</SelectItem>
                      <SelectItem value="GAMING">Gaming</SelectItem>
                      <SelectItem value="IOT">IoT Devices</SelectItem>
                      <SelectItem value="GUEST">Guest Network</SelectItem>
                      <SelectItem value="VPN">VPN</SelectItem>
                      <SelectItem value="SECURITY">Security</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="complexity">Complexity *</Label>
                  <Select
                    defaultValue="MODERATE"
                    onValueChange={(value) => register('complexity').onChange({ target: { value } })}
                  >
                    <SelectTrigger id="complexity">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="SIMPLE">Simple</SelectItem>
                      <SelectItem value="MODERATE">Moderate</SelectItem>
                      <SelectItem value="ADVANCED">Advanced</SelectItem>
                      <SelectItem value="EXPERT">Expert</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Version */}
              <div className="space-y-2">
                <Label htmlFor="version">Version</Label>
                <Input
                  id="version"
                  placeholder="1.0.0"
                  {...register('version')}
                  aria-invalid={!!errors.version}
                />
                {errors.version && (
                  <p className="text-sm text-destructive">{errors.version.message}</p>
                )}
              </div>

              {/* Variables */}
              {potentialVariables.length > 0 && (
                <div className="space-y-3 rounded-lg border p-4">
                  <div className="flex items-center justify-between">
                    <Label>Template Variables</Label>
                    <Badge variant="secondary">
                      {selectedVariables.size} selected
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Select values to parameterize. This makes your template reusable for different networks.
                  </p>
                  <div className="space-y-2">
                    {potentialVariables.map((variable) => (
                      <div
                        key={variable.name}
                        className="flex items-start space-x-3 rounded-md border p-3 hover:bg-accent/50"
                      >
                        <Checkbox
                          id={`var-${variable.name}`}
                          checked={selectedVariables.has(variable.name)}
                          onCheckedChange={() => toggleVariable(variable.name)}
                          aria-label={`Select ${variable.label} as variable`}
                        />
                        <div className="flex-1 space-y-1">
                          <Label
                            htmlFor={`var-${variable.name}`}
                            className="cursor-pointer font-medium"
                          >
                            {variable.label}
                            {variable.isRequired && (
                              <span className="ml-1 text-destructive">*</span>
                            )}
                          </Label>
                          <p className="text-xs text-muted-foreground">
                            {variable.description}
                          </p>
                          {variable.defaultValue && (
                            <code className="text-xs bg-muted px-2 py-0.5 rounded font-mono">
                              Default: {variable.defaultValue}
                            </code>
                          )}
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {variable.type}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Error Alert */}
              {saveError && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{saveError}</AlertDescription>
                </Alert>
              )}
            </div>
          </ScrollArea>

          <DialogFooter className="mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={saving || !!nameError}>
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Save Template
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
});

SaveTemplateDialog.displayName = 'SaveTemplateDialog';
