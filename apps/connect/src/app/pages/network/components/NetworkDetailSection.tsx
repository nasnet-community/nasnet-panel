/**
 * Network Detail Section Component
 * Labelled key-value section for displaying network configuration details
 * (IP addresses, DNS, gateway, VLAN info, etc.)
 */

import React from 'react';

import { useTranslation } from 'react-i18next';

import { cn } from '@nasnet/ui/utils';

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
  success: 'bg-success/15 text-success',
  warning: 'bg-warning/15 text-warning',
  error: 'bg-error/15 text-error',
  info: 'bg-info/15 text-info',
  neutral: 'bg-muted text-muted-foreground',
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export const NetworkDetailSection = React.memo(function NetworkDetailSection({
  title,
  description,
  items,
  isLoading = false,
  className,
}: NetworkDetailSectionProps) {
  const { t } = useTranslation('network');
  if (isLoading) {
    return (
      <div
        className={cn(
          'bg-card rounded-card-lg border border-border p-component-md',
          className,
        )}
        aria-busy="true"
        aria-label={`Loading ${title}`}
      >
        <div className="animate-pulse space-y-3">
          <div className="h-4 bg-muted rounded w-32" />
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex justify-between gap-4">
              <div className="h-3 bg-muted rounded w-24" />
              <div className="h-3 bg-muted rounded w-36" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <section
      className={cn(
        'bg-card rounded-card-lg border border-border p-component-md',
        className,
      )}
      aria-labelledby={`nds-title-${title.replace(/\s+/g, '-').toLowerCase()}`}
    >
      {/* Header */}
      <div className="mb-3">
        <h3
          id={`nds-title-${title.replace(/\s+/g, '-').toLowerCase()}`}
          className="text-sm font-semibold text-foreground"
        >
          {title}
        </h3>
        {description && (
          <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
        )}
      </div>

      {/* Key-value rows */}
      <dl className="space-y-2">
        {items.map((item, idx) => (
          <div
            key={idx}
            className="flex items-start justify-between gap-4 text-sm"
          >
            <dt className="text-muted-foreground shrink-0">{item.label}</dt>
            <dd
              className={cn(
                'text-right',
                item.mono
                  ? 'font-mono text-xs text-foreground'
                  : 'text-foreground',
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
        <p className="text-xs text-muted-foreground">{t('status.noDetailsAvailable')}</p>
      )}
    </section>
  );
});

NetworkDetailSection.displayName = 'NetworkDetailSection';
