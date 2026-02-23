/**
 * InstanceManager Desktop Presenter
 *
 * Desktop-optimized presenter for InstanceManager pattern.
 * Dense table layout with advanced filtering and sorting.
 *
 * @see ADR-018: Headless Platform Presenters
 */
import * as React from 'react';
import type { InstanceManagerProps } from './types';
/**
 * Desktop presenter for InstanceManager
 *
 * Features:
 * - Data table with sorting
 * - Inline filters
 * - Bulk selection with checkboxes
 * - Hover states and actions
 */
declare function InstanceManagerDesktopComponent(props: InstanceManagerProps): import("react/jsx-runtime").JSX.Element;
export declare const InstanceManagerDesktop: React.MemoExoticComponent<typeof InstanceManagerDesktopComponent>;
export {};
//# sourceMappingURL=InstanceManagerDesktop.d.ts.map