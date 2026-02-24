/**
 * Port Knock Sequence Manager (Desktop Presenter)
 *
 * Desktop table view with inline actions for managing port knock sequences.
 *
 * Story: NAS-7.12 - Implement Port Knocking - Task 4
 */
/**
 * @description Desktop table presenter for port knock sequence management
 */
export interface PortKnockSequenceManagerDesktopProps {
    className?: string;
    onEdit?: (sequenceId: string) => void;
    onCreate?: () => void;
}
export declare const PortKnockSequenceManagerDesktop: import("react").NamedExoticComponent<PortKnockSequenceManagerDesktopProps>;
//# sourceMappingURL=PortKnockSequenceManagerDesktop.d.ts.map