/**
 * ValidationStage Component
 *
 * Displays a single validation stage with status, errors, and collapse/expand.
 *
 * @module @nasnet/ui/patterns/validation-progress
 */

import * as React from 'react';

import { motion, AnimatePresence } from 'framer-motion';
import {
  CheckCircle2,
  XCircle,
  Circle,
  Loader2,
  SkipForward,
  ChevronDown,
  ChevronRight,
  AlertTriangle,
  FileCheck,
  Code2,
  GitBranch,
  Link2,
  Wifi,
  Server,
  PlayCircle,
} from 'lucide-react';

import { cn } from '@nasnet/ui/primitives';

import type { ValidationStageName, ValidationStageResult, StageMeta } from './types';

/**
 * Stage metadata mapping.
 */
const STAGE_META: Record<ValidationStageName, StageMeta> = {
  schema: {
    label: 'Schema',
    description: 'Type and structure validation',
    icon: 'FileCheck',
  },
  syntax: {
    label: 'Syntax',
    description: 'Format validation (IP, MAC, etc.)',
    icon: 'Code2',
  },
  'cross-resource': {
    label: 'Cross-Resource',
    description: 'Conflict detection with other resources',
    icon: 'GitBranch',
  },
  dependencies: {
    label: 'Dependencies',
    description: 'Required resources exist',
    icon: 'Link2',
  },
  network: {
    label: 'Network',
    description: 'IP/Port/VLAN availability',
    icon: 'Wifi',
  },
  platform: {
    label: 'Platform',
    description: 'Router capability check',
    icon: 'Server',
  },
  'dry-run': {
    label: 'Dry Run',
    description: 'Simulate on router',
    icon: 'PlayCircle',
  },
};

/**
 * Get the icon component for a stage.
 */
function getStageIcon(iconName: string) {
  const icons: Record<string, React.ComponentType<{ className?: string }>> = {
    FileCheck,
    Code2,
    GitBranch,
    Link2,
    Wifi,
    Server,
    PlayCircle,
  };
  return icons[iconName] || FileCheck;
}

export interface ValidationStageProps {
  /** Stage result data */
  result: ValidationStageResult;
  /** Whether this stage is currently expanded */
  isExpanded?: boolean;
  /** Callback when expand/collapse is toggled */
  onToggle?: () => void;
  /** Whether to show the connector line to next stage */
  showConnector?: boolean;
  /** Stage index for animation stagger */
  index?: number;
}

/**
 * Single validation stage display component.
 */
