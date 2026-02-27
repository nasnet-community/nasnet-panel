/**
 * useConfidenceIndicator Hook
 *
 * Headless hook for confidence indicator logic.
 * Implements the Headless + Platform Presenter pattern (ADR-018).
 *
 * All business logic is contained here - presenters only handle rendering.
 *
 * @module @nasnet/ui/patterns/confidence-indicator
 * @see NAS-4A.10: Build Confidence Indicator Component
 */

import { useMemo, useCallback } from 'react';

import type {
  UseConfidenceIndicatorConfig,
  UseConfidenceIndicatorReturn,
  ConfidenceLevel,
} from './confidence-indicator.types';

/**
 * Confidence level thresholds
 * - >= 90: high confidence (green)
 * - >= 60: medium confidence (amber)
 * - < 60: low confidence (red)
 */
const CONFIDENCE_THRESHOLDS = {
  HIGH: 90,
  MEDIUM: 60,
} as const;

/**
 * Level-to-color mapping using semantic design tokens
 */
const LEVEL_COLORS = {
  high: 'success',
  medium: 'warning',
  low: 'error',
} as const;

/**
 * Level-to-icon mapping for lucide-react icons
 */
const LEVEL_ICONS = {
  high: 'CheckCircle2',
  medium: 'AlertTriangle',
  low: 'XCircle',
} as const;

/**
 * Human-readable labels for confidence levels
 */
const LEVEL_LABELS = {
  high: 'High confidence',
  medium: 'Medium confidence',
  low: 'Low confidence',
} as const;

/**
 * Calculate confidence level from percentage
 */
function calculateLevel(confidence: number): ConfidenceLevel {
  if (confidence >= CONFIDENCE_THRESHOLDS.HIGH) return 'high';
  if (confidence >= CONFIDENCE_THRESHOLDS.MEDIUM) return 'medium';
  return 'low';
}

/**
 * Clamp confidence value between 0 and 100
 */
function clampConfidence(confidence: number): number {
  return Math.min(100, Math.max(0, Math.round(confidence)));
}

/**
 * Headless hook for confidence indicator component.
 *
 * Encapsulates all logic for:
 * - Confidence level calculation
 * - Color and icon selection
 * - ARIA label generation
 * - Override action handling
 *
 * @param config - Configuration options
 * @returns Computed state for presenters
 *
 * @example
 * ```tsx
 * const state = useConfidenceIndicator({
 *   confidence: 95,
 *   method: 'Auto-detected via DHCP response',
 *   onOverride: () => setIsEditing(true),
 * });
 *
 * // state.level === 'high'
 * // state.color === 'success'
 * // state.ariaLabel === 'High confidence, 95%, Auto-detected via DHCP response'
 * ```
 */
export function useConfidenceIndicator(
  config: UseConfidenceIndicatorConfig
): UseConfidenceIndicatorReturn {
  const { confidence, method, onOverride, showPercentage = true } = config;

  // Clamp and memoize the percentage
  const percentage = useMemo(() => clampConfidence(confidence), [confidence]);

  // Calculate the confidence level
  const level = useMemo(() => calculateLevel(percentage), [percentage]);

  // Get the semantic color for the level
  const color = LEVEL_COLORS[level];

  // Get the icon name for the level
  const iconName = LEVEL_ICONS[level];

  // Get the human-readable label
  const levelLabel = LEVEL_LABELS[level];

  // Determine if override is available
  const canOverride = Boolean(onOverride);

  // Memoize the override handler
  const handleOverride = useCallback(() => {
    if (onOverride) {
      onOverride();
    }
  }, [onOverride]);

  // Build accessible ARIA label
  const ariaLabel = useMemo(() => {
    const parts: string[] = [levelLabel];

    if (showPercentage) {
      parts.push(`${percentage}%`);
    }

    if (method) {
      parts.push(method);
    }

    return parts.join(', ');
  }, [levelLabel, percentage, method, showPercentage]);

  return {
    level,
    color,
    iconName,
    percentage,
    method,
    canOverride,
    handleOverride,
    ariaLabel,
    levelLabel,
    showPercentage,
  };
}

/**
 * Export level constants for testing and documentation
 */
export { CONFIDENCE_THRESHOLDS, LEVEL_COLORS, LEVEL_ICONS, LEVEL_LABELS };
