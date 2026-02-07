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
  loading = false,
}: DnsServerListProps) {
  return (
    <div className="space-y-3">
      {/* DNS Servers List */}
      {servers.length > 0 ? (
        <div className="space-y-2">
          {servers.map((server, index) => (
            <Card key={server.id} className="overflow-hidden">
              <CardContent className="p-3">
                <div className="flex items-center gap-3">
                  {/* Drag Handle (static servers only) */}
                  {!server.isDynamic && (
                    <div className="flex-shrink-0 text-muted-foreground touch-manipulation">
                      <GripVertical className="h-5 w-5" />
                    </div>
                  )}

                  {/* Icon */}
                  <Globe
                    className={`h-5 w-5 flex-shrink-0 ${
                      server.isDynamic
                        ? 'text-muted-foreground'
                        : 'text-primary'
                    }`}
                  />

                  {/* Server Info */}
                  <div className="flex-1 min-w-0">
                    <div className="font-mono text-sm truncate">
                      {server.address}
                    </div>
                    {index === 0 && !server.isDynamic && (
                      <div className="text-xs text-muted-foreground">
                        Primary
                      </div>
                    )}
                  </div>

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
                      className="flex-shrink-0 h-11 w-11" // 44px touch target
                    >
                      <X className="h-5 w-5" />
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        // Empty state
        <Card>
          <CardContent className="p-6 text-center">
            <Globe className="h-12 w-12 mx-auto mb-3 text-muted-foreground opacity-50" />
            <p className="text-sm text-muted-foreground mb-1">
              No DNS servers configured
            </p>
            <p className="text-xs text-muted-foreground/70">
              Add a static DNS server below
            </p>
          </CardContent>
        </Card>
      )}

      {/* Add DNS Server Button */}
      <Button
        onClick={onAdd}
        variant="outline"
        className="w-full h-11" // 44px touch target
        disabled={loading}
      >
        <Plus className="h-5 w-5 mr-2" />
        Add DNS Server
      </Button>

      {/* Help Text */}
      <div className="text-xs text-muted-foreground space-y-1 px-1">
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
