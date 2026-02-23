/**
 * DNS Cache Panel - Auto-Detecting Wrapper
 * NAS-6.12: DNS Cache & Diagnostics - Task 6
 *
 * @description Automatically selects Mobile or Desktop presenter based on viewport width.
 * Follows Headless + Platform Presenters pattern (ADR-018) with automatic platform detection.
 */
import type { DnsCachePanelProps } from './types';
/**
 * DNS Cache Panel Component
 *
 * @description Displays DNS cache statistics (entries, size, hit rate, top domains) and
 * provides cache flush functionality with before/after preview.
 * Automatically adapts UI for mobile (<640px) and desktop (>=640px) viewports.
 *
 * @example
 * ```tsx
 * import { DnsCachePanel } from '@nasnet/features/network';
 * import { useToast } from '@nasnet/ui/primitives/use-toast';
 *
 * function DnsPage() {
 *   const { toast } = useToast();
 *
 *   return (
 *     <DnsCachePanel
 *       deviceId="router-1"
 *       onFlushSuccess={(result) => toast({
 *         title: 'Cache flushed',
 *         description: `Removed ${result.entriesRemoved} entries`,
 *       })}
 *       onFlushError={(error) => toast({
 *         title: 'Failed to flush cache',
 *         description: error,
 *         variant: 'destructive',
 *       })}
 *     />
 *   );
 * }
 * ```
 *
 * @see DnsCachePanelDesktop Desktop presenter layout
 * @see DnsCachePanelMobile Mobile presenter layout
 */
export declare function DnsCachePanel(props: DnsCachePanelProps): import("react/jsx-runtime").JSX.Element;
export declare namespace DnsCachePanel {
    var displayName: string;
}
//# sourceMappingURL=DnsCachePanel.d.ts.map