/**
 * Service Ports Table Component (Mobile Presenter)
 *
 * @description Mobile-optimized service ports management interface with card-based layout,
 * touch-friendly 44px action buttons, search and filter capabilities. Built-in services
 * are read-only; custom services support edit and delete operations.
 *
 * @example
 * ```tsx
 * <ServicePortsTableMobile
 *   className="p-4"
 * />
 * ```
 */

import React, { useState, useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useCustomServices } from '../hooks/useCustomServices';
import type { ServicePortDefinition, ServicePortProtocol, ServicePortCategory } from '@nasnet/core/types';
import {
  Card,
  CardContent,
  CardHeader,
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@nasnet/ui/primitives';
import { Pencil, Trash2, Search, MoreVertical } from 'lucide-react';
import { Icon } from '@nasnet/ui/primitives/icon';
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
    <div className="space-y-component-md">
      {[...Array(5)].map((_, i) => (
        <Skeleton key={i} className="h-32 w-full" />
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
// Service Card Component
// ============================================================================

interface ServiceCardProps {
  service: ServicePortDefinition;
  onEdit: (service: ServicePortDefinition) => void;
  onDelete: (service: ServicePortDefinition) => void;
}

const ServiceCard = React.memo(function ServiceCard({ service, onEdit, onDelete }: ServiceCardProps) {
  const { t } = useTranslation('firewall');

  const handleEditClick = useCallback(() => {
    onEdit(service);
  }, [onEdit, service]);

  const handleDeleteClick = useCallback(() => {
    onDelete(service);
  }, [onDelete, service]);

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h3 className="text-base font-semibold">{service.service}</h3>
              <ProtocolBadge protocol={service.protocol} />
            </div>
            {service.description && (
              <p className="mt-1 text-sm text-muted-foreground">{service.description}</p>
            )}
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-11 w-11"
                disabled={service.isBuiltIn}
                aria-label={t('servicePorts.actions', 'Actions')}
              >
                <MoreVertical className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleEditClick} disabled={service.isBuiltIn}>
                <Pencil className="mr-2 h-4 w-4" />
                {t('servicePorts.editService')}
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={handleDeleteClick}
                disabled={service.isBuiltIn}
                className="text-error"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                {t('servicePorts.deleteService')}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      <CardContent className="pb-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground">{t('servicePorts.fields.port')}</p>
            <p className="font-mono text-lg font-semibold tabular-nums">{service.port}</p>
          </div>
          <TypeBadge isBuiltIn={service.isBuiltIn} />
        </div>
        {service.isBuiltIn && (
          <p className="mt-3 text-xs text-muted-foreground">
            {t('servicePorts.tooltips.builtInReadOnly')}
          </p>
        )}
      </CardContent>
    </Card>
  );
});
ServiceCard.displayName = 'ServiceCard';

// ============================================================================
// Main Component
// ============================================================================

export interface ServicePortsTableMobileProps {
  /** Optional CSS class name */
  className?: string;
}

export const ServicePortsTableMobile = React.memo(function ServicePortsTableMobile({
  className,
}: ServicePortsTableMobileProps) {
  const { t } = useTranslation('firewall');
  const { services, deleteService } = useCustomServices();

  // Local state
  const [searchQuery, setSearchQuery] = useState('');
  const [protocolFilter, setProtocolFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [serviceToDelete, setServiceToDelete] = useState<ServicePortDefinition | null>(null);
  const [isLoading] = useState(false);

  // Filter services
  const filteredServices = useMemo(() => {
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

    return result;
  }, [services, searchQuery, protocolFilter, categoryFilter]);

  // Handlers
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
    <div className={cn('space-y-component-md', className)}>
      {/* Search and Filters */}
      <div className="space-y-component-sm">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder={t('servicePorts.placeholders.searchServices')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        <div className="flex gap-component-sm">
          <Select value={protocolFilter} onValueChange={setProtocolFilter}>
            <SelectTrigger className="flex-1">
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
            <SelectTrigger className="flex-1">
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
      </div>

      {/* Cards */}
      {isLoading ? (
        <LoadingState />
      ) : filteredServices.length === 0 ? (
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
        <div className="space-y-component-sm">
          {filteredServices.map((service) => (
            <ServiceCard
              key={`${service.port}-${service.protocol}`}
              service={service}
              onEdit={handleEditClick}
              onDelete={handleDeleteClick}
            />
          ))}
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
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)} className="min-h-[44px]">
              {t('servicePorts.buttons.cancel', 'Cancel')}
            </Button>
            <Button variant="destructive" onClick={handleDeleteConfirm} className="min-h-[44px]">
              {t('servicePorts.deleteService')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
});
ServicePortsTableMobile.displayName = 'ServicePortsTableMobile';
