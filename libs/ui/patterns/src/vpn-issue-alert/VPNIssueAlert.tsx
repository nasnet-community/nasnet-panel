/**
 * VPN Issue Alert Component
 * Displays VPN warnings and errors
 * Based on NasNetConnect Design System
 *
 * @example
 * ```tsx
 * <VPNIssueAlert
 *   issue={vpnIssue}
 *   onDismiss={() => handleDismiss()}
 * />
 * ```
 */

import React, { memo, useCallback } from 'react';
import { XCircle, AlertTriangle, Info } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

import type { VPNIssue } from '@nasnet/core/types';
import { Alert, AlertTitle, AlertDescription, Icon } from '@nasnet/ui/primitives';

import { ProtocolIcon, getProtocolLabel } from '../protocol-icon';

export interface VPNIssueAlertProps {
  /** The issue to display */
  issue: VPNIssue;
  /** Optional dismiss handler */
  onDismiss?: () => void;
  /** Custom className */
  className?: string;
}

/**
 * Get severity configuration
 */
function getSeverityConfig(severity: 'warning' | 'error') {
  if (severity === 'error') {
    return {
      icon: XCircle,
      variant: 'destructive' as const,
      iconClass: 'text-error',
    };
  }
  return {
    icon: AlertTriangle,
    variant: 'default' as const,
    iconClass: 'text-warning',
  };
}

/**
 * Format relative time
 */
function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);

  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;

  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

/**
 * VPNIssueAlert Component
 * Shows a single VPN issue/warning
 */
function VPNIssueAlertComponent({ issue, onDismiss, className = '' }: VPNIssueAlertProps) {
  const config = getSeverityConfig(issue.severity);

  const handleDismiss = useCallback(() => {
    onDismiss?.();
  }, [onDismiss]);

  return (
    <Alert
      variant={config.variant}
      className={`relative border-l-4 ${
        issue.severity === 'error' ?
          'border-l-error bg-error-light/50 dark:bg-error/10'
        : 'border-l-warning bg-warning-light/50 dark:bg-warning/10'
      } ${className}`}
    >
      <div className="flex items-start gap-3">
        <Icon
          icon={config.icon}
          className={`h-5 w-5 ${config.iconClass} mt-0.5 flex-shrink-0`}
        />
        <div className="min-w-0 flex-1">
          <AlertTitle className="mb-1 flex items-center gap-2">
            <ProtocolIcon
              protocol={issue.protocol}
              size={16}
            />
            <span className="font-medium">
              {getProtocolLabel(issue.protocol)} {issue.entityType}
            </span>
            <span className="text-muted-foreground font-normal">·</span>
            <span className="text-muted-foreground truncate font-normal">{issue.entityName}</span>
          </AlertTitle>
          <AlertDescription className="text-sm">{issue.message}</AlertDescription>
          <p className="text-muted-foreground mt-1 text-xs">
            {formatRelativeTime(issue.timestamp)}
          </p>
        </div>
        {onDismiss && (
          <button
            onClick={handleDismiss}
            className="hover:bg-muted/50 rounded-md p-1 transition-colors"
            aria-label="Dismiss"
          >
            <Icon
              icon={XCircle}
              className="text-muted-foreground h-4 w-4"
            />
          </button>
        )}
      </div>
    </Alert>
  );
}

export const VPNIssueAlert = memo(VPNIssueAlertComponent);
VPNIssueAlert.displayName = 'VPNIssueAlert';

/**
 * VPN Issues List Component
 */
export interface VPNIssuesListProps {
  /** List of issues */
  issues: VPNIssue[];
  /** Maximum issues to show */
  maxItems?: number;
  /** Show "see all" link */
  showSeeAll?: boolean;
  /** Handler for "see all" click */
  onSeeAll?: () => void;
  /** Custom className */
  className?: string;
}

function VPNIssuesListComponent({
  issues,
  maxItems = 3,
  showSeeAll = false,
  onSeeAll,
  className = '',
}: VPNIssuesListProps) {
  const displayedIssues = issues.slice(0, maxItems);
  const hiddenCount = issues.length - displayedIssues.length;

  const handleSeeAll = useCallback(() => {
    onSeeAll?.();
  }, [onSeeAll]);

  if (issues.length === 0) {
    return (
      <Alert className={className}>
        <Icon
          icon={Info}
          className="text-info h-5 w-5"
        />
        <AlertTitle>No Issues</AlertTitle>
        <AlertDescription>All VPN connections are working properly.</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className={`space-y-3 ${className}`}>
      {displayedIssues.map((issue) => (
        <VPNIssueAlert
          key={issue.id}
          issue={issue}
        />
      ))}

      {showSeeAll && hiddenCount > 0 && (
        <button
          onClick={handleSeeAll}
          className="text-primary hover:text-primary/80 w-full py-2 text-sm font-medium transition-colors"
        >
          View {hiddenCount} more {hiddenCount === 1 ? 'issue' : 'issues'}
        </button>
      )}
    </div>
  );
}

export const VPNIssuesList = memo(VPNIssuesListComponent);
VPNIssuesList.displayName = 'VPNIssuesList';
