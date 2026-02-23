/**
 * Port Knock Sequence Form (Desktop Presenter)
 *
 * Two-column layout with form on left and visualizer on right.
 * Features drag-drop reordering for knock ports.
 *
 * Story: NAS-7.12 - Implement Port Knocking - Task 3
 */
import React from 'react';
import type { UsePortKnockSequenceFormReturn } from './use-port-knock-sequence-form';
export interface PortKnockSequenceFormDesktopProps {
    /** Headless hook return value */
    formState: UsePortKnockSequenceFormReturn;
    /** Whether form is in edit mode */
    isEditMode?: boolean;
    /** Whether form is submitting */
    isSubmitting?: boolean;
    /** Additional class names */
    className?: string;
}
declare function PortKnockSequenceFormDesktopComponent({ formState, isEditMode, isSubmitting, className, }: PortKnockSequenceFormDesktopProps): import("react/jsx-runtime").JSX.Element;
export declare const PortKnockSequenceFormDesktop: React.MemoExoticComponent<typeof PortKnockSequenceFormDesktopComponent>;
export {};
//# sourceMappingURL=PortKnockSequenceFormDesktop.d.ts.map