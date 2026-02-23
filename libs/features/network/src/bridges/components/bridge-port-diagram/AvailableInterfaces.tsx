import { memo, useCallback, useMemo } from 'react';
import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { Badge, Icon } from '@nasnet/ui/primitives';
import { GripVertical } from 'lucide-react';
import type { Interface } from '@nasnet/api-client/generated';

export interface AvailableInterfacesProps {
  interfaces: Interface[];
  loading: boolean;
  className?: string;
}

/**
 * Available Interfaces Component - Shows draggable interfaces that can be added to bridge
 *
 * @description Draggable interface list for bridge port assignment with loading and empty states
 */
export const AvailableInterfaces = memo(function AvailableInterfaces({
  interfaces,
  loading,
  className,
}: AvailableInterfacesProps) {
  // Memoize skeleton loaders
  const skeletonLoaders = useMemo(
    () =>
      [1, 2, 3].map((i) => (
        <div key={i} className="h-12 rounded-md bg-muted animate-pulse" />
      )),
    []
  );

  if (loading) {
    return (
      <div className={className || 'rounded-lg border bg-card p-4'}>
        <h3 className="text-sm font-medium mb-3">Available Interfaces</h3>
        <div className="space-y-2">{skeletonLoaders}</div>
      </div>
    );
  }

  if (interfaces.length === 0) {
    return (
      <div className={className || 'rounded-lg border bg-card p-4'}>
        <h3 className="text-sm font-medium mb-3">Available Interfaces</h3>
        <p className="text-sm text-muted-foreground">
          No interfaces available. All interfaces are already assigned to bridges.
        </p>
      </div>
    );
  }

  return (
    <div className={className || 'rounded-lg border bg-card p-4'}>
      <h3 className="text-sm font-medium mb-3">Available Interfaces</h3>
      <p className="text-xs text-muted-foreground mb-3">
        Drag an interface to the bridge to add it as a port
      </p>
      <div className="space-y-2" role="list" aria-label="Available interfaces">
        {interfaces.map((iface) => (
          <DraggableInterface key={iface.id} interface={iface} />
        ))}
      </div>
    </div>
  );
});

interface DraggableInterfaceProps {
  interface: Interface;
}

const DraggableInterface = memo(function DraggableInterface({ interface: iface }: DraggableInterfaceProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: iface.id,
    data: {
      type: 'interface',
      name: iface.name,
    },
  });

  const style = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.5 : 1,
  };

  // Memoized interface type badge variant determiner
  const getTypeBadgeVariant = useCallback((type: string): 'default' | 'secondary' | 'outline' => {
    switch (type.toLowerCase()) {
      case 'ether':
        return 'default';
      case 'wlan':
        return 'secondary';
      default:
        return 'outline';
    }
  }, []);

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="flex items-center gap-3 rounded-md border bg-background p-3 cursor-grab active:cursor-grabbing transition-colors hover:bg-accent"
      role="listitem"
      aria-label={`Draggable interface ${iface.name}`}
    >
      {/* Drag Handle */}
      <Icon icon={GripVertical} className="h-4 w-4 text-muted-foreground flex-shrink-0" aria-hidden="true" />

      {/* Interface Icon */}
      <div className="flex h-8 w-8 items-center justify-center rounded bg-primary/10 text-primary flex-shrink-0">
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <rect x="6" y="8" width="12" height="8" rx="1" stroke="currentColor" strokeWidth="2" />
          <path d="M9 8V6M15 8V6M9 16V18M15 16V18" stroke="currentColor" strokeWidth="2" />
        </svg>
      </div>

      {/* Interface Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium text-sm truncate">{iface.name}</span>
          <Badge variant={getTypeBadgeVariant(iface.type)} className="text-xs">
            {iface.type}
          </Badge>
        </div>
        {iface.macAddress && (
          <code className="text-xs font-mono text-muted-foreground">{iface.macAddress}</code>
        )}
      </div>
    </div>
  );
});

DraggableInterface.displayName = 'DraggableInterface';

AvailableInterfaces.displayName = 'AvailableInterfaces';
