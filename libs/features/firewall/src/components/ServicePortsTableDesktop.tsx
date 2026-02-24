/**
 * Service Ports Table Component (Desktop Presenter)
 *
 * @description Desktop-optimized service ports management with dense data table layout,
 * sortable columns, advanced filtering, and bulk actions. Built-in services are read-only;
 * custom services support edit and delete operations with professional UI.
 *
 * @example
 * ```tsx
 * <ServicePortsTableDesktop
 *   className="p-4"
 * />
 * ```
 */

import React, { useState, useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useCustomServices } from '../hooks/useCustomServices';
import type { ServicePortDefinition, ServicePortProtocol, ServicePortCategory } from '@nasnet/core/types';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Button,
  Badge,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Skeleton,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@nasnet/ui/primitives';
import { Pencil, Trash2, Search, ChevronUp, ChevronDown } from 'lucide-react';
import { cn } from '@nasnet/ui/utils';

// ============================================================================
// Protocol Badge Component
// ============================================================================

interface ProtocolBadgeProps {
  protocol: ServicePortProtocol;
}

const ProtocolBadge = React.memo(function ProtocolBadge({ protocol }: ProtocolBadgeProps) {
  const variantMap: Record<ServicePortProtocol, 'default' | 'info' | 'success'> = {
    tcp: 'info',
    udp: 'success',
    both: 'default',
  };

  const variant = variantMap[protocol];
  const { t } = useTranslation('firewall');

  return (
    <Badge variant={variant} className="text-xs uppercase">
      {t(`servicePorts.protocols.${protocol}`)}
    </Badge>
  );
});
ProtocolBadge.displayName = 'ProtocolBadge';

// ============================================================================
// Type Badge Component
// ============================================================================

interface TypeBadgeProps {
  isBuiltIn: boolean;
}

const TypeBadge = React.memo(function TypeBadge({ isBuiltIn }: TypeBadgeProps) {
  const { t } = useTranslation('firewall');

  return (
    <Badge variant={isBuiltIn ? 'default' : 'warning'} className="text-xs">
      {t(`servicePorts.types.${isBuiltIn ? 'builtIn' : 'custom'}`)}
    </Badge>
  );
});
TypeBadge.displayName = 'TypeBadge';

// ============================================================================
// Loading State Component
// ============================================================================

const LoadingState = React.memo(function LoadingState() {
  return (
    <div className="space-y-2">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="flex items-center space-x-4">
          <Skeleton className="h-12 flex-1" />
        </div>
      ))}
    </div>
  );
});
LoadingState.displayName = 'LoadingState';

// ============================================================================
// Empty State Component
// ============================================================================

interface EmptyStateProps {
  message: string;
  description?: string;
}

const EmptyState = React.memo(function EmptyState({ message, description }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <p className="text-lg font-medium text-muted-foreground">{message}</p>
      {description && <p className="mt-2 text-sm text-muted-foreground">{description}</p>}
    </div>
  );
});
EmptyState.displayName = 'EmptyState';

// ============================================================================
// Main Component
// ============================================================================

export interface ServicePortsTableDesktopProps {
  /** Optional CSS class name */
  className?: string;
}

type SortField = 'name' | 'port';
type SortDirection = 'asc' | 'desc';

