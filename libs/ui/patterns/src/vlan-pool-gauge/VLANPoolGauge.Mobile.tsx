import { Card, CardContent, cn } from '@nasnet/ui/primitives';

import type { VLANPoolGaugeProps } from './VLANPoolGauge';

/**
 * Mobile presenter for VLANPoolGauge
 * Large gauge with simplified stats, touch-friendly
 */
export function VLANPoolGaugeMobile({
  total,
  allocated,
  shouldWarn,
  className,
}: VLANPoolGaugeProps) {
  const available = total - allocated;
  const utilization = total > 0 ? (allocated / total) * 100 : 0;

  // Determine color based on utilization
  const getColor = () => {
    if (utilization >= 90) return 'text-error';
    if (utilization >= 70) return 'text-warning';
    return 'text-success';
  };

  const strokeColor = () => {
    if (utilization >= 90) return 'stroke-error';
    if (utilization >= 70) return 'stroke-warning';
    return 'stroke-success';
  };

  // SVG circle calculations
  const radius = 70;
  const strokeWidth = 12;
  const normalizedRadius = radius - strokeWidth / 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDashoffset = circumference - (utilization / 100) * circumference;

  return (
    <Card
      className={cn(
        'bg-card border-border p-component-md rounded-[var(--semantic-radius-card)] border',
        className
      )}
    >
      <CardContent className="p-0">
        {/* Circular gauge */}
        <div className="gap-component-lg flex flex-col items-center">
          <div className="relative inline-flex items-center justify-center">
            <svg
              height={radius * 2}
              width={radius * 2}
            >
              {/* Background circle */}
              <circle
                stroke="currentColor"
                className="text-muted"
                fill="transparent"
                strokeWidth={strokeWidth}
                r={normalizedRadius}
                cx={radius}
                cy={radius}
              />
              {/* Progress circle */}
              <circle
                stroke="currentColor"
                className={cn('transition-all duration-300', strokeColor())}
                fill="transparent"
                strokeWidth={strokeWidth}
                strokeDasharray={`${circumference} ${circumference}`}
                style={{
                  strokeDashoffset,
                  transform: 'rotate(-90deg)',
                  transformOrigin: '50% 50%',
                }}
                strokeLinecap="round"
                r={normalizedRadius}
                cx={radius}
                cy={radius}
              />
            </svg>

            {/* Center text */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <div className={cn('text-3xl font-bold', getColor())}>{utilization.toFixed(0)}%</div>
              <div className="text-muted-foreground mt-1 text-xs">Used</div>
            </div>
          </div>

          {/* Stats */}
          <div className="space-y-component-sm w-full text-center">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Allocated:</span>
              <span className="font-medium">{allocated.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Available:</span>
              <span className="font-medium">{available.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Total Pool:</span>
              <span className="font-medium">{total.toLocaleString()}</span>
            </div>
          </div>

          {/* Warning indicator */}
          {shouldWarn && (
            <div className="p-component-md bg-warning-light border-warning w-full rounded-[var(--semantic-radius-input)] border">
              <p className="text-warning-dark text-center text-xs font-medium">
                Pool capacity running low
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

VLANPoolGaugeMobile.displayName = 'VLANPoolGauge.Mobile';
