/**
 * Log Detail Panel Component
 * Side panel showing full log entry details
 * Epic 0.8: System Logs - Log Entry Details Panel
 */

import * as React from 'react';
import {
  Button,
  cn,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@nasnet/ui/primitives';
import { Copy, X, ChevronLeft, ChevronRight, ExternalLink } from 'lucide-react';
import { useToast } from '@nasnet/ui/primitives';
import type { LogEntry } from '@nasnet/core/types';
import { SeverityBadge } from '../severity-badge';
import { topicBadgeVariants } from '../log-entry';

export interface LogDetailPanelProps {
  /**
   * The log entry to display
   */
  entry: LogEntry | null;
  /**
   * Whether the panel is open
   */
  isOpen: boolean;
  /**
   * Close handler
   */
  onClose: () => void;
  /**
   * Related entries (from same topic, for context)
   */
  relatedEntries?: LogEntry[];
  /**
   * Navigate to previous entry
   */
  onPrevious?: () => void;
  /**
   * Navigate to next entry
   */
  onNext?: () => void;
  /**
   * Whether there is a previous entry
   */
  hasPrevious?: boolean;
  /**
   * Whether there is a next entry
   */
  hasNext?: boolean;
}

/**
 * Format topic label
 */
function formatTopicLabel(topic: string): string {
  return topic.charAt(0).toUpperCase() + topic.slice(1);
}

/**
 * LogDetailPanel Component
 */
export function LogDetailPanel({
  entry,
  isOpen,
  onClose,
  relatedEntries = [],
  onPrevious,
  onNext,
  hasPrevious = false,
  hasNext = false,
}: LogDetailPanelProps) {
  const { toast } = useToast();

  if (!entry) return null;

  const handleCopy = async () => {
    const text = `[${new Date(entry.timestamp).toISOString()}] [${entry.topic}] [${entry.severity}] ${entry.message}`;
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: 'Copied to clipboard',
        description: 'Log entry has been copied',
      });
    } catch {
      toast({
        title: 'Failed to copy',
        description: 'Could not copy to clipboard',
        variant: 'destructive',
      });
    }
  };

  const handleCopyLink = async () => {
    const url = `${window.location.href.split('#')[0]}#log-${entry.id}`;
    try {
      await navigator.clipboard.writeText(url);
      toast({
        title: 'Link copied',
        description: 'Direct link to this log entry has been copied',
      });
    } catch {
      toast({
        title: 'Failed to copy',
        variant: 'destructive',
      });
    }
  };

  const timestamp = new Date(entry.timestamp);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-lg sm:max-w-xl">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-base">Log Entry Details</DialogTitle>
            <div className="flex items-center gap-1">
              {onPrevious && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onPrevious}
                  disabled={!hasPrevious}
                  aria-label="Previous entry"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
              )}
              {onNext && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onNext}
                  disabled={!hasNext}
                  aria-label="Next entry"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4">
          {/* Timestamp */}
          <div>
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Timestamp
            </label>
            <p className="font-mono text-sm mt-1">
              {timestamp.toLocaleString()} ({timestamp.toISOString()})
            </p>
          </div>

          {/* Topic & Severity */}
          <div className="flex items-center gap-4">
            <div>
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Topic
              </label>
              <div className="mt-1">
                <span className={cn(topicBadgeVariants({ topic: entry.topic }))}>
                  {formatTopicLabel(entry.topic)}
                </span>
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Severity
              </label>
              <div className="mt-1">
                <SeverityBadge severity={entry.severity} />
              </div>
            </div>
          </div>

          {/* Message */}
          <div>
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Message
            </label>
            <div className="mt-1 p-3 rounded-card-sm bg-slate-50 dark:bg-slate-800 border">
              <p className="text-sm whitespace-pre-wrap break-words font-mono">
                {entry.message}
              </p>
            </div>
          </div>

          {/* Related entries */}
          {relatedEntries.length > 0 && (
            <div>
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Related Entries ({relatedEntries.length})
              </label>
              <div className="mt-1 space-y-1 max-h-32 overflow-y-auto">
                {relatedEntries.slice(0, 5).map((related) => (
                  <div
                    key={related.id}
                    className="flex items-center gap-2 text-xs p-2 rounded bg-slate-50 dark:bg-slate-800"
                  >
                    <span className="text-muted-foreground font-mono">
                      {new Date(related.timestamp).toLocaleTimeString()}
                    </span>
                    <SeverityBadge severity={related.severity} />
                    <span className="truncate flex-1">{related.message}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-2 pt-2 border-t">
            <Button variant="outline" size="sm" onClick={handleCopy} className="gap-2">
              <Copy className="h-4 w-4" />
              Copy Entry
            </Button>
            <Button variant="outline" size="sm" onClick={handleCopyLink} className="gap-2">
              <ExternalLink className="h-4 w-4" />
              Copy Link
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}




