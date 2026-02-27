/**
 * ChangelogModal Component (NAS-8.7)
 *
 * Displays GitHub release notes with version information and warnings.
 *
 * @description Displays a modal with release notes for service updates, including severity,
 * version diff, security warnings, and a link to the full changelog on GitHub.
 *
 * @example
 * ```tsx
 * <ChangelogModal
 *   open={modalOpen}
 *   onClose={() => setModalOpen(false)}
 *   instanceName="Tor Proxy"
 *   currentVersion="1.0.0"
 *   newVersion="1.1.0"
 *   severity="SECURITY"
 *   changelogUrl="https://github.com/torproject/tor/releases/tag/v1.1.0"
 *   securityFixes={true}
 * />
 * ```
 */

import React from 'react';

import { ExternalLink, ShieldAlert, AlertCircle, ArrowUp, CheckCircle } from 'lucide-react';

import type { UpdateSeverity } from '@nasnet/api-client/queries';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  Button,
  Badge,
  Separator,
  cn,
} from '@nasnet/ui/primitives';

export interface ChangelogModalProps {
  /** Whether the modal is open */
  open: boolean;

  /** Callback to close the modal */
  onClose: () => void;

  /** Service instance name */
  instanceName: string;

  /** Current version */
  currentVersion: string;

  /** New version */
  newVersion: string;

  /** Update severity */
  severity: UpdateSeverity;

  /** Changelog URL (GitHub releases) */
  changelogUrl: string;

  /** Release date (ISO string) */
  releaseDate?: string;

  /** Whether update includes security fixes */
  securityFixes?: boolean;

  /** Whether update has breaking changes */
  breakingChanges?: boolean;

  /** Optional CSS class name */
  className?: string;
}

/**
 * Severity icon mapping
 */
const SEVERITY_ICONS = {
  SECURITY: ShieldAlert,
  MAJOR: AlertCircle,
  MINOR: ArrowUp,
  PATCH: CheckCircle,
};

/**
 * Severity color mapping
 */
const SEVERITY_COLORS: Record<UpdateSeverity, string> = {
  SECURITY: 'bg-error/10 text-error border-error/20',
  MAJOR: 'bg-warning/10 text-warning border-warning/20',
  MINOR: 'bg-info/10 text-info border-info/20',
  PATCH: 'bg-success/10 text-success border-success/20',
};

/**
 * Severity label mapping
 */
const SEVERITY_LABELS: Record<UpdateSeverity, string> = {
  SECURITY: 'Security Update',
  MAJOR: 'Major Update',
  MINOR: 'Minor Update',
  PATCH: 'Patch Update',
};

function ChangelogModalComponent(props: ChangelogModalProps) {
  const {
    open,
    onClose,
    instanceName,
    currentVersion,
    newVersion,
    severity,
    changelogUrl,
    releaseDate,
    securityFixes,
    breakingChanges,
    className,
  } = props;

  const SeverityIcon = SEVERITY_ICONS[severity];
  const severityColor = SEVERITY_COLORS[severity];
  const severityLabel = SEVERITY_LABELS[severity];

  // Format release date
  const formattedDate = React.useMemo(() => {
    if (!releaseDate) return null;
    try {
      const date = new Date(releaseDate);
      // Check if date is valid
      if (isNaN(date.getTime())) return null;
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch {
      return null;
    }
  }, [releaseDate]);

  // Open changelog URL in new tab
  const handleOpenChangelog = React.useCallback(() => {
    window.open(changelogUrl, '_blank', 'noopener,noreferrer');
  }, [changelogUrl]);

  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => !isOpen && onClose()}
    >
      <DialogContent className={cn('max-h-[80vh] max-w-2xl overflow-y-auto', className)}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <SeverityIcon
              className="h-6 w-6"
              aria-hidden="true"
            />
            <span>{instanceName} Update</span>
          </DialogTitle>
          <DialogDescription>View changelog and release notes for this update</DialogDescription>
        </DialogHeader>

        <div className="space-y-component-lg py-component-md">
          {/* Severity badge */}
          <div className="flex items-center justify-between">
            <Badge
              className={cn(
                'gap-component-sm px-component-md inline-flex items-center border py-1.5 text-sm font-medium',
                severityColor
              )}
            >
              <SeverityIcon
                className="h-4 w-4"
                aria-hidden="true"
              />
              {severityLabel}
            </Badge>
            {formattedDate && (
              <span className="text-muted-foreground text-sm">Released {formattedDate}</span>
            )}
          </div>

          {/* Version diff */}
          <div className="bg-muted p-component-md rounded-md">
            <h3 className="text-muted-foreground mb-component-sm text-sm font-medium">
              Version Change
            </h3>
            <p className="font-mono text-lg">
              <span className="text-muted-foreground">v{currentVersion}</span>
              <span className="mx-component-md text-muted-foreground">→</span>
              <span className="text-foreground font-mono font-semibold">v{newVersion}</span>
            </p>
          </div>

          {/* Warnings */}
          {(securityFixes || breakingChanges) && (
            <div className="space-y-component-sm">
              {securityFixes && (
                <div className="gap-component-md border-error/20 bg-error/10 p-component-sm flex items-start rounded-md border">
                  <ShieldAlert
                    className="text-error mt-0.5 h-5 w-5 flex-shrink-0"
                    aria-hidden="true"
                  />
                  <div className="flex-1">
                    <p className="text-error text-sm font-medium">Security Fixes Included</p>
                    <p className="text-muted-foreground mt-component-sm text-xs">
                      This update includes important security patches. We recommend updating as soon
                      as possible.
                    </p>
                  </div>
                </div>
              )}
              {breakingChanges && (
                <div className="gap-component-md border-warning/20 bg-warning/10 p-component-sm flex items-start rounded-md border">
                  <AlertCircle
                    className="text-warning mt-0.5 h-5 w-5 flex-shrink-0"
                    aria-hidden="true"
                  />
                  <div className="flex-1">
                    <p className="text-warning text-sm font-medium">Breaking Changes</p>
                    <p className="text-muted-foreground mt-component-sm text-xs">
                      This update contains breaking changes. Review the changelog before updating.
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          <Separator />

          {/* Changelog preview message */}
          <div className="py-component-lg space-y-component-md text-center">
            <p className="text-muted-foreground text-sm">
              For detailed release notes and changelog, visit the GitHub release page.
            </p>
            <Button
              onClick={handleOpenChangelog}
              className="inline-flex items-center gap-2"
            >
              <ExternalLink
                className="h-4 w-4"
                aria-hidden="true"
              />
              View Full Changelog on GitHub
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/**
 * ChangelogModal - Displays release notes for service updates
 */
export const ChangelogModal = React.memo(ChangelogModalComponent);
ChangelogModal.displayName = 'ChangelogModal';
