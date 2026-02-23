/**
 * AddressListManager Desktop Presenter
 *
 * Desktop-optimized view with expandable table rows and virtualization.
 * Pro-grade density with hover states and dropdown menus.
 *
 * @see ADR-018: Headless Platform Presenters
 * @see NAS-7.3: Implement Address Lists
 */

import { useState, useMemo, useRef, memo, useCallback } from 'react';

import { useVirtualizer } from '@tanstack/react-virtual';
import { ChevronDown, ChevronRight, Shield, Trash2 } from 'lucide-react';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Badge,
  Button,
  Card,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  cn,
} from '@nasnet/ui/primitives';

import type { AddressListManagerProps, AddressList, SortConfig } from './types';
import type { UseAddressListManagerStateReturn } from './useAddressListManagerState';

export interface AddressListManagerDesktopProps
  extends AddressListManagerProps,
    UseAddressListManagerStateReturn {}

/**
 * Desktop presenter for AddressListManager
 *
 * Features:
 * - Expandable table rows with virtualization
 * - Sortable columns
 * - Dropdown menus for actions
 * - Dense layout optimized for desktop
 */
export const AddressListManagerDesktop = memo(function AddressListManagerDesktop(
  props: AddressListManagerDesktopProps
) {
  const {
    lists,
    isLoading,
    error,
    onDeleteList,
    onFetchReferencingRules,
    enableVirtualization = true,
    className,
    emptyMessage = 'No address lists found',
    emptyAction,
    // State from headless hook
    isExpanded,
    toggleExpanded,
    showRulesForList,
  } = props;

  // Sort state
  const [sortConfig, setSortConfig] = useState<SortConfig>({
    field: 'name',
    direction: 'asc',
  });

  // Sort lists
  const sortedLists = useMemo(() => {
    const sorted = [...lists];
    sorted.sort((a, b) => {
      const { field, direction } = sortConfig;
      let comparison = 0;

      switch (field) {
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'entryCount':
          comparison = a.entryCount - b.entryCount;
          break;
        case 'dynamicCount':
          comparison = a.dynamicCount - b.dynamicCount;
          break;
        case 'referencingRulesCount':
          comparison = a.referencingRulesCount - b.referencingRulesCount;
          break;
      }

      return direction === 'asc' ? comparison : -comparison;
    });
    return sorted;
  }, [lists, sortConfig]);

  // Virtualization setup
  const parentRef = useRef<HTMLDivElement>(null);
  const rowVirtualizer = useVirtualizer({
    count: sortedLists.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 60, // Estimated row height
    overscan: 5,
    enabled: enableVirtualization && sortedLists.length > 50,
  });

  // Handle sort with useCallback to prevent unnecessary re-renders
  const handleSort = useCallback((field: SortConfig['field']) => {
    setSortConfig((prev) => ({
      field,
      direction:
        prev.field === field && prev.direction === 'asc' ? 'desc' : 'asc',
    }));
  }, []);

  // Loading state
  if (isLoading) {
    return (
      <Card className={cn('p-6', className)} role="status" aria-live="polite">
        <div className="flex items-center justify-center">
          <div className="text-muted-foreground">Loading address lists...</div>
        </div>
      </Card>
    );
  }

  // Error state
  if (error) {
    return (
      <Card
        className={cn('p-6 border-error', className)}
        role="alert"
        aria-live="assertive"
      >
        <div className="flex items-center justify-center text-error">
          Error loading address lists: {error.message}
        </div>
      </Card>
    );
  }

  // Empty state
  if (lists.length === 0) {
    return (
      <Card className={cn('p-12', className)}>
        <div className="flex flex-col items-center justify-center space-y-4">
          <Shield
            className="h-12 w-12 text-muted-foreground"
            aria-hidden="true"
          />
          <p className="text-muted-foreground text-center">{emptyMessage}</p>
          {emptyAction}
        </div>
      </Card>
    );
  }

  // Render virtualized or standard table
  const useVirtualization = enableVirtualization && sortedLists.length > 50;

  return (
    <Card
      className={cn('overflow-hidden border-l-4 border-l-category-firewall', className)}
      role="region"
      aria-label="Address lists manager"
    >
      <div
        ref={parentRef}
        className={cn('overflow-auto', useVirtualization && 'h-[600px]')}
      >
        <Table role="presentation">
          <TableHeader className="sticky top-0 z-10 bg-background">
            <TableRow role="row">
              <TableHead className="w-[40px]"></TableHead>
              <TableHead
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => handleSort('name')}
              >
                <div className="flex items-center gap-1">
                  List Name
                  {sortConfig.field === 'name' && (
                    <ChevronDown
                      className={cn(
                        'h-4 w-4 transition-transform',
                        sortConfig.direction === 'desc' && 'rotate-180'
                      )}
                    />
                  )}
                </div>
              </TableHead>
              <TableHead
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => handleSort('entryCount')}
              >
                <div className="flex items-center gap-1">
                  Entries
                  {sortConfig.field === 'entryCount' && (
                    <ChevronDown
                      className={cn(
                        'h-4 w-4 transition-transform',
                        sortConfig.direction === 'desc' && 'rotate-180'
                      )}
                    />
                  )}
                </div>
              </TableHead>
              <TableHead
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => handleSort('dynamicCount')}
              >
                <div className="flex items-center gap-1">
                  Dynamic
                  {sortConfig.field === 'dynamicCount' && (
                    <ChevronDown
                      className={cn(
                        'h-4 w-4 transition-transform',
                        sortConfig.direction === 'desc' && 'rotate-180'
                      )}
                    />
                  )}
                </div>
              </TableHead>
              <TableHead
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => handleSort('referencingRulesCount')}
              >
                <div className="flex items-center gap-1">
                  Rules
                  {sortConfig.field === 'referencingRulesCount' && (
                    <ChevronDown
                      className={cn(
                        'h-4 w-4 transition-transform',
                        sortConfig.direction === 'desc' && 'rotate-180'
                      )}
                    />
                  )}
                </div>
              </TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {useVirtualization ? (
              // Virtualized rows
              <div
                style={{
                  height: `${rowVirtualizer.getTotalSize()}px`,
                  width: '100%',
                  position: 'relative',
                }}
              >
                {rowVirtualizer.getVirtualItems().map((virtualRow) => {
                  const list = sortedLists[virtualRow.index];
                  return (
                    <ListRow
                      key={list.name}
                      list={list}
                      expanded={isExpanded(list.name)}
                      onToggle={() => toggleExpanded(list.name)}
                      onShowRules={() => showRulesForList(list.name)}
                      onDelete={
                        onDeleteList
                          ? () => onDeleteList(list.name)
                          : undefined
                      }
                      style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        transform: `translateY(${virtualRow.start}px)`,
                      }}
                    />
                  );
                })}
              </div>
            ) : (
              // Standard rows
              sortedLists.map((list) => (
                <ListRow
                  key={list.name}
                  list={list}
                  expanded={isExpanded(list.name)}
                  onToggle={() => toggleExpanded(list.name)}
                  onShowRules={() => showRulesForList(list.name)}
                  onDelete={
                    onDeleteList ? () => onDeleteList(list.name) : undefined
                  }
                />
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </Card>
  );
});

