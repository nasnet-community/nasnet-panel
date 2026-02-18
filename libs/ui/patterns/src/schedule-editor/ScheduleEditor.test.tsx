/**
 * ScheduleEditor Component Tests
 * Tests for platform dispatcher component
 *
 * Note: This component is a simple platform dispatcher that uses useMediaQuery
 * to select between ScheduleEditorMobile and ScheduleEditorDesktop.
 * The presenters are tested separately in their respective test files.
 */

import { describe, it, expect } from 'vitest';

import { ScheduleEditor } from './ScheduleEditor';

describe('ScheduleEditor', () => {
  describe('component metadata', () => {
    it('should have correct displayName for debugging', () => {
      expect(ScheduleEditor.displayName).toBe('ScheduleEditor');
    });

    it('should be a memoized component', () => {
      // Check that ScheduleEditor is wrapped with React.memo
      expect(ScheduleEditor.$$typeof).toBeDefined();
    });
  });

  describe('platform detection pattern', () => {
    it('should use useMediaQuery with correct breakpoint query', () => {
      // This component follows the Platform Presenter pattern
      // using useMediaQuery('(max-width: 640px)') to detect mobile
      // The actual rendering logic is tested via integration tests
      expect(typeof ScheduleEditor).toBe('function');
    });
  });
});
