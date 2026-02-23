/**
 * SearchFAB Component
 * Floating Action Button for mobile and tablet command palette access
 *
 * Features:
 * - Fixed position at bottom of screen
 * - 56x56px button (14x14px icon = 44px touch target)
 * - Spring animation entrance/exit
 * - Opens command palette on tap
 * - Visible on mobile and tablet platforms (hidden on desktop for Cmd+K)
 * - Customizable position via bottom/right props
 *
 * @see NAS-4.10: Implement Navigation & Command Palette
 * @see Adaptive Design: Mobile (<640px) + Tablet (640-1024px)
 */
/**
 * Props for SearchFAB
 */
export interface SearchFABProps {
    /** Position from bottom (default: 80px to avoid bottom nav) */
    bottom?: number;
    /** Position from right (default: 16px) */
    right?: number;
    /** Optional className */
    className?: string;
}
/**
 * Search Floating Action Button for mobile
 * Opens the command palette when tapped
 *
 * @example
 * ```tsx
 * // In your mobile layout
 * function MobileLayout({ children }) {
 *   return (
 *     <div>
 *       {children}
 *       <BottomNavigation />
 *       <SearchFAB />
 *       <CommandPalette />
 *     </div>
 *   );
 * }
 * ```
 */
export declare function SearchFAB({ bottom, right, className, }: SearchFABProps): import("react/jsx-runtime").JSX.Element | null;
//# sourceMappingURL=SearchFAB.d.ts.map