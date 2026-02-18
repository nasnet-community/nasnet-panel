/**
 * InterfaceSelectorDesktop - Desktop presenter for interface selection
 *
 * Features:
 * - Popover dropdown with search
 * - Type filter
 * - Keyboard navigation (Arrow keys, Enter, Escape)
 * - Multi-select with chips
 * - Loading and error states
 *
 * @see NAS-4A.9: Build Interface Selector Component
 * @see ADR-018: Headless Platform Presenters
 *
 * @module @nasnet/ui/patterns/network-inputs/interface-selector
 */

import { memo, useRef, useEffect } from 'react';

import { ChevronDown, Search, X, RefreshCw, AlertCircle } from 'lucide-react';

import {
  cn,
  Button,
  Input,
  Popover,
  PopoverTrigger,
  PopoverContent,
  ScrollArea,
  Badge,
  Skeleton,
} from '@nasnet/ui/primitives';

import { InterfaceItem } from './interface-item';
import { InterfaceTypeFilter } from './interface-type-filter';
import { InterfaceTypeIcon } from './interface-type-icon';
import { useInterfaceSelector } from './use-interface-selector';

import type { InterfaceSelectorDesktopProps } from './interface-selector.types';

/**
 * Desktop presenter for interface selector.
 *
 * Renders as a popover dropdown with:
 * - Search input
 * - Type filter
 * - Scrollable interface list
 * - Multi-select chips
 *
 * @param props - InterfaceSelectorDesktopProps
 */
export const InterfaceSelectorDesktop = memo(function InterfaceSelectorDesktop(
  props: InterfaceSelectorDesktopProps
) {
  const {
    disabled = false,
    error: externalError,
    placeholder = 'Select interface...',
    label,
    className,
    multiple = false,
    showStatus = true,
    showIP = true,
    types = [],
    id,
    'aria-describedby': ariaDescribedBy,
    hookOverride,
  } = props;

  const state = useInterfaceSelector(props);
  const mergedState = { ...state, ...hookOverride };

  const {
    filteredInterfaces,
    selectedValues,
    isLoading,
    error: subscriptionError,
    searchQuery,
    typeFilter,
    isOpen,
    setSearchQuery,
    setTypeFilter,
    setIsOpen,
    toggleSelection,
    getInterfaceById,
    getDisplayValue,
    retry,
  } = mergedState;

  const searchInputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Focus search input when popover opens
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      // Small delay to ensure popover is rendered
      const timer = setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [isOpen]);

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  const displayError = externalError || subscriptionError?.message;
  const displayValue = getDisplayValue();

  // Show type filter only if types prop is not restricting selection
  const showTypeFilter = types.length === 0;

  return (
    <div className={cn('space-y-2', className)}>
      {/* Label */}
      {label && (
        <label
          htmlFor={id}
          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
        >
          {label}
        </label>
      )}

      {/* Main trigger and popover */}
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            id={id}
            variant="outline"
            role="combobox"
            aria-expanded={isOpen}
            aria-haspopup="listbox"
            aria-describedby={ariaDescribedBy}
            aria-invalid={!!displayError}
            disabled={disabled}
            className={cn(
              'w-full justify-between font-normal',
              !displayValue && 'text-muted-foreground',
              displayError && 'border-destructive'
            )}
          >
            <span className="truncate">
              {displayValue || placeholder}
            </span>
            <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>

        <PopoverContent
          className="w-[320px] p-0"
          align="start"
          onKeyDown={handleKeyDown}
        >
          {/* Search and filter header */}
          <div className="p-3 border-b space-y-3">
            {/* Search input */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                ref={searchInputRef}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search interfaces..."
                className="pl-9 h-9"
                aria-label="Search interfaces"
              />
              {searchQuery && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
                  onClick={() => setSearchQuery('')}
                  aria-label="Clear search"
                >
                  <X className="h-3.5 w-3.5" />
                </Button>
              )}
            </div>

            {/* Type filter */}
            {showTypeFilter && (
              <InterfaceTypeFilter
                value={typeFilter}
                onChange={setTypeFilter}
                className="w-full"
              />
            )}
          </div>

          {/* Interface list */}
          <ScrollArea className="max-h-[300px]">
            <div
              ref={listRef}
              role="listbox"
              aria-label="Interface list"
              aria-multiselectable={multiple}
              className="p-2"
            >
              {/* Loading state */}
              {isLoading && (
                <div className="space-y-2">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="flex items-center gap-3 p-2">
                      <Skeleton className="h-5 w-5 rounded-full" />
                      <div className="space-y-1.5 flex-1">
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-3 w-32" />
                      </div>
                      <Skeleton className="h-2 w-2 rounded-full" />
                    </div>
                  ))}
                </div>
              )}

              {/* Error state */}
              {!isLoading && subscriptionError && (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <AlertCircle className="h-8 w-8 text-destructive mb-2" />
                  <p className="text-sm text-muted-foreground mb-3">
                    Failed to load interfaces
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={retry}
                    className="gap-2"
                  >
                    <RefreshCw className="h-3.5 w-3.5" />
                    Retry
                  </Button>
                </div>
              )}

              {/* Empty state */}
              {!isLoading && !subscriptionError && filteredInterfaces.length === 0 && (
                <div className="py-8 text-center text-sm text-muted-foreground">
                  {searchQuery ? 'No interfaces match your search' : 'No interfaces available'}
                </div>
              )}

              {/* Interface items */}
              {!isLoading && !subscriptionError && filteredInterfaces.map((iface) => (
                <InterfaceItem
                  key={iface.id}
                  interface={iface}
                  selected={selectedValues.includes(iface.id)}
                  onSelect={() => toggleSelection(iface.id)}
                  showCheckbox={multiple}
                  showStatus={showStatus}
                  showIP={showIP}
                />
              ))}
            </div>
          </ScrollArea>

          {/* Footer with result count */}
          {!isLoading && !subscriptionError && filteredInterfaces.length > 0 && (
            <div className="px-3 py-2 border-t text-xs text-muted-foreground">
              {filteredInterfaces.length} interface{filteredInterfaces.length !== 1 ? 's' : ''}
              {selectedValues.length > 0 && (
                <span> · {selectedValues.length} selected</span>
              )}
            </div>
          )}
        </PopoverContent>
      </Popover>

      {/* Multi-select chips */}
      {multiple && selectedValues.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {selectedValues.map((id) => {
            const iface = getInterfaceById(id);
            if (!iface) return null;

            return (
              <Badge
                key={id}
                variant="secondary"
                className="gap-1 pl-1.5 pr-1"
              >
                <InterfaceTypeIcon type={iface.type} size={3} />
                <span className="text-xs">{iface.name}</span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleSelection(id);
                  }}
                  className="ml-0.5 rounded-full p-0.5 hover:bg-muted"
                  aria-label={`Remove ${iface.name}`}
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            );
          })}
        </div>
      )}

      {/* Error message */}
      {displayError && (
        <p className="text-sm text-destructive" role="alert">
          {displayError}
        </p>
      )}
    </div>
  );
});

InterfaceSelectorDesktop.displayName = 'InterfaceSelectorDesktop';

export default InterfaceSelectorDesktop;
