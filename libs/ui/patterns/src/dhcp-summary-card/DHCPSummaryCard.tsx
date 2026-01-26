/**
 * DHCP Summary Card Component
 * Compact card showing active leases count and IP range
 * Based on UX Design Specification - Direction 4: Action-First
 */

import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@nasnet/ui/primitives';
import { Network, Users, ChevronRight, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';

/**
 * DHCPSummaryCard Props
 */
export interface DHCPSummaryCardProps {
  /** Total number of active leases */
  activeLeases: number;
  /** Total number of leases (for capacity) */
  totalCapacity?: number;
  /** IP address range (e.g., "192.168.1.100-192.168.1.200") */
  ipRange?: string;
  /** Server name */
  serverName?: string;
  /** Whether data is loading */
  isLoading?: boolean;
  /** Link to full DHCP page */
  linkTo?: string;
  /** Custom className */
  className?: string;
}

/**
 * DHCPSummaryCard Component
 * Shows DHCP server summary with active lease count and IP range
 */
export function DHCPSummaryCard({
  activeLeases,
  totalCapacity,
  ipRange,
  serverName = 'DHCP Server',
  isLoading = false,
  linkTo = '/dhcp',
  className = '',
}: DHCPSummaryCardProps) {
  const content = (
    <Card className={`h-full transition-all duration-200 ${linkTo ? 'hover:shadow-md hover:-translate-y-0.5 cursor-pointer' : ''} ${className}`}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-info/10 dark:bg-info/20 flex items-center justify-center">
              <Network className="w-4 h-4 text-info" />
            </div>
            <CardTitle className="text-base font-semibold">{serverName}</CardTitle>
          </div>
          {linkTo && (
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          )}
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        {isLoading ? (
          <div className="flex items-center justify-center py-4">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="space-y-3">
            {/* Active Leases */}
            <div className="flex items-center gap-3">
              <Users className="w-5 h-5 text-muted-foreground" />
              <div>
                <p className="text-2xl font-bold text-foreground">
                  {activeLeases}
                  {totalCapacity && (
                    <span className="text-sm text-muted-foreground font-normal ml-1">
                      / {totalCapacity}
                    </span>
                  )}
                </p>
                <p className="text-xs text-muted-foreground">Active Leases</p>
              </div>
            </div>

            {/* IP Range */}
            {ipRange && (
              <div className="pt-2 border-t border-border">
                <p className="text-xs text-muted-foreground">IP Range</p>
                <p className="text-sm font-mono text-foreground truncate" title={ipRange}>
                  {ipRange}
                </p>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );

  if (linkTo) {
    return <Link to={linkTo} className="block">{content}</Link>;
  }

  return content;
}




























