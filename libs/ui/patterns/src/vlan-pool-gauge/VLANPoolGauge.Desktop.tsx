import { Card, CardContent, CardHeader, CardTitle, cn } from '@nasnet/ui/primitives';

import type { VLANPoolGaugeProps } from './VLANPoolGauge';

/**
 * Desktop presenter for VLANPoolGauge
 * Compact gauge with dense stats layout
 */
export function VLANPoolGaugeDesktop({
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
  const radius = 60;
  const strokeWidth = 10;
  const normalizedRadius = radius - strokeWidth / 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDashoffset = circumference - (utilization / 100) * circumference;

  return (
    <Card
      className={cn(
        'bg-card border-border rounded-[var(--semantic-radius-card)] border transition-shadow hover:shadow-md',
        className
      )}
    >
      <CardHeader>
        <CardTitle className="flex items-center justify-between text-lg">
          VLAN Pool Utilization
          {shouldWarn && (
            <span className="text-warning gap-component-sm flex items-center text-xs font-normal">
              <svg
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
              Low Capacity
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="gap-component-lg flex items-center">
          {/* Circular gauge */}
          <div className="relative inline-flex flex-shrink-0 items-center justify-center">
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
              <div className={cn('text-2xl font-bold', getColor())}>{utilization.toFixed(0)}%</div>
            </div>
          </div>

          {/* Stats grid */}
          <div className="gap-component-md grid flex-1 grid-cols-3">
            <div>
              <div className="text-muted-foreground text-xs font-medium uppercase tracking-wider">
                Allocated
              </div>
              <div className="mt-2 text-lg font-semibold">{allocated.toLocaleString()}</div>
            </div>
            <div>
              <div className="text-muted-foreground text-xs font-medium uppercase tracking-wider">
                Available
              </div>
              <div className="mt-2 text-lg font-semibold">{available.toLocaleString()}</div>
            </div>
            <div>
              <div className="text-muted-foreground text-xs font-medium uppercase tracking-wider">
                Total
              </div>
              <div className="mt-2 text-lg font-semibold">{total.toLocaleString()}</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

VLANPoolGaugeDesktop.displayName = 'VLANPoolGauge.Desktop';