/**
 * Individual list row component
 */
interface ListRowProps {
  list: AddressList;
  expanded: boolean;
  onToggle: () => void;
  onShowRules: () => void;
  onDelete?: () => void;
  style?: React.CSSProperties;
}

function ListRow({
  list,
  expanded,
  onToggle,
  onShowRules,
  onDelete,
  style,
}: ListRowProps) {
  return (
    <>
      <TableRow
        className="cursor-pointer hover:bg-muted/50"
        onClick={onToggle}
        style={style}
      >
        <TableCell>
          {expanded ? (
            <ChevronDown className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          )}
        </TableCell>
        <TableCell className="font-mono font-medium">{list.name}</TableCell>
        <TableCell>
          <Badge variant="outline">{list.entryCount}</Badge>
        </TableCell>
        <TableCell>
          {list.dynamicCount > 0 && (
            <Badge variant="secondary">{list.dynamicCount} dynamic</Badge>
          )}
        </TableCell>
        <TableCell>
          {list.referencingRulesCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onShowRules();
              }}
              className="h-auto p-1"
            >
              <Badge variant="outline" className="bg-category-firewall/10">
                {list.referencingRulesCount} rules
              </Badge>
            </Button>
          )}
        </TableCell>
        <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm">
                Actions
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={onShowRules}>
                <Shield className="mr-2 h-4 w-4" />
                Show Rules
              </DropdownMenuItem>
              {onDelete && (
                <DropdownMenuItem
                  onClick={onDelete}
                  className="text-destructive"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete List
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </TableCell>
      </TableRow>
      {expanded && (
        <TableRow>
          <TableCell colSpan={6} className="bg-muted/30 p-4">
            <div className="space-y-2">
              <h4 className="font-medium text-sm">Entries in {list.name}</h4>
              {list.entries && list.entries.length > 0 ? (
                <div className="space-y-1">
                  {list.entries.map((entry) => (
                    <div
                      key={entry.id}
                      className="flex items-center justify-between p-2 bg-background rounded border"
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm">
                          {entry.address}
                        </span>
                        {entry.dynamic && (
                          <Badge variant="secondary" className="text-xs">
                            Dynamic
                          </Badge>
                        )}
                        {entry.comment && (
                          <span className="text-muted-foreground text-sm">
                            {entry.comment}
                          </span>
                        )}
                      </div>
                      {entry.timeout && (
                        <Badge variant="outline" className="text-xs">
                          {entry.timeout}
                        </Badge>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No entries in this list
                </p>
              )}
            </div>
          </TableCell>
        </TableRow>
      )}
    </>
  );
}

AddressListManagerDesktop.displayName = 'AddressListManagerDesktop';
ListRow.displayName = 'ListRow';
