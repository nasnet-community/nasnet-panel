/**
 * InstanceManager Mobile Presenter
 *
 * Mobile-optimized presenter for InstanceManager pattern.
 * Optimized for touch interaction with simplified filtering.
 *
 * @see ADR-018: Headless Platform Presenters
 */
import * as React from 'react';
import type { InstanceManagerProps } from './types';
/**
 * Mobile presenter for InstanceManager
 *
 * Features:
 * - Single column list layout
 * - Bottom sheet for filters
 * - Simplified bulk actions
 * - Pull-to-refresh ready
 */
declare function InstanceManagerMobileComponent(props: InstanceManagerProps): import("react/jsx-runtime").JSX.Element;
export declare const InstanceManagerMobile: React.MemoExoticComponent<typeof InstanceManagerMobileComponent>;
export {};
//# sourceMappingURL=InstanceManagerMobile.d.ts.map