/**
 * useHelpMode Hook
 * Provides access to the global Simple/Technical help mode state
 *
 * This is a thin wrapper around the Zustand store that provides
 * a cleaner API for pattern components.
 *
 * @see NAS-4A.12: Build Help System Components
 */
import { type HelpMode } from '@nasnet/state/stores';
export type { HelpMode };
/**
 * Return type for useHelpMode hook
 */
export interface UseHelpModeReturn {
    /** Current global help mode */
    mode: HelpMode;
    /** Toggle between simple and technical modes */
    toggleMode: () => void;
    /** Set specific mode */
    setMode: (mode: HelpMode) => void;
    /** Check if currently in simple mode */
    isSimple: boolean;
    /** Check if currently in technical mode */
    isTechnical: boolean;
}
/**
 * Hook for accessing and controlling the global help mode
 *
 * @returns Help mode state and control functions
 *
 * @example
 * ```tsx
 * function HelpContent({ field }: { field: string }) {
 *   const { mode, toggleMode, isSimple } = useHelpMode();
 *
 *   return (
 *     <div>
 *       <p>{isSimple ? 'Simple explanation' : 'Technical details'}</p>
 *       <button onClick={toggleMode}>
 *         Switch to {isSimple ? 'Technical' : 'Simple'} mode
 *       </button>
 *     </div>
 *   );
 * }
 * ```
 */
export declare function useHelpMode(): UseHelpModeReturn;
//# sourceMappingURL=use-help-mode.d.ts.map