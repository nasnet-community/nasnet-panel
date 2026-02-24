/**
 * Port Knock Sequence Manager (Platform Wrapper)
 *
 * @description
 * Wrapper component that detects platform and renders the appropriate presenter.
 * Manages the list of port knock sequences with CRUD operations.
 *
 * Features:
 * - Automatic platform detection (Mobile/Desktop)
 * - Inline enable/disable toggle
 * - CRUD actions (Edit, Delete)
 * - Recent access count display
 * - Safety confirmation for deletion
 *
 * Story: NAS-7.12 - Implement Port Knocking - Task 4
 * @see Docs/design/PLATFORM_PRESENTER_GUIDE.md
 */
import React from 'react';
export interface PortKnockSequenceManagerProps {
    className?: string;
    onEdit?: (sequenceId: string) => void;
    onCreate?: () => void;
}
export declare const PortKnockSequenceManager: React.NamedExoticComponent<PortKnockSequenceManagerProps>;
//# sourceMappingURL=PortKnockSequenceManager.d.ts.map