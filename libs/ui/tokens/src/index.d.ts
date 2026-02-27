/**
 * @nasnet/ui/tokens - Design Token System
 *
 * Central export point for NasNetConnect design tokens.
 * Provides three-tier token architecture:
 *
 * **Tier 1: Primitives** (~80 tokens)
 * - Raw CSS variables, colors, spacing, shadows, borders
 * - Generated from `tokens.json` via build script
 * - Output to `dist/variables.css` for CSS custom properties
 *
 * **Tier 2: Semantic** (~70 tokens)
 * - Platform-aware, context-aware tokens
 * - Animation tokens (mobile/tablet/desktop responsive durations)
 * - Status colors (success/error/warning/info)
 * - Category accents (14 feature categories)
 * - Network interface types (WAN/LAN/VPN/Wireless)
 *
 * **Tier 3: Component** (~50 tokens)
 * - Ready-to-use component-specific tokens
 * - Pre-configured Framer Motion transitions
 * - Component shadow and elevation tokens
 *
 * @see Docs/design/DESIGN_TOKENS.md
 * @see Docs/design/ux-design/2-core-user-experience.md
 *
 * @example
 * ```tsx
 * // Import CSS variables (Tier 1 + Tier 2 primitives)
 * import '@nasnet/ui/tokens/variables.css';
 *
 * // Import TypeScript animation tokens (Tier 2 + Tier 3)
 * import {
 *   transitions,
 *   getAnimationTokens,
 *   durations,
 *   easings,
 *   springs,
 * } from '@nasnet/ui/tokens';
 *
 * // Use in Framer Motion
 * <motion.div
 *   initial={{ opacity: 0 }}
 *   animate={{ opacity: 1 }}
 *   transition={transitions.enter}
 * />
 * ```
 */
export * from './animation';
//# sourceMappingURL=index.d.ts.map
