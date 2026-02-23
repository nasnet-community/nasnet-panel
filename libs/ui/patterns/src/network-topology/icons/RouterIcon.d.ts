/**
 * RouterIcon
 *
 * SVG icon representing the central router in the network topology.
 * Uses design tokens for theming and supports accessibility.
 */
export interface RouterIconProps {
    /** Size of the icon in pixels */
    size?: number;
    /** Router status for styling */
    status?: 'online' | 'offline' | 'unknown';
    /** Additional CSS classes */
    className?: string;
    /** Accessible label */
    'aria-label'?: string;
}
/**
 * Central router icon for the network topology visualization.
 * Displays as a stylized router with status-based coloring.
 */
export declare const RouterIcon: import("react").NamedExoticComponent<RouterIconProps>;
//# sourceMappingURL=RouterIcon.d.ts.map