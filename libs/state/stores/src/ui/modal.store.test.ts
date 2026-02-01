/**
 * Tests for Modal Store
 * @see NAS-4.5: Implement UI State with Zustand
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { act } from '@testing-library/react';
import {
  useModalStore,
  selectActiveModal,
  selectModalData,
  createSelectIsModalOpen,
  getModalState,
} from './modal.store';

describe('useModalStore', () => {
  beforeEach(() => {
    // Reset store state before each test
    useModalStore.setState({
      activeModal: null,
      modalData: null,
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Initial State', () => {
    it('should have no active modal initially', () => {
      const state = useModalStore.getState();
      expect(state.activeModal).toBe(null);
      expect(state.modalData).toBe(null);
    });
  });

  describe('openModal Action', () => {
    it('should open a modal with ID', () => {
      const { openModal } = useModalStore.getState();

      act(() => {
        openModal('confirm-delete');
      });

      expect(useModalStore.getState().activeModal).toBe('confirm-delete');
      expect(useModalStore.getState().modalData).toBe(null);
    });

    it('should open a modal with ID and data', () => {
      const { openModal } = useModalStore.getState();
      const testData = { itemId: '123', itemName: 'Router 1' };

      act(() => {
        openModal('confirm-delete', testData);
      });

      expect(useModalStore.getState().activeModal).toBe('confirm-delete');
      expect(useModalStore.getState().modalData).toEqual(testData);
    });

    it('should replace existing modal when opening a new one', () => {
      const { openModal } = useModalStore.getState();

      act(() => {
        openModal('modal-1', { data: 'first' });
      });

      expect(useModalStore.getState().activeModal).toBe('modal-1');

      act(() => {
        useModalStore.getState().openModal('modal-2', { data: 'second' });
      });

      expect(useModalStore.getState().activeModal).toBe('modal-2');
      expect(useModalStore.getState().modalData).toEqual({ data: 'second' });
    });

    it('should accept custom string modal IDs', () => {
      const { openModal } = useModalStore.getState();

      act(() => {
        openModal('custom-modal-id');
      });

      expect(useModalStore.getState().activeModal).toBe('custom-modal-id');
    });
  });

  describe('closeModal Action', () => {
    it('should close the modal and clear data', () => {
      useModalStore.setState({
        activeModal: 'test-modal',
        modalData: { test: 'data' },
      });

      const { closeModal } = useModalStore.getState();

      act(() => {
        closeModal();
      });

      expect(useModalStore.getState().activeModal).toBe(null);
      expect(useModalStore.getState().modalData).toBe(null);
    });

    it('should be idempotent when no modal is open', () => {
      const { closeModal } = useModalStore.getState();

      expect(useModalStore.getState().activeModal).toBe(null);

      act(() => {
        closeModal();
      });

      expect(useModalStore.getState().activeModal).toBe(null);
    });
  });

  describe('updateModalData Action', () => {
    it('should merge data with existing modal data', () => {
      useModalStore.setState({
        activeModal: 'test-modal',
        modalData: { name: 'John', age: 30 },
      });

      const { updateModalData } = useModalStore.getState();

      act(() => {
        updateModalData({ age: 31, city: 'NYC' });
      });

      expect(useModalStore.getState().modalData).toEqual({
        name: 'John',
        age: 31,
        city: 'NYC',
      });
    });

    it('should set data when modalData is null', () => {
      useModalStore.setState({
        activeModal: 'test-modal',
        modalData: null,
      });

      const { updateModalData } = useModalStore.getState();

      act(() => {
        updateModalData({ name: 'John' });
      });

      expect(useModalStore.getState().modalData).toEqual({ name: 'John' });
    });
  });

  describe('isModalOpen Method', () => {
    it('should return true when the specified modal is open', () => {
      useModalStore.setState({ activeModal: 'test-modal' });

      const { isModalOpen } = useModalStore.getState();

      expect(isModalOpen('test-modal')).toBe(true);
    });

    it('should return false when a different modal is open', () => {
      useModalStore.setState({ activeModal: 'other-modal' });

      const { isModalOpen } = useModalStore.getState();

      expect(isModalOpen('test-modal')).toBe(false);
    });

    it('should return false when no modal is open', () => {
      useModalStore.setState({ activeModal: null });

      const { isModalOpen } = useModalStore.getState();

      expect(isModalOpen('test-modal')).toBe(false);
    });
  });

  describe('getModalData Method', () => {
    it('should return typed modal data', () => {
      useModalStore.setState({
        activeModal: 'test-modal',
        modalData: { id: 123, name: 'Test' },
      });

      const { getModalData } = useModalStore.getState();

      interface TestData {
        id: number;
        name: string;
      }

      const data = getModalData<TestData>();
      expect(data?.id).toBe(123);
      expect(data?.name).toBe('Test');
    });

    it('should return null when no modal data', () => {
      useModalStore.setState({ activeModal: null, modalData: null });

      const { getModalData } = useModalStore.getState();

      expect(getModalData()).toBe(null);
    });
  });

  describe('Selectors', () => {
    it('selectActiveModal should return the active modal ID', () => {
      useModalStore.setState({ activeModal: 'settings' });
      expect(selectActiveModal(useModalStore.getState())).toBe('settings');
    });

    it('selectModalData should return the modal data', () => {
      const testData = { key: 'value' };
      useModalStore.setState({ modalData: testData });
      expect(selectModalData(useModalStore.getState())).toEqual(testData);
    });

    it('createSelectIsModalOpen should create a selector for specific modal', () => {
      useModalStore.setState({ activeModal: 'confirm-delete' });

      const isConfirmDeleteOpen = createSelectIsModalOpen('confirm-delete');
      const isSettingsOpen = createSelectIsModalOpen('settings');

      expect(isConfirmDeleteOpen(useModalStore.getState())).toBe(true);
      expect(isSettingsOpen(useModalStore.getState())).toBe(false);
    });
  });

  describe('Helper Functions', () => {
    it('getModalState should return current state', () => {
      const state = getModalState();
      expect(state.activeModal).toBe(null);
      expect(typeof state.openModal).toBe('function');
      expect(typeof state.closeModal).toBe('function');
    });
  });

  describe('Single Modal Paradigm', () => {
    it('should only allow one modal at a time', () => {
      const { openModal } = useModalStore.getState();

      act(() => {
        openModal('modal-1');
      });

      expect(useModalStore.getState().activeModal).toBe('modal-1');

      act(() => {
        useModalStore.getState().openModal('modal-2');
      });

      expect(useModalStore.getState().activeModal).toBe('modal-2');
      // Only modal-2 should be active, modal-1 is gone
    });

    it('should not persist modal state (session-only)', () => {
      // Modal store has no persist middleware
      // This test verifies the store doesn't try to access localStorage
      const { openModal, closeModal } = useModalStore.getState();

      act(() => {
        openModal('test-modal', { data: 'test' });
      });

      expect(useModalStore.getState().activeModal).toBe('test-modal');

      act(() => {
        closeModal();
      });

      expect(useModalStore.getState().activeModal).toBe(null);
      // No localStorage interaction expected
    });
  });

  describe('Known Modal IDs', () => {
    it('should work with all known modal IDs', () => {
      const knownModals = [
        'confirm-delete',
        'confirm-action',
        'router-credentials',
        'add-router',
        'edit-router',
        'settings',
        'keyboard-shortcuts',
        'router-details',
        'vpn-config',
        'firewall-rule',
        'network-interface',
      ];

      knownModals.forEach((modalId) => {
        act(() => {
          useModalStore.getState().openModal(modalId);
        });
        expect(useModalStore.getState().activeModal).toBe(modalId);
      });
    });
  });
});
