/**
 * CommandPaletteMobile Component
 * Mobile and Tablet presenter for the command palette (bottom sheet)
 *
 * Features:
 * - Bottom sheet presentation (Mobile & Tablet)
 * - Keyboard navigation support (Tablet with keyboard)
 * - 44x44px touch targets (WCAG AAA Mobile)
 * - Swipe to dismiss support
 * - Framer Motion animations
 * - Touch-friendly interface scaling
 *
 * @see NAS-4.10: Implement Navigation & Command Palette
 * @see ADR-018: Headless Platform Presenters
 */

import * as React from 'react';

import { motion, AnimatePresence, useDragControls } from 'framer-motion';
import { Search, Clock, Sparkles, X } from 'lucide-react';

import { Sheet, SheetPortal, SheetOverlay, SheetClose, cn } from '@nasnet/ui/primitives';

import { CommandItem } from './CommandItem';
import { useCommandPalette } from './useCommandPalette';

/**
 * cmdk Command primitive for consistent behavior with Desktop
 */
import { Command as CommandPrimitive } from 'cmdk';

/**
 * Props for CommandPaletteMobile
 */
export interface CommandPaletteMobileProps {
  /** Optional className */
  className?: string;
}

/**
 * Mobile and Tablet command palette presenter
 * Renders as a bottom sheet with touch-friendly targets and keyboard support
 *
 * @example
 * ```tsx
 * <CommandPaletteMobile />
 * ```
 */
const CommandPaletteMobile = React.memo(function CommandPaletteMobile({
  className,
}: CommandPaletteMobileProps) {
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
    handleKeyDown,
    inputRef,
  } = useCommandPalette();

  const dragControls = useDragControls();

  return (
    <Sheet
      open={open}
      onOpenChange={setOpen}
    >
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
                'border-border bg-card fixed inset-x-0 bottom-0 z-50 flex max-h-[85vh] flex-col rounded-t-2xl border-t shadow-xl',
                className
              )}
            >
              {/* Drag handle */}
              <div
                className="flex justify-center py-2"
                onPointerDown={(e) => dragControls.start(e)}
              >
                <div className="bg-muted-foreground/30 h-1 w-12 rounded-full" />
              </div>

              {/* Header with close button */}
              <div className="flex items-center justify-between px-4 pb-2">
                <h2 className="text-base font-semibold">Search Commands</h2>
                <SheetClose asChild>
                  <button
                    className="hover:bg-muted focus-visible:ring-ring flex h-11 w-11 items-center justify-center rounded-lg transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2"
                    aria-label="Close search"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </SheetClose>
              </div>

              {/* Search Input */}
              <div className="border-border flex h-12 items-center border-b px-4">
                <Search
                  className="text-muted-foreground mr-3 h-5 w-5 shrink-0"
                  aria-hidden="true"
                />
                <CommandPrimitive.Input
                  ref={inputRef}
                  value={query}
                  onValueChange={setQuery}
                  placeholder="Search commands..."
                  className="placeholder:text-muted-foreground flex w-full bg-transparent text-base outline-none disabled:cursor-not-allowed disabled:opacity-50"
                  aria-label="Search commands"
                  aria-autocomplete="list"
                  aria-controls="command-list-mobile"
                  aria-expanded={hasResults}
                  role="combobox"
                  autoComplete="off"
                  autoCorrect="off"
                  autoCapitalize="off"
                  spellCheck="false"
                  onKeyDown={handleKeyDown}
                />
                {query && (
                  <button
                    className="hover:bg-muted focus-visible:ring-ring flex h-11 w-11 items-center justify-center rounded-lg transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2"
                    onClick={() => setQuery('')}
                    aria-label="Clear search"
                  >
                    <X className="h-5 w-5" />
                  </button>
                )}
              </div>

              {/* Results List */}
              <CommandPrimitive.List
                id="command-list-mobile"
                role="listbox"
                aria-label={isShowingRecent ? 'Recent commands' : 'Search results'}
                className="flex-1 overflow-y-auto overflow-x-hidden px-4 py-3"
              >
                {/* Empty state */}
                <CommandPrimitive.Empty className="text-muted-foreground py-6 text-center text-sm">
                  No commands found{query && ` for "${query}"`}
                </CommandPrimitive.Empty>

                {/* Section header */}
                {hasResults && (
                  <div className="text-muted-foreground mb-2 flex items-center gap-2 px-4 py-2 text-xs font-semibold uppercase">
                    {isShowingRecent ?
                      <>
                        <Clock
                          className="h-3 w-3"
                          aria-hidden="true"
                        />
                        <span>Recent</span>
                      </>
                    : <>
                        <Sparkles
                          className="h-3 w-3"
                          aria-hidden="true"
                        />
                        <span>Results</span>
                      </>
                    }
                  </div>
                )}

                {/* Command items - no shortcuts on mobile */}
                {results.map((command, index) => (
                  <CommandPrimitive.Item
                    key={command.id}
                    value={command.id}
                    onSelect={() => execute(command)}
                    className="p-0"
                  >
                    <CommandItem
                      command={command}
                      selected={index === selectedIndex}
                      showShortcut={false}
                      isOnline={isOnline}
                      onSelect={() => execute(command)}
                      className="min-h-[44px] px-4 py-3"
                    />
                  </CommandPrimitive.Item>
                ))}

                {/* Empty recent state */}
                {!hasResults && !query && (
                  <div className="text-muted-foreground py-6 text-center text-sm">
                    <Clock
                      className="mx-auto mb-2 h-8 w-8 opacity-50"
                      aria-hidden="true"
                    />
                    <p>No recent commands</p>
                    <p className="mt-1 text-xs">Your recent commands will appear here</p>
                  </div>
                )}
              </CommandPrimitive.List>

              {/* Results count */}
              {hasResults && (
                <div className="border-border text-muted-foreground border-t px-4 py-2 text-center text-xs">
                  <span
                    aria-live="polite"
                    aria-atomic="true"
                  >
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
});

CommandPaletteMobile.displayName = 'CommandPaletteMobile';

export { CommandPaletteMobile };
