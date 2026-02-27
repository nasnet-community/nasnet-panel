/**
 * Log Action Context Menu Component
 * Epic 0.8: System Logs - Custom Log Actions
 */

import * as React from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  cn,
} from '@nasnet/ui/primitives';
import {
  MoreVertical,
  Copy,
  Pin,
  ExternalLink,
  Shield,
  Plus,
  Ban,
  Network,
  Lock,
  Wifi,
  WifiOff,
  Cable,
  Globe,
  Route,
  Plug,
  Code,
} from 'lucide-react';
import type { LogEntry } from '@nasnet/core/types';
import { getActionsForTopic, extractDataFromMessage, type LogAction } from './logActionRegistry';

/**
 * Icon mapping for action icons
 */
const iconMap: Record<string, React.ElementType> = {
  Copy,
  Pin,
  ExternalLink,
  Shield,
  Plus,
  Ban,
  Network,
  Lock,
  Wifi,
  WifiOff,
  Cable,
  Globe,
  Route,
  Plug,
  Code,
  MoreVertical,
};

export interface LogActionMenuProps {
  /**
   * The log entry to show actions for
   */
  entry: LogEntry;
  /**
   * Handler for action selection
   */
  onAction: (action: LogAction, extractedData: string | null) => void;
  /**
   * Whether the entry is bookmarked
   */
  isBookmarked?: boolean;
  /**
   * Optional trigger element (defaults to MoreVertical icon)
   */
  trigger?: React.ReactNode;
  /**
   * Additional class names for the trigger
   */
  className?: string;
}

/**
 * @description Context menu for log entry actions including copy, bookmark, and topic-specific actions
 */
export const LogActionMenu = React.memo(function LogActionMenu({
  entry,
  onAction,
  isBookmarked = false,
  trigger,
  className,
}: LogActionMenuProps) {
  const actions = React.useMemo(() => getActionsForTopic(entry.topic), [entry.topic]);

  // Separate topic-specific and common actions
  const topicActions = React.useMemo(
    () => actions.filter((a) => !['copy', 'bookmark', 'view-details'].includes(a.id)),
    [actions]
  );

  const commonActions = React.useMemo(
    () => actions.filter((a) => ['copy', 'bookmark', 'view-details'].includes(a.id)),
    [actions]
  );

  const handleAction = React.useCallback(
    (action: LogAction) => {
      const extractedData = extractDataFromMessage(entry.message, action);
      onAction(action, extractedData);
    },
    [entry.message, onAction]
  );

  const getIcon = React.useCallback((iconName: string) => {
    const Icon = iconMap[iconName] || MoreVertical;
    return (
      <Icon
        className="mr-2 h-4 w-4"
        aria-hidden="true"
      />
    );
  }, []);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        {trigger || (
          <button
            className={cn(
              'p-component-sm rounded-button hover:bg-muted focus-visible:ring-ring min-h-[44px] min-w-[44px] transition-colors focus-visible:ring-2 focus-visible:ring-offset-2',
              className
            )}
            aria-label="Log entry actions"
          >
            <MoreVertical
              className="text-muted-foreground h-4 w-4"
              aria-hidden="true"
            />
          </button>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-56"
      >
        {/* Topic-specific actions */}
        {topicActions.length > 0 && (
          <>
            {topicActions.map((action) => (
              <DropdownMenuItem
                key={action.id}
                onClick={() => handleAction(action)}
                className="cursor-pointer"
              >
                {getIcon(action.icon)}
                <span>{action.label}</span>
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
          </>
        )}

        {/* Common actions */}
        {commonActions.map((action) => (
          <DropdownMenuItem
            key={action.id}
            onClick={() => handleAction(action)}
            className="cursor-pointer"
          >
            {action.id === 'bookmark' ?
              <>
                <Pin
                  className={`mr-2 h-4 w-4 ${isBookmarked ? 'text-primary fill-current' : ''}`}
                  aria-hidden="true"
                />
                <span>{isBookmarked ? 'Remove Bookmark' : 'Bookmark'}</span>
              </>
            : <>
                {getIcon(action.icon)}
                <span>{action.label}</span>
              </>
            }
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
});

LogActionMenu.displayName = 'LogActionMenu';
