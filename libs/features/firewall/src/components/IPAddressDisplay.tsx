/**
 * IPAddressDisplay Component
 *
 * Reusable component for displaying IP addresses with context menu integration.
 * Allows quick-add to address lists via right-click (desktop) or long-press (mobile).
 *
 * Layer 3 Domain Component
 *
 * @description Displays IP addresses in badge or text format with optional context menu for
 * adding to address lists. Supports both desktop (right-click) and mobile (long-press) interactions.
 * Accessible with keyboard support (Shift+F10 for context menu trigger).
 *
 * @module @nasnet/features/firewall/components
 */

import { useState, useRef, useCallback, memo } from 'react';

import { usePlatform } from '@nasnet/ui/layouts';
import { Badge, Sheet, SheetContent, SheetHeader, SheetTitle } from '@nasnet/ui/primitives';
import { cn } from '@nasnet/ui/utils';

import { AddToAddressListContextMenu } from './AddToAddressListContextMenu';

// ============================================
// CONSTANTS
// ============================================

const LONG_PRESS_THRESHOLD_MS = 500;

// ============================================
// TYPES
// ============================================

export interface IPAddressDisplayProps {
  /** The IP address to display (e.g., "192.168.1.100") */
  ipAddress: string;
  /** Optional label to show before the IP */
  label?: string;
  /** Show as badge (default) or plain text */
  variant?: 'badge' | 'text';
  /** Existing address lists for quick-add */
  existingLists?: string[];
  /** Callback when IP is added to a list */
  onAddToList?: (listName: string, ipAddress: string) => void | Promise<void>;
  /** Whether to show the context menu (default: true) */
  showContextMenu?: boolean;
  /** Optional className for styling */
  className?: string;
}

// ============================================
// COMPONENT
// ============================================

/**
 * Display IP address with context menu for adding to address lists
 *
 * @example
 * ```tsx
 * <IPAddressDisplay
 *   ipAddress="192.168.1.100"
 *   label="Source"
 *   existingLists={['blocklist', 'allowlist']}
 *   onAddToList={handleAddToList}
 * />
 * ```
 */
function IPAddressDisplayInner({
  ipAddress,
  label,
  variant = 'badge',
  existingLists = [],
  onAddToList,
  showContextMenu = true,
  className,
}: IPAddressDisplayProps) {
  const platform = usePlatform();
  const [showMobileSheet, setShowMobileSheet] = useState(false);
  const [longPressTimer, setLongPressTimer] = useState<NodeJS.Timeout | null>(null);
  const elementRef = useRef<HTMLDivElement>(null);

  // ============================================
  // MOBILE LONG-PRESS HANDLERS
  // ============================================

  const handleTouchStart = useCallback(() => {
    if (platform !== 'mobile' || !showContextMenu) return;

    const timer = setTimeout(() => {
      setShowMobileSheet(true);
      // Haptic feedback if available
      if ('vibrate' in navigator) {
        navigator.vibrate(50);
      }
    }, LONG_PRESS_THRESHOLD_MS);

    setLongPressTimer(timer);
  }, [platform, showContextMenu]);

  const handleTouchEnd = useCallback(() => {
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      setLongPressTimer(null);
    }
  }, [longPressTimer]);

  const handleTouchMove = useCallback(() => {
    // Cancel long-press if finger moves
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      setLongPressTimer(null);
    }
  }, [longPressTimer]);

  // ============================================
  // RENDER CONTENT
  // ============================================

  const renderIPContent = useCallback(() => {
    if (variant === 'badge') {
      return (
        <Badge
          variant="outline"
          className={cn('font-mono text-xs', className)}
        >
          {label && <span className="mr-1 font-sans">{label}:</span>}
          <span className="font-mono">{ipAddress}</span>
        </Badge>
      );
    }

    return (
      <span className={cn('font-mono text-sm', className)}>
        {label && <span className="mr-1 font-sans">{label}:</span>}
        <span className="font-mono">{ipAddress}</span>
      </span>
    );
  }, [variant, ipAddress, label, className]);

  // ============================================
  // RENDER
  // ============================================

  if (!showContextMenu) {
    return <div className="inline-block">{renderIPContent()}</div>;
  }

  // Desktop: Use context menu
  if (platform === 'desktop') {
    return (
      <AddToAddressListContextMenu
        ipAddress={ipAddress}
        existingLists={existingLists}
        onAddToList={onAddToList}
      >
        <div
          ref={elementRef}
          className="inline-block cursor-pointer hover:bg-accent rounded px-1 -mx-1 transition-colors"
          role="button"
          tabIndex={0}
          aria-label={`IP address ${ipAddress}. Press Shift+F10 to open context menu`}
          onKeyDown={(e) => {
            // Support keyboard trigger (Shift+F10 or Context Menu key)
            if (e.shiftKey && e.key === 'F10') {
              e.preventDefault();
              elementRef.current?.dispatchEvent(
                new MouseEvent('contextmenu', {
                  bubbles: true,
                  cancelable: true,
                  view: window,
                })
              );
            }
          }}
        >
          {renderIPContent()}
        </div>
      </AddToAddressListContextMenu>
    );
  }

  // Mobile: Use Sheet with long-press
  return (
    <>
      <div
        ref={elementRef}
        className="inline-block active:bg-accent rounded px-1 -mx-1 transition-colors"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onTouchMove={handleTouchMove}
        role="button"
        tabIndex={0}
        aria-label={`IP address ${ipAddress}. Long-press to add to address list`}
      >
        {renderIPContent()}
      </div>

      <Sheet open={showMobileSheet} onOpenChange={setShowMobileSheet}>
        <SheetContent side="bottom" className="h-[50vh]">
          <SheetHeader>
            <SheetTitle>Add to Address List</SheetTitle>
          </SheetHeader>

          <div className="mt-4 space-y-2">
            <div className="flex items-center gap-2 p-3 bg-muted rounded-md">
              <span className="text-sm text-muted-foreground">IP Address:</span>
              <Badge variant="outline" className="font-mono">
                <span className="font-mono">{ipAddress}</span>
              </Badge>
            </div>

            <div className="space-y-1">
              <p className="text-sm font-medium">Select list:</p>
              {existingLists.length > 0 ? (
                <div className="space-y-1" role="listbox">
                  {existingLists.map((list) => (
                    <button
                      key={list}
                      onClick={async () => {
                        if (onAddToList) {
                          await onAddToList(list, ipAddress);
                          setShowMobileSheet(false);
                        }
                      }}
                      className="w-full text-left px-4 py-3 rounded-md border border-border hover:bg-accent transition-colors active:scale-95"
                      role="option"
                      aria-selected={false}
                    >
                      <span className="font-mono font-medium">{list}</span>
                    </button>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground p-4 text-center" aria-live="polite">
                  No address lists available. Create one first.
                </p>
              )}
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}

IPAddressDisplayInner.displayName = 'IPAddressDisplay';

export const IPAddressDisplay = memo(IPAddressDisplayInner);
