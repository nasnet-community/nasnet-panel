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

import React, { useCallback } from 'react';
import { usePlatform } from '@nasnet/ui/patterns';
import { PortKnockSequenceManagerDesktop } from './PortKnockSequenceManagerDesktop';
import { PortKnockSequenceManagerMobile } from './PortKnockSequenceManagerMobile';

export interface PortKnockSequenceManagerProps {
  className?: string;
  onEdit?: (sequenceId: string) => void;
  onCreate?: () => void;
}

/**
 * PortKnockSequenceManager Component
 *
 * Platform-aware wrapper that renders:
 * - Desktop: Dense table with inline actions
 * - Mobile: Card-based layout with touch-friendly controls
 *
 * @param props - Component props
 * @param props.className - Optional CSS class name for styling
 * @param props.onEdit - Callback when editing a sequence (receives sequenceId)
 * @param props.onCreate - Callback when creating a new sequence
 * @returns Platform-appropriate port knock sequence manager
 */
const PortKnockSequenceManagerComponent = React.memo(
  function PortKnockSequenceManagerComponent({
    className,
    onEdit,
    onCreate,
  }: PortKnockSequenceManagerProps) {
    // Platform detection: Mobile (<640px), Tablet (640-1024px), Desktop (>1024px)
    const platform = usePlatform();

    // Memoize callbacks for stable references
    const memoizedOnEdit = useCallback(onEdit || (() => {}), [onEdit]);
    const memoizedOnCreate = useCallback(onCreate || (() => {}), [onCreate]);

    return platform === 'mobile' ? (
      <PortKnockSequenceManagerMobile
        className={className}
        onEdit={memoizedOnEdit}
        onCreate={memoizedOnCreate}
      />
    ) : (
      <PortKnockSequenceManagerDesktop
        className={className}
        onEdit={memoizedOnEdit}
        onCreate={memoizedOnCreate}
      />
    );
  }
);

PortKnockSequenceManagerComponent.displayName = 'PortKnockSequenceManager';

export const PortKnockSequenceManager = PortKnockSequenceManagerComponent;
