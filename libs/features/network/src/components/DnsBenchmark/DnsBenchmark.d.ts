/**
 * DNS Benchmark - Auto-Detecting Wrapper
 * NAS-6.12: DNS Cache & Diagnostics - Task 5
 *
 * Automatically selects Mobile or Desktop presenter based on viewport width.
 * Follows Headless + Platform Presenters pattern (ADR-018).
 */
import type { DnsBenchmarkProps } from './types';
/**
 * DNS Benchmark Component
 *
 * Tests all configured DNS servers and displays results sorted by response time.
 * Automatically adapts UI for mobile (<640px) and desktop (>=640px) viewports.
 *
 * @description Headless + Platform Presenters pattern for DNS performance testing
 *
 * @example
 * ```tsx
 * <DnsBenchmark
 *   deviceId="router-1"
 *   onSuccess={(result) => console.log('Benchmark complete', result)}
 *   onError={(error) => toast.error(error)}
 * />
 * ```
 */
declare function DnsBenchmarkComponent(props: DnsBenchmarkProps): import("react/jsx-runtime").JSX.Element;
declare namespace DnsBenchmarkComponent {
    var displayName: string;
}
export declare const DnsBenchmark: import("react").MemoExoticComponent<typeof DnsBenchmarkComponent>;
export {};
//# sourceMappingURL=DnsBenchmark.d.ts.map