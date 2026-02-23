/**
 * Device Card Component
 *
 * Main component that auto-detects platform and renders the appropriate presenter.
 * Part of the Headless + Platform Presenter pattern (ADR-018).
 *
 * @module @nasnet/ui/patterns/network/device-card
 * @see NAS-4A.20: Build Device Discovery Card Component
 */
import * as React from 'react';
import type { DeviceCardProps } from './device-card.types';
/**
 * Device Card Component
 *
 * Displays discovered network devices with type detection, online status,
 * vendor lookup, and interactive actions.
 *
 * Auto-detects platform (mobile/desktop) and renders the appropriate presenter.
 * Uses CSS media queries for SSR compatibility.
 *
 * Features:
 * - Device type inference from MAC vendor lookup
 * - Online/offline status with visual indicators
 * - Interactive actions (rename, static IP, block)
 * - Platform-responsive (mobile = bottom sheet, desktop = dropdown)
 * - Compact mode for sidebar/widget contexts
 * - WCAG AAA accessible
 * - Reduced motion support
 *
 * @example
 * ```tsx
 * // Basic usage
 * <DeviceCard device={discoveredDevice} />
 *
 * // With actions
 * <DeviceCard
 *   device={device}
 *   onConfigure={(d) => openConfig(d)}
 *   onBlock={(d) => blockDevice(d)}
 *   onRename={(d, name) => renameDevice(d, name)}
 * />
 *
 * // Compact mode for sidebar
 * <DeviceCard
 *   device={device}
 *   compact
 *   onClick={(d) => setSelectedDevice(d)}
 * />
 * ```
 */
/**
 * Internal component function
 */
declare function DeviceCardComponent({ device, onConfigure, onBlock, onRename, onAssignStaticIp, compact, showActions, className, id, isSelected, onClick, }: DeviceCardProps): import("react/jsx-runtime").JSX.Element;
/**
 * Memoized DeviceCard component
 */
export declare const DeviceCard: React.MemoExoticComponent<typeof DeviceCardComponent>;
export {};
//# sourceMappingURL=device-card.d.ts.map