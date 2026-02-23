/**
 * ThemeToggle Component
 *
 * Provides a button to cycle through three theme modes:
 * 1. Light (Sun icon)
 * 2. Dark (Moon icon)
 * 3. System (Monitor icon) - follows OS preference
 *
 * Features:
 * - Three-state toggle: Light → Dark → System → Light
 * - Displays appropriate icon for each mode
 * - Keyboard accessible with full keyboard support
 * - Screen reader friendly with descriptive aria-label
 * - Smooth icon rotation animation on hover
 * - Persistent state via Zustand store
 *
 * @example
 * ```tsx
 * <ThemeToggle />
 * <ThemeToggle className="ml-2" />
 * ```
 */
/**
 * Props for ThemeToggle component
 * Controls styling of the theme toggle button
 */
export interface ThemeToggleProps {
    /**
     * Optional className for styling
     */
    className?: string;
}
/**
 * ThemeToggle Component
 */
declare function ThemeToggleComponent({ className }: ThemeToggleProps): import("react/jsx-runtime").JSX.Element;
export declare const ThemeToggle: import("react").MemoExoticComponent<typeof ThemeToggleComponent>;
export {};
//# sourceMappingURL=ThemeToggle.d.ts.map