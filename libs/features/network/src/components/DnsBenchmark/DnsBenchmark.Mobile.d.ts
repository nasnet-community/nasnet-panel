/**
 * DNS Benchmark - Mobile Presenter
 * NAS-6.12: DNS Cache & Diagnostics - Task 5.4
 *
 * @description Mobile layout (<640px) with card-based results.
 * Optimized for touch with full-width buttons and responsive spacing.
 */
import * as React from 'react';
import type { DnsBenchmarkProps } from './types';
/**
 * Mobile presenter for DNS Benchmark component
 *
 * @internal Platform presenter - use DnsBenchmark wrapper for auto-detection
 */
declare function DnsBenchmarkMobileComponent({ deviceId, autoRun, onSuccess, onError, className, }: DnsBenchmarkProps): import("react/jsx-runtime").JSX.Element;
declare namespace DnsBenchmarkMobileComponent {
    var displayName: string;
}
export declare const DnsBenchmarkMobile: React.MemoExoticComponent<typeof DnsBenchmarkMobileComponent>;
export {};
//# sourceMappingURL=DnsBenchmark.Mobile.d.ts.map