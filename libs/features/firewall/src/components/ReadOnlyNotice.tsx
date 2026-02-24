/**
 * Read-Only Notice Component
 * @description Displays informational banner explaining firewall editing is disabled in Phase 0
 * Epic 0.6, Story 0.6.4
 */

import { useState, useEffect, useMemo, useCallback, memo } from 'react';
import { Info, X } from 'lucide-react';
import { Icon } from '@nasnet/ui/primitives/icon';
import { cn } from '@nasnet/ui/utils';

export interface ReadOnlyNoticeProps {
  /** Optional CSS class names to apply to container */
  className?: string;
}

/**
 * ReadOnlyNotice Component
 * @description Displays at the top of the Firewall tab with:
 * - Info style (blue semantic token)
 * - Clear explanation of WHY editing is disabled
 * - Reference to Phase 1 safety pipeline
 * - Dismissible with localStorage persistence
 *
 * @example
 * ```tsx
 * <ReadOnlyNotice className="mb-4" />
 * ```
 *
 * @param props - Component props
 * @returns Read-only notice banner or null if dismissed
 */
export const ReadOnlyNotice = memo(function ReadOnlyNotice({ className }: ReadOnlyNoticeProps) {
  const STORAGE_KEY_NOTICE_DISMISSED = 'nasnet:firewall:notice-dismissed';
  const [isDismissed, setIsDismissed] = useState(false);

  // Load dismissed state from localStorage
  useEffect(() => {
    const dismissed = localStorage.getItem(STORAGE_KEY_NOTICE_DISMISSED) === 'true';
    setIsDismissed(dismissed);
  }, []);

  // Handle dismiss with useCallback for stable reference
  const handleDismiss = useCallback(() => {
    localStorage.setItem(STORAGE_KEY_NOTICE_DISMISSED, 'true');
    setIsDismissed(true);
  }, []);

  // Memoize the benefits list for stability
  const benefitsList = useMemo(() => [
    'Pre-apply validation to catch errors',
    'Configuration preview before applying',
    'Automatic rollback if connectivity is lost',
  ], []);

  if (isDismissed) {
    return null;
  }

  return (
    <div
      className={cn(
        'relative rounded-card-sm border border-info/30 bg-info/5 p-component-md',
        className
      )}
      role="alert"
      aria-label="Firewall read-only mode notice"
    >
      <div className="flex items-start gap-3">
        {/* Icon */}
        <Icon
          icon={Info}
          size={20}
          className="text-info flex-shrink-0 mt-0.5"
        />

        {/* Content */}
        <div className="flex-1">
          <h3 className="text-sm font-semibold text-foreground">
            Viewing Mode Only
          </h3>
          <div className="mt-2 text-sm text-muted-foreground">
            <p>
              Firewall configuration editing is not available in Phase 0 to ensure network safety.
            </p>
            <p className="mt-2">
              Phase 1 will introduce the <strong>Safety Pipeline</strong>, enabling you to make
              firewall changes with:
            </p>
            <ul className="mt-2 ml-4 list-disc space-y-1">
              {benefitsList.map((benefit, index) => (
                <li key={index}>{benefit}</li>
              ))}
            </ul>
            <p className="mt-2 text-xs">
              For now, you can view your current configuration. If you need to make changes, use
              WinBox or the RouterOS terminal.
            </p>
          </div>
        </div>

        {/* Dismiss button */}
        <button
          onClick={handleDismiss}
          className="text-muted-foreground hover:text-foreground flex-shrink-0 transition-colors"
          aria-label="Dismiss read-only notice"
        >
          <Icon
            icon={X}
            size={20}
          />
        </button>
      </div>
    </div>
  );
});

ReadOnlyNotice.displayName = 'ReadOnlyNotice';
