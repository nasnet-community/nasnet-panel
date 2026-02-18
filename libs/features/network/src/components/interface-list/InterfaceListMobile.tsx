import { Button, Badge, Card, CardHeader, CardTitle, CardDescription, CardContent, Checkbox } from '@nasnet/ui/primitives';
import { InterfaceListFilters } from './InterfaceListFilters';
import { BatchActionsToolbar } from './BatchActionsToolbar';
import type { InterfaceFilters } from './InterfaceList';

export interface InterfaceListMobileProps {
  interfaces: any[];
  allInterfaces: any[];
  loading: boolean;
  error: any;
  selectedIds: Set<string>;
  onSelect: (ids: Set<string>) => void;
  filters: InterfaceFilters;
  onFilterChange: (filters: InterfaceFilters) => void;
  onRefresh: () => void;
  routerId: string;
  onOpenDetail: (interfaceId: string) => void;
}

/**
 * Interface List Mobile Presenter
 * Displays interfaces as cards optimized for mobile/touch
 */
export function InterfaceListMobile({
  interfaces,
  allInterfaces,
  loading,
  error,
  selectedIds,
  onSelect,
  filters,
  onFilterChange,
  onRefresh,
  routerId,
  onOpenDetail,
}: InterfaceListMobileProps) {
  const selectedInterfaces = allInterfaces.filter((iface) =>
    selectedIds.has(iface.id)
  );

  const toggleSelection = (interfaceId: string) => {
    const newSelection = new Set(selectedIds);
    if (newSelection.has(interfaceId)) {
      newSelection.delete(interfaceId);
    } else {
      newSelection.add(interfaceId);
    }
    onSelect(newSelection);
  };

  if (error) {
    return (
      <div className="space-y-4 p-4">
        <InterfaceListFilters filters={filters} onChange={onFilterChange} />
        <div className="p-8 text-center border rounded-lg border-destructive bg-destructive/10">
          <p className="text-destructive font-medium">Failed to load interfaces</p>
          <p className="text-sm text-muted-foreground mt-2">
            {error.message || 'Unknown error'}
          </p>
          <Button onClick={onRefresh} className="mt-4">
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 p-4">
      {/* Filters */}
      <InterfaceListFilters filters={filters} onChange={onFilterChange} />

      {/* Loading state */}
      {loading && (
        <div className="text-center p-8 text-muted-foreground">
          Loading interfaces...
        </div>
      )}

      {/* Empty state */}
      {!loading && interfaces.length === 0 && (
        <div className="text-center p-8 text-muted-foreground">
          {filters.type || filters.status || filters.search
            ? 'No interfaces match the current filters'
            : 'No interfaces found'}
        </div>
      )}

      {/* Interface cards */}
      <div className="space-y-2">
        {interfaces.map((iface) => {
          const isSelected = selectedIds.has(iface.id);
          const statusVariant =
            iface.status === 'UP'
              ? 'success'
              : iface.status === 'DOWN'
              ? 'error'
              : 'secondary';

          return (
            <Card
              key={iface.id}
              className={`cursor-pointer transition-colors ${
                isSelected ? 'border-primary bg-primary/5' : ''
              }`}
              onClick={() => onOpenDetail(iface.id)}
            >
              <CardHeader className="flex-row items-start justify-between space-y-0 pb-2">
                <div className="flex items-start gap-3 flex-1">
                  <Checkbox
                    checked={isSelected}
                    onCheckedChange={(checked) => {
                      toggleSelection(iface.id);
                    }}
                    onClick={(e) => e.stopPropagation()}
                    aria-label={`Select ${iface.name}`}
                  />
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-base">{iface.name}</CardTitle>
                    <CardDescription className="flex gap-2 mt-1">
                      <Badge variant="outline" className="text-xs">
                        {iface.type}
                      </Badge>
                      <Badge variant={statusVariant} className="text-xs">
                        {iface.status}
                      </Badge>
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Enabled:</span>
                  <Badge variant={iface.enabled ? 'default' : 'outline'} className="text-xs">
                    {iface.enabled ? 'Yes' : 'No'}
                  </Badge>
                </div>
                {iface.ip && iface.ip.length > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">IP:</span>
                    <span className="font-mono text-xs">{iface.ip[0]}</span>
                  </div>
                )}
                {iface.mtu && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">MTU:</span>
                    <span>{iface.mtu}</span>
                  </div>
                )}
                {iface.comment && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Comment:</span>
                    <span className="truncate max-w-xs text-xs">{iface.comment}</span>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Bottom action bar for batch operations */}
      {selectedIds.size > 0 && (
        <div className="fixed bottom-4 left-4 right-4 z-10">
          <Card className="shadow-lg">
            <CardContent className="p-4">
              <BatchActionsToolbar
                routerId={routerId}
                selectedIds={selectedIds}
                selectedInterfaces={selectedInterfaces}
                onClearSelection={() => onSelect(new Set())}
              />
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
