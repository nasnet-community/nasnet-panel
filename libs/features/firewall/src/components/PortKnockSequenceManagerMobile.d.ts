/**
 * Port Knock Sequence Manager (Mobile Presenter)
 *
 * Card-based mobile view with touch-friendly actions for managing port knock sequences.
 *
 * Story: NAS-7.12 - Implement Port Knocking - Task 4
 */
/**
 * @description Mobile card presenter for port knock sequence management
 */
export interface PortKnockSequenceManagerMobileProps {
    className?: string;
    onEdit?: (sequenceId: string) => void;
    onCreate?: () => void;
}
export declare const PortKnockSequenceManagerMobile: import("react").NamedExoticComponent<PortKnockSequenceManagerMobileProps>;
//# sourceMappingURL=PortKnockSequenceManagerMobile.d.ts.map