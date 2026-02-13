/**
 * AlertTemplateDetailPanel Component (Enhanced)
 * NAS-18.12: Alert Rule Templates Feature
 *
 * Displays detailed information about an alert rule template.
 * Shows conditions, variables, channels, throttling, and metadata.
 * Includes interactive variable input form for customization.
 *
 * Responsive: Desktop uses drawer/panel, Mobile uses bottom sheet.
 */

import * as React from 'react';
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  Separator,
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  cn,
} from '@nasnet/ui/primitives';
import { useMediaQuery } from '@nasnet/ui/primitives';

import {
  getCategoryMeta,
  type AlertTemplateCategoryMeta,
} from '../../utils/alert-template-categories';
import type { AlertRuleTemplate } from '../../schemas/alert-rule-template.schema';
import {
  AlertTemplateVariableInputForm,
  type VariableValues,
} from './AlertTemplateVariableInputForm';

// =============================================================================
// Props Interface
// =============================================================================

export interface AlertTemplateDetailPanelProps {
  /** Template to display (null to close panel) */
  template: AlertRuleTemplate | null;

  /** Callback when panel is closed */
  onClose: () => void;

  /** Callback when Apply button is clicked with variable values */
  onApply?: (template: AlertRuleTemplate, variables: VariableValues) => void;

  /** Callback when Export button is clicked */
  onExport?: (template: AlertRuleTemplate) => void;

  /** Callback when Delete button is clicked (custom templates only) */
  onDelete?: (template: AlertRuleTemplate) => void;

  /** Open state (controlled) */
  open?: boolean;

  /** Whether form is submitting */
  isSubmitting?: boolean;
}

// =============================================================================
// Detail Content Component
// =============================================================================

interface DetailContentProps {
  template: AlertRuleTemplate;
  onApply?: (template: AlertRuleTemplate, variables: VariableValues) => void;
  onExport?: (template: AlertRuleTemplate) => void;
  onDelete?: (template: AlertRuleTemplate) => void;
  isSubmitting?: boolean;
}

