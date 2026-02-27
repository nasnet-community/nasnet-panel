/**
 * Resource Lifecycle Tests
 *
 * Tests for lifecycle state utilities and transitions.
 */

import { describe, it, expect } from 'vitest';
import {
  ResourceLifecycleState,
  ResourceLifecycleEvent,
  LIFECYCLE_TRANSITIONS,
  isValidTransition,
  getNextState,
  getValidEvents,
  isActiveOnRouter,
  isEditable,
  isPending,
  hasErrors,
  isTerminal,
  getStateDisplayInfo,
} from '../lifecycle';

describe('Resource Lifecycle', () => {
  describe('Constants', () => {
    it('should have all expected states', () => {
      expect(ResourceLifecycleState.DRAFT).toBe('DRAFT');
      expect(ResourceLifecycleState.VALIDATING).toBe('VALIDATING');
      expect(ResourceLifecycleState.VALID).toBe('VALID');
      expect(ResourceLifecycleState.APPLYING).toBe('APPLYING');
      expect(ResourceLifecycleState.ACTIVE).toBe('ACTIVE');
      expect(ResourceLifecycleState.DEGRADED).toBe('DEGRADED');
      expect(ResourceLifecycleState.ERROR).toBe('ERROR');
      expect(ResourceLifecycleState.DEPRECATED).toBe('DEPRECATED');
      expect(ResourceLifecycleState.ARCHIVED).toBe('ARCHIVED');
    });

    it('should have all expected events', () => {
      expect(ResourceLifecycleEvent.VALIDATE).toBe('VALIDATE');
      expect(ResourceLifecycleEvent.APPLY).toBe('APPLY');
      expect(ResourceLifecycleEvent.CONFIRM).toBe('CONFIRM');
      expect(ResourceLifecycleEvent.DEGRADE).toBe('DEGRADE');
      expect(ResourceLifecycleEvent.RECOVER).toBe('RECOVER');
      expect(ResourceLifecycleEvent.RETRY).toBe('RETRY');
      expect(ResourceLifecycleEvent.EDIT).toBe('EDIT');
      expect(ResourceLifecycleEvent.DEPRECATE).toBe('DEPRECATE');
      expect(ResourceLifecycleEvent.RESTORE).toBe('RESTORE');
      expect(ResourceLifecycleEvent.ARCHIVE).toBe('ARCHIVE');
    });
  });

  describe('LIFECYCLE_TRANSITIONS', () => {
    it('should have transitions for all states', () => {
      const states = Object.values(ResourceLifecycleState);
      states.forEach((state) => {
        expect(LIFECYCLE_TRANSITIONS[state]).toBeDefined();
      });
    });

    it('should have VALIDATE transition from DRAFT', () => {
      const transitions = LIFECYCLE_TRANSITIONS[ResourceLifecycleState.DRAFT];
      expect(transitions[ResourceLifecycleEvent.VALIDATE]).toBe(ResourceLifecycleState.VALIDATING);
    });

    it('should have APPLY and EDIT transitions from VALID', () => {
      const transitions = LIFECYCLE_TRANSITIONS[ResourceLifecycleState.VALID];
      expect(transitions[ResourceLifecycleEvent.APPLY]).toBe(ResourceLifecycleState.APPLYING);
      expect(transitions[ResourceLifecycleEvent.EDIT]).toBe(ResourceLifecycleState.DRAFT);
    });

    it('should have no transitions from ARCHIVED (terminal)', () => {
      const transitions = LIFECYCLE_TRANSITIONS[ResourceLifecycleState.ARCHIVED];
      expect(Object.keys(transitions)).toHaveLength(0);
    });
  });

  describe('isValidTransition', () => {
    it('should return true for valid transitions', () => {
      expect(isValidTransition(ResourceLifecycleState.DRAFT, ResourceLifecycleEvent.VALIDATE)).toBe(
        true
      );
      expect(isValidTransition(ResourceLifecycleState.VALID, ResourceLifecycleEvent.APPLY)).toBe(
        true
      );
      expect(
        isValidTransition(ResourceLifecycleState.ACTIVE, ResourceLifecycleEvent.DEPRECATE)
      ).toBe(true);
    });

    it('should return false for invalid transitions', () => {
      expect(isValidTransition(ResourceLifecycleState.DRAFT, ResourceLifecycleEvent.APPLY)).toBe(
        false
      );
      expect(
        isValidTransition(ResourceLifecycleState.ARCHIVED, ResourceLifecycleEvent.RESTORE)
      ).toBe(false);
      expect(
        isValidTransition(ResourceLifecycleState.ACTIVE, ResourceLifecycleEvent.VALIDATE)
      ).toBe(false);
    });
  });

  describe('getNextState', () => {
    it('should return next state for valid transitions', () => {
      expect(getNextState(ResourceLifecycleState.DRAFT, ResourceLifecycleEvent.VALIDATE)).toBe(
        ResourceLifecycleState.VALIDATING
      );
      expect(getNextState(ResourceLifecycleState.DEPRECATED, ResourceLifecycleEvent.ARCHIVE)).toBe(
        ResourceLifecycleState.ARCHIVED
      );
    });

    it('should return null for invalid transitions', () => {
      expect(getNextState(ResourceLifecycleState.DRAFT, ResourceLifecycleEvent.APPLY)).toBe(null);
      expect(getNextState(ResourceLifecycleState.ARCHIVED, ResourceLifecycleEvent.RESTORE)).toBe(
        null
      );
    });
  });

  describe('getValidEvents', () => {
    it('should return valid events for a state', () => {
      const draftEvents = getValidEvents(ResourceLifecycleState.DRAFT);
      expect(draftEvents).toContain(ResourceLifecycleEvent.VALIDATE);
      expect(draftEvents).not.toContain(ResourceLifecycleEvent.APPLY);

      const activeEvents = getValidEvents(ResourceLifecycleState.ACTIVE);
      expect(activeEvents).toContain(ResourceLifecycleEvent.DEGRADE);
      expect(activeEvents).toContain(ResourceLifecycleEvent.DEPRECATE);
      expect(activeEvents).toContain(ResourceLifecycleEvent.EDIT);
    });

    it('should return empty array for terminal states', () => {
      const archivedEvents = getValidEvents(ResourceLifecycleState.ARCHIVED);
      expect(archivedEvents).toHaveLength(0);
    });
  });

  describe('State Predicates', () => {
    describe('isActiveOnRouter', () => {
      it('should return true for ACTIVE and DEGRADED', () => {
        expect(isActiveOnRouter(ResourceLifecycleState.ACTIVE)).toBe(true);
        expect(isActiveOnRouter(ResourceLifecycleState.DEGRADED)).toBe(true);
      });

      it('should return false for other states', () => {
        expect(isActiveOnRouter(ResourceLifecycleState.DRAFT)).toBe(false);
        expect(isActiveOnRouter(ResourceLifecycleState.VALID)).toBe(false);
        expect(isActiveOnRouter(ResourceLifecycleState.ERROR)).toBe(false);
        expect(isActiveOnRouter(ResourceLifecycleState.ARCHIVED)).toBe(false);
      });
    });

    describe('isEditable', () => {
      it('should return true for editable states', () => {
        expect(isEditable(ResourceLifecycleState.DRAFT)).toBe(true);
        expect(isEditable(ResourceLifecycleState.VALID)).toBe(true);
        expect(isEditable(ResourceLifecycleState.ACTIVE)).toBe(true);
        expect(isEditable(ResourceLifecycleState.ERROR)).toBe(true);
      });

      it('should return false for non-editable states', () => {
        expect(isEditable(ResourceLifecycleState.VALIDATING)).toBe(false);
        expect(isEditable(ResourceLifecycleState.APPLYING)).toBe(false);
        expect(isEditable(ResourceLifecycleState.DEPRECATED)).toBe(false);
        expect(isEditable(ResourceLifecycleState.ARCHIVED)).toBe(false);
      });
    });

    describe('isPending', () => {
      it('should return true for pending states', () => {
        expect(isPending(ResourceLifecycleState.VALIDATING)).toBe(true);
        expect(isPending(ResourceLifecycleState.APPLYING)).toBe(true);
      });

      it('should return false for non-pending states', () => {
        expect(isPending(ResourceLifecycleState.DRAFT)).toBe(false);
        expect(isPending(ResourceLifecycleState.ACTIVE)).toBe(false);
        expect(isPending(ResourceLifecycleState.ERROR)).toBe(false);
      });
    });

    describe('hasErrors', () => {
      it('should return true for error states', () => {
        expect(hasErrors(ResourceLifecycleState.ERROR)).toBe(true);
        expect(hasErrors(ResourceLifecycleState.DEGRADED)).toBe(true);
      });

      it('should return false for non-error states', () => {
        expect(hasErrors(ResourceLifecycleState.ACTIVE)).toBe(false);
        expect(hasErrors(ResourceLifecycleState.VALID)).toBe(false);
      });
    });

    describe('isTerminal', () => {
      it('should return true only for ARCHIVED', () => {
        expect(isTerminal(ResourceLifecycleState.ARCHIVED)).toBe(true);
      });

      it('should return false for all other states', () => {
        const nonTerminal = [
          ResourceLifecycleState.DRAFT,
          ResourceLifecycleState.VALIDATING,
          ResourceLifecycleState.VALID,
          ResourceLifecycleState.APPLYING,
          ResourceLifecycleState.ACTIVE,
          ResourceLifecycleState.DEGRADED,
          ResourceLifecycleState.ERROR,
          ResourceLifecycleState.DEPRECATED,
        ];

        nonTerminal.forEach((state) => {
          expect(isTerminal(state)).toBe(false);
        });
      });
    });
  });

  describe('getStateDisplayInfo', () => {
    it('should return correct info for DRAFT', () => {
      const info = getStateDisplayInfo(ResourceLifecycleState.DRAFT);
      expect(info.label).toBe('Draft');
      expect(info.color).toBe('gray');
      expect(info.showSpinner).toBe(false);
    });

    it('should return correct info for VALIDATING', () => {
      const info = getStateDisplayInfo(ResourceLifecycleState.VALIDATING);
      expect(info.label).toBe('Validating');
      expect(info.color).toBe('blue');
      expect(info.showSpinner).toBe(true);
    });

    it('should return correct info for ACTIVE', () => {
      const info = getStateDisplayInfo(ResourceLifecycleState.ACTIVE);
      expect(info.label).toBe('Active');
      expect(info.color).toBe('green');
      expect(info.showSpinner).toBe(false);
    });

    it('should return correct info for ERROR', () => {
      const info = getStateDisplayInfo(ResourceLifecycleState.ERROR);
      expect(info.label).toBe('Error');
      expect(info.color).toBe('red');
      expect(info.showSpinner).toBe(false);
    });

    it('should return spinner for pending states', () => {
      expect(getStateDisplayInfo(ResourceLifecycleState.VALIDATING).showSpinner).toBe(true);
      expect(getStateDisplayInfo(ResourceLifecycleState.APPLYING).showSpinner).toBe(true);
    });
  });
});
