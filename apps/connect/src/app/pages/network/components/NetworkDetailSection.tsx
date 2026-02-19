/**
 * Network Detail Section Component
 * Labelled key-value section for displaying network configuration details
 * (IP addresses, DNS, gateway, VLAN info, etc.)
 */

import { cn } from '@/lib/utils';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface NetworkDetailItem {
  /** Field label shown in the left column */
  label: string;
  /** Value displayed in the right column */
  value: string | React.ReactNode;
  /** Optional monospace hint — use for IPs, MACs, port numbers */
  mono?: boolean;
  /** Optional badge colour (maps to semantic status colours) */
  badge?: 'success' | 'warning' | 'error' | 'info' | 'neutral';
}

interface NetworkDetailSectionProps {
  /** Section heading */
  title: string;
  /** Optional description rendered beneath the title */
  description?: string;
  /** Rows to display */
  items: NetworkDetailItem[];
  /** When true renders a subtle loading skeleton */
  isLoading?: boolean;
  /** Additional Tailwind classes */
  className?: string;
}

// ---------------------------------------------------------------------------
// Badge colour mapping
// ---------------------------------------------------------------------------

const BADGE_CLASSES: Record<NonNullable<NetworkDetailItem['badge']>, string> = {
  success: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400',
  warning: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400',
  error: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400',
  info: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400',
  neutral: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400',
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function NetworkDetailSection({
  title,
  description,
  items,
  isLoading = false,
  className,
}: NetworkDetailSectionProps) {
  if (isLoading) {
    return (
      <div
        className={cn(
          'bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4',
          className,
        )}
        aria-busy="true"
        aria-label={`Loading ${title}`}
      >
        <div className="animate-pulse space-y-3">
          <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-32" />
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex justify-between gap-4">
              <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-24" />
              <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-36" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <section
      className={cn(
        'bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4',
        className,
      )}
      aria-labelledby={`nds-title-${title.replace(/\s+/g, '-').toLowerCase()}`}
    >
      {/* Header */}
      <div className="mb-3">
        <h3
          id={`nds-title-${title.replace(/\s+/g, '-').toLowerCase()}`}
          className="text-sm font-semibold text-slate-900 dark:text-white"
        >
          {title}
        </h3>
        {description && (
          <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{description}</p>
        )}
      </div>

      {/* Key-value rows */}
      <dl className="space-y-2">
        {items.map((item, idx) => (
          <div
            key={idx}
            className="flex items-start justify-between gap-4 text-sm"
          >
            <dt className="text-slate-500 dark:text-slate-400 shrink-0">{item.label}</dt>
            <dd
              className={cn(
                'text-right',
                item.mono
                  ? 'font-mono text-xs text-slate-900 dark:text-white'
                  : 'text-slate-900 dark:text-white',
              )}
            >
              {item.badge ? (
                <span
                  className={cn(
                    'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium',
                    BADGE_CLASSES[item.badge],
                  )}
                >
                  {item.value}
                </span>
              ) : (
                item.value
              )}
            </dd>
          </div>
        ))}
      </dl>

      {items.length === 0 && (
        <p className="text-xs text-slate-400 dark:text-slate-500">No details available.</p>
      )}
    </section>
  );
}
