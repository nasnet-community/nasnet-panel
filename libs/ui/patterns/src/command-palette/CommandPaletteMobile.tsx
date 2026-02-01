/**
 * CommandPaletteMobile Component
 * Mobile presenter for the command palette (bottom sheet)
 *
 * Features:
 * - Bottom sheet presentation
 * - No keyboard shortcut display (mobile has no keyboard)
 * - 44x44px touch targets
 * - Swipe to dismiss support
 * - Framer Motion animations
 *
 * @see NAS-4.10: Implement Navigation & Command Palette
 * @see ADR-018: Headless Platform Presenters
 */

import * as React from 'react';

import { motion, AnimatePresence, useDragControls } from 'framer-motion';
import { Search, Clock, Sparkles, X } from 'lucide-react';

import {
  Sheet,
  SheetPortal,
  SheetOverlay,
  SheetContent,
  SheetClose,
 cn } from '@nasnet/ui/primitives';

import { CommandItem } from './CommandItem';
import { useCommandPalette } from './useCommandPalette';

/**
 * Props for CommandPaletteMobile
 */
export interface CommandPaletteMobileProps {
  /** Optional className */
  className?: string;
}

/**
 * Mobile command palette presenter
 * Renders as a bottom sheet with touch-friendly targets
 */
export function CommandPaletteMobile({ className }: CommandPaletteMobileProps) {
  const {
    open,
    setOpen,
    query,
    setQuery,
    results,
    selectedIndex,
    hasResults,
    isShowingRecent,
    isOnline,
    execute,
    inputRef,
  } = useCommandPalette();

  const dragControls = useDragControls();

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <AnimatePresence>
        {open && (
          <SheetPortal forceMount>
            <SheetOverlay asChild>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="fixed inset-0 z-50 bg-black/60"
              />
            </SheetOverlay>

            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              drag="y"
              dragControls={dragControls}
              dragConstraints={{ top: 0 }}
              dragElastic={{ top: 0, bottom: 0.3 }}
              onDragEnd={(_, info) => {
                // Close if dragged down more than 100px
                if (info.offset.y > 100) {
                  setOpen(false);
                }
              }}
              className={cn(
                'fixed inset-x-0 bottom-0 z-50 flex max-h-[85vh] flex-col rounded-t-2xl border-t border-border bg-card shadow-xl',
                className
              )}
            >
              {/* Drag handle */}
              <div
                className="flex justify-center py-2"
                onPointerDown={(e) => dragControls.start(e)}
              >
                <div className="h-1 w-12 rounded-full bg-muted-foreground/30" />
              </div>

              {/* Header with close button */}
              <div className="flex items-center justify-between px-4 pb-2">
                <h2 className="text-base font-semibold">Search Commands</h2>
                <SheetClose asChild>
                  <button
                    className="flex h-11 w-11 items-center justify-center rounded-lg hover:bg-accent"
                    aria-label="Close"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </SheetClose>
              </div>

              {/* Search Input */}
              <div className="flex items-center border-y border-border bg-muted/50 px-4">
                <Search
                  className="mr-3 h-5 w-5 shrink-0 text-muted-foreground"
                  aria-hidden="true"
                />
                <input
                  ref={inputRef}
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search..."
                  className="flex h-14 w-full bg-transparent text-base outline-none placeholder:text-muted-foreground"
                  aria-label="Search commands"
                  autoComplete="off"
                  autoCorrect="off"
                  autoCapitalize="off"
                  spellCheck="false"
                />
                {query && (
                  <button
                    className="flex h-11 w-11 items-center justify-center rounded-lg hover:bg-accent"
                    onClick={() => setQuery('')}
                    aria-label="Clear search"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>

              {/* Results List */}
              <div
                className="flex-1 overflow-y-auto overflow-x-hidden p-3"
                role="listbox"
                aria-label={isShowingRecent ? 'Recent commands' : 'Search results'}
              >
                {/* Empty state */}
                {!hasResults && query && (
                  <div className="py-8 text-center text-sm text-muted-foreground">
                    No commands found for "{query}"
                  </div>
                )}

                {/* Section header */}
                {hasResults && (
                  <div className="mb-2 flex items-center gap-2 px-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    {isShowingRecent ? (
                      <>
                        <Clock className="h-3.5 w-3.5" aria-hidden="true" />
                        <span>Recent</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
                        <span>Results</span>
                      </>
                    )}
                  </div>
                )}

                {/* Command items - no shortcuts on mobile */}
                {results.map((command, index) => (
                  <CommandItem
                    key={command.id}
                    command={command}
                    selected={index === selectedIndex}
                    showShortcut={false} // No shortcuts on mobile
                    isOnline={isOnline}
                    onSelect={() => execute(command)}
                    className="min-h-[44px]" // WCAG AAA touch target
                  />
                ))}

                {/* Empty recent state */}
                {!hasResults && !query && (
                  <div className="py-8 text-center text-sm text-muted-foreground">
                    <Clock className="mx-auto mb-2 h-8 w-8 opacity-50" aria-hidden="true" />
                    <p>No recent commands</p>
                    <p className="mt-1 text-xs">Your recent commands will appear here</p>
                  </div>
                )}
              </div>

              {/* Results count */}
              {hasResults && (
                <div className="border-t border-border px-4 py-2 text-center text-xs text-muted-foreground">
                  <span aria-live="polite" aria-atomic="true">
                    {results.length} {results.length === 1 ? 'command' : 'commands'}
                  </span>
                </div>
              )}
            </motion.div>
          </SheetPortal>
        )}
      </AnimatePresence>
    </Sheet>
  );
}
