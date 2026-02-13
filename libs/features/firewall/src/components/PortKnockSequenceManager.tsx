/**
 * Port Knock Sequence Manager (Platform Wrapper)
 *
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

import { useMediaQuery } from '@nasnet/ui/primitives';
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
 * @returns Platform-appropriate port knock sequence manager
 */
export function PortKnockSequenceManager({
  className,
  onEdit,
  onCreate,
}: PortKnockSequenceManagerProps) {
  // Platform detection: <640px = Mobile, >=640px = Desktop
  const isMobile = useMediaQuery('(max-width: 640px)');

  return isMobile ? (
    <PortKnockSequenceManagerMobile
      className={className}
      onEdit={onEdit}
      onCreate={onCreate}
    />
  ) : (
    <PortKnockSequenceManagerDesktop
      className={className}
      onEdit={onEdit}
      onCreate={onCreate}
    />
  );
}

PortKnockSequenceManager.displayName = 'PortKnockSequenceManager';
