/**
 * Port Knock Sequence Form (Mobile Presenter)
 *
 * Card-based layout with collapsible sections for mobile devices.
 * Optimized for 44px touch targets.
 *
 * Story: NAS-7.12 - Implement Port Knocking - Task 3
 */
import React from 'react';
import type { UsePortKnockSequenceFormReturn } from './use-port-knock-sequence-form';
export interface PortKnockSequenceFormMobileProps {
    /** Headless hook return value */
    formState: UsePortKnockSequenceFormReturn;
    /** Whether form is in edit mode */
    isEditMode?: boolean;
    /** Whether form is submitting */
    isSubmitting?: boolean;
    /** Additional class names */
    className?: string;
}
declare function PortKnockSequenceFormMobileComponent({ formState, isEditMode, isSubmitting, className, }: PortKnockSequenceFormMobileProps): import("react/jsx-runtime").JSX.Element;
export declare const PortKnockSequenceFormMobile: React.MemoExoticComponent<typeof PortKnockSequenceFormMobileComponent>;
export {};
//# sourceMappingURL=PortKnockSequenceFormMobile.d.ts.map