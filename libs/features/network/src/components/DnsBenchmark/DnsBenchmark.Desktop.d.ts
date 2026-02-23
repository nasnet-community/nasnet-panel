/**
 * DNS Benchmark - Desktop Presenter
 * NAS-6.12: DNS Cache & Diagnostics - Task 5.3
 *
 * @description Desktop layout (>=640px) with data table sorted by response time.
 * Provides detailed DNS server benchmark results with status indicators and
 * response time metrics.
 */
import * as React from 'react';
import type { DnsBenchmarkProps } from './types';
/**
 * Desktop presenter for DNS Benchmark component
 *
 * @internal Platform presenter - use DnsBenchmark wrapper for auto-detection
 */
declare function DnsBenchmarkDesktopComponent({ deviceId, autoRun, onSuccess, onError, className, }: DnsBenchmarkProps): import("react/jsx-runtime").JSX.Element;
declare namespace DnsBenchmarkDesktopComponent {
    var displayName: string;
}
export declare const DnsBenchmarkDesktop: React.MemoExoticComponent<typeof DnsBenchmarkDesktopComponent>;
export {};
//# sourceMappingURL=DnsBenchmark.Desktop.d.ts.map