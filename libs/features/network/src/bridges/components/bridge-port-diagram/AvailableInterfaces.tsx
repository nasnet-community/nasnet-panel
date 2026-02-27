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
        <div
          key={i}
          className="bg-muted h-12 animate-pulse rounded-md"
        />
      )),
    []
  );

  if (loading) {
    return (
      <div className={className || 'bg-card p-component-md rounded-lg border'}>
        <h3 className="mb-component-md text-sm font-medium">Available Interfaces</h3>
        <div className="space-y-component-sm">{skeletonLoaders}</div>
      </div>
    );
  }

  if (interfaces.length === 0) {
    return (
      <div className={className || 'bg-card p-component-md rounded-lg border'}>
        <h3 className="mb-component-md text-sm font-medium">Available Interfaces</h3>
        <p className="text-muted-foreground text-sm">
          No interfaces available. All interfaces are already assigned to bridges.
        </p>
      </div>
    );
  }

  return (
    <div className={className || 'bg-card p-component-md rounded-lg border'}>
      <h3 className="mb-component-md text-sm font-medium">Available Interfaces</h3>
      <p className="text-muted-foreground mb-component-md text-xs">
        Drag an interface to the bridge to add it as a port
      </p>
      <div
        className="space-y-component-sm"
        role="list"
        aria-label="Available interfaces"
      >
        {interfaces.map((iface) => (
          <DraggableInterface
            key={iface.id}
            interface={iface}
          />
        ))}
      </div>
    </div>
  );
});

interface DraggableInterfaceProps {
  interface: Interface;
}

const DraggableInterface = memo(function DraggableInterface({
  interface: iface,
}: DraggableInterfaceProps) {
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
  } as React.CSSProperties;

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
      className="gap-component-sm bg-card p-component-sm hover:bg-accent flex cursor-grab items-center rounded-md border transition-colors active:cursor-grabbing"
      role="listitem"
      aria-label={`Draggable interface ${iface.name}`}
    >
      {/* Drag Handle */}
      <Icon
        icon={GripVertical}
        className="text-muted-foreground h-4 w-4 flex-shrink-0"
        aria-hidden="true"
      />

      {/* Interface Icon */}
      <div className="bg-category-networking/10 text-category-networking flex h-8 w-8 flex-shrink-0 items-center justify-center rounded">
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <rect
            x="6"
            y="8"
            width="12"
            height="8"
            rx="1"
            stroke="currentColor"
            strokeWidth="2"
          />
          <path
            d="M9 8V6M15 8V6M9 16V18M15 16V18"
            stroke="currentColor"
            strokeWidth="2"
          />
        </svg>
      </div>

      {/* Interface Info */}
      <div className="min-w-0 flex-1">
        <div className="gap-component-sm flex items-center">
          <span className="truncate font-mono text-sm font-medium">{iface.name}</span>
          <Badge
            variant={getTypeBadgeVariant(iface.type)}
            className="text-xs"
          >
            {iface.type}
          </Badge>
        </div>
        {iface.macAddress && (
          <code className="text-muted-foreground font-mono text-xs">{iface.macAddress}</code>
        )}
      </div>
    </div>
  );
});

DraggableInterface.displayName = 'DraggableInterface';

AvailableInterfaces.displayName = 'AvailableInterfaces';
