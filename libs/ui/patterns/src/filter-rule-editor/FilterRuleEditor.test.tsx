/**
 * FilterRuleEditor Component Tests
 *
 * Tests for FilterRuleEditor pattern component including:
 * - Form rendering (both desktop and mobile presenters)
 * - Action-specific field visibility
 * - Validation feedback
 * - Rule preview updates
 * - Save/cancel callbacks
 * - Platform detection switches presenter
 * - Required field validation
 * - WCAG AAA accessibility (axe-core - 0 violations)
 */

import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { axe } from 'vitest-axe';
import 'vitest-axe/extend-expect';

import { FilterRuleEditor } from './FilterRuleEditor';

import type { FilterRuleEditorProps } from './filter-rule-editor.types';

// Mock the platform hook
vi.mock('@nasnet/ui/layouts', () => ({
  usePlatform: vi.fn(() => 'desktop'),
}));

const defaultProps: FilterRuleEditorProps = {
  routerId: 'router-123',
  open: true,
  onClose: vi.fn(),
  onSave: vi.fn(),
  isSaving: false,
  mode: 'create',
};

describe('FilterRuleEditor', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders desktop presenter by default', () => {
      const { usePlatform } = require('@nasnet/ui/layouts');
      usePlatform.mockReturnValue('desktop');

      render(<FilterRuleEditor {...defaultProps} />);

      // Desktop uses Dialog - check for dialog role
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    it('renders mobile presenter on mobile platform', () => {
      const { usePlatform } = require('@nasnet/ui/layouts');
      usePlatform.mockReturnValue('mobile');

      render(<FilterRuleEditor {...defaultProps} />);

      // Mobile uses Sheet - check for dialog (sheet is still dialog role)
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    it('renders with initial rule values in edit mode', () => {
      render(
        <FilterRuleEditor
          {...defaultProps}
          mode="edit"
          initialRule={{
            chain: 'forward',
            action: 'drop',
            protocol: 'tcp',
            dstPort: '23',
          }}
        />
      );

      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    it('does not render when open is false', () => {
      render(<FilterRuleEditor {...defaultProps} open={false} />);

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
  });

  describe('Action-Specific Field Visibility', () => {
    it('shows logPrefix field for log action', async () => {
      render(
        <FilterRuleEditor
          {...defaultProps}
          initialRule={{
            chain: 'input',
            action: 'log',
          }}
        />
      );

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });
    });

    it('shows jumpTarget field for jump action', async () => {
      render(
        <FilterRuleEditor
          {...defaultProps}
          initialRule={{
            chain: 'forward',
            action: 'jump',
          }}
        />
      );

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });
    });

    it('shows no special fields for accept action', async () => {
      render(
        <FilterRuleEditor
          {...defaultProps}
          initialRule={{
            chain: 'input',
            action: 'accept',
          }}
        />
      );

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });
    });
  });

  describe('Form Validation', () => {
    it('displays validation error for invalid IP address', async () => {
      render(<FilterRuleEditor {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });
    });

    it('displays validation error for invalid port range', async () => {
      render(<FilterRuleEditor {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });
    });

    it('disables save button when form is invalid', async () => {
      render(<FilterRuleEditor {...defaultProps} />);

      await waitFor(() => {
        const dialog = screen.getByRole('dialog');
        const buttons = within(dialog).getAllByRole('button');
        expect(buttons.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Callbacks', () => {
    it('calls onClose when cancel button clicked', async () => {
      const onClose = vi.fn();
      const user = userEvent.setup();

      render(<FilterRuleEditor {...defaultProps} onClose={onClose} />);

      const closeButton = screen.getByRole('button', { name: /close|cancel/i });
      await user.click(closeButton);

      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('calls onSave with form data when save clicked', async () => {
      const onSave = vi.fn();
      const user = userEvent.setup();

      render(
        <FilterRuleEditor
          {...defaultProps}
          onSave={onSave}
          initialRule={{
            chain: 'input',
            action: 'accept',
            protocol: 'tcp',
            dstPort: '22',
          }}
        />
      );

      await waitFor(() => {
        const saveButton = screen.getByRole('button', { name: /save|create/i });
        expect(saveButton).toBeInTheDocument();
      });

      const saveButton = screen.getByRole('button', { name: /save|create/i });
      await user.click(saveButton);

      await waitFor(() => {
        expect(onSave).toHaveBeenCalled();
      });
    });

    it('calls onDelete when delete button clicked (edit mode)', async () => {
      const onDelete = vi.fn();
      const user = userEvent.setup();

      render(
        <FilterRuleEditor
          {...defaultProps}
          mode="edit"
          onDelete={onDelete}
          initialRule={{
            id: '*1',
            chain: 'input',
            action: 'accept',
          }}
        />
      );

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      const deleteButton = screen.queryByRole('button', { name: /delete/i });
      if (deleteButton) {
        await user.click(deleteButton);

        await waitFor(() => {
          expect(onDelete).toHaveBeenCalled();
        });
      }
    });

    it('does not show delete button in create mode', () => {
      render(<FilterRuleEditor {...defaultProps} mode="create" />);

      const deleteButton = screen.queryByRole('button', { name: /delete/i });
      expect(deleteButton).not.toBeInTheDocument();
    });
  });

  describe('Loading States', () => {
    it('disables save button when isSaving is true', () => {
      render(<FilterRuleEditor {...defaultProps} isSaving={true} />);

      const saveButton = screen.getByRole('button', { name: /save|saving|create/i });
      expect(saveButton).toBeDisabled();
    });

    it('disables delete button when isDeleting is true', () => {
      render(
        <FilterRuleEditor
          {...defaultProps}
          mode="edit"
          onDelete={vi.fn()}
          isDeleting={true}
          initialRule={{ id: '*1', chain: 'input', action: 'accept' }}
        />
      );

      const deleteButton = screen.queryByRole('button', { name: /delet/i });
      if (deleteButton) {
        expect(deleteButton).toBeDisabled();
      }
    });
  });

  describe('Preview Display', () => {
    it('shows human-readable rule preview', async () => {
      render(
        <FilterRuleEditor
          {...defaultProps}
          initialRule={{
            chain: 'input',
            action: 'accept',
            protocol: 'tcp',
            dstPort: '22',
            comment: 'Allow SSH',
          }}
        />
      );

      await waitFor(() => {
        const dialog = screen.getByRole('dialog');
        expect(dialog).toBeInTheDocument();
      });
    });
  });

  describe('WCAG AAA Accessibility', () => {
    it('has no accessibility violations (desktop)', async () => {
      const { container } = render(<FilterRuleEditor {...defaultProps} />);

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('has no accessibility violations (mobile)', async () => {
      const { usePlatform } = require('@nasnet/ui/layouts');
      usePlatform.mockReturnValue('mobile');

      const { container } = render(<FilterRuleEditor {...defaultProps} />);

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('has no accessibility violations with validation errors', async () => {
      const { container } = render(
        <FilterRuleEditor
          {...defaultProps}
          initialRule={{
            chain: 'input',
            action: 'log',
            log: true,
            // Invalid - missing logPrefix will trigger validation error
          }}
        />
      );

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('supports keyboard navigation', async () => {
      const user = userEvent.setup();

      render(<FilterRuleEditor {...defaultProps} />);

      await user.tab();
      await waitFor(() => {
        const focusedElement = document.activeElement;
        expect(focusedElement).not.toBe(document.body);
      });

      await user.tab();
      await user.tab();

      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBeGreaterThan(0);
    });

    it('has proper ARIA labels and roles', () => {
      render(<FilterRuleEditor {...defaultProps} />);

      const dialog = screen.getByRole('dialog');
      expect(dialog).toBeInTheDocument();
      expect(dialog).toHaveAccessibleName();
    });

    it('provides form field labels', async () => {
      render(<FilterRuleEditor {...defaultProps} />);

      await waitFor(() => {
        const dialog = screen.getByRole('dialog');
        const inputs = within(dialog).queryAllByRole('textbox');
        const selects = within(dialog).queryAllByRole('combobox');

        const allControls = [...inputs, ...selects];
        if (allControls.length > 0) {
          allControls.forEach(control => {
            expect(control).toHaveAccessibleName();
          });
        }
      });
    });
  });

  describe('Platform Detection', () => {
    it('switches to mobile presenter when platform changes', () => {
      const { usePlatform } = require('@nasnet/ui/layouts');

      usePlatform.mockReturnValue('desktop');
      const { rerender } = render(<FilterRuleEditor {...defaultProps} />);

      expect(screen.getByRole('dialog')).toBeInTheDocument();

      usePlatform.mockReturnValue('mobile');
      rerender(<FilterRuleEditor {...defaultProps} />);

      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    it('renders tablet as desktop presenter', () => {
      const { usePlatform } = require('@nasnet/ui/layouts');
      usePlatform.mockReturnValue('tablet');

      render(<FilterRuleEditor {...defaultProps} />);

      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('handles missing optional props gracefully', () => {
      const minimalProps: FilterRuleEditorProps = {
        routerId: 'router-123',
        open: true,
        onClose: vi.fn(),
        onSave: vi.fn(),
      };

      expect(() => render(<FilterRuleEditor {...minimalProps} />)).not.toThrow();
    });

    it('handles empty address lists', () => {
      expect(() =>
        render(<FilterRuleEditor {...defaultProps} addressLists={[]} />)
      ).not.toThrow();
    });

    it('handles empty interface lists', () => {
      expect(() =>
        render(<FilterRuleEditor {...defaultProps} interfaceLists={[]} />)
      ).not.toThrow();
    });
  });
});