function DetailContent({
  template,
  onApply,
  onExport,
  onDelete,
  isSubmitting = false,
}: DetailContentProps) {
  const categoryMeta = getCategoryMeta(template.category);
  const [activeTab, setActiveTab] = React.useState<'details' | 'configure'>('details');

  const severityColors = {
    CRITICAL: 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300',
    WARNING: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300',
    INFO: 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300',
  };

  const operatorLabels: Record<string, string> = {
    EQUALS: '=',
    NOT_EQUALS: '≠',
    GREATER_THAN: '>',
    LESS_THAN: '<',
    CONTAINS: 'contains',
    REGEX: 'matches regex',
  };

  // Handle form submission from variable input form
  const handleVariableSubmit = (values: VariableValues) => {
    if (onApply) {
      onApply(template, values);
    }
  };

  // If template has variables, use tabs, otherwise show details only
  const hasVariables = template.variables.length > 0;

  const detailsContent = (
    <div className="space-y-6">
      {/* Header badges */}
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="outline" className={cn('text-xs', categoryMeta.color)}>
          {categoryMeta.label}
        </Badge>
        <Badge className={cn('text-xs', severityColors[template.severity])}>
          {template.severity}
        </Badge>
        {template.isBuiltIn && (
          <Badge variant="secondary" className="text-xs">
            Built-in
          </Badge>
        )}
        <Badge variant="outline" className="text-xs">
          v{template.version}
        </Badge>
      </div>

      {/* Description */}
      <div>
        <h4 className="text-sm font-medium mb-2">Description</h4>
        <p className="text-sm text-muted-foreground">{template.description}</p>
      </div>

      <Separator />

      {/* Event type */}
      <div>
        <h4 className="text-sm font-medium mb-2">Event Type</h4>
        <code className="text-xs bg-muted px-2 py-1 rounded">{template.eventType}</code>
      </div>

      <Separator />

      {/* Conditions */}
      <div>
        <h4 className="text-sm font-medium mb-3">
          Conditions ({template.conditions.length})
        </h4>
        <div className="space-y-2">
          {template.conditions.map((condition, index) => (
            <Card key={index} className="bg-muted/50">
              <CardContent className="p-3">
                <div className="flex items-center gap-2 text-sm">
                  <code className="font-medium text-xs">{condition.field}</code>
                  <Badge variant="outline" className="text-xs">
                    {operatorLabels[condition.operator] || condition.operator}
                  </Badge>
                  <code className="text-xs bg-background px-2 py-1 rounded">
                    {condition.value}
                  </code>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <Separator />

      {/* Channels */}
      <div>
        <h4 className="text-sm font-medium mb-3">
          Notification Channels ({template.channels.length})
        </h4>
        <div className="flex flex-wrap gap-2">
          {template.channels.map((channel) => (
            <Badge key={channel} variant="secondary" className="text-xs capitalize">
              {channel}
            </Badge>
          ))}
        </div>
      </div>

      {/* Variables (read-only display) */}
      {hasVariables && (
        <>
          <Separator />
          <div>
            <h4 className="text-sm font-medium mb-3">
              Variables ({template.variables.length})
            </h4>
            <div className="space-y-3">
              {template.variables.map((variable) => (
                <Card key={variable.name} className="bg-muted/50">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm">{variable.label}</CardTitle>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          {variable.type}
                        </Badge>
                        {variable.required && (
                          <Badge variant="destructive" className="text-xs">
                            Required
                          </Badge>
                        )}
                      </div>
                    </div>
                    <CardDescription className="text-xs">
                      Variable: <code className="text-xs">{`{{${variable.name}}}`}</code>
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pb-3">
                    {variable.description && (
                      <p className="text-xs text-muted-foreground mb-2">{variable.description}</p>
                    )}
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      {variable.defaultValue && (
                        <div>
                          Default: <code className="text-xs">{variable.defaultValue}</code>
                        </div>
                      )}
                      {variable.min !== undefined && <div>Min: {variable.min}</div>}
                      {variable.max !== undefined && <div>Max: {variable.max}</div>}
                      {variable.unit && <div>Unit: {variable.unit}</div>}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Throttle config (if any) */}
      {template.throttle && (
        <>
          <Separator />
          <div>
            <h4 className="text-sm font-medium mb-3">Throttle Configuration</h4>
            <Card className="bg-muted/50">
              <CardContent className="p-3">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Max Alerts:</span>
                    <span className="font-medium">{template.throttle.maxAlerts}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Period:</span>
                    <span className="font-medium">{template.throttle.periodSeconds}s</span>
                  </div>
                  {template.throttle.groupByField && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Group By:</span>
                      <code className="text-xs">{template.throttle.groupByField}</code>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}

      {/* Actions (only for templates without variables) */}
      {!hasVariables && (
        <>
          <Separator />
          <div className="flex flex-col gap-2">
            {onApply && (
              <Button
                variant="default"
                size="default"
                onClick={() => onApply(template, {})}
                disabled={isSubmitting}
                className="w-full min-h-[44px]"
              >
                {isSubmitting ? 'Applying...' : 'Apply Template'}
              </Button>
            )}
            <div className="flex gap-2">
              {onExport && (
                <Button
                  variant="outline"
                  size="default"
                  onClick={() => onExport(template)}
                  disabled={isSubmitting}
                  className="flex-1 min-h-[44px]"
                >
                  Export
                </Button>
              )}
              {onDelete && !template.isBuiltIn && (
                <Button
                  variant="destructive"
                  size="default"
                  onClick={() => onDelete(template)}
                  disabled={isSubmitting}
                  className="flex-1 min-h-[44px]"
                >
                  Delete
                </Button>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );

  // If no variables, show details only
  if (!hasVariables) {
    return detailsContent;
  }

  // With variables, show tabs
  return (
    <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="details">Details</TabsTrigger>
        <TabsTrigger value="configure">
          Configure
          {template.variables.length > 0 && (
            <Badge variant="secondary" className="ml-2 text-xs h-5">
              {template.variables.length}
            </Badge>
          )}
        </TabsTrigger>
      </TabsList>

      <TabsContent value="details" className="mt-6">
        {detailsContent}
        <div className="flex gap-2 mt-6">
          {onExport && (
            <Button
              variant="outline"
              size="default"
              onClick={() => onExport(template)}
              disabled={isSubmitting}
              className="flex-1 min-h-[44px]"
            >
              Export
            </Button>
          )}
          {onDelete && !template.isBuiltIn && (
            <Button
              variant="destructive"
              size="default"
              onClick={() => onDelete(template)}
              disabled={isSubmitting}
              className="flex-1 min-h-[44px]"
            >
              Delete
            </Button>
          )}
        </div>
      </TabsContent>

      <TabsContent value="configure" className="mt-6">
        <AlertTemplateVariableInputForm
          template={template}
          onSubmit={handleVariableSubmit}
          onCancel={() => setActiveTab('details')}
          isSubmitting={isSubmitting}
        />
      </TabsContent>
    </Tabs>
  );
}

// =============================================================================
// Main Component
// =============================================================================

/**
 * AlertTemplateDetailPanel - Display template details with interactive configuration
 *
 * Features:
 * - Responsive (Desktop: Dialog, Mobile: Sheet)
 * - Shows all template metadata (category, severity, version)
 * - Displays conditions with operator labels
 * - Lists notification channels
 * - Shows variables with constraints and defaults
 * - Interactive variable input form with validation
 * - Displays throttle configuration
 * - Apply, Export, and Delete actions
 * - WCAG AAA compliant
 *
 * @param props - Component props
 */
export function AlertTemplateDetailPanel(props: AlertTemplateDetailPanelProps) {
  const { template, onClose, onApply, onExport, onDelete, open, isSubmitting } = props;

  const isDesktop = useMediaQuery('(min-width: 640px)');
  const isOpen = open !== undefined ? open : template !== null;

  if (!template) return null;

  const sharedContent = (
    <DetailContent
      template={template}
      onApply={onApply}
      onExport={onExport}
      onDelete={onDelete}
      isSubmitting={isSubmitting}
    />
  );

  // Desktop: Use Dialog
  if (isDesktop) {
    return (
      <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{template.name}</DialogTitle>
            <DialogDescription>Alert rule template details</DialogDescription>
          </DialogHeader>
          {sharedContent}
        </DialogContent>
      </Dialog>
    );
  }

  // Mobile: Use Sheet (bottom sheet)
  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent side="bottom" className="max-h-[90vh] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{template.name}</SheetTitle>
          <SheetDescription>Alert rule template details</SheetDescription>
        </SheetHeader>
        <div className="mt-4">{sharedContent}</div>
      </SheetContent>
    </Sheet>
  );
}
