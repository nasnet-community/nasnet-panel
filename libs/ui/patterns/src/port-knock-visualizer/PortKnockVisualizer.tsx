/**
 * Port Knock Sequence Visualizer
 *
 * Visual flow diagram showing knock sequence progression:
 * - Stage 1 (Port X) → Stage 2 (Port Y) → ... → Access Granted
 * - Protocol badges (TCP/UDP) for each knock port
 * - Timeout indicators between stages
 * - Protected service icon and port at final stage
 * - Responsive: horizontal flow on desktop, vertical on mobile
 *
 * @see Docs/sprint-artifacts/Epic7-Security-Firewall/NAS-7-12-implement-port-knocking.md
 */

import { LockIcon, CheckCircle2Icon, ArrowRightIcon, ClockIcon } from 'lucide-react';

import type { KnockPort, PortKnockSequence } from '@nasnet/core/types';
import { Badge , cn } from '@nasnet/ui/primitives';

// ============================================================================
// Types
// ============================================================================

export interface PortKnockVisualizerProps {
  /** Knock ports in sequence */
  knockPorts: KnockPort[];

  /** Protected service port */
  protectedPort: number;

  /** Protected service protocol */
  protectedProtocol: 'tcp' | 'udp';

  /** Knock timeout between stages */
  knockTimeout?: string;

  /** Access timeout after successful knock */
  accessTimeout?: string;

  /** Compact mode (reduced spacing) */
  compact?: boolean;

  /** Additional class names */
  className?: string;
}

// ============================================================================
// Protocol Badge Component
// ============================================================================

interface ProtocolBadgeProps {
  protocol: string;
  compact?: boolean;
}

function ProtocolBadge({ protocol, compact }: ProtocolBadgeProps) {
  const variant = protocol === 'tcp' ? 'default' : protocol === 'udp' ? 'secondary' : 'outline';

  return (
    <Badge variant={variant} className={cn('uppercase font-mono', compact && 'text-xs px-1.5 py-0.5')}>
      {protocol}
    </Badge>
  );
}

// ============================================================================
// Stage Node Component
// ============================================================================

interface StageNodeProps {
  stageNumber: number;
  port: number;
  protocol: string;
  compact?: boolean;
}

function StageNode({ stageNumber, port, protocol, compact }: StageNodeProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center gap-2 p-4 border-2 border-red-500 rounded-lg bg-red-50 dark:bg-red-950/20',
        compact && 'p-3 gap-1'
      )}
    >
      <div className={cn('text-xs font-medium text-red-700 dark:text-red-400')}>
        Stage {stageNumber}
      </div>
      <div className={cn('text-2xl font-bold text-red-900 dark:text-red-100', compact && 'text-xl')}>
        {port}
      </div>
      <ProtocolBadge protocol={protocol} compact={compact} />
    </div>
  );
}

// ============================================================================
// Arrow Separator Component
// ============================================================================

interface ArrowSeparatorProps {
  timeout?: string;
  vertical?: boolean;
  compact?: boolean;
}

function ArrowSeparator({ timeout, vertical, compact }: ArrowSeparatorProps) {
  return (
    <div
      className={cn(
        'flex items-center gap-2',
        vertical ? 'flex-col' : 'flex-row',
        compact && 'gap-1'
      )}
    >
      <ArrowRightIcon
        className={cn(
          'text-red-500',
          vertical && 'rotate-90',
          compact ? 'h-4 w-4' : 'h-6 w-6'
        )}
      />
      {timeout && (
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <ClockIcon className="h-3 w-3" />
          <span>{timeout}</span>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Final Stage Component
// ============================================================================

interface FinalStageProps {
  port: number;
  protocol: string;
  accessTimeout?: string;
  compact?: boolean;
}

function FinalStage({ port, protocol, accessTimeout, compact }: FinalStageProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center gap-2 p-4 border-2 border-green-500 rounded-lg bg-green-50 dark:bg-green-950/20',
        compact && 'p-3 gap-1'
      )}
    >
      <CheckCircle2Icon className={cn('text-green-600 dark:text-green-400', compact ? 'h-6 w-6' : 'h-8 w-8')} />
      <div className={cn('text-sm font-medium text-green-700 dark:text-green-400')}>
        Access Granted
      </div>
      <div className={cn('flex items-center gap-2 text-lg font-bold text-green-900 dark:text-green-100', compact && 'text-base')}>
        <LockIcon className={cn(compact ? 'h-4 w-4' : 'h-5 w-5')} />
        {protocol.toUpperCase()}:{port}
      </div>
      {accessTimeout && (
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <ClockIcon className="h-3 w-3" />
          <span>Timeout: {accessTimeout}</span>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Main Component
// ============================================================================

/**
 * Port Knock Sequence Visualizer
 * Shows visual flow of knock sequence progression
 */
export function PortKnockVisualizer({
  knockPorts,
  protectedPort,
  protectedProtocol,
  knockTimeout,
  accessTimeout,
  compact = false,
  className,
}: PortKnockVisualizerProps) {
  // Determine layout direction based on screen size
  const [isMobile, setIsMobile] = React.useState(false);

  React.useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 640);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const isVertical = isMobile;

  return (
    <div
      className={cn(
        'flex gap-4 p-4 bg-background border border-border rounded-lg',
        isVertical ? 'flex-col items-center' : 'flex-row items-center flex-wrap justify-center',
        compact && 'gap-2 p-3',
        className
      )}
      role="img"
      aria-label="Port knocking sequence visualization"
    >
      {knockPorts.map((knockPort, index) => (
        <React.Fragment key={`stage-${index}`}>
          <StageNode
            stageNumber={index + 1}
            port={knockPort.port}
            protocol={knockPort.protocol}
            compact={compact}
          />

          {index < knockPorts.length - 1 ? (
            <ArrowSeparator timeout={knockTimeout} vertical={isVertical} compact={compact} />
          ) : (
            <ArrowSeparator vertical={isVertical} compact={compact} />
          )}
        </React.Fragment>
      ))}

      <FinalStage
        port={protectedPort}
        protocol={protectedProtocol}
        accessTimeout={accessTimeout}
        compact={compact}
      />
    </div>
  );
}

PortKnockVisualizer.displayName = 'PortKnockVisualizer';
