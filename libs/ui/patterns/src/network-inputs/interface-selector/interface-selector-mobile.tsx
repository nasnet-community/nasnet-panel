/**
 * InterfaceSelectorMobile - Mobile presenter for interface selection
 *
 * Features:
 * - Full-screen bottom sheet
 * - 44px minimum touch targets (WCAG 2.5.5)
 * - Scrollable interface list
 * - Search input
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
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  ScrollArea,
  Badge,
  Skeleton,
} from '@nasnet/ui/primitives';

import { InterfaceItemMobile } from './interface-item';
import { InterfaceTypeFilter } from './interface-type-filter';
import { InterfaceTypeIcon } from './interface-type-icon';
import { useInterfaceSelector } from './use-interface-selector';

import type { InterfaceSelectorMobileProps } from './interface-selector.types';

/**
 * Mobile presenter for interface selector.
 *
 * Renders as a bottom sheet with:
 * - Full-height scrollable list
 * - Large touch targets (44px minimum)
 * - Search input
 * - Type filter
 *
 * @param props - InterfaceSelectorMobileProps
 */
export const InterfaceSelectorMobile = memo(function InterfaceSelectorMobile(
  props: InterfaceSelectorMobileProps
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

  // Focus search input when sheet opens
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      const timer = setTimeout(() => {
        searchInputRef.current?.focus();
      }, 100);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [isOpen]);

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

      {/* Trigger button - 44px touch target minimum */}
      <Button
        id={id}
        variant="outline"
        role="combobox"
        aria-expanded={isOpen}
        aria-haspopup="dialog"
        aria-describedby={ariaDescribedBy}
        aria-invalid={!!displayError}
        disabled={disabled}
        onClick={() => setIsOpen(true)}
        className={cn(
          'w-full min-h-[44px] justify-between font-normal font-mono',
          !displayValue && 'text-muted-foreground',
          displayError && 'border-error'
        )}
      >
        <span className="truncate">
          {displayValue || placeholder}
        </span>
        <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
      </Button>

      {/* Bottom sheet */}
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetContent
          side="bottom"
          className="h-[85vh] flex flex-col p-0"
        >
          <SheetHeader className="px-4 pt-4 pb-3 border-b shrink-0">
            <SheetTitle>
              {label || 'Select Interface'}
            </SheetTitle>
          </SheetHeader>

          {/* Search and filter */}
          <div className="px-4 py-3 space-y-3 border-b shrink-0">
            {/* Search input - 44px minimum touch target */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                ref={searchInputRef}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search interfaces..."
                className="pl-9 h-11 font-mono"
                aria-label="Search interfaces"
              />
              {searchQuery && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute right-1 top-1/2 -translate-y-1/2 h-9 w-9 p-0"
                  onClick={() => setSearchQuery('')}
                  aria-label="Clear search"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>

            {/* Type filter */}
            {showTypeFilter && (
              <InterfaceTypeFilter
                value={typeFilter}
                onChange={setTypeFilter}
                className="w-full h-11"
              />
            )}
          </div>

          {/* Scrollable interface list */}
          <ScrollArea className="flex-1">
            <div
              role="listbox"
              aria-label="Interface list"
              aria-multiselectable={multiple}
              className="p-4 space-y-1"
            >
              {/* Loading state */}
              {isLoading && (
                <div className="space-y-2">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="flex items-center gap-3 p-3 min-h-[44px]">
                      <Skeleton className="h-5 w-5 rounded-full" />
                      <div className="space-y-1.5 flex-1">
                        <Skeleton className="h-4 w-28" />
                        <Skeleton className="h-3 w-36" />
                      </div>
                      <Skeleton className="h-2.5 w-2.5 rounded-full" />
                    </div>
                  ))}
                </div>
              )}

              {/* Error state */}
              {!isLoading && subscriptionError && (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <AlertCircle className="h-10 w-10 text-destructive mb-3" />
                  <p className="text-sm text-muted-foreground mb-4">
                    Failed to load interfaces
                  </p>
                  <Button
                    variant="outline"
                    onClick={retry}
                    className="gap-2 h-11"
                  >
                    <RefreshCw className="h-4 w-4" />
                    Retry
                  </Button>
                </div>
              )}

              {/* Empty state */}
              {!isLoading && !subscriptionError && filteredInterfaces.length === 0 && (
                <div className="py-12 text-center text-sm text-muted-foreground">
                  {searchQuery ? 'No interfaces match your search' : 'No interfaces available'}
                </div>
              )}

              {/* Interface items - using mobile variant with 44px touch targets */}
              {!isLoading && !subscriptionError && filteredInterfaces.map((iface) => (
                <InterfaceItemMobile
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

          {/* Footer with result count and done button */}
          <div className="px-4 py-3 border-t shrink-0 flex items-center justify-between">
            <span className="text-sm text-muted-foreground">
              {filteredInterfaces.length} interface{filteredInterfaces.length !== 1 ? 's' : ''}
              {selectedValues.length > 0 && (
                <span> · {selectedValues.length} selected</span>
              )}
            </span>
            {multiple && (
              <Button
                onClick={() => setIsOpen(false)}
                className="h-11 px-6"
              >
                Done
              </Button>
            )}
          </div>
        </SheetContent>
      </Sheet>

      {/* Multi-select chips */}
      {multiple && selectedValues.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedValues.map((id) => {
            const iface = getInterfaceById(id);
            if (!iface) return null;

            return (
              <Badge
                key={id}
                variant="secondary"
                className="gap-1.5 pl-2 pr-1 py-1 h-8"
              >
                <InterfaceTypeIcon type={iface.type} size={3} />
                <span className="text-sm">{iface.name}</span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleSelection(id);
                  }}
                  className="ml-1 rounded-full p-1 hover:bg-muted min-w-[28px] min-h-[28px] flex items-center justify-center"
                  aria-label={`Remove ${iface.name}`}
                >
                  <X className="h-3.5 w-3.5" />
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

InterfaceSelectorMobile.displayName = 'InterfaceSelectorMobile';

export default InterfaceSelectorMobile;
