/**
 * EmailChannelForm - Platform Detector
 *
 * Auto-detects platform (Mobile/Desktop) and renders the appropriate presenter.
 * Follows Headless + Platform Presenter pattern from PLATFORM_PRESENTER_GUIDE.md
 *
 * @description Renders email configuration form optimized for each platform
 * @example
 * // Basic usage with callbacks
 * <EmailChannelForm
 *   initialConfig={existingConfig}
 *   onSubmit={handleSave}
 *   onTest={handleTest}
 * />
 *
 * // With custom styling
 * <EmailChannelForm
 *   initialConfig={config}
 *   onSubmit={handleSave}
 *   className="p-4"
 * />
 *
 * @see useEmailChannelForm
 * @see Docs/design/PLATFORM_PRESENTER_GUIDE.md
 */

import { memo, useMemo } from 'react';
import { useMediaQuery } from '@nasnet/ui/primitives';
import { useEmailChannelForm, type UseEmailChannelFormOptions } from '../hooks/useEmailChannelForm';
import { EmailChannelFormDesktop } from './EmailChannelFormDesktop';
import { EmailChannelFormMobile } from './EmailChannelFormMobile';
import { cn } from '@nasnet/ui/utils';

/**
 * @interface EmailChannelFormProps
 * @description Props for EmailChannelForm platform detector
 */
interface EmailChannelFormProps extends UseEmailChannelFormOptions {
  /** Optional CSS className for custom styling */
  className?: string;
  /** Optional platform override ('mobile' | 'desktop') */
  presenter?: 'mobile' | 'desktop';
}

/**
 * Email channel configuration form with automatic platform detection.
 *
 * Detects viewport width and renders optimized presenter:
 * - Mobile (<640px): Touch-optimized single-column with accordion sections
 * - Desktop (≥640px): Dense two-column layout with collapsible advanced settings
 *
 * All form state managed in headless hook. Presenters handle rendering only.
 *
 * @component
 * @example
 * return (
 *   <EmailChannelForm
 *     initialConfig={config}
 *     onSubmit={handleSave}
 *     onTest={handleTest}
 *   />
 * );
 */
const EmailChannelForm = memo(
  function EmailChannelForm(props: EmailChannelFormProps) {
    const { className, presenter, ...hookOptions } = props;

    // Platform detection: mobile <640px
    const isMobile = useMediaQuery('(max-width: 640px)');

    // Determine which presenter to render
    const shouldUseMobile = useMemo(() => {
      if (presenter) return presenter === 'mobile';
      return isMobile;
    }, [presenter, isMobile]);

    // Initialize headless hook (zero JSX, stable across renders)
    const emailForm = useEmailChannelForm(hookOptions);

    // Render appropriate presenter based on platform
    return (
      <div className={cn('EmailChannelForm-wrapper', className)}>
        {shouldUseMobile ?
          <EmailChannelFormMobile emailForm={emailForm} />
        : <EmailChannelFormDesktop emailForm={emailForm} />}
      </div>
    );
  },
  // Custom memo comparison for performance
  (prevProps, nextProps) => {
    return (
      prevProps.className === nextProps.className &&
      prevProps.presenter === nextProps.presenter &&
      prevProps.initialConfig === nextProps.initialConfig &&
      prevProps.onSubmit === nextProps.onSubmit &&
      prevProps.onTest === nextProps.onTest
    );
  }
);

EmailChannelForm.displayName = 'EmailChannelForm';

export { EmailChannelForm };
export type { EmailChannelFormProps };
