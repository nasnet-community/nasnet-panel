/**
 * DNS Server List - Desktop Presenter
 *
 * Desktop/tablet optimized view with:
 * - Drag-and-drop reordering
 * - Inline action buttons
 * - Compact list layout
 *
 * Story: NAS-6.4 - Implement DNS Configuration
 */

import { Badge, Button } from '@nasnet/ui/primitives';
import { SortableListWithActions } from '@nasnet/ui/patterns/sortable';
import { X, Globe, Plus } from 'lucide-react';
import type { DnsServerListProps, DnsServer } from './DnsServerList';

/**
 * Desktop presenter for DNS server list
 *
 * Uses SortableListWithActions for drag-and-drop reordering.
 * Static servers can be reordered and removed.
 * Dynamic servers are read-only with "Dynamic" badge.
 */
export function DnsServerListDesktop({
  servers,
  onReorder,
  onRemove,
  onAdd,
  loading = false,
}: DnsServerListProps) {
  return (
    <div className="space-y-4">
      {/* DNS Servers List with Drag-and-Drop */}
      {servers.length > 0 ? (
        <SortableListWithActions
          items={servers.map((s: DnsServer) => ({ ...s, disabled: s.isDynamic || loading }))}
          onReorder={({ items }: any) => onReorder(items)}
          renderItem={(server: DnsServer) => (
            <div className="flex items-center gap-3 p-3 bg-card rounded-input border border-input">
              {/* Icon */}
              <Globe className="h-4 w-4 text-muted-foreground flex-shrink-0" />

              {/* Server IP Address */}
              <div className="flex-1 font-mono text-sm">{server.address}</div>

              {/* Dynamic Badge or Remove Button */}
              {server.isDynamic ? (
                <Badge variant="secondary" className="flex-shrink-0">
                  Dynamic
                </Badge>
              ) : (
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => onRemove(server.id)}
                  disabled={loading}
                  aria-label={`Remove DNS server ${server.address}`}
                  className="flex-shrink-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          )}
          showDragHandle={true}
        />
      ) : (
        // Empty state
        <div className="p-6 text-center text-muted-foreground border border-dashed rounded-input">
          <Globe className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">No DNS servers configured</p>
          <p className="text-xs mt-1">
            Add a static DNS server or configure DHCP to receive dynamic servers
          </p>
        </div>
      )}

      {/* Add DNS Server Button */}
      <Button
        onClick={onAdd}
        variant="outline"
        className="w-full"
        disabled={loading}
        aria-label="Add a new DNS server"
      >
        <Plus className="h-4 w-4 mr-2" />
        Add DNS Server
      </Button>

      {/* Help Text */}
      <div className="text-xs text-muted-foreground space-y-1">
        <p>
          <strong>Static servers</strong> are manually configured and take
          priority over dynamic servers.
        </p>
        <p>
          <strong>Dynamic servers</strong> are automatically obtained from your
          ISP via DHCP or PPPoE.
        </p>
        <p className="text-muted-foreground/70">
          Drag static servers to reorder priority (first server is primary).
        </p>
      </div>
    </div>
  );
}