export const ValidationStage = React.memo(function ValidationStage({
  result,
  isExpanded = false,
  onToggle,
  showConnector = true,
  index = 0,
}: ValidationStageProps) {
  const meta = STAGE_META[result.stage];
  const StageIcon = getStageIcon(meta.icon);
  const hasDetails = result.errors.length > 0 || result.warnings.length > 0;

  // Status-specific styling
  const statusConfig = {
    pending: {
      icon: Circle,
      iconClass: 'text-muted-foreground',
      bgClass: 'bg-muted',
      label: 'Pending',
    },
    running: {
      icon: Loader2,
      iconClass: 'text-primary animate-spin',
      bgClass: 'bg-primary/10',
      label: 'Running',
    },
    passed: {
      icon: CheckCircle2,
      iconClass: 'text-success',
      bgClass: 'bg-success/10',
      label: 'Passed',
    },
    failed: {
      icon: XCircle,
      iconClass: 'text-error',
      bgClass: 'bg-error/10',
      label: 'Failed',
    },
    skipped: {
      icon: SkipForward,
      iconClass: 'text-muted-foreground',
      bgClass: 'bg-muted',
      label: 'Skipped',
    },
  };

  const config = statusConfig[result.status];
  const StatusIcon = config.icon;

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05 }}
      className="relative"
    >
      {/* Connector line */}
      {showConnector && (
        <div
          className={cn(
            'bg-border absolute left-4 top-12 ml-4 h-4 w-0.5',
            result.status === 'passed' ? 'bg-success/30'
            : result.status === 'failed' ? 'bg-error/30'
            : result.status === 'running' ? 'bg-primary/30'
            : 'bg-border'
          )}
        />
      )}

      {/* Stage header */}
      <button
        type="button"
        onClick={onToggle}
        disabled={!hasDetails}
        className={cn(
          'flex w-full items-center gap-3 rounded-lg p-3 transition-colors',
          'hover:bg-accent/50 focus-visible:ring-ring focus-visible:outline-none focus-visible:ring-2',
          hasDetails && 'cursor-pointer',
          !hasDetails && 'cursor-default'
        )}
        aria-expanded={hasDetails ? isExpanded : undefined}
      >
        {/* Status icon - per spec: h-8 w-8 rounded-full */}
        <div
          className={cn(
            'flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full',
            config.bgClass
          )}
        >
          <StatusIcon className={cn('h-4 w-4', config.iconClass)} />
        </div>

        {/* Stage info */}
        <div className="min-w-0 flex-1 text-left">
          <div className="flex items-center gap-2">
            <span className="text-foreground text-sm font-medium">{meta.label}</span>
            {result.durationMs !== undefined &&
              result.status !== 'pending' &&
              result.status !== 'running' && (
                <span className="text-muted-foreground text-xs">{result.durationMs}ms</span>
              )}
          </div>
          <p className="text-muted-foreground mt-0.5 truncate text-xs">{meta.description}</p>

          {/* Error/warning counts */}
          {hasDetails && (
            <div className="mt-1.5 flex items-center gap-3">
              {result.errors.length > 0 && (
                <span className="text-error flex items-center gap-1 text-xs">
                  <XCircle className="h-3 w-3" />
                  {result.errors.length} error{result.errors.length !== 1 ? 's' : ''}
                </span>
              )}
              {result.warnings.length > 0 && (
                <span className="text-warning flex items-center gap-1 text-xs">
                  <AlertTriangle className="h-3 w-3" />
                  {result.warnings.length} warning{result.warnings.length !== 1 ? 's' : ''}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Expand/collapse arrow */}
        {hasDetails && (
          <div className="flex-shrink-0">
            {isExpanded ?
              <ChevronDown className="text-muted-foreground h-4 w-4" />
            : <ChevronRight className="text-muted-foreground h-4 w-4" />}
          </div>
        )}
      </button>

      {/* Expandable details */}
      <AnimatePresence>
        {isExpanded && hasDetails && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="ml-12 mr-3 space-y-2 pb-3">
              {/* Errors */}
              {result.errors.map((error, i) => (
                <div
                  key={`error-${i}`}
                  className="bg-error/5 border-error/20 rounded-md border p-2.5"
                >
                  <div className="flex items-start gap-2">
                    <XCircle className="text-error mt-0.5 h-4 w-4 flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-error text-sm font-medium">{error.message}</p>
                      {error.fieldPath && (
                        <p className="text-muted-foreground mt-0.5 text-xs">
                          Field: <code className="font-mono">{error.fieldPath}</code>
                        </p>
                      )}
                      {error.suggestedFix && (
                        <p className="text-muted-foreground mt-1 text-xs">
                          Suggestion: {error.suggestedFix}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}

              {/* Warnings */}
              {result.warnings.map((warning, i) => (
                <div
                  key={`warning-${i}`}
                  className="bg-warning/5 border-warning/20 rounded-md border p-2.5"
                >
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="text-warning mt-0.5 h-4 w-4 flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-warning text-sm font-medium">{warning.message}</p>
                      {warning.fieldPath && (
                        <p className="text-muted-foreground mt-0.5 text-xs">
                          Field: <code className="font-mono">{warning.fieldPath}</code>
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
});

ValidationStage.displayName = 'ValidationStage';
