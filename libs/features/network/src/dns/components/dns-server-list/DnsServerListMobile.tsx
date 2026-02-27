/**
 * DNS Server List - Mobile Presenter
 *
 * Mobile optimized view with:
 * - Card layout
 * - Touch-optimized controls (44px minimum)
 * - Simplified UI
 *
 * Story: NAS-6.4 - Implement DNS Configuration
 */

import { Badge, Button, Card, CardContent } from '@nasnet/ui/primitives';
import { X, Globe, Plus, GripVertical } from 'lucide-react';
import type { DnsServerListProps, DnsServer } from './DnsServerList';

/**
 * Mobile presenter for DNS server list
 *
 * Simplified card-based layout optimized for touch interaction.
 * Note: Full drag-and-drop on mobile can be handled by SortableListWithActions
 * but for simplicity, we show a visual indicator and handle reordering via touch.
 */
export function DnsServerListMobile({
  servers,
  onReorder,
  onRemove,
  onAdd,
  isLoading = false,
}: DnsServerListProps) {
  return (
    <div className="space-y-component-sm category-networking">
      {/* DNS Servers List */}
      {
        servers.length > 0 ?
          <div className="space-y-component-xs">
            {servers.map((server, index) => (
              <Card
                key={server.id}
                className="category-networking overflow-hidden"
              >
                <CardContent className="p-component-sm">
                  <div className="gap-component-sm flex items-center">
                    {/* Drag Handle (static servers only) */}
                    {!server.isDynamic && (
                      <div className="text-muted-foreground flex-shrink-0 touch-manipulation">
                        <GripVertical className="h-5 w-5" />
                      </div>
                    )}

                    {/* Icon */}
                    <Globe
                      className={`h-5 w-5 flex-shrink-0 ${
                        server.isDynamic ? 'text-muted-foreground' : 'text-primary'
                      }`}
                    />

                    {/* Server Info */}
                    <div className="min-w-0 flex-1">
                      <div className="truncate font-mono text-sm">{server.address}</div>
                      {index === 0 && !server.isDynamic && (
                        <div className="text-muted-foreground text-xs">Primary</div>
                      )}
                    </div>

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
                        className="min-h-[44px] min-w-[44px] flex-shrink-0"
                      >
                        <X className="h-5 w-5" />
                      </Button>
                    }
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          // Empty state
        : <Card>
            <CardContent className="p-component-lg text-center">
              <Globe className="mb-component-md text-muted-foreground mx-auto h-12 w-12 opacity-50" />
              <p className="text-muted-foreground mb-component-xs text-sm">
                No DNS servers configured
              </p>
              <p className="text-muted-foreground/70 text-xs">Add a static DNS server below</p>
            </CardContent>
          </Card>

      }

      {/* Add DNS Server Button */}
      <Button
        onClick={onAdd}
        variant="outline"
        className="min-h-[44px] w-full"
        disabled={isLoading}
        aria-label="Add a new DNS server"
      >
        <Plus className="mr-component-sm h-5 w-5" />
        Add DNS Server
      </Button>

      {/* Help Text */}
      <div className="text-muted-foreground space-y-component-sm px-component-sm text-xs">
        <p>
          <strong>Static:</strong> Manually configured, higher priority
        </p>
        <p>
          <strong>Dynamic:</strong> From ISP via DHCP/PPPoE
        </p>
      </div>
    </div>
  );
}
