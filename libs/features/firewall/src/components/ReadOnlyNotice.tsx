/**
 * Read-Only Notice Component
 * Displays informational banner explaining firewall editing is disabled in Phase 0
 * Epic 0.6, Story 0.6.4
 */

import { useState, useEffect } from 'react';

export interface ReadOnlyNoticeProps {
  className?: string;
}

/**
 * ReadOnlyNotice Component
 *
 * Displays at the top of the Firewall tab with:
 * - Info/warning style (blue/amber)
 * - Clear explanation of WHY editing is disabled
 * - Reference to Phase 1 safety pipeline
 * - Dismissible with localStorage persistence
 *
 * @param props - Component props
 * @returns Read-only notice banner
 */
export function ReadOnlyNotice({ className }: ReadOnlyNoticeProps) {
  const STORAGE_KEY = 'nasnet:firewall:notice-dismissed';
  const [isDismissed, setIsDismissed] = useState(false);

  // Load dismissed state from localStorage
  useEffect(() => {
    const dismissed = localStorage.getItem(STORAGE_KEY) === 'true';
    setIsDismissed(dismissed);
  }, []);

  // Handle dismiss
  const handleDismiss = () => {
    localStorage.setItem(STORAGE_KEY, 'true');
    setIsDismissed(true);
  };

  if (isDismissed) {
    return null;
  }

  return (
    <div
      className={`relative rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-950 ${className || ''}`}
      role="alert"
    >
      <div className="flex items-start gap-3">
        {/* Icon */}
        <svg
          className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>

        {/* Content */}
        <div className="flex-1">
          <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-100">
            🔒 Viewing Mode Only
          </h3>
          <div className="mt-2 text-sm text-blue-800 dark:text-blue-200">
            <p>
              Firewall configuration editing is not available in Phase 0 to ensure network safety.
            </p>
            <p className="mt-2">
              Phase 1 will introduce the <strong>Safety Pipeline</strong>, enabling you to make
              firewall changes with:
            </p>
            <ul className="mt-2 ml-4 list-disc space-y-1">
              <li>Pre-apply validation to catch errors</li>
              <li>Configuration preview before applying</li>
              <li>Automatic rollback if connectivity is lost</li>
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
          className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-200 flex-shrink-0"
          aria-label="Dismiss notice"
        >
          <svg
            className="h-5 w-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>
    </div>
  );
}
