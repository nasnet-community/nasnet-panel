import { useEffect, useRef } from 'react';

import { useTranslation } from '@nasnet/core/i18n';
import { useConnectionStore, type ConnectionState, type ConnectionActions } from '@nasnet/state/stores';
import { useToast } from '@nasnet/ui/primitives';

/**
 * useConnectionToast Hook
 *
 * Automatically shows toast notifications when connection state changes.
 * Specifically shows success toast when reconnection completes.
 *
 * Features:
 * - Watches connection state transitions
 * - Shows success toast on successful reconnection
 * - Auto-dismisses after 3 seconds
 * - Only triggers on reconnecting → connected transition
 *
 * Usage:
 * ```tsx
 * // In App component or high-level provider
 * useConnectionToast();
 * ```
 *
 * Integration:
 * - Add to App component to enable global toast notifications
 * - Requires shadcn/ui Toast provider to be configured
 */
export function useConnectionToast() {
  const { t } = useTranslation('common');
  const state = useConnectionStore((store: ConnectionState & ConnectionActions) => store.state);
  const { toast } = useToast();
  const previousStateRef = useRef(state);

  useEffect(() => {
    const previousState = previousStateRef.current;

    // Show success toast when transitioning from reconnecting to connected
    if (previousState === 'reconnecting' && state === 'connected') {
      toast({
        title: t('status.reconnected'),
        description: t('status.reconnectedDescription'),
        variant: 'default',
        duration: 3000,
      });
    }

    // Update previous state ref
    previousStateRef.current = state;
  }, [state, toast, t]);
}
