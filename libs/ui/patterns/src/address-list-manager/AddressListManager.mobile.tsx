/**
 * AddressListManager Mobile Presenter
 *
 * Mobile-optimized view with Sheet slide-out panels for entries.
 * Touch-first with 44px touch targets and bottom navigation.
 *
 * @see ADR-018: Headless Platform Presenters
 * @see NAS-7.3: Implement Address Lists
 */

import { ChevronRight, Shield, Trash2, Clock } from 'lucide-react';

import {
  Card,
  Badge,
  Button,
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  ScrollArea,
  cn,
} from '@nasnet/ui/primitives';

import type { AddressListManagerProps, AddressList, AddressListEntry } from './types';
import type { UseAddressListManagerStateReturn } from './useAddressListManagerState';

export interface AddressListManagerMobileProps
  extends AddressListManagerProps,
    UseAddressListManagerStateReturn {}

/**
 * Mobile presenter for AddressListManager
 *
 * Features:
 * - Touch-optimized card list
 * - Sheet slide-out panels for entries
 * - 44px minimum touch targets
 * - Simplified layout for small screens
 */
export function AddressListManagerMobile(
  props: AddressListManagerMobileProps
) {
  const {
    lists,
    isLoading,
    error,
    onDeleteList,
    className,
    emptyMessage = 'No address lists found',
    emptyAction,
    // State from headless hook
    isExpanded,
    toggleExpanded,
    showRulesForList,
    selectedListForRules,
    closeRulesModal,
  } = props;

  // Loading state
  if (isLoading) {
    return (
      <div className={cn('p-4', className)}>
        <Card className="p-6">
          <div className="flex items-center justify-center">
            <div className="text-muted-foreground">Loading...</div>
          </div>
        </Card>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className={cn('p-4', className)}>
        <Card className="p-6 border-error">
          <div className="flex items-center justify-center text-error text-center">
            Error: {error.message}
          </div>
        </Card>
      </div>
    );
  }

  // Empty state
  if (lists.length === 0) {
    return (
      <div className={cn('p-4', className)}>
        <Card className="p-8">
          <div className="flex flex-col items-center justify-center space-y-4">
            <Shield className="h-12 w-12 text-muted-foreground" />
            <p className="text-muted-foreground text-center">{emptyMessage}</p>
            {emptyAction}
          </div>
        </Card>
      </div>
    );
  }

  // Get the currently selected list for the sheet
  const selectedList = lists.find((list) => list.name === selectedListForRules);

  return (
    <div className={cn('space-y-3 p-4', className)}>
      {lists.map((list) => (
        <ListCard
          key={list.name}
          list={list}
          onTap={() => toggleExpanded(list.name)}
          onShowRules={() => showRulesForList(list.name)}
          onDelete={onDeleteList ? () => onDeleteList(list.name) : undefined}
        />
      ))}

      {/* Entries Sheet */}
      {selectedList && (
        <Sheet
          open={isExpanded(selectedList.name)}
          onOpenChange={(open) => !open && toggleExpanded(selectedList.name)}
        >
          <SheetContent side="bottom" className="h-[80vh]">
            <SheetHeader>
              <SheetTitle className="font-mono">{selectedList.name}</SheetTitle>
              <SheetDescription>
                {selectedList.entryCount} entries
                {selectedList.dynamicCount > 0 &&
                  ` (${selectedList.dynamicCount} dynamic)`}
              </SheetDescription>
            </SheetHeader>
            <ScrollArea className="h-[calc(80vh-8rem)] mt-4">
              <div className="space-y-2">
                {selectedList.entries && selectedList.entries.length > 0 ? (
                  selectedList.entries.map((entry) => (
                    <EntryCard key={entry.id} entry={entry} />
                  ))
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    No entries in this list
                  </div>
                )}
              </div>
            </ScrollArea>
          </SheetContent>
        </Sheet>
      )}
    </div>
  );
}

/**
 * Individual list card component
 */
interface ListCardProps {
  list: AddressList;
  onTap: () => void;
  onShowRules: () => void;
  onDelete?: () => void;
}

function ListCard({ list, onTap, onShowRules, onDelete }: ListCardProps) {
  return (
    <Card
      className="p-4 border-l-4 border-l-category-firewall cursor-pointer active:bg-muted"
      onClick={onTap}
    >
      <div className="space-y-3">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <h3 className="font-mono font-medium text-base truncate">
              {list.name}
            </h3>
          </div>
          <ChevronRight className="h-5 w-5 text-muted-foreground flex-shrink-0 ml-2" />
        </div>

        {/* Stats */}
        <div className="flex flex-wrap gap-2">
          <Badge variant="outline" className="text-xs">
            {list.entryCount} entries
          </Badge>
          {list.dynamicCount > 0 && (
            <Badge variant="secondary" className="text-xs">
              {list.dynamicCount} dynamic
            </Badge>
          )}
          {list.referencingRulesCount > 0 && (
            <Badge
              variant="outline"
              className="text-xs bg-category-firewall/10"
              onClick={(e) => {
                e.stopPropagation();
                onShowRules();
              }}
            >
              <Shield className="h-3 w-3 mr-1" />
              {list.referencingRulesCount} rules
            </Badge>
          )}
        </div>

        {/* Actions */}
        {onDelete && (
          <div className="flex gap-2 pt-2 border-t">
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onShowRules();
              }}
              className="flex-1 h-11"
            >
              <Shield className="h-4 w-4 mr-2" />
              Show Rules
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
              className="h-11 text-destructive"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
    </Card>
  );
}

/**
 * Individual entry card component
 */
interface EntryCardProps {
  entry: AddressListEntry;
}

function EntryCard({ entry }: EntryCardProps) {
  return (
    <Card className="p-3">
      <div className="space-y-2">
        {/* Address */}
        <div className="flex items-center justify-between">
          <span className="font-mono text-sm font-medium">{entry.address}</span>
          {entry.dynamic && (
            <Badge variant="secondary" className="text-xs">
              Dynamic
            </Badge>
          )}
        </div>

        {/* Comment */}
        {entry.comment && (
          <p className="text-sm text-muted-foreground">{entry.comment}</p>
        )}

        {/* Metadata */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          {entry.timeout && (
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {entry.timeout}
            </div>
          )}
          {entry.creationTime && (
            <span>
              Created{' '}
              {new Date(entry.creationTime).toLocaleDateString()}
            </span>
          )}
        </div>

        {/* Disabled badge */}
        {entry.disabled && (
          <Badge variant="outline" className="text-xs">
            Disabled
          </Badge>
        )}
      </div>
    </Card>
  );
}
