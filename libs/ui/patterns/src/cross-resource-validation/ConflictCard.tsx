/**
 * ConflictCard Component
 *
 * Displays a single cross-resource conflict with affected resources
 * and available resolution options.
 *
 * @module @nasnet/ui/patterns/cross-resource-validation
 */

import * as React from 'react';

import {
  AlertTriangle,
  AlertCircle,
  Info,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Network,
  Plug,
  Fingerprint,
  Layers,
  GitBranch,
  Boxes,
  Cable,
  Copy,
  type LucideIcon,
} from 'lucide-react';

import { Button, cn, Card, CardContent, CardHeader, Badge } from '@nasnet/ui/primitives';

import { CONFLICT_TYPE_LABELS } from './types';

import type {
  ResourceConflict,
  ConflictType,
  ConflictSeverity,
  ConflictResolution,
} from './types';

/**
 * Icon mapping for conflict types
 */
const CONFLICT_ICONS: Record<ConflictType, LucideIcon> = {
  ip_collision: Network,
  port_conflict: Plug,
  duplicate_mac: Fingerprint,
  subnet_overlap: Layers,
  route_conflict: GitBranch,
  vlan_conflict: Boxes,
  interface_conflict: Cable,
  name_duplicate: Copy,
};

/**
 * Severity icons and colors
 */
const SEVERITY_CONFIG: Record<
  ConflictSeverity,
  { icon: LucideIcon; color: string; bgColor: string }
> = {
  error: {
    icon: AlertCircle,
    color: 'text-error',
    bgColor: 'bg-error/10',
  },
  warning: {
    icon: AlertTriangle,
    color: 'text-warning',
    bgColor: 'bg-warning/10',
  },
  info: {
    icon: Info,
    color: 'text-info',
    bgColor: 'bg-info/10',
  },
};

