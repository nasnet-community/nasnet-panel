/**
 * Common Patterns
 *
 * Reusable UX patterns that are not domain-specific.
 * These can be used across any feature.
 *
 * All patterns follow the Headless + Platform Presenters architecture:
 * - usePatternName.ts - Headless hook with business logic
 * - PatternName.tsx - Auto-detect wrapper
 * - PatternName.Mobile.tsx - Mobile presenter
 * - PatternName.Desktop.tsx - Desktop presenter
 *
 * @see PATTERNS.md for implementation guide
 * @see ADR-018 for architecture details
 */
export * from './resource-card';
export * from './metric-display';
export * from '../status-badge';
export * from '../status-indicator';
export * from '../data-table';
export * from '../empty-state';
export * from '../confirmation-dialog';
export * from '../form-field';
export * from '../connection-indicator';
export * from '../connection-banner';
export * from '../resource-gauge';
export * from '../last-updated';
export * from '../severity-badge';
export * from '../theme-toggle';
export * from '../back-button';
export * from './motion-presets';
//# sourceMappingURL=index.d.ts.map