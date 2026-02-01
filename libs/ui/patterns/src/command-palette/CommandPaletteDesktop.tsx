/**
 * CommandPaletteDesktop Component
 * Desktop presenter for the command palette (centered modal)
 *
 * Features:
 * - Centered dialog presentation
 * - Keyboard shortcut display
 * - Full keyboard navigation
 * - Framer Motion animations
 *
 * @see NAS-4.10: Implement Navigation & Command Palette
 * @see ADR-018: Headless Platform Presenters
 */

import * as React from 'react';

import { Command as CommandPrimitive } from 'cmdk';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Clock, Sparkles } from 'lucide-react';

import {
  Dialog,
  DialogPortal,
  DialogOverlay,
 cn } from '@nasnet/ui/primitives';

import { CommandItem } from './CommandItem';
import { useCommandPalette } from './useCommandPalette';

/**
 * Props for CommandPaletteDesktop
 */
export interface CommandPaletteDesktopProps {
  /** Optional className for the dialog content */
  className?: string;
}

/**
 * Desktop command palette presenter
 * Renders as a centered modal with full keyboard support
 */
export function CommandPaletteDesktop({
  className,
}: CommandPaletteDesktopProps) {
  const {
    open,
    setOpen,
    query,
    setQuery,
    results,
    selectedIndex,
    setSelectedIndex,
    hasResults,
    isShowingRecent,
    isOnline,
    execute,
    handleKeyDown,
    inputRef,
  } = useCommandPalette();

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <AnimatePresence>
        {open && (
          <DialogPortal forceMount>
            <DialogOverlay asChild>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
              />
            </DialogOverlay>

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -20 }}
              transition={{ duration: 0.15, ease: 'easeOut' }}
              className={cn(
                'fixed left-[50%] top-[20%] z-50 w-full max-w-lg translate-x-[-50%] rounded-xl border border-border bg-popover text-popover-foreground shadow-2xl',
                className
              )}
            >
              <CommandPrimitive
                className="flex flex-col overflow-hidden"
                onKeyDown={handleKeyDown}
                shouldFilter={false}
              >
                {/* Search Input */}
                <div className="flex items-center border-b border-border px-4">
                  <Search
                    className="mr-2 h-4 w-4 shrink-0 text-muted-foreground"
                    aria-hidden="true"
                  />
                  <CommandPrimitive.Input
                    ref={inputRef}
                    value={query}
                    onValueChange={setQuery}
                    placeholder="Search commands..."
                    className="flex h-12 w-full bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
                    aria-label="Search commands"
                    aria-autocomplete="list"
                    aria-controls="command-list"
                    aria-expanded={hasResults}
                    role="combobox"
                  />
                </div>

                {/* Results List */}
                <CommandPrimitive.List
                  id="command-list"
                  role="listbox"
                  aria-label={isShowingRecent ? 'Recent commands' : 'Search results'}
                  className="max-h-[300px] overflow-y-auto overflow-x-hidden p-2"
                >
                  {/* Empty state */}
                  <CommandPrimitive.Empty className="py-6 text-center text-sm text-muted-foreground">
                    No commands found.
                  </CommandPrimitive.Empty>

                  {/* Section header */}
                  {hasResults && (
                    <div className="mb-2 flex items-center gap-2 px-2 text-xs font-medium text-muted-foreground">
                      {isShowingRecent ? (
                        <>
                          <Clock className="h-3 w-3" aria-hidden="true" />
                          <span>Recent</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="h-3 w-3" aria-hidden="true" />
                          <span>Results</span>
                        </>
                      )}
                    </div>
                  )}

                  {/* Command items */}
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
                        showShortcut={true}
                        isOnline={isOnline}
                        onSelect={() => execute(command)}
                      />
                    </CommandPrimitive.Item>
                  ))}
                </CommandPrimitive.List>

                {/* Footer with hints */}
                <div className="flex items-center justify-between border-t border-border px-4 py-2 text-xs text-muted-foreground">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1">
                      <kbd className="rounded bg-muted px-1.5 py-0.5 font-mono text-[10px]">
                        ↑↓
                      </kbd>
                      <span>Navigate</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <kbd className="rounded bg-muted px-1.5 py-0.5 font-mono text-[10px]">
                        ↵
                      </kbd>
                      <span>Select</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <kbd className="rounded bg-muted px-1.5 py-0.5 font-mono text-[10px]">
                        Esc
                      </kbd>
                      <span>Close</span>
                    </div>
                  </div>
                  {results.length > 0 && (
                    <span aria-live="polite" aria-atomic="true">
                      {results.length} {results.length === 1 ? 'result' : 'results'}
                    </span>
                  )}
                </div>
              </CommandPrimitive>
            </motion.div>
          </DialogPortal>
        )}
      </AnimatePresence>
    </Dialog>
  );
}
