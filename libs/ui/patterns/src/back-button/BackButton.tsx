import { useNavigate } from '@tanstack/react-router';
import { ArrowLeft } from 'lucide-react';

import { Button } from '@nasnet/ui/primitives';

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

/**
 * BackButton Component
 *
 * A reusable back navigation button with an arrow icon.
 *
 * Features:
 * - Left arrow icon using Lucide
 * - Navigates to specified route using React Router
 * - Ghost variant with icon size styling
 * - Rounded full for circular appearance
 * - Accessible with proper aria-label
 *
 * Usage:
 * ```tsx
 * <BackButton to="/routers" ariaLabel="Back to router list" />
 * ```
 *
 * Related:
 * - Story 0.9.6: Return to Router List
 */
export function BackButton({
  to,
  ariaLabel = 'Go back',
  className = '',
}: BackButtonProps) {
  const navigate = useNavigate();

  const handleClick = () => {
    // Use type assertion to allow dynamic paths from props
    navigate({ to: to as '/' });
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={handleClick}
      className={`rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors ${className}`}
      aria-label={ariaLabel}
    >
      <ArrowLeft className="h-5 w-5 text-slate-700 dark:text-slate-300" />
    </Button>
  );
}
