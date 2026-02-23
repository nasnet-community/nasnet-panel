/**
 * UI Primitives Hooks
 *
 * Custom React hooks for UI primitives.
 *
 * Includes:
 * - useReducedMotion - Detect user's motion preference (accessibility)
 * - useMediaQuery - Detect media query matches (responsive design)
 *
 * All hooks are SSR-safe and handle client/server environments correctly.
 */

export { useReducedMotion } from './useReducedMotion';
export { useMediaQuery } from './useMediaQuery';
