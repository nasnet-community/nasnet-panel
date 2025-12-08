/**
 * useConfigurationCheck Hook
 * Checks if a router needs configuration and manages the wizard state
 * Only triggers on first visit per router (tracked in router store)
 */

import { useState, useEffect, useCallback } from 'react';
import { useSystemNote } from '@nasnet/api-client/queries';
import { useRouterStore } from '@nasnet/state/stores';

export interface UseConfigurationCheckResult {
  /**
   * Whether the configuration check is loading
   */
  isLoading: boolean;

  /**
   * Whether the router needs configuration (note is empty)
   */
  needsConfiguration: boolean;

  /**
   * Whether the wizard should be shown
   */
  showWizard: boolean;

  /**
   * Opens the wizard
   */
  openWizard: () => void;

  /**
   * Closes the wizard and marks router as checked
   */
  closeWizard: () => void;

  /**
   * Marks the router as checked without showing wizard
   */
  markAsChecked: () => void;

  /**
   * Error from loading system note
   */
  error: Error | null;
}

/**
 * Hook to check if a router needs configuration and manage the wizard
 *
 * @param routerId - Router ID to check
 * @param routerIp - Router IP address for API calls
 * @returns Configuration check state and actions
 *
 * @example
 * ```tsx
 * function RouterPanel({ routerId, routerIp }) {
 *   const {
 *     showWizard,
 *     closeWizard,
 *     needsConfiguration
 *   } = useConfigurationCheck(routerId, routerIp);
 *
 *   return (
 *     <>
 *       <ConfigurationImportWizard
 *         isOpen={showWizard}
 *         onClose={closeWizard}
 *         // ...
 *       />
 *       {// rest of panel}
 *     </>
 *   );
 * }
 * ```
 */
export function useConfigurationCheck(
  routerId: string,
  routerIp: string
): UseConfigurationCheckResult {
  const [showWizard, setShowWizard] = useState(false);
  const [hasTriggeredCheck, setHasTriggeredCheck] = useState(false);

  // Get store actions
  const isConfigurationChecked = useRouterStore(
    (state) => state.isConfigurationChecked
  );
  const markConfigurationChecked = useRouterStore(
    (state) => state.markConfigurationChecked
  );

  // Check if already checked
  const alreadyChecked = isConfigurationChecked(routerId);

  // Fetch system note (only if not already checked)
  const {
    data: noteData,
    isLoading,
    error,
  } = useSystemNote(routerIp);

  // Determine if configuration is needed
  const needsConfiguration = noteData ? !noteData.note.trim() : false;

  // Trigger wizard on first load if needed
  useEffect(() => {
    // Only check once per mount
    if (hasTriggeredCheck) return;

    // Skip if already checked this router
    if (alreadyChecked) {
      setHasTriggeredCheck(true);
      return;
    }

    // Wait for data to load
    if (isLoading) return;

    // If note is empty, show wizard
    if (noteData && !noteData.note.trim()) {
      setShowWizard(true);
    }

    // Mark that we've done the check for this mount
    setHasTriggeredCheck(true);
  }, [alreadyChecked, isLoading, noteData, hasTriggeredCheck]);

  /**
   * Opens the wizard manually
   */
  const openWizard = useCallback(() => {
    setShowWizard(true);
  }, []);

  /**
   * Closes the wizard and marks router as checked
   */
  const closeWizard = useCallback(() => {
    setShowWizard(false);
    markConfigurationChecked(routerId);
  }, [routerId, markConfigurationChecked]);

  /**
   * Marks router as checked without showing wizard
   */
  const markAsChecked = useCallback(() => {
    markConfigurationChecked(routerId);
  }, [routerId, markConfigurationChecked]);

  return {
    isLoading,
    needsConfiguration,
    showWizard,
    openWizard,
    closeWizard,
    markAsChecked,
    error: error ?? null,
  };
}

