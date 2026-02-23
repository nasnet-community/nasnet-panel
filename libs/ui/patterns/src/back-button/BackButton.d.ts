import * as React from 'react';
export interface BackButtonProps {
    /**
     * The route to navigate to when the button is clicked
     */
    to: string;
    /**
     * Accessible label for screen readers
     * @default "Go back"
     */
    ariaLabel?: string;
    /**
     * Optional className for additional styling
     */
    className?: string;
}
declare const BackButton: React.MemoExoticComponent<React.ForwardRefExoticComponent<BackButtonProps & React.RefAttributes<HTMLButtonElement>>>;
export { BackButton };
//# sourceMappingURL=BackButton.d.ts.map