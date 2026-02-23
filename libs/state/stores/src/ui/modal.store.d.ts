/**
 * Known modal IDs for type safety
 * Add new modal IDs here as they are created
 */
export type KnownModalId = 'confirm-delete' | 'confirm-action' | 'router-credentials' | 'add-router' | 'edit-router' | 'settings' | 'keyboard-shortcuts' | 'router-details' | 'vpn-config' | 'firewall-rule' | 'network-interface';
/**
 * Modal ID type - allows known IDs and custom strings
 */
export type ModalId = KnownModalId | (string & Record<string, never>);
/**
 * Modal data type - generic record
 */
export type ModalData = Record<string, unknown>;
/**
 * Modal state interface
 */
export interface ModalState {
    /**
     * Currently active modal ID
     * null if no modal is open
     */
    activeModal: ModalId | null;
    /**
     * Data passed to the active modal
     * null if no modal is open or no data provided
     */
    modalData: ModalData | null;
}
/**
 * Modal actions interface
 */
export interface ModalActions {
    /**
     * Open a modal with optional data
     * Replaces any currently open modal
     *
     * @param id - Modal identifier
     * @param data - Optional data to pass to the modal
     */
    openModal: <T extends ModalData = ModalData>(id: ModalId, data?: T) => void;
    /**
     * Close the currently open modal
     * Clears both activeModal and modalData
     */
    closeModal: () => void;
    /**
     * Update data for the currently open modal
     * Merges with existing data
     *
     * @param data - Partial data to merge
     */
    updateModalData: <T extends ModalData = ModalData>(data: Partial<T>) => void;
    /**
     * Check if a specific modal is open
     *
     * @param id - Modal identifier to check
     * @returns true if the specified modal is open
     */
    isModalOpen: (id: ModalId) => boolean;
    /**
     * Get typed modal data
     * Returns null if no modal is open or data doesn't exist
     */
    getModalData: <T extends ModalData = ModalData>() => T | null;
}
/**
 * Zustand store for modal state management
 *
 * Single-modal paradigm: Only one modal can be open at a time.
 * Opening a new modal will close any existing modal.
 *
 * Usage:
 * ```tsx
 * // Open a modal
 * const { openModal, closeModal } = useModalStore();
 *
 * openModal('confirm-delete', { itemId: '123', itemName: 'Router 1' });
 *
 * // In the modal component
 * const { activeModal, modalData, closeModal } = useModalStore();
 *
 * if (activeModal !== 'confirm-delete') return null;
 *
 * const { itemId, itemName } = modalData as { itemId: string; itemName: string };
 *
 * return (
 *   <Dialog open onClose={closeModal}>
 *     <p>Delete {itemName}?</p>
 *     <Button onClick={() => { deleteItem(itemId); closeModal(); }}>
 *       Delete
 *     </Button>
 *   </Dialog>
 * );
 * ```
 *
 * DevTools:
 * - Integrated with Redux DevTools for debugging (development only)
 * - Store name: 'modal-store'
 *
 * Persistence:
 * - NOT persisted - modal state is session-only
 */
export declare const useModalStore: import("zustand").UseBoundStore<Omit<import("zustand").StoreApi<ModalState & ModalActions>, "setState"> & {
    setState<A extends string | {
        type: string;
    }>(partial: (ModalState & ModalActions) | Partial<ModalState & ModalActions> | ((state: ModalState & ModalActions) => (ModalState & ModalActions) | Partial<ModalState & ModalActions>), replace?: boolean | undefined, action?: A | undefined): void;
}>;
/**
 * Select active modal ID
 */
export declare const selectActiveModal: (state: ModalState) => ModalId | null;
/**
 * Select modal data
 */
export declare const selectModalData: <T extends ModalData = ModalData>(state: ModalState) => T | null;
/**
 * Create a selector for a specific modal
 * Returns true if the specified modal is open
 */
export declare const createSelectIsModalOpen: (id: ModalId) => (state: ModalState) => boolean;
/**
 * Get modal store state outside of React
 * Useful for imperative code or testing
 */
export declare const getModalState: () => ModalState & ModalActions;
/**
 * Subscribe to modal store changes outside of React
 */
export declare const subscribeModalState: (listener: (state: ModalState & ModalActions, prevState: ModalState & ModalActions) => void) => () => void;
/**
 * Helper type for typed modal data
 *
 * @example
 * ```tsx
 * interface DeleteModalData {
 *   itemId: string;
 *   itemName: string;
 * }
 *
 * const data = useModalStore(selectModalData) as TypedModalData<DeleteModalData>;
 * ```
 */
export type TypedModalData<T extends ModalData> = T | null;
//# sourceMappingURL=modal.store.d.ts.map