export const ServicePortsTableDesktop = React.memo(function ServicePortsTableDesktop({
  className,
}: ServicePortsTableDesktopProps) {
  const { t } = useTranslation('firewall');
  const { services, deleteService } = useCustomServices();

  // Local state
  const [searchQuery, setSearchQuery] = useState('');
  const [protocolFilter, setProtocolFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [serviceToDelete, setServiceToDelete] = useState<ServicePortDefinition | null>(null);
  const [isLoading] = useState(false);

  // Filter and sort services
  const filteredAndSortedServices = useMemo(() => {
    let result = [...services];

    // Search filter (by name or port)
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (service) =>
          service.service.toLowerCase().includes(query) ||
          service.port.toString().includes(query) ||
          service.description?.toLowerCase().includes(query)
      );
    }

    // Protocol filter
    if (protocolFilter !== 'all') {
      result = result.filter((service) => service.protocol === protocolFilter);
    }

    // Category filter
    if (categoryFilter !== 'all') {
      result = result.filter((service) => service.category === categoryFilter);
    }

    // Sort
    result.sort((a, b) => {
      let comparison = 0;

      if (sortField === 'name') {
        comparison = a.service.localeCompare(b.service);
      } else if (sortField === 'port') {
        comparison = a.port - b.port;
      }

      return sortDirection === 'asc' ? comparison : -comparison;
    });

    return result;
  }, [services, searchQuery, protocolFilter, categoryFilter, sortField, sortDirection]);

  // Handlers
  const handleSort = useCallback((field: SortField) => {
    setSortField((prevField) => {
      if (prevField === field) {
        setSortDirection((prevDir) => (prevDir === 'asc' ? 'desc' : 'asc'));
      } else {
        setSortField(field);
        setSortDirection('asc');
      }
      return prevField === field ? prevField : field;
    });
  }, []);

  const handleDeleteClick = useCallback((service: ServicePortDefinition) => {
    setServiceToDelete(service);
    setDeleteDialogOpen(true);
  }, []);

  const handleDeleteConfirm = useCallback(() => {
    if (serviceToDelete) {
      try {
        deleteService(serviceToDelete.port);
        setDeleteDialogOpen(false);
        setServiceToDelete(null);
      } catch (error) {
        console.error('Failed to delete service:', error);
      }
    }
  }, [serviceToDelete, deleteService]);

  const handleEditClick = useCallback((service: ServicePortDefinition) => {
    // TODO: Open edit dialog (Task 6)
    console.log('Edit service:', service);
  }, []);

  // Categories for filter dropdown (constant)
  const CATEGORIES: ServicePortCategory[] = useMemo(
    () => [
      'web',
      'secure',
      'database',
      'messaging',
      'mail',
      'network',
      'system',
      'containers',
      'mikrotik',
      'custom',
    ],
    []
  );

  return (
    <div className={cn('space-y-4', className)}>
      {/* Search and Filters */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
          <Input
            placeholder={t('servicePorts.placeholders.searchServices')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
            aria-label={t('servicePorts.fields.name')}
          />
        </div>

        <Select value={protocolFilter} onValueChange={setProtocolFilter}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder={t('servicePorts.fields.protocol')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('servicePorts.protocols.all', 'All Protocols')}</SelectItem>
            <SelectItem value="tcp">{t('servicePorts.protocols.tcp')}</SelectItem>
            <SelectItem value="udp">{t('servicePorts.protocols.udp')}</SelectItem>
            <SelectItem value="both">{t('servicePorts.protocols.both')}</SelectItem>
          </SelectContent>
        </Select>

        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder={t('servicePorts.fields.category')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('servicePorts.categories.all', 'All Categories')}</SelectItem>
            {CATEGORIES.map((category) => (
              <SelectItem key={category} value={category}>
                {category}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      {isLoading ? (
        <LoadingState />
      ) : filteredAndSortedServices.length === 0 ? (
        <EmptyState
          message={
            searchQuery || protocolFilter !== 'all' || categoryFilter !== 'all'
              ? t('servicePorts.emptyStates.noServices')
              : t('servicePorts.emptyStates.noServices')
          }
          description={
            searchQuery || protocolFilter !== 'all' || categoryFilter !== 'all'
              ? t('servicePorts.emptyStates.noServicesDescription')
              : undefined
          }
        />
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead
                  className="cursor-pointer select-none"
                  onClick={() => handleSort('name')}
                  role="button"
                  tabIndex={0}
                  aria-label={`${t('servicePorts.fields.name')} - ${sortField === 'name' ? `sorted ${sortDirection}` : 'not sorted'}`}
                >
                  {t('servicePorts.fields.name')}
                  {sortField === 'name' && (
                    <span className="ml-1" aria-hidden="true">
                      {sortDirection === 'asc' ? <ChevronUp className="h-4 w-4 inline" /> : <ChevronDown className="h-4 w-4 inline" />}
                    </span>
                  )}
                </TableHead>
                <TableHead>{t('servicePorts.fields.protocol')}</TableHead>
                <TableHead
                  className="cursor-pointer select-none"
                  onClick={() => handleSort('port')}
                  role="button"
                  tabIndex={0}
                  aria-label={`${t('servicePorts.fields.port')} - ${sortField === 'port' ? `sorted ${sortDirection}` : 'not sorted'}`}
                >
                  {t('servicePorts.fields.port')}
                  {sortField === 'port' && (
                    <span className="ml-1" aria-hidden="true">
                      {sortDirection === 'asc' ? <ChevronUp className="h-4 w-4 inline" /> : <ChevronDown className="h-4 w-4 inline" />}
                    </span>
                  )}
                </TableHead>
                <TableHead>{t('servicePorts.fields.type')}</TableHead>
                <TableHead className="text-right">{t('servicePorts.actions', 'Actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAndSortedServices.map((service) => (
                <TableRow key={`${service.port}-${service.protocol}`}>
                  <TableCell>
                    <div>
                      <p className="font-medium">{service.service}</p>
                      {service.description && (
                        <p className="text-xs text-muted-foreground">{service.description}</p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <ProtocolBadge protocol={service.protocol} />
                  </TableCell>
                  <TableCell>
                    <span className="font-mono text-sm tabular-nums text-foreground">{service.port}</span>
                  </TableCell>
                  <TableCell>
                    <TypeBadge isBuiltIn={service.isBuiltIn} />
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      {service.isBuiltIn ? (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="flex items-center justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                disabled
                                className="opacity-50 cursor-not-allowed"
                                aria-label={t('servicePorts.editService')}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                disabled
                                className="opacity-50 cursor-not-allowed"
                                aria-label={t('servicePorts.deleteService')}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>
                            {t('servicePorts.tooltips.builtInReadOnly')}
                          </TooltipContent>
                        </Tooltip>
                      ) : (
                        <>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEditClick(service)}
                            aria-label={t('servicePorts.editService')}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteClick(service)}
                            aria-label={t('servicePorts.deleteService')}
                          >
                            <Trash2 className="h-4 w-4 text-error" />
                          </Button>
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('servicePorts.confirmations.deleteService')}</DialogTitle>
            <DialogDescription>
              {t('servicePorts.confirmations.deleteServiceDescription')}
              {serviceToDelete && (
                <div className="mt-4 rounded-md bg-muted p-3">
                  <p className="font-medium">
                    {serviceToDelete.service} (Port {serviceToDelete.port})
                  </p>
                </div>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              {t('servicePorts.buttons.cancel', 'Cancel')}
            </Button>
            <Button variant="destructive" onClick={handleDeleteConfirm}>
              {t('servicePorts.deleteService')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
});
ServicePortsTableDesktop.displayName = 'ServicePortsTableDesktop';
