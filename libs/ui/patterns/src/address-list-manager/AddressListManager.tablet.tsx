/**
 * AddressListManager Tablet Presenter
 *
 * Tablet-optimized view with collapsible sidebar and master-detail pattern.
 * Balanced density with touch-friendly interactions.
 *
 * @see ADR-018: Headless Platform Presenters
 * @see NAS-7.3: Implement Address Lists
 */

import { memo, useMemo } from 'react';

import { ChevronRight, Shield, Trash2, ChevronDown } from 'lucide-react';

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

import type { AddressListManagerProps, AddressList } from './types';
import type { UseAddressListManagerStateReturn } from './useAddressListManagerState';

export interface AddressListManagerTabletProps
  extends AddressListManagerProps,
    UseAddressListManagerStateReturn {}

/**
 * Tablet presenter for AddressListManager
 *
 * Features:
 * - Master-detail layout with collapsible list panel
 * - Touch-friendly interaction targets
 * - Sheet panels for detailed entry viewing
 * - Balanced information density
 */
export const AddressListManagerTablet = memo(function AddressListManagerTablet(
  props: AddressListManagerTabletProps
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

  // Sort lists alphabetically
  const sortedLists = useMemo(() => {
    return [...lists].sort((a, b) => a.name.localeCompare(b.name));
  }, [lists]);

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
      <div className={cn('p-6', className)}>
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

  // Get currently selected list
  const selectedList = sortedLists.find(
    (list) => list.name === selectedListForRules
  );

  return (
    <div className={cn('flex flex-col space-y-4', className)}>
      {/* List panel */}
      <Card className="border-category-firewall">
        <ScrollArea className="h-[400px]">
          <div className="space-y-2 p-4">
            {sortedLists.map((list) => (
              <ListItem
                key={list.name}
                list={list}
                expanded={isExpanded(list.name)}
                onToggle={() => toggleExpanded(list.name)}
                onShowRules={() => showRulesForList(list.name)}
                onDelete={
                  onDeleteList ? () => onDeleteList(list.name) : undefined
                }
              />
            ))}
          </div>
        </ScrollArea>
      </Card>

      {/* Detail panel */}
      {selectedList && (
        <Sheet
          open={isExpanded(selectedList.name)}
          onOpenChange={(open) => !open && toggleExpanded(selectedList.name)}
        >
          <SheetContent side="right" className="w-full sm:w-96">
            <SheetHeader>
              <SheetTitle className="font-mono">{selectedList.name}</SheetTitle>
              <SheetDescription>
                {selectedList.entryCount} entries
                {selectedList.dynamicCount > 0 &&
                  ` (${selectedList.dynamicCount} dynamic)`}
              </SheetDescription>
            </SheetHeader>
            <ScrollArea className="h-[calc(100vh-8rem)] mt-4">
              <div className="space-y-3 pr-4">
                {selectedList.entries && selectedList.entries.length > 0 ? (
                  selectedList.entries.map((entry) => (
                    <Card key={entry.id} className="p-3">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-mono text-sm font-medium">
                            {entry.address}
                          </span>
                          {entry.dynamic && (
                            <Badge variant="secondary" className="text-xs">
                              Dynamic
                            </Badge>
                          )}
                        </div>
                        {entry.comment && (
                          <p className="text-sm text-muted-foreground">
                            {entry.comment}
                          </p>
                        )}
                        {entry.timeout && (
                          <Badge variant="outline" className="text-xs">
                            {entry.timeout}
                          </Badge>
                        )}
                      </div>
                    </Card>
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
});

AddressListManagerTablet.displayName = 'AddressListManagerTablet';

/**
 * Individual list item component for tablet
 */
interface ListItemProps {
  list: AddressList;
  expanded: boolean;
  onToggle: () => void;
  onShowRules: () => void;
  onDelete?: () => void;
}

const ListItem = memo(function ListItem({
  list,
  expanded,
  onToggle,
  onShowRules,
  onDelete,
}: ListItemProps) {
  return (
    <Card
      className="p-3 cursor-pointer hover:bg-muted/50 border-l-4 border-l-category-firewall transition-colors"
      onClick={onToggle}
    >
      <div className="space-y-2">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <h3 className="font-mono font-medium text-sm truncate">
              {list.name}
            </h3>
          </div>
          {expanded ? (
            <ChevronDown className="h-5 w-5 text-muted-foreground flex-shrink-0 ml-2" />
          ) : (
            <ChevronRight className="h-5 w-5 text-muted-foreground flex-shrink-0 ml-2" />
          )}
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
              className="flex-1 h-10 text-xs"
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
              className="h-10 text-destructive"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
    </Card>
  );
});
