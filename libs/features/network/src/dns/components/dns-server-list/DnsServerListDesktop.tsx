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
  isLoading = false,
}: DnsServerListProps) {
  return (
    <div className="space-y-component-md category-networking">
      {/* DNS Servers List with Drag-and-Drop */}
      {
        servers.length > 0 ?
          <SortableListWithActions
            items={servers.map((s: DnsServer) => ({ ...s, disabled: s.isDynamic || isLoading }))}
            onReorder={({ items }: any) => onReorder(items)}
            renderItem={(server: DnsServer) => (
              <div className="gap-component-sm p-component-sm bg-card border-input flex items-center rounded-[var(--semantic-radius-button)] border">
                {/* Icon */}
                <Globe className="text-muted-foreground h-4 w-4 flex-shrink-0" />

                {/* Server IP Address */}
                <div className="flex-1 font-mono text-sm">{server.address}</div>

                {/* Dynamic Badge or Remove Button */}
                {server.isDynamic ?
                  <Badge
                    variant="secondary"
                    className="flex-shrink-0"
                  >
                    Dynamic
                  </Badge>
                : <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => onRemove(server.id)}
                    disabled={isLoading}
                    aria-label={`Remove DNS server ${server.address}`}
                    className="flex-shrink-0"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                }
              </div>
            )}
            showDragHandle={true}
          />
          // Empty state
        : <div className="p-component-lg text-muted-foreground category-networking rounded-[var(--semantic-radius-button)] border border-dashed text-center">
            <Globe className="mb-component-sm mx-auto h-8 w-8 opacity-50" />
            <p className="text-sm">No DNS servers configured</p>
            <p className="mt-component-sm text-xs">
              Add a static DNS server or configure DHCP to receive dynamic servers
            </p>
          </div>

      }

      {/* Add DNS Server Button */}
      <Button
        onClick={onAdd}
        variant="outline"
        className="min-h-[44px] w-full"
        disabled={isLoading}
        aria-label="Add a new DNS server"
      >
        <Plus className="mr-component-sm h-4 w-4" />
        Add DNS Server
      </Button>

      {/* Help Text */}
      <div className="text-muted-foreground space-y-component-sm text-xs">
        <p>
          <strong>Static servers</strong> are manually configured and take priority over dynamic
          servers.
        </p>
        <p>
          <strong>Dynamic servers</strong> are automatically obtained from your ISP via DHCP or
          PPPoE.
        </p>
        <p className="text-muted-foreground/70">
          Drag static servers to reorder priority (first server is primary).
        </p>
      </div>
    </div>
  );
}
