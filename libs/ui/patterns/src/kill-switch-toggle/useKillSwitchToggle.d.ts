/**
 * Kill Switch Toggle Headless Hook
 *
 * Provides all logic and state for kill switch toggle component.
 * Follows the Headless + Platform Presenter pattern.
 *
 * Responsibilities:
 * - Fetch kill switch status
 * - Handle enable/disable toggle
 * - Handle mode changes
 * - Handle fallback interface selection
 * - Calculate derived state (status text, colors, etc.)
 */
import type { KillSwitchToggleProps, UseKillSwitchToggleReturn } from './types';
/**
 * Headless hook for kill switch toggle state.
 *
 * Provides all the logic and derived state needed by presenters.
 * Does not render anything - that's the presenter's job.
 *
 * @example
 * ```tsx
 * function KillSwitchToggleDesktop(props: KillSwitchToggleProps) {
 *   const state = useKillSwitchToggle(props);
 *
 *   return (
 *     <div>
 *       <Switch checked={state.enabled} onChange={state.handleToggle} />
 *       <Select value={state.mode} onChange={state.handleModeChange}>
 *         <option value="BLOCK_ALL">Block All</option>
 *         <option value="ALLOW_DIRECT">Allow Direct</option>
 *         <option value="FALLBACK_SERVICE">Fallback Service</option>
 *       </Select>
 *     </div>
 *   );
 * }
 * ```
 */
export declare function useKillSwitchToggle(props: KillSwitchToggleProps): UseKillSwitchToggleReturn;
//# sourceMappingURL=useKillSwitchToggle.d.ts.map