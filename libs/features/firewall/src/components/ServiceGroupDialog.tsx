/**
 * ServiceGroupDialog Component
 *
 * Form dialog for creating and editing service groups.
 * Allows users to select multiple services and group them together
 * for quick selection in firewall rules.
 *
 * Features:
 * - Multi-select service picker (searchable)
 * - Protocol filtering (TCP/UDP/Both)
 * - Real-time preview of selected ports
 * - Conflict detection for group names
 * - Edit mode with pre-selected services
 *
 * @see NAS-7.8 Service Ports Management
 * @module @nasnet/features/firewall/components
 */

import { useEffect, useMemo, useState, useCallback, memo } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import { Search, X, Info } from 'lucide-react';

import {
  ServiceGroupInputSchema,
  type ServiceGroupInput,
  type ServiceGroup,
  type ServicePortDefinition,
  type ServicePortProtocol,
  formatPortList,
} from '@nasnet/core/types';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  Button,
  Label,
  Input,
  Textarea,
  RadioGroup,
  RadioGroupItem,
  Badge,
  ScrollArea,
  Alert,
  AlertDescription,
  Checkbox,
  Popover,
  PopoverTrigger,
  PopoverContent,
  cn,
} from '@nasnet/ui/primitives';

import { useCustomServices } from '../hooks';

// ============================================================================
// Props Interface
// ============================================================================

export interface ServiceGroupDialogProps {
  /** Dialog open state */
  open: boolean;
  /** Callback to change dialog open state */
  onOpenChange: (open: boolean) => void;
  /** Service group to edit (undefined for create mode) */
  editGroup?: ServiceGroup;
}

// ============================================================================
// Main Component
// ============================================================================

/**
 * ServiceGroupDialog - Dialog for creating/editing service groups
 *
 * Allows users to create or edit service groups by selecting multiple services
 * and grouping them for quick selection in firewall rules.
 *
 * @param props - Component props
 * @returns Dialog component for service group management
 */
export const ServiceGroupDialog = memo(function ServiceGroupDialog({
  open,
  onOpenChange,
  editGroup,
}: ServiceGroupDialogProps) {
  const { t } = useTranslation('firewall');
  const { services, serviceGroups, createGroup, updateGroup } = useCustomServices();

  // Form state
  const form = useForm<ServiceGroupInput>({
    resolver: zodResolver(ServiceGroupInputSchema),
    defaultValues: editGroup || {
      name: '',
      description: '',
      ports: [],
      protocol: 'tcp',
    },
  });

  // Reset form when editGroup changes
  useEffect(() => {
    if (open) {
      form.reset(
        editGroup || {
          name: '',
          description: '',
          ports: [],
          protocol: 'tcp',
        }
      );
      setSearchQuery('');
    }
  }, [open, editGroup, form]);

  // Local state for service picker
  const [searchQuery, setSearchQuery] = useState('');
  const [isPickerOpen, setIsPickerOpen] = useState(false);

  // Watch form values
  const selectedPorts = form.watch('ports');
  const selectedProtocol = form.watch('protocol');

  // Filter services by protocol
  const filteredByProtocol = useMemo(() => {
    return services.filter((service) => {
      if (selectedProtocol === 'both') {
        return true; // Both includes all services
      }
      // Show services that match protocol or support 'both'
      return service.protocol === selectedProtocol || service.protocol === 'both';
    });
  }, [services, selectedProtocol]);

  // Filter services by search query
  const filteredServices = useMemo(() => {
    if (!searchQuery) return filteredByProtocol;

    const query = searchQuery.toLowerCase().trim();
    return filteredByProtocol.filter(
      (service) =>
        service.service.toLowerCase().includes(query) ||
        service.port.toString().includes(query) ||
        service.description?.toLowerCase().includes(query)
    );
  }, [filteredByProtocol, searchQuery]);

  // Get selected services (for chips display)
  const selectedServices = useMemo(() => {
    return services.filter((service) => selectedPorts.includes(service.port));
  }, [services, selectedPorts]);

  // Preview port list
  const previewPortList = useMemo(() => {
    if (selectedPorts.length === 0) return '';
    return formatPortList(selectedPorts);
  }, [selectedPorts]);

  // Handle service selection toggle
  const handleToggleService = useCallback(
    (port: number) => {
      const currentPorts = form.getValues('ports');
      const newPorts =
        currentPorts.includes(port) ?
          currentPorts.filter((p) => p !== port)
        : [...currentPorts, port];

      form.setValue('ports', newPorts, { shouldValidate: true });
    },
    [form]
  );

  // Handle form submission
  const handleSubmit = useCallback(
    async (data: ServiceGroupInput) => {
      try {
        if (editGroup) {
          await updateGroup(editGroup.id, data);
        } else {
          await createGroup(data);
        }

        // Close dialog and reset form
        onOpenChange(false);
        form.reset();
        setSearchQuery('');
      } catch (error) {
        // Set error on name field (most likely conflict)
        form.setError('name', {
          type: 'manual',
          message:
            error instanceof Error ? error.message : t('servicePorts.validation.groupNameExists'),
        });
      }
    },
    [editGroup, updateGroup, createGroup, onOpenChange, form, t]
  );

  // Form errors
  const nameError = form.formState.errors.name?.message;
  const portsError = form.formState.errors.ports?.message;
  const isSubmitting = form.formState.isSubmitting;

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
    >
      <DialogContent className="flex max-h-[90vh] max-w-2xl flex-col">
        <DialogHeader>
          <DialogTitle>
            {editGroup ? t('servicePorts.editGroup') : t('servicePorts.createGroup')}
          </DialogTitle>
          <DialogDescription>
            {editGroup ?
              t('servicePorts.editGroupDescription', {
                defaultValue: 'Modify the service group configuration',
              })
            : t('servicePorts.createGroupDescription', {
                defaultValue:
                  'Group multiple services together for quick selection in firewall rules',
              })
            }
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={form.handleSubmit(handleSubmit)}
          className="flex flex-1 flex-col overflow-hidden"
        >
          <ScrollArea className="pr-component-md flex-1">
            <div className="space-y-component-lg py-component-xs">
              {/* Group Name */}
              <div className="space-y-component-sm">
                <Label htmlFor="group-name">
                  {t('servicePorts.fields.groupName')}
                  <span className="text-error ml-0.5">*</span>
                </Label>
                <Input
                  id="group-name"
                  placeholder={t('servicePorts.placeholders.groupName')}
                  {...form.register('name')}
                  aria-invalid={!!nameError}
                  aria-describedby={nameError ? 'group-name-error' : undefined}
                />
                {nameError && (
                  <p
                    id="group-name-error"
                    className="text-error text-sm"
                    role="alert"
                  >
                    {nameError}
                  </p>
                )}
              </div>

              {/* Protocol */}
              <div className="space-y-component-sm">
                <Label>{t('servicePorts.fields.protocol')}</Label>
                <Controller
                  control={form.control}
                  name="protocol"
                  render={({ field }) => (
                    <RadioGroup
                      value={field.value}
                      onValueChange={(value) => field.onChange(value as ServicePortProtocol)}
                      className="gap-component-md flex"
                    >
                      <div className="space-x-component-sm flex items-center">
                        <RadioGroupItem
                          value="tcp"
                          id="protocol-tcp"
                        />
                        <Label
                          htmlFor="protocol-tcp"
                          className="font-normal"
                        >
                          {t('servicePorts.protocols.tcp')}
                        </Label>
                      </div>
                      <div className="space-x-component-sm flex items-center">
                        <RadioGroupItem
                          value="udp"
                          id="protocol-udp"
                        />
                        <Label
                          htmlFor="protocol-udp"
                          className="font-normal"
                        >
                          {t('servicePorts.protocols.udp')}
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem
                          value="both"
                          id="protocol-both"
                        />
                        <Label
                          htmlFor="protocol-both"
                          className="font-normal"
                        >
                          {t('servicePorts.protocols.both')}
                        </Label>
                      </div>
                    </RadioGroup>
                  )}
                />
              </div>

              {/* Services Multi-Select */}
              <div className="space-y-component-sm">
                <Label htmlFor="services-picker">
                  {t('servicePorts.fields.services')}
                  <span className="text-error ml-0.5">*</span>
                </Label>
                <Popover
                  open={isPickerOpen}
                  onOpenChange={setIsPickerOpen}
                >
                  <PopoverTrigger asChild>
                    <Button
                      id="services-picker"
                      variant="outline"
                      role="combobox"
                      aria-expanded={isPickerOpen}
                      aria-haspopup="listbox"
                      aria-invalid={!!portsError}
                      className={cn(
                        'w-full justify-between font-normal',
                        selectedPorts.length === 0 && 'text-muted-foreground',
                        portsError && 'border-error'
                      )}
                    >
                      <span className="truncate">
                        {selectedPorts.length === 0 ?
                          t('servicePorts.placeholders.selectServices')
                        : `${selectedPorts.length} service${selectedPorts.length !== 1 ? 's' : ''} selected`
                        }
                      </span>
                      <Search
                        className="ml-2 h-4 w-4 shrink-0 opacity-50"
                        aria-hidden="true"
                      />
                    </Button>
                  </PopoverTrigger>

                  <PopoverContent
                    className="w-[--radix-popover-trigger-width] p-0"
                    align="start"
                  >
                    {/* Search Header */}
                    <div className="p-component-sm border-b">
                      <div className="relative">
                        <Search
                          className="text-muted-foreground absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2"
                          aria-hidden="true"
                        />
                        <Input
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          placeholder={t('servicePorts.placeholders.searchServices')}
                          className="h-9 pl-9"
                          aria-label={t('servicePorts.labels.searchServices', {
                            defaultValue: 'Search services',
                          })}
                        />
                        {searchQuery && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2 p-0"
                            onClick={() => setSearchQuery('')}
                            aria-label={t('servicePorts.labels.clearSearch', {
                              defaultValue: 'Clear search',
                            })}
                          >
                            <X
                              className="h-3.5 w-3.5"
                              aria-hidden="true"
                            />
                          </Button>
                        )}
                      </div>
                    </div>

                    {/* Service List */}
                    <ScrollArea className="max-h-[300px]">
                      <div
                        role="listbox"
                        aria-label="Service list"
                        className="p-component-sm"
                      >
                        {filteredServices.length === 0 && (
                          <div className="text-muted-foreground py-8 text-center text-sm">
                            {searchQuery ?
                              'No services match your search'
                            : 'No services available for this protocol'}
                          </div>
                        )}

                        {filteredServices.map((service) => {
                          const isSelected = selectedPorts.includes(service.port);

                          return (
                            <div
                              key={service.port}
                              className={cn(
                                'gap-component-sm p-component-sm hover:bg-accent flex cursor-pointer items-center rounded-md',
                                isSelected && 'bg-accent/50'
                              )}
                              onClick={() => handleToggleService(service.port)}
                              role="option"
                              aria-selected={isSelected}
                            >
                              <Checkbox
                                checked={isSelected}
                                onCheckedChange={() => handleToggleService(service.port)}
                                aria-label={t('servicePorts.labels.selectService', {
                                  defaultValue: 'Select {{service}}',
                                  service: service.service,
                                })}
                              />
                              <div className="min-w-0 flex-1">
                                <div className="gap-component-sm flex items-center">
                                  <span className="truncate text-sm font-medium">
                                    {service.service}
                                  </span>
                                  <Badge
                                    variant="outline"
                                    className="font-mono text-xs"
                                  >
                                    {service.port}
                                  </Badge>
                                  {service.isBuiltIn && (
                                    <Badge
                                      variant="secondary"
                                      className="text-xs"
                                    >
                                      Built-in
                                    </Badge>
                                  )}
                                </div>
                                {service.description && (
                                  <p className="text-muted-foreground mt-0.5 truncate text-xs">
                                    {service.description}
                                  </p>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </ScrollArea>

                    {/* Footer */}
                    {filteredServices.length > 0 && (
                      <div className="px-component-sm py-component-sm text-muted-foreground border-t text-xs">
                        {t('servicePorts.labels.servicesAvailable', {
                          defaultValue: '{{count}} service available',
                          count: filteredServices.length,
                        })}
                        {selectedPorts.length > 0 && (
                          <span>
                            {' '}
                            ·{' '}
                            {t('servicePorts.labels.servicesSelected', {
                              defaultValue: '{{count}} selected',
                              count: selectedPorts.length,
                            })}
                          </span>
                        )}
                      </div>
                    )}
                  </PopoverContent>
                </Popover>

                {portsError && (
                  <p
                    className="text-error text-sm"
                    role="alert"
                  >
                    {portsError}
                  </p>
                )}
              </div>

              {/* Selected Services Chips */}
              {selectedServices.length > 0 && (
                <div className="space-y-component-sm">
                  <Label className="text-muted-foreground text-sm">
                    Selected Services ({selectedServices.length})
                  </Label>
                  <div className="gap-component-sm flex flex-wrap">
                    {selectedServices.map((service) => (
                      <Badge
                        key={service.port}
                        variant="secondary"
                        className="gap-component-sm pl-component-sm pr-1"
                      >
                        <span className="font-mono text-xs">
                          {service.service} ({service.port})
                        </span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToggleService(service.port);
                          }}
                          className="p-component-xs hover:bg-muted rounded-full"
                          aria-label={t('servicePorts.labels.removeService', {
                            defaultValue: 'Remove {{service}}',
                            service: service.service,
                          })}
                        >
                          <X
                            className="h-3 w-3"
                            aria-hidden="true"
                          />
                        </button>
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Preview Section */}
              {selectedPorts.length > 0 && (
                <Alert>
                  <Info
                    className="h-4 w-4"
                    aria-hidden="true"
                  />
                  <AlertDescription className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">
                        {t('servicePorts.labels.preview', { defaultValue: 'Preview:' })}
                      </span>
                      <Badge variant="outline">
                        {selectedPorts.length} port
                        {selectedPorts.length !== 1 ? 's' : ''}
                      </Badge>
                    </div>
                    <div className="text-muted-foreground break-all font-mono text-sm">
                      {previewPortList}
                    </div>
                    <div className="text-muted-foreground text-xs">
                      {t('servicePorts.labels.protocol', {
                        defaultValue: 'Protocol:',
                      })}{' '}
                      {selectedProtocol.toUpperCase()}
                    </div>
                  </AlertDescription>
                </Alert>
              )}

              {/* Description (Optional) */}
              <div className="space-y-component-sm">
                <Label htmlFor="group-description">
                  {t('servicePorts.fields.description')}
                  <span className="text-muted-foreground ml-1 text-xs">(optional)</span>
                </Label>
                <Textarea
                  id="group-description"
                  placeholder={t('servicePorts.placeholders.description')}
                  {...form.register('description')}
                  rows={3}
                  className="resize-none"
                />
              </div>
            </div>
          </ScrollArea>

          <DialogFooter className="mt-component-lg">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                onOpenChange(false);
                form.reset();
                setSearchQuery('');
              }}
              disabled={isSubmitting}
            >
              {t('servicePorts.buttons.cancel', { defaultValue: 'Cancel' })}
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
            >
              {isSubmitting ?
                'Saving...'
              : editGroup ?
                t('servicePorts.buttons.save', { defaultValue: 'Save' })
              : t('servicePorts.buttons.create', { defaultValue: 'Create Group' })}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
});

ServiceGroupDialog.displayName = 'ServiceGroupDialog';
