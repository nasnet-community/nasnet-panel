/**
 * NATRuleBuilderDesktop - Desktop Platform Presenter
 *
 * Dialog-based form with inline layout and live preview panel.
 * Optimized for keyboard navigation and dense data entry.
 *
 * @module @nasnet/ui/patterns/security/nat-rule-builder
 */

import { memo, useMemo, useState } from 'react';

import {
  Network,
  Shield,
  Settings,
  AlertCircle,
  Info,
  Trash2,
  Copy,
  ArrowRight,
  Globe,
} from 'lucide-react';
import { Controller } from 'react-hook-form';

import {
  NatChainSchema,
  NatActionSchema,
  ProtocolSchema,
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
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
  Switch,
  Badge,
  Separator,
  Label} from '@nasnet/ui/primitives';

import { useNATRuleBuilder } from './use-nat-rule-builder';
import { ConfirmationDialog } from '../../confirmation-dialog';
import { RHFFormField } from '../../rhf-form-field';



import type { NATRuleBuilderProps } from './nat-rule-builder.types';

/**
 * Desktop presenter for NAT rule builder.
 *
 * Features:
 * - Dialog with inline form layout
 * - Live CLI preview panel
 * - Action-specific field groups
 * - Interface and address list selectors
 * - Dangerous action confirmation
 */
