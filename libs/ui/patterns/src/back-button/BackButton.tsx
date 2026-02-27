import * as React from 'react';
import { useNavigate } from '@tanstack/react-router';
import { ArrowLeft } from 'lucide-react';

import { Button, cn, Icon } from '@nasnet/ui/primitives';

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
const BackButtonComponent = React.forwardRef<HTMLButtonElement, BackButtonProps>(
  ({ to, ariaLabel = 'Go back', className }, ref) => {
    const navigate = useNavigate();

    const handleClick = React.useCallback(() => {
      // Use type assertion to allow dynamic paths from props
      navigate({ to: to as '/' });
    }, [to, navigate]);

    return (
      <Button
        ref={ref}
        variant="ghost"
        size="icon"
        onClick={handleClick}
        className={cn('hover:bg-muted rounded-full transition-colors', className)}
        aria-label={ariaLabel}
      >
        <Icon
          icon={ArrowLeft}
          size="md"
          className="text-muted-foreground"
        />
      </Button>
    );
  }
);

BackButtonComponent.displayName = 'BackButton';

const BackButton = React.memo(BackButtonComponent);

export { BackButton };
