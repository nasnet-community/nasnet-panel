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
import {
  getActionsForTopic,
  extractDataFromMessage,
  type LogAction,
} from './logActionRegistry';

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
 * Context menu for log entry actions
 */
export function LogActionMenu({
  entry,
  onAction,
  isBookmarked = false,
  trigger,
  className,
}: LogActionMenuProps) {
  const actions = React.useMemo(
    () => getActionsForTopic(entry.topic),
    [entry.topic]
  );

  // Separate topic-specific and common actions
  const topicActions = actions.filter(
    (a) => !['copy', 'bookmark', 'view-details'].includes(a.id)
  );
  const commonActions = actions.filter((a) =>
    ['copy', 'bookmark', 'view-details'].includes(a.id)
  );

  const handleAction = (action: LogAction) => {
    const extractedData = extractDataFromMessage(entry.message, action);
    onAction(action, extractedData);
  };

  const getIcon = (iconName: string) => {
    const Icon = iconMap[iconName] || MoreVertical;
    return <Icon className="h-4 w-4 mr-2" />;
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        {trigger || (
          <button
            className={`p-1 rounded-button hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors ${className || ''}`}
            aria-label="Log entry actions"
          >
            <MoreVertical className="h-4 w-4 text-slate-500" />
          </button>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
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
            {action.id === 'bookmark' ? (
              <>
                <Pin
                  className={`h-4 w-4 mr-2 ${isBookmarked ? 'fill-current text-primary-500' : ''}`}
                />
                <span>{isBookmarked ? 'Remove Bookmark' : 'Bookmark'}</span>
              </>
            ) : (
              <>
                {getIcon(action.icon)}
                <span>{action.label}</span>
              </>
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}



