export const NATRuleBuilderDesktop = memo(function NATRuleBuilderDesktop({
  routerId,
  initialRule,
  open,
  onClose,
  onSave,
  onDelete,
  isSaving = false,
  isDeleting = false,
  mode = initialRule?.id ? 'edit' : 'create',
  showChainDiagram = true,
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

  // Confirmation dialog state
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Get action-specific badge color
  const actionBadgeVariant = useMemo(() => {
    const action = rule.action;
    if (!action) return 'default';

    if (action === 'masquerade') return 'success';
    if (action === 'dst-nat' || action === 'src-nat') return 'info';
    if (action === 'drop') return 'error';
    if (action === 'redirect') return 'warning';

    return 'default';
  }, [rule.action]);

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
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10">
                  <Shield className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <DialogTitle>
                    {mode === 'edit' ? 'Edit NAT Rule' : 'Create NAT Rule'}
                  </DialogTitle>
                  <DialogDescription>
                    Configure network address translation for {rule.chain || 'NAT'} chain
                  </DialogDescription>
                </div>
              </div>
              {rule.action && (
                <Badge variant={actionBadgeVariant}>
                  {rule.action.toUpperCase()}
                </Badge>
              )}
            </div>
          </DialogHeader>

          {/* Form Content */}
          <div className="flex-1 overflow-y-auto space-y-6 py-4">
            {/* Chain and Action Section */}
            <Card className="p-4">
              <div className="flex items-center gap-2 mb-4">
                <Network className="w-4 h-4 text-muted-foreground" />
                <h3 className="font-medium">Chain & Action</h3>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Chain Selector */}
                <RHFFormField
                  name="chain"
                  label="NAT Chain"
                  control={control}
                  error={errors.chain}
                  required
                >
                  <Controller
                    name="chain"
                    control={control}
                    render={({ field }) => (
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select chain" />
                        </SelectTrigger>
                        <SelectContent>
                          {NatChainSchema.options.map((chain: string) => (
                            <SelectItem key={chain} value={chain}>
                              <div className="flex flex-col items-start">
                                <span className="font-medium">{chain}</span>
                                <span className="text-xs text-muted-foreground">
                                  {chain === 'srcnat'
                                    ? 'Outgoing traffic (masquerade)'
                                    : 'Incoming traffic (port forwarding)'}
                                </span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                </RHFFormField>

                {/* Action Selector */}
                <RHFFormField
                  name="action"
                  label="NAT Action"
                  control={control}
                  error={errors.action}
                  required
                >
                  <Controller
                    name="action"
                    control={control}
                    render={({ field }) => (
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select action" />
                        </SelectTrigger>
                        <SelectContent>
                          {NatActionSchema.options.map((action: string) => (
                            <SelectItem key={action} value={action}>
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

            {/* Matchers Section */}
            <Card className="p-4">
              <div className="flex items-center gap-2 mb-4">
                <Settings className="w-4 h-4 text-muted-foreground" />
                <h3 className="font-medium">Traffic Matchers</h3>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Protocol */}
                {isFieldVisible('protocol') && (
                  <RHFFormField
                    name="protocol"
                    label="Protocol"
                    control={control}
                    error={errors.protocol}
                  >
                    <Controller
                      name="protocol"
                      control={control}
                      render={({ field }) => (
                        <Select value={field.value} onValueChange={field.onChange}>
                          <SelectTrigger>
                            <SelectValue placeholder="Any protocol" />
                          </SelectTrigger>
                          <SelectContent>
                            {ProtocolSchema.options.map((protocol: string) => (
                              <SelectItem key={protocol} value={protocol}>
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
                    control={control}
                    error={errors.srcAddress}
                    hint="IP address or CIDR (e.g., 192.168.1.0/24)"
                  >
                    <Controller
                      name="srcAddress"
                      control={control}
                      render={({ field }) => (
                        <Input
                          {...field}
                          placeholder="192.168.1.0/24"
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
                    control={control}
                    error={errors.dstAddress}
                    hint="IP address or CIDR"
                  >
                    <Controller
                      name="dstAddress"
                      control={control}
                      render={({ field }) => (
                        <Input
                          {...field}
                          placeholder="0.0.0.0/0"
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
                    control={control}
                    error={errors.srcPort}
                    hint="Single port or range (e.g., 8000-9000)"
                  >
                    <Controller
                      name="srcPort"
                      control={control}
                      render={({ field }) => (
                        <Input
                          {...field}
                          placeholder="Any"
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
                    control={control}
                    error={errors.dstPort}
                    hint="Single port or range"
                  >
                    <Controller
                      name="dstPort"
                      control={control}
                      render={({ field }) => (
                        <Input
                          {...field}
                          placeholder="80"
                          value={field.value || ''}
                        />
                      )}
                    />
                  </RHFFormField>
                )}
              </div>
            </Card>

            {/* Interfaces Section */}
            {(isFieldVisible('inInterface') ||
              isFieldVisible('outInterface') ||
              isFieldVisible('inInterfaceList') ||
              isFieldVisible('outInterfaceList')) && (
              <Card className="p-4">
                <div className="flex items-center gap-2 mb-4">
                  <Globe className="w-4 h-4 text-muted-foreground" />
                  <h3 className="font-medium">Interfaces</h3>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {/* Input Interface */}
                  {isFieldVisible('inInterface') && (
                    <RHFFormField
                      name="inInterface"
                      label="Input Interface"
                      control={control}
                      error={errors.inInterface}
                    >
                      <Controller
                        name="inInterface"
                        control={control}
                        render={({ field }) => (
                          <Select value={field.value} onValueChange={field.onChange}>
                            <SelectTrigger>
                              <SelectValue placeholder="Any" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="">Any</SelectItem>
                              {interfaces.map((iface) => (
                                <SelectItem key={iface} value={iface}>
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
                      control={control}
                      error={errors.outInterface}
                    >
                      <Controller
                        name="outInterface"
                        control={control}
                        render={({ field }) => (
                          <Select value={field.value} onValueChange={field.onChange}>
                            <SelectTrigger>
                              <SelectValue placeholder="Any" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="">Any</SelectItem>
                              {interfaces.map((iface) => (
                                <SelectItem key={iface} value={iface}>
                                  {iface}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                      />
                    </RHFFormField>
                  )}

                  {/* Input Interface List */}
                  {isFieldVisible('inInterfaceList') && (
                    <RHFFormField
                      name="inInterfaceList"
                      label="Input Interface List"
                      control={control}
                      error={errors.inInterfaceList}
                    >
                      <Controller
                        name="inInterfaceList"
                        control={control}
                        render={({ field }) => (
                          <Select value={field.value} onValueChange={field.onChange}>
                            <SelectTrigger>
                              <SelectValue placeholder="None" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="">None</SelectItem>
                              {interfaceLists.map((list) => (
                                <SelectItem key={list} value={list}>
                                  {list}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                      />
                    </RHFFormField>
                  )}

                  {/* Output Interface List */}
                  {isFieldVisible('outInterfaceList') && (
                    <RHFFormField
                      name="outInterfaceList"
                      label="Output Interface List"
                      control={control}
                      error={errors.outInterfaceList}
                    >
                      <Controller
                        name="outInterfaceList"
                        control={control}
                        render={({ field }) => (
                          <Select value={field.value} onValueChange={field.onChange}>
                            <SelectTrigger>
                              <SelectValue placeholder="None" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="">None</SelectItem>
                              {interfaceLists.map((list) => (
                                <SelectItem key={list} value={list}>
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
              </Card>
            )}

            {/* Translation Section */}
            {(isFieldVisible('toAddresses') || isFieldVisible('toPorts')) && (
              <Card className="p-4">
                <div className="flex items-center gap-2 mb-4">
                  <ArrowRight className="w-4 h-4 text-muted-foreground" />
                  <h3 className="font-medium">Translation</h3>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {/* To Addresses */}
                  {isFieldVisible('toAddresses') && (
                    <RHFFormField
                      name="toAddresses"
                      label="Target Address"
                      control={control}
                      error={errors.toAddresses}
                      required={rule.action === 'dst-nat' || rule.action === 'src-nat'}
                      hint="IP address to translate to"
                    >
                      <Controller
                        name="toAddresses"
                        control={control}
                        render={({ field }) => (
                          <Input
                            {...field}
                            placeholder="192.168.1.100"
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
                      control={control}
                      error={errors.toPorts}
                      hint="Port or comma-separated ports"
                    >
                      <Controller
                        name="toPorts"
                        control={control}
                        render={({ field }) => (
                          <Input
                            {...field}
                            placeholder="8080"
                            value={field.value || ''}
                          />
                        )}
                      />
                    </RHFFormField>
                  )}
                </div>
              </Card>
            )}

            {/* Meta Section */}
            <Card className="p-4">
              <div className="flex items-center gap-2 mb-4">
                <Info className="w-4 h-4 text-muted-foreground" />
                <h3 className="font-medium">Options</h3>
              </div>

              <div className="space-y-4">
                {/* Comment */}
                <RHFFormField
                  name="comment"
                  label="Comment"
                  control={control}
                  error={errors.comment}
                  hint="Optional description (max 255 characters)"
                >
                  <Controller
                    name="comment"
                    control={control}
                    render={({ field }) => (
                      <Input
                        {...field}
                        placeholder="e.g., Allow web traffic"
                        value={field.value || ''}
                      />
                    )}
                  />
                </RHFFormField>

                {/* Disabled Toggle */}
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="disabled">Disabled</Label>
                    <p className="text-sm text-muted-foreground">
                      Create rule in disabled state
                    </p>
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

                {/* Log Toggle */}
                {isFieldVisible('log') && (
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="log">Log Packets</Label>
                      <p className="text-sm text-muted-foreground">
                        Log matching packets to router log
                      </p>
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
                    control={control}
                    error={errors.logPrefix}
                    hint="Prefix for log entries (max 50 characters)"
                  >
                    <Controller
                      name="logPrefix"
                      control={control}
                      render={({ field }) => (
                        <Input
                          {...field}
                          placeholder="NAT:"
                          value={field.value || ''}
                        />
                      )}
                    />
                  </RHFFormField>
                )}
              </div>
            </Card>

            {/* Preview Section */}
            <Card className="p-4 bg-muted/50">
              <div className="flex items-center gap-2 mb-3">
                <Info className="w-4 h-4 text-muted-foreground" />
                <h3 className="font-medium">Preview</h3>
              </div>

              <div className="space-y-2">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Description:</p>
                  <p className="text-sm font-medium">{description}</p>
                </div>
                <Separator />
                <div>
                  <p className="text-sm text-muted-foreground mb-1">CLI Command:</p>
                  <code className="block text-xs bg-background p-2 rounded border overflow-x-auto">
                    {preview}
                  </code>
                </div>
              </div>
            </Card>
          </div>

          {/* Footer */}
          <DialogFooter className="flex items-center justify-between border-t pt-4">
            <div className="flex gap-2">
              {mode === 'edit' && onDelete && (
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  onClick={handleDelete}
                  disabled={isDeleting || isSaving}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
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
                type="button"
                onClick={builder.onSubmit}
                disabled={!formState.isValid || isSaving || isDeleting}
              >
                {isSaving ? 'Saving...' : mode === 'edit' ? 'Save Changes' : 'Create Rule'}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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

NATRuleBuilderDesktop.displayName = 'NATRuleBuilderDesktop';
