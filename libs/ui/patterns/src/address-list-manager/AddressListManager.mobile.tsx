/**
 * AddressListManager Mobile Presenter
 *
 * Mobile-optimized view with Sheet slide-out panels for entries.
 * Touch-first with 44px touch targets and bottom navigation.
 *
 * @see ADR-018: Headless Platform Presenters
 * @see NAS-7.3: Implement Address Lists
 */

import { memo, useCallback } from 'react';

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
 * Individual list card component
 */
interface ListCardProps {
  list: AddressList;
  onTap: () => void;
  onShowRules: () => void;
  onDelete?: () => void;
}

const ListCard = memo(function ListCard({ list, onTap, onShowRules, onDelete }: ListCardProps) {
  const handleTap = useCallback(onTap, [onTap]);
  const handleShowRules = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      onShowRules();
    },
    [onShowRules]
  );
  const handleDelete = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      onDelete?.();
    },
    [onDelete]
  );

  return (
    <Card
      className="border-l-category-firewall active:bg-muted cursor-pointer border-l-4 p-4"
      onClick={handleTap}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleTap();
        }
      }}
      aria-expanded={false}
      aria-label={`Address list: ${list.name}`}
    >
      <div className="space-y-3">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="min-w-0 flex-1">
            <h3 className="truncate font-mono text-base font-medium">{list.name}</h3>
          </div>
          <ChevronRight className="text-muted-foreground ml-2 h-5 w-5 flex-shrink-0" />
        </div>

        {/* Stats */}
        <div className="flex flex-wrap gap-2">
          <Badge
            variant="outline"
            className="text-xs"
          >
            {list.entryCount} entries
          </Badge>
          {list.dynamicCount > 0 && (
            <Badge
              variant="secondary"
              className="text-xs"
            >
              {list.dynamicCount} dynamic
            </Badge>
          )}
          {list.referencingRulesCount > 0 && (
            <Badge
              variant="outline"
              className="bg-category-firewall/10 text-xs"
              onClick={handleShowRules}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  handleShowRules(e as any);
                }
              }}
              aria-label={`Show rules for ${list.name}`}
            >
              <Shield
                className="mr-1 h-3 w-3"
                aria-hidden="true"
              />
              {list.referencingRulesCount} rules
            </Badge>
          )}
        </div>

        {/* Actions */}
        {onDelete && (
          <div className="flex gap-2 border-t pt-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleShowRules}
              className="h-11 flex-1"
              aria-label={`Show rules for ${list.name}`}
            >
              <Shield
                className="mr-2 h-4 w-4"
                aria-hidden="true"
              />
              Show Rules
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDelete}
              className="text-destructive h-11"
              aria-label={`Delete address list ${list.name}`}
            >
              <Trash2
                className="h-4 w-4"
                aria-hidden="true"
              />
            </Button>
          </div>
        )}
      </div>
    </Card>
  );
});

/**
 * Individual entry card component
 */
interface EntryCardProps {
  entry: AddressListEntry;
}

const EntryCard = memo(function EntryCard({ entry }: EntryCardProps) {
  return (
    <Card className="p-3">
      <div className="space-y-2">
        {/* Address */}
        <div className="flex items-center justify-between">
          <span
            className="font-mono text-sm font-medium"
            title={entry.address}
          >
            {entry.address}
          </span>
          {entry.dynamic && (
            <Badge
              variant="secondary"
              className="text-xs"
            >
              Dynamic
            </Badge>
          )}
        </div>

        {/* Comment */}
        {entry.comment && <p className="text-muted-foreground text-sm">{entry.comment}</p>}

        {/* Metadata */}
        <div className="text-muted-foreground flex items-center gap-2 text-xs">
          {entry.timeout && (
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {entry.timeout}
            </div>
          )}
          {entry.creationTime && (
            <span>Created {new Date(entry.creationTime).toLocaleDateString()}</span>
          )}
        </div>

        {/* Disabled badge */}
        {entry.disabled && (
          <Badge
            variant="outline"
            className="text-xs"
          >
            Disabled
          </Badge>
        )}
      </div>
    </Card>
  );
});

/**
 * Mobile presenter for AddressListManager
 *
 * Features:
 * - Touch-optimized card list
 * - Sheet slide-out panels for entries
 * - 44px minimum touch targets
 * - Simplified layout for small screens
 */
export const AddressListManagerMobile = memo(function AddressListManagerMobile(
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
        <Card
          className="p-6"
          role="status"
          aria-live="polite"
        >
          <div className="flex items-center justify-center">
            <div className="text-muted-foreground">Loading address lists...</div>
          </div>
        </Card>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className={cn('p-4', className)}>
        <Card
          className="border-error p-6"
          role="alert"
          aria-live="assertive"
        >
          <div className="text-error flex items-center justify-center text-center">
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
            <Shield
              className="text-muted-foreground h-12 w-12"
              aria-hidden="true"
            />
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
          <SheetContent
            side="bottom"
            className="h-[80vh]"
          >
            <SheetHeader>
              <SheetTitle className="font-mono">{selectedList.name}</SheetTitle>
              <SheetDescription>
                {selectedList.entryCount} entries
                {selectedList.dynamicCount > 0 && ` (${selectedList.dynamicCount} dynamic)`}
              </SheetDescription>
            </SheetHeader>
            <ScrollArea className="mt-4 h-[calc(80vh-8rem)]">
              <div className="space-y-2">
                {selectedList.entries && selectedList.entries.length > 0 ?
                  selectedList.entries.map((entry) => (
                    <EntryCard
                      key={entry.id}
                      entry={entry}
                    />
                  ))
                : <div className="text-muted-foreground py-8 text-center">
                    No entries in this list
                  </div>
                }
              </div>
            </ScrollArea>
          </SheetContent>
        </Sheet>
      )}
    </div>
  );
});

AddressListManagerMobile.displayName = 'AddressListManagerMobile';
ListCard.displayName = 'ListCard';
EntryCard.displayName = 'EntryCard';
