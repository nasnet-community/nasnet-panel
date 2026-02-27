/**
 * TanStack Query mutation hook for updating connection tracking settings
 * NAS-7.4: Connection Tracking - Settings Mutation Layer
 * Uses rosproxy backend for RouterOS API communication
 *
 * Endpoint: PATCH /rest/ip/firewall/connection/tracking/set
 */
import { UseMutationResult } from '@tanstack/react-query';
/**
 * Partial update payload for connection tracking settings
 * All fields are optional - only provided fields will be updated
 */
export interface UpdateConnectionTrackingInput {
  enabled?: boolean;
  maxEntries?: number;
  genericTimeout?: number;
  tcpEstablishedTimeout?: number;
  tcpTimeWaitTimeout?: number;
  tcpCloseTimeout?: number;
  tcpSynSentTimeout?: number;
  tcpSynReceivedTimeout?: number;
  tcpFinWaitTimeout?: number;
  tcpCloseWaitTimeout?: number;
  tcpLastAckTimeout?: number;
  udpTimeout?: number;
  udpStreamTimeout?: number;
  icmpTimeout?: number;
  looseTracking?: boolean;
}
/**
 * Variables for update mutation
 */
export interface UpdateConnectionTrackingVariables {
  /**
   * Target router IP address
   */
  routerIp: string;
  /**
   * Settings to update (partial)
   */
  settings: UpdateConnectionTrackingInput;
}
export interface UseUpdateConnectionTrackingOptions {
  /**
   * Target router IP address
   */
  routerIp: string;
  /**
   * Callback fired on successful update
   */
  onSuccess?: () => void;
  /**
   * Callback fired on error
   */
  onError?: (error: Error) => void;
}
/**
 * React Query mutation hook for updating connection tracking settings
 *
 * Updates the global connection tracking configuration. Only provided
 * fields will be updated - omitted fields remain unchanged.
 *
 * @param options - Hook configuration options
 * @returns Mutation result with updateSettings function
 *
 * @example
 * ```tsx
 * function ConnectionTrackingSettingsForm() {
 *   const routerIp = useConnectionStore(state => state.currentRouterIp);
 *   const { mutate: updateSettings, isPending } = useUpdateConnectionTracking({
 *     routerIp: routerIp || '',
 *     onSuccess: () => toast.success('Settings updated'),
 *     onError: (error) => toast.error(`Failed: ${error.message}`),
 *   });
 *
 *   const handleSubmit = (values: UpdateConnectionTrackingInput) => {
 *     updateSettings({ settings: values });
 *   };
 *
 *   return (
 *     <Form onSubmit={handleSubmit}>
 *       <FormField name="enabled" label="Connection Tracking Enabled" />
 *       <FormField name="maxEntries" label="Max Entries" type="number" />
 *       <FormField name="tcpEstablishedTimeout" label="TCP Established Timeout (seconds)" type="number" />
 *       <Button type="submit" disabled={isPending}>
 *         {isPending ? 'Saving...' : 'Save Settings'}
 *       </Button>
 *     </Form>
 *   );
 * }
 * ```
 */
export declare function useUpdateConnectionTracking({
  routerIp,
  onSuccess,
  onError,
}: UseUpdateConnectionTrackingOptions): UseMutationResult<
  void,
  Error,
  Pick<UpdateConnectionTrackingVariables, 'settings'>,
  unknown
>;
//# sourceMappingURL=useUpdateConnectionTracking.d.ts.map
