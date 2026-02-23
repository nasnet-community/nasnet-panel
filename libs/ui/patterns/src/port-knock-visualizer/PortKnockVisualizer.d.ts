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
import React from 'react';
import type { KnockPort } from '@nasnet/core/types';
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
/**
 * Port Knock Sequence Visualizer
 * Shows visual flow of knock sequence progression
 */
declare function PortKnockVisualizerComponent({ knockPorts, protectedPort, protectedProtocol, knockTimeout, accessTimeout, compact, className, }: PortKnockVisualizerProps): import("react/jsx-runtime").JSX.Element;
export declare const PortKnockVisualizer: React.MemoExoticComponent<typeof PortKnockVisualizerComponent>;
export {};
//# sourceMappingURL=PortKnockVisualizer.d.ts.map