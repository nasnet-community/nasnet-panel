/**
 * ShortcutsOverlay Component
 * Modal overlay displaying all available keyboard shortcuts
 *
 * Features:
 * - Grouped by category
 * - Platform-specific key formatting (⌘ vs Ctrl)
 * - Context-aware shortcuts highlighted
 * - Framer Motion animations
 * - Desktop only (no keyboard on mobile)
 *
 * @see NAS-4.10: Implement Navigation & Command Palette
 */

import * as React from 'react';
import { useMemo } from 'react';

import { motion, AnimatePresence } from 'framer-motion';
import { Keyboard, X } from 'lucide-react';

import {
  useShortcutRegistry,
  groupShortcutsByCategory,
  formatShortcutKeys,
  type ShortcutGroup,
} from '@nasnet/state/stores';
import { usePlatform } from '@nasnet/ui/layouts';
import {
  Dialog,
  DialogPortal,
  DialogOverlay,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
 cn } from '@nasnet/ui/primitives';

/**
 * Group labels for display
 */
const GROUP_LABELS: Record<ShortcutGroup, string> = {
  global: 'Global',
  navigation: 'Navigation',
  actions: 'Actions',
  editing: 'Editing',
  context: 'Context',
};

/**
 * Group display order
 */
const GROUP_ORDER: ShortcutGroup[] = [
  'global',
  'navigation',
  'actions',
  'editing',
  'context',
];

/**
 * Detect if running on macOS
 */
function useIsMac(): boolean {
  const [isMac, setIsMac] = React.useState(false);

  React.useEffect(() => {
    setIsMac(/Mac|iPod|iPhone|iPad/.test(navigator.platform));
  }, []);

  return isMac;
}

/**
 * Keyboard key component
 */
function Kbd({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <kbd
      className={cn(
        'inline-flex min-w-[1.5rem] items-center justify-center rounded-md border border-border bg-muted px-1.5 py-0.5 font-mono text-xs font-medium text-muted-foreground',
        className
      )}
    >
      {children}
    </kbd>
  );
}

/**
 * Shortcut row component
 */
function ShortcutRow({
  label,
  keys,
  isMac,
}: {
  label: string;
  keys: string;
  isMac: boolean;
}) {
  const formattedKeys = formatShortcutKeys(keys, isMac);
  const keyParts = formattedKeys.split(' ');

  return (
    <div className="flex items-center justify-between py-1.5">
      <span className="text-sm text-foreground">{label}</span>
      <div className="flex items-center gap-1">
        {keyParts.map((part, index) => (
          <React.Fragment key={index}>
            {index > 0 && (
              <span className="text-xs text-muted-foreground">then</span>
            )}
            <Kbd>{part}</Kbd>
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}

/**
 * Shortcut group component
 */
function ShortcutGroupSection({
  group,
  isMac,
}: {
  group: ShortcutGroup;
  isMac: boolean;
}) {
  const { getByGroup } = useShortcutRegistry();
  const shortcuts = getByGroup(group);

  if (shortcuts.length === 0) return null;

  return (
    <div className="space-y-1">
      <h3 className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
        {GROUP_LABELS[group]}
      </h3>
      <div className="space-y-0.5">
        {shortcuts.map((shortcut) => (
          <ShortcutRow
            key={shortcut.id}
            label={shortcut.label}
            keys={shortcut.keys}
            isMac={isMac}
          />
        ))}
      </div>
    </div>
  );
}

/**
 * Props for ShortcutsOverlay
 */
export interface ShortcutsOverlayProps {
  /** Optional className */
  className?: string;
}

/**
 * ShortcutsOverlay component
 * Shows all registered keyboard shortcuts in a modal
 *
 * @example
 * ```tsx
 * // In your app shell
 * function App() {
 *   useGlobalShortcuts();
 *
 *   return (
 *     <>
 *       <RouterOutlet />
 *       <CommandPalette />
 *       <ShortcutsOverlay />
 *     </>
 *   );
 * }
 * ```
 */
export function ShortcutsOverlay({ className }: ShortcutsOverlayProps) {
  const platform = usePlatform();
  const { overlayOpen, closeOverlay } = useShortcutRegistry();
  const isMac = useIsMac();

  // Don't render on mobile - no keyboard
  if (platform === 'mobile') {
    return null;
  }

  return (
    <Dialog open={overlayOpen} onOpenChange={(open) => !open && closeOverlay()}>
      <AnimatePresence>
        {overlayOpen && (
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
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.15, ease: 'easeOut' }}
              className={cn(
                'fixed left-[50%] top-[50%] z-50 w-full max-w-xl translate-x-[-50%] translate-y-[-50%] rounded-xl border border-border bg-popover p-6 text-popover-foreground shadow-2xl',
                className
              )}
            >
              {/* Header */}
              <div className="mb-6 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                    <Keyboard className="h-5 w-5" aria-hidden="true" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold">Keyboard Shortcuts</h2>
                    <p className="text-sm text-muted-foreground">
                      Press <Kbd>?</Kbd> to toggle this overlay
                    </p>
                  </div>
                </div>
                <DialogClose asChild>
                  <button
                    className="rounded-lg p-2 hover:bg-accent"
                    aria-label="Close"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </DialogClose>
              </div>

              {/* Shortcut groups in columns */}
              <div className="grid grid-cols-2 gap-6">
                {GROUP_ORDER.map((group) => (
                  <ShortcutGroupSection key={group} group={group} isMac={isMac} />
                ))}
              </div>

              {/* Footer */}
              <div className="mt-6 border-t border-border pt-4 text-center text-xs text-muted-foreground">
                <p>
                  Tip: Use <Kbd>⌘</Kbd>
                  <Kbd>K</Kbd> to open the command palette for quick navigation
                </p>
              </div>
            </motion.div>
          </DialogPortal>
        )}
      </AnimatePresence>
    </Dialog>
  );
}
