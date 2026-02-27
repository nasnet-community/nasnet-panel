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
          'min-h-[44px] w-full justify-between font-mono font-normal',
          !displayValue && 'text-muted-foreground',
          displayError && 'border-error'
        )}
      >
        <span className="truncate">{displayValue || placeholder}</span>
        <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
      </Button>

      {/* Bottom sheet */}
      <Sheet
        open={isOpen}
        onOpenChange={setIsOpen}
      >
        <SheetContent
          side="bottom"
          className="flex h-[85vh] flex-col p-0"
        >
          <SheetHeader className="shrink-0 border-b px-4 pb-3 pt-4">
            <SheetTitle>{label || 'Select Interface'}</SheetTitle>
          </SheetHeader>

          {/* Search and filter */}
          <div className="shrink-0 space-y-3 border-b px-4 py-3">
            {/* Search input - 44px minimum touch target */}
            <div className="relative">
              <Search className="text-muted-foreground absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" />
              <Input
                ref={searchInputRef}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search interfaces..."
                className="h-11 pl-9 font-mono"
                aria-label="Search interfaces"
              />
              {searchQuery && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute right-1 top-1/2 h-9 w-9 -translate-y-1/2 p-0"
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
                className="h-11 w-full"
              />
            )}
          </div>

          {/* Scrollable interface list */}
          <ScrollArea className="flex-1">
            <div
              role="listbox"
              aria-label="Interface list"
              aria-multiselectable={multiple}
              className="space-y-1 p-4"
            >
              {/* Loading state */}
              {isLoading && (
                <div className="space-y-2">
                  {[...Array(5)].map((_, i) => (
                    <div
                      key={i}
                      className="flex min-h-[44px] items-center gap-3 p-3"
                    >
                      <Skeleton className="h-5 w-5 rounded-full" />
                      <div className="flex-1 space-y-1.5">
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
                  <AlertCircle className="text-destructive mb-3 h-10 w-10" />
                  <p className="text-muted-foreground mb-4 text-sm">Failed to load interfaces</p>
                  <Button
                    variant="outline"
                    onClick={retry}
                    className="h-11 gap-2"
                  >
                    <RefreshCw className="h-4 w-4" />
                    Retry
                  </Button>
                </div>
              )}

              {/* Empty state */}
              {!isLoading && !subscriptionError && filteredInterfaces.length === 0 && (
                <div className="text-muted-foreground py-12 text-center text-sm">
                  {searchQuery ? 'No interfaces match your search' : 'No interfaces available'}
                </div>
              )}

              {/* Interface items - using mobile variant with 44px touch targets */}
              {!isLoading &&
                !subscriptionError &&
                filteredInterfaces.map((iface) => (
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
          <div className="flex shrink-0 items-center justify-between border-t px-4 py-3">
            <span className="text-muted-foreground text-sm">
              {filteredInterfaces.length} interface{filteredInterfaces.length !== 1 ? 's' : ''}
              {selectedValues.length > 0 && <span> · {selectedValues.length} selected</span>}
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
                className="h-8 gap-1.5 py-1 pl-2 pr-1"
              >
                <InterfaceTypeIcon
                  type={iface.type}
                  size={3}
                />
                <span className="text-sm">{iface.name}</span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleSelection(id);
                  }}
                  className="hover:bg-muted ml-1 flex min-h-[28px] min-w-[28px] items-center justify-center rounded-full p-1"
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
        <p
          className="text-destructive text-sm"
          role="alert"
        >
          {displayError}
        </p>
      )}
    </div>
  );
});

InterfaceSelectorMobile.displayName = 'InterfaceSelectorMobile';

export default InterfaceSelectorMobile;
