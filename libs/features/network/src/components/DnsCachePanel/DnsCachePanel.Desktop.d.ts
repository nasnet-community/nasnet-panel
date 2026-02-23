/**
 * DNS Cache Panel - Desktop Presenter
 * NAS-6.12: DNS Cache & Diagnostics - Task 6.3
 *
 * @description Desktop layout (>=640px) with stats cards, flush button, and
 * confirmation dialog with before/after preview. Shows top domains list.
 */
import * as React from 'react';
import type { DnsCachePanelProps } from './types';
/**
 * Desktop presenter for DNS Cache Panel component
 *
 * @internal Platform presenter - use DnsCachePanel wrapper for auto-detection
 */
declare function DnsCachePanelDesktopComponent({ deviceId, enablePolling, onFlushSuccess, onFlushError, className, }: DnsCachePanelProps): import("react/jsx-runtime").JSX.Element;
declare namespace DnsCachePanelDesktopComponent {
    var displayName: string;
}
export declare const DnsCachePanelDesktop: React.MemoExoticComponent<typeof DnsCachePanelDesktopComponent>;
export {};
//# sourceMappingURL=DnsCachePanel.Desktop.d.ts.map