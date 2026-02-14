/**
 * ResourceUsageBar Pattern Component
 *
 * Resource usage visualization with threshold-based color coding.
 * Follows the Headless + Platform Presenter pattern.
 */

export {
  ResourceUsageBar,
  ResourceUsageBarMobile,
  ResourceUsageBarDesktop,
  useResourceUsageBar,
} from './ResourceUsageBar';

export type {
  ResourceUsageBarProps,
  UsageStatus,
  ResourceType,
} from './types';

export type { UseResourceUsageBarReturn } from './useResourceUsageBar';
