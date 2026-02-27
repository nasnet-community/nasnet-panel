/**
 * NATRuleBuilderMobile - Mobile Platform Presenter
 *
 * Sheet-based form with card sections and 44px touch targets.
 * Optimized for touch interaction and vertical scrolling.
 *
 * @module @nasnet/ui/patterns/security/nat-rule-builder
 */

import { memo, useState } from 'react';

import {
  Network,
  Shield,
  Settings,
  Info,
  Trash2,
  ArrowRight,
  Globe,
  ChevronDown,
} from 'lucide-react';
import { Controller } from 'react-hook-form';

import { NatChainSchema, NatActionSchema, ProtocolSchema } from '@nasnet/core/types';
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
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
  Switch,
  Badge,
  Separator,
  Label,
} from '@nasnet/ui/primitives';

import { useNATRuleBuilder } from './use-nat-rule-builder';
import { ConfirmationDialog } from '../../confirmation-dialog';
import { RHFFormField } from '../../rhf-form-field';

import type { NATRuleBuilderProps } from './nat-rule-builder.types';

/**
 * Mobile presenter for NAT rule builder.
 *
 * Features:
 * - Sheet with card-based sections
 * - 44px minimum touch targets (WCAG AAA)
 * - Vertical scrolling layout
 * - Collapsible sections for better space usage
 * - Sticky footer with action buttons
 */
export const NATRuleBuilderMobile = memo(function NATRuleBuilderMobile({
  routerId,
  initialRule,
  open,
  onClose,
  onSave,
  onDelete,
  isSaving = false,
  isDeleting = false,
  mode = initialRule?.id ? 'edit' : 'create',
  showChainDiagram = false, // Hide on mobile for space
  interfaces = [],
  interfaceLists = [],
  addressLists = [],
}: NATRuleBuilderProps) {
  const builder = useNATRuleBuilder({
    initialRule,
    onSubmit: onSave,
  });

  const { form, rule, preview, description, visibleFields, errors } = builder;
  const { control, formState } = form;

  // Type-safe control casting for react-hook-form compatibility
  const typedControl = control as any;

  // Confirmation dialog state
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Collapsible section state
  const [expandedSections, setExpandedSections] = useState({
    matchers: true,
    interfaces: true,
    translation: true,
    options: false,
    preview: false,
  });

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  // Check if field is visible
  const isFieldVisible = (fieldName: string) => {
    return visibleFields.includes(fieldName);
  };

  // Handle delete with confirmation
  const handleDelete = () => {
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    setShowDeleteConfirm(false);
    await onDelete?.();
  };

  return (
    <>
      <Sheet
        open={open}
        onOpenChange={onClose}
      >
        <SheetContent
          side="bottom"
          className="flex h-[95vh] flex-col p-0"
        >
          {/* Header */}
          <SheetHeader className="border-b px-4 pb-3 pt-4">
            <div className="flex items-center gap-3">
              <div className="bg-primary/10 flex h-10 w-10 items-center justify-center rounded-lg">
                <Shield className="text-primary h-5 w-5" />
              </div>
              <div className="flex-1">
                <SheetTitle>{mode === 'edit' ? 'Edit NAT Rule' : 'Create NAT Rule'}</SheetTitle>
                <SheetDescription>{rule.chain || 'NAT'} chain configuration</SheetDescription>
              </div>
              {rule.action && (
                <Badge
                  variant="secondary"
                  className="text-xs"
                >
                  {rule.action.toUpperCase()}
                </Badge>
              )}
            </div>
          </SheetHeader>

          {/* Form Content - Scrollable */}
          <div className="flex-1 space-y-4 overflow-y-auto px-4 py-4">
            {/* Chain and Action Section */}
            <Card className="p-component-md border-t-category-firewall border-t-2">
              <div className="mb-4 flex items-center gap-2">
                <Network className="text-category-firewall h-4 w-4" />
                <h3 className="text-foreground text-sm font-semibold uppercase tracking-wider">
                  NAT Configuration
                </h3>
              </div>

              <div className="space-y-4">
                {/* Chain Selector - 44px touch target */}
                <RHFFormField
                  name="chain"
                  label="NAT Chain"
                  control={typedControl}
                  error={errors.chain}
                  required
                >
                  <Controller
                    name="chain"
                    control={control}
                    render={({ field }) => (
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                      >
                        <SelectTrigger className="h-11">
                          <SelectValue placeholder="Select chain" />
                        </SelectTrigger>
                        <SelectContent>
                          {NatChainSchema.options.map((chain: string) => (
                            <SelectItem
                              key={chain}
                              value={chain}
                              className="min-h-[44px]"
                            >
                              <div className="flex flex-col items-start py-1">
                                <span className="font-medium">{chain}</span>
                                <span className="text-muted-foreground text-xs">
                                  {chain === 'srcnat' ? 'Outgoing' : 'Incoming'}
                                </span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                </RHFFormField>

                {/* Action Selector - 44px touch target */}
                <RHFFormField
                  name="action"
                  label="NAT Action"
                  control={typedControl}
                  error={errors.action}
                  required
                >
                  <Controller
                    name="action"
                    control={control}
                    render={({ field }) => (
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                      >
                        <SelectTrigger className="h-11">
                          <SelectValue placeholder="Select action" />
                        </SelectTrigger>
                        <SelectContent>
                          {NatActionSchema.options.map((action: string) => (
                            <SelectItem
                              key={action}
                              value={action}
                              className="min-h-[44px]"
                            >
                              {action}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                </RHFFormField>
              </div>
            </Card>

            {/* Matchers Section - Collapsible */}
            <Card className="p-component-md">
              <button
                type="button"
                onClick={() => toggleSection('matchers')}
                className="mb-4 flex min-h-[44px] w-full items-center justify-between"
              >
                <div className="flex items-center gap-2">
                  <Settings className="text-muted-foreground h-4 w-4" />
                  <h3 className="text-foreground text-sm font-semibold uppercase tracking-wider">
                    Traffic Matchers
                  </h3>
                </div>
                <ChevronDown
                  className={`h-4 w-4 transition-transform ${
                    expandedSections.matchers ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {expandedSections.matchers && (
                <div className="space-y-4">
                  {/* Protocol */}
                  {isFieldVisible('protocol') && (
                    <RHFFormField
                      name="protocol"
                      label="Protocol"
                      control={typedControl}
                      error={errors.protocol}
                    >
                      <Controller
                        name="protocol"
                        control={control}
                        render={({ field }) => (
                          <Select
                            value={field.value}
                            onValueChange={field.onChange}
                          >
                            <SelectTrigger className="h-11">
                              <SelectValue placeholder="Any" />
                            </SelectTrigger>
                            <SelectContent>
                              {ProtocolSchema.options.map((protocol: string) => (
                                <SelectItem
                                  key={protocol}
                                  value={protocol}
                                  className="min-h-[44px]"
                                >
                                  {protocol.toUpperCase()}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                      />
                    </RHFFormField>
                  )}

                  {/* Source Address */}
                  {isFieldVisible('srcAddress') && (
                    <RHFFormField
                      name="srcAddress"
                      label="Source Address"
                      control={typedControl}
                      error={errors.srcAddress}
                      hint="IP or CIDR"
                    >
                      <Controller
                        name="srcAddress"
                        control={control}
                        render={({ field }) => (
                          <Input
                            {...field}
                            placeholder="192.168.1.0/24"
                            className="h-11"
                            value={field.value || ''}
                          />
                        )}
                      />
                    </RHFFormField>
                  )}

                  {/* Destination Address */}
                  {isFieldVisible('dstAddress') && (
                    <RHFFormField
                      name="dstAddress"
                      label="Destination Address"
                      control={typedControl}
                      error={errors.dstAddress}
                      hint="IP or CIDR"
                    >
                      <Controller
                        name="dstAddress"
                        control={control}
                        render={({ field }) => (
                          <Input
                            {...field}
                            placeholder="0.0.0.0/0"
                            className="h-11"
                            value={field.value || ''}
                          />
                        )}
                      />
                    </RHFFormField>
                  )}

                  {/* Source Port */}
                  {isFieldVisible('srcPort') && (
                    <RHFFormField
                      name="srcPort"
                      label="Source Port"
                      control={typedControl}
                      error={errors.srcPort}
                      hint="Port or range"
                    >
                      <Controller
                        name="srcPort"
                        control={control}
                        render={({ field }) => (
                          <Input
                            {...field}
                            placeholder="Any"
                            className="h-11"
                            value={field.value || ''}
                          />
                        )}
                      />
                    </RHFFormField>
                  )}

                  {/* Destination Port */}
                  {isFieldVisible('dstPort') && (
                    <RHFFormField
                      name="dstPort"
                      label="Destination Port"
                      control={typedControl}
                      error={errors.dstPort}
                      hint="Port or range"
                    >
                      <Controller
                        name="dstPort"
                        control={control}
                        render={({ field }) => (
                          <Input
                            {...field}
                            placeholder="80"
                            className="h-11"
                            value={field.value || ''}
                          />
                        )}
                      />
                    </RHFFormField>
                  )}
                </div>
              )}
            </Card>

            {/* Interfaces Section - Collapsible */}
            {(isFieldVisible('inInterface') ||
              isFieldVisible('outInterface') ||
              isFieldVisible('inInterfaceList') ||
              isFieldVisible('outInterfaceList')) && (
              <Card className="p-component-md">
                <button
                  type="button"
                  onClick={() => toggleSection('interfaces')}
                  className="mb-4 flex min-h-[44px] w-full items-center justify-between"
                >
                  <div className="flex items-center gap-2">
                    <Globe className="text-muted-foreground h-4 w-4" />
                    <h3 className="text-foreground text-sm font-semibold uppercase tracking-wider">
                      Interfaces
                    </h3>
                  </div>
                  <ChevronDown
                    className={`h-4 w-4 transition-transform ${
                      expandedSections.interfaces ? 'rotate-180' : ''
                    }`}
                  />
                </button>

                {expandedSections.interfaces && (
                  <div className="space-y-4">
                    {/* Input Interface */}
                    {isFieldVisible('inInterface') && (
                      <RHFFormField
                        name="inInterface"
                        label="Input Interface"
                        control={typedControl}
                        error={errors.inInterface}
                      >
                        <Controller
                          name="inInterface"
                          control={control}
                          render={({ field }) => (
                            <Select
                              value={field.value}
                              onValueChange={field.onChange}
                            >
                              <SelectTrigger className="h-11">
                                <SelectValue placeholder="Any" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem
                                  value=""
                                  className="min-h-[44px]"
                                >
                                  Any
                                </SelectItem>
                                {interfaces.map((iface) => (
                                  <SelectItem
                                    key={iface}
                                    value={iface}
                                    className="min-h-[44px]"
                                  >
                                    {iface}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          )}
                        />
                      </RHFFormField>
                    )}

                    {/* Output Interface */}
                    {isFieldVisible('outInterface') && (
                      <RHFFormField
                        name="outInterface"
                        label="Output Interface"
                        control={typedControl}
                        error={errors.outInterface}
                      >
                        <Controller
                          name="outInterface"
                          control={control}
                          render={({ field }) => (
                            <Select
                              value={field.value}
                              onValueChange={field.onChange}
                            >
                              <SelectTrigger className="h-11">
                                <SelectValue placeholder="Any" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem
                                  value=""
                                  className="min-h-[44px]"
                                >
                                  Any
                                </SelectItem>
                                {interfaces.map((iface) => (
                                  <SelectItem
                                    key={iface}
                                    value={iface}
                                    className="min-h-[44px]"
                                  >
                                    {iface}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          )}
                        />
                      </RHFFormField>
                    )}

                    {/* Interface Lists */}
                    {isFieldVisible('inInterfaceList') && (
                      <RHFFormField
                        name="inInterfaceList"
                        label="Input Interface List"
                        control={typedControl}
                        error={errors.inInterfaceList}
                      >
                        <Controller
                          name="inInterfaceList"
                          control={control}
                          render={({ field }) => (
                            <Select
                              value={field.value}
                              onValueChange={field.onChange}
                            >
                              <SelectTrigger className="h-11">
                                <SelectValue placeholder="None" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem
                                  value=""
                                  className="min-h-[44px]"
                                >
                                  None
                                </SelectItem>
                                {interfaceLists.map((list) => (
                                  <SelectItem
                                    key={list}
                                    value={list}
                                    className="min-h-[44px]"
                                  >
                                    {list}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          )}
                        />
                      </RHFFormField>
                    )}

                    {isFieldVisible('outInterfaceList') && (
                      <RHFFormField
                        name="outInterfaceList"
                        label="Output Interface List"
                        control={typedControl}
                        error={errors.outInterfaceList}
                      >
                        <Controller
                          name="outInterfaceList"
                          control={control}
                          render={({ field }) => (
                            <Select
                              value={field.value}
                              onValueChange={field.onChange}
                            >
                              <SelectTrigger className="h-11">
                                <SelectValue placeholder="None" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem
                                  value=""
                                  className="min-h-[44px]"
                                >
                                  None
                                </SelectItem>
                                {interfaceLists.map((list) => (
                                  <SelectItem
                                    key={list}
                                    value={list}
                                    className="min-h-[44px]"
                                  >
                                    {list}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          )}
                        />
                      </RHFFormField>
                    )}
                  </div>
                )}
              </Card>
            )}

            {/* Translation Section - Collapsible */}
            {(isFieldVisible('toAddresses') || isFieldVisible('toPorts')) && (
              <Card className="p-component-md">
                <button
                  type="button"
                  onClick={() => toggleSection('translation')}
                  className="mb-4 flex min-h-[44px] w-full items-center justify-between"
                >
                  <div className="flex items-center gap-2">
                    <ArrowRight className="text-primary h-4 w-4" />
                    <h3 className="text-foreground text-sm font-semibold uppercase tracking-wider">
                      Translation
                    </h3>
                  </div>
                  <ChevronDown
                    className={`h-4 w-4 transition-transform ${
                      expandedSections.translation ? 'rotate-180' : ''
                    }`}
                  />
                </button>

                {expandedSections.translation && (
                  <div className="space-y-4">
                    {/* To Addresses */}
                    {isFieldVisible('toAddresses') && (
                      <RHFFormField
                        name="toAddresses"
                        label="Target Address"
                        control={typedControl}
                        error={errors.toAddresses}
                        required={rule.action === 'dst-nat' || rule.action === 'src-nat'}
                      >
                        <Controller
                          name="toAddresses"
                          control={control}
                          render={({ field }) => (
                            <Input
                              {...field}
                              placeholder="192.168.1.100"
                              className="h-11"
                              value={field.value || ''}
                            />
                          )}
                        />
                      </RHFFormField>
                    )}

                    {/* To Ports */}
                    {isFieldVisible('toPorts') && (
                      <RHFFormField
                        name="toPorts"
                        label="Target Port(s)"
                        control={typedControl}
                        error={errors.toPorts}
                      >
                        <Controller
                          name="toPorts"
                          control={control}
                          render={({ field }) => (
                            <Input
                              {...field}
                              placeholder="8080"
                              className="h-11"
                              value={field.value || ''}
                            />
                          )}
                        />
                      </RHFFormField>
                    )}
                  </div>
                )}
              </Card>
            )}

            {/* Options Section - Collapsible */}
            <Card className="p-component-md">
              <button
                type="button"
                onClick={() => toggleSection('options')}
                className="mb-4 flex min-h-[44px] w-full items-center justify-between"
              >
                <div className="flex items-center gap-2">
                  <Info className="text-muted-foreground h-4 w-4" />
                  <h3 className="text-foreground text-sm font-semibold uppercase tracking-wider">
                    Options
                  </h3>
                </div>
                <ChevronDown
                  className={`h-4 w-4 transition-transform ${
                    expandedSections.options ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {expandedSections.options && (
                <div className="space-y-4">
                  {/* Comment */}
                  <RHFFormField
                    name="comment"
                    label="Comment"
                    control={typedControl}
                    error={errors.comment}
                  >
                    <Controller
                      name="comment"
                      control={control}
                      render={({ field }) => (
                        <Input
                          {...field}
                          placeholder="Optional description"
                          className="h-11"
                          value={field.value || ''}
                        />
                      )}
                    />
                  </RHFFormField>

                  {/* Disabled Toggle - 44px touch target */}
                  <div className="flex min-h-[44px] items-center justify-between">
                    <div className="space-y-0.5">
                      <Label
                        htmlFor="disabled"
                        className="text-sm"
                      >
                        Disabled
                      </Label>
                      <p className="text-muted-foreground text-xs">Create in disabled state</p>
                    </div>
                    <Controller
                      name="disabled"
                      control={control}
                      render={({ field }) => (
                        <Switch
                          id="disabled"
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      )}
                    />
                  </div>

                  {/* Log Toggle - 44px touch target */}
                  {isFieldVisible('log') && (
                    <div className="flex min-h-[44px] items-center justify-between">
                      <div className="space-y-0.5">
                        <Label
                          htmlFor="log"
                          className="text-sm"
                        >
                          Log Packets
                        </Label>
                        <p className="text-muted-foreground text-xs">Log matching packets</p>
                      </div>
                      <Controller
                        name="log"
                        control={control}
                        render={({ field }) => (
                          <Switch
                            id="log"
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        )}
                      />
                    </div>
                  )}

                  {/* Log Prefix */}
                  {isFieldVisible('logPrefix') && rule.log && (
                    <RHFFormField
                      name="logPrefix"
                      label="Log Prefix"
                      control={typedControl}
                      error={errors.logPrefix}
                    >
                      <Controller
                        name="logPrefix"
                        control={control}
                        render={({ field }) => (
                          <Input
                            {...field}
                            placeholder="NAT:"
                            className="h-11"
                            value={field.value || ''}
                          />
                        )}
                      />
                    </RHFFormField>
                  )}
                </div>
              )}
            </Card>

            {/* Preview Section - Collapsible */}
            <Card className="p-component-md bg-muted/50">
              <button
                type="button"
                onClick={() => toggleSection('preview')}
                className="mb-4 flex min-h-[44px] w-full items-center justify-between"
              >
                <div className="flex items-center gap-2">
                  <Info className="text-muted-foreground h-4 w-4" />
                  <h3 className="text-foreground text-sm font-semibold uppercase tracking-wider">
                    Preview
                  </h3>
                </div>
                <ChevronDown
                  className={`h-4 w-4 transition-transform ${
                    expandedSections.preview ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {expandedSections.preview && (
                <div className="space-y-3">
                  <div>
                    <p className="text-muted-foreground mb-1 text-xs">Description:</p>
                    <p className="text-sm font-medium">{description}</p>
                  </div>
                  <Separator />
                  <div>
                    <p className="text-muted-foreground mb-1 text-xs">CLI:</p>
                    <code className="bg-background block overflow-x-auto rounded border p-2 text-xs">
                      {preview}
                    </code>
                  </div>
                </div>
              )}
            </Card>

            {/* Bottom spacing for footer */}
            <div className="h-24" />
          </div>

          {/* Footer - Sticky */}
          <SheetFooter className="bg-background sticky bottom-0 border-t px-4 py-3">
            <div className="flex w-full flex-col gap-2">
              {mode === 'edit' && onDelete && (
                <Button
                  type="button"
                  variant="destructive"
                  size="lg"
                  onClick={handleDelete}
                  disabled={isDeleting || isSaving}
                  className="min-h-[44px] w-full"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete Rule
                </Button>
              )}

              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="lg"
                  onClick={onClose}
                  disabled={isSaving || isDeleting}
                  className="min-h-[44px] flex-1"
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  size="lg"
                  onClick={builder.onSubmit}
                  disabled={!formState.isValid || isSaving || isDeleting}
                  className="min-h-[44px] flex-1"
                >
                  {isSaving ?
                    'Saving...'
                  : mode === 'edit' ?
                    'Save'
                  : 'Create'}
                </Button>
              </div>
            </div>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      {/* Delete Confirmation Dialog */}
      <ConfirmationDialog
        open={showDeleteConfirm}
        onOpenChange={setShowDeleteConfirm}
        title="Delete NAT Rule"
        description="Are you sure you want to delete this NAT rule? This action cannot be undone."
        confirmLabel="Delete Rule"
        cancelLabel="Cancel"
        variant="destructive"
        onConfirm={confirmDelete}
        isLoading={isDeleting}
      />
    </>
  );
});

NATRuleBuilderMobile.displayName = 'NATRuleBuilderMobile';