export interface ConflictCardProps {
  /** The conflict to display */
  conflict: ResourceConflict;
  /** Whether the card is expanded */
  isExpanded?: boolean;
  /** Callback when expand/collapse is toggled */
  onToggle?: () => void;
  /** Callback when a resolution is selected */
  onSelectResolution?: (conflictId: string, resolutionId: string) => void;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Displays a single cross-resource conflict with expandable details.
 *
 * @example
 * ```tsx
 * <ConflictCard
 *   conflict={{
 *     id: '1',
 *     type: 'ip_collision',
 *     severity: 'error',
 *     title: 'IP Address Collision',
 *     description: 'Multiple interfaces have the same IP',
 *     resources: [...],
 *     resolutions: [...],
 *   }}
 *   onSelectResolution={(conflictId, resolutionId) => handleResolve()}
 * />
 * ```
 */
export function ConflictCard({
  conflict,
  isExpanded = false,
  onToggle,
  onSelectResolution,
  className,
}: ConflictCardProps) {
  const ConflictIcon = CONFLICT_ICONS[conflict.type];
  const severityConfig = SEVERITY_CONFIG[conflict.severity];
  const SeverityIcon = severityConfig.icon;

  const hasResolutions = conflict.resolutions.length > 0;
  const hasMultipleResolutions = conflict.resolutions.length > 1;

  return (
    <Card
      className={cn(
        'border-l-4 transition-all',
        conflict.severity === 'error' && 'border-l-error',
        conflict.severity === 'warning' && 'border-l-warning',
        conflict.severity === 'info' && 'border-l-info',
        className
      )}
    >
      <CardHeader className="pb-2">
        <div className="flex items-start gap-3">
          {/* Conflict type icon */}
          <div className={cn('p-2 rounded-lg', severityConfig.bgColor)}>
            <ConflictIcon
              className={cn('h-5 w-5', severityConfig.color)}
              aria-hidden="true"
            />
          </div>

          {/* Title and description */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-semibold text-foreground">{conflict.title}</h3>
              <Badge
                variant={
                  conflict.severity === 'error'
                    ? 'error'
                    : conflict.severity === 'warning'
                    ? 'default'
                    : 'secondary'
                }
                className="text-xs"
              >
                {CONFLICT_TYPE_LABELS[conflict.type]}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              {conflict.description}
            </p>
            {conflict.conflictValue && (
              <div className="mt-2">
                <code className="text-xs bg-muted px-2 py-1 rounded font-mono">
                  {conflict.conflictValue}
                </code>
              </div>
            )}
          </div>

          {/* Severity indicator and expand button */}
          <div className="flex items-center gap-2 shrink-0">
            <SeverityIcon
              className={cn('h-5 w-5', severityConfig.color)}
              aria-label={conflict.severity}
            />
            {(hasResolutions || conflict.resources.length > 0) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onToggle}
                aria-expanded={isExpanded}
                aria-controls={`conflict-${conflict.id}-details`}
              >
                {isExpanded ? (
                  <ChevronUp className="h-4 w-4" aria-hidden="true" />
                ) : (
                  <ChevronDown className="h-4 w-4" aria-hidden="true" />
                )}
                <span className="sr-only">
                  {isExpanded ? 'Collapse details' : 'Expand details'}
                </span>
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      {/* Expandable content */}
      {isExpanded && (
        <CardContent
          id={`conflict-${conflict.id}-details`}
          className="pt-0 space-y-4"
        >
          {/* Affected resources */}
          {conflict.resources.length > 0 && (
            <div>
              <h4 className="text-sm font-medium mb-2">Affected Resources</h4>
              <div className="space-y-2" role="list" aria-label="Affected resources">
                {conflict.resources.map((resource) => (
                  <div
                    key={resource.id}
                    role="listitem"
                    className="flex items-center justify-between p-2 bg-muted/50 rounded-md text-sm"
                  >
                    <div>
                      <span className="font-medium">{resource.name}</span>
                      <span className="text-muted-foreground ml-2">
                        ({resource.type})
                      </span>
                      {resource.path && (
                        <span className="text-xs text-muted-foreground block">
                          {resource.path}
                        </span>
                      )}
                    </div>
                    {resource.value && (
                      <code className="text-xs bg-background px-2 py-0.5 rounded font-mono">
                        {resource.value}
                      </code>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Resolution options */}
          {hasResolutions && (
            <div>
              <h4 className="text-sm font-medium mb-2">
                {hasMultipleResolutions ? 'Resolution Options' : 'Resolution'}
              </h4>
              <div className="space-y-2" role="group" aria-label="Resolution options">
                {conflict.resolutions.map((resolution) => (
                  <ResolutionOption
                    key={resolution.id}
                    resolution={resolution}
                    onSelect={() =>
                      onSelectResolution?.(conflict.id, resolution.id)
                    }
                  />
                ))}
              </div>
            </div>
          )}

          {/* Help link */}
          {conflict.helpUrl && (
            <a
              href={conflict.helpUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
            >
              Learn more about this conflict
              <ExternalLink className="h-3 w-3" aria-hidden="true" />
            </a>
          )}
        </CardContent>
      )}
    </Card>
  );
}

/**
 * Single resolution option button
 */
function ResolutionOption({
  resolution,
  onSelect,
}: {
  resolution: ConflictResolution;
  onSelect: () => void;
}) {
  return (
    <div
      className={cn(
        'flex items-center justify-between p-3 border rounded-lg',
        resolution.recommended && 'border-primary bg-primary/5'
      )}
    >
      <div>
        <div className="flex items-center gap-2">
          <span className="font-medium text-sm">{resolution.label}</span>
          {resolution.recommended && (
            <Badge variant="default" className="text-xs">
              Recommended
            </Badge>
          )}
          {resolution.destructive && (
            <Badge variant="error" className="text-xs">
              Destructive
            </Badge>
          )}
        </div>
        <p className="text-xs text-muted-foreground mt-0.5">
          {resolution.description}
        </p>
      </div>
      <Button
        variant={resolution.destructive ? 'destructive' : 'outline'}
        size="sm"
        onClick={onSelect}
      >
        Apply
      </Button>
    </div>
  );
}

ConflictCard.displayName = 'ConflictCard';
