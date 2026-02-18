/**
 * useInterfaceStatusCard Headless Hook
 *
 * Provides logic for InterfaceStatusCard component including:
 * - Click/keyboard event handling
 * - Status change detection for animations
 * - Accessibility attributes
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { useReducedMotion } from './utils';
import type { InterfaceGridData, InterfaceStatus } from './types';

interface UseInterfaceStatusCardProps {
  /** Interface data */
  interface: InterfaceGridData;
  /** Callback when card is selected */
  onSelect: (iface: InterfaceGridData) => void;
}

interface UseInterfaceStatusCardReturn {
  /** Click handler for the card */
  handleClick: () => void;
  /** Keyboard handler for Enter/Space */
  handleKeyDown: (e: React.KeyboardEvent) => void;
  /** Whether status recently changed (for animation) */
  isStatusChanged: boolean;
  /** Whether to skip animations */
  prefersReducedMotion: boolean;
  /** ARIA label for the card */
  ariaLabel: string;
  /** ID for the details element (for aria-describedby) */
  detailsId: string;
}

/**
 * Headless hook for InterfaceStatusCard component.
 * Handles click/keyboard events, status change detection, and accessibility.
 *
 * @example
 * function InterfaceStatusCard({ interface, onSelect }: InterfaceStatusCardProps) {
 *   const {
 *     handleClick,
 *     handleKeyDown,
 *     isStatusChanged,
 *     prefersReducedMotion,
 *     ariaLabel,
 *     detailsId,
 *   } = useInterfaceStatusCard({ interface, onSelect });
 *
 *   return (
 *     <Card
 *       role="article"
 *       aria-label={ariaLabel}
 *       aria-describedby={detailsId}
 *       tabIndex={0}
 *       onClick={handleClick}
 *       onKeyDown={handleKeyDown}
 *       className={cn(!prefersReducedMotion && isStatusChanged && 'animate-pulse')}
 *     >
 *       <CardContent>{/* ... *\/}</CardContent>
 *     </Card>
 *   );
 * }
 */
export function useInterfaceStatusCard({
  interface: iface,
  onSelect,
}: UseInterfaceStatusCardProps): UseInterfaceStatusCardReturn {
  const previousStatusRef = useRef<InterfaceStatus>(iface.status);
  const [isStatusChanged, setIsStatusChanged] = useState(false);
  const prefersReducedMotion = useReducedMotion();

  // Detect status changes for pulse animation
  useEffect(() => {
    if (iface.status !== previousStatusRef.current) {
      setIsStatusChanged(true);
      previousStatusRef.current = iface.status;

      // Clear the status changed flag after animation duration (2 seconds)
      const timer = setTimeout(() => setIsStatusChanged(false), 2000);
      return () => clearTimeout(timer);
    }
    // No cleanup needed if status hasn't changed
    return undefined;
  }, [iface.status]);

  const handleClick = useCallback(() => {
    onSelect(iface);
  }, [iface, onSelect]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        onSelect(iface);
      }
    },
    [iface, onSelect]
  );

  const ariaLabel = `${iface.name} interface, status ${iface.status}${
    iface.ip ? `, IP ${iface.ip}` : ''
  }`;
  const detailsId = `interface-${iface.id}-details`;

  return {
    handleClick,
    handleKeyDown,
    isStatusChanged,
    prefersReducedMotion,
    ariaLabel,
    detailsId,
  };
}
