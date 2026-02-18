/**
 * ServiceTemplateCard Tests
 *
 * Unit tests for ServiceTemplateCard pattern component.
 */

import * as React from 'react';

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';


import { ServiceTemplateCard } from './ServiceTemplateCard';

import type { ServiceTemplate, TemplateAction } from './types';

// Mock the usePlatform hook
const mockUsePlatform = vi.fn(() => 'desktop');

vi.mock('@nasnet/ui/layouts', () => ({
  usePlatform: () => mockUsePlatform(),
}));

// Test wrapper component
function TestWrapper({ children }: { children: React.ReactNode }) {
  return <div>{children}</div>;
}

// Helper function to render with wrapper
function renderWithWrapper(ui: React.ReactElement) {
  return render(<TestWrapper>{ui}</TestWrapper>);
}

describe('ServiceTemplateCard', () => {
  const mockTemplate: ServiceTemplate = {
    id: '1',
    name: 'Privacy Stack',
    description: 'Complete privacy setup',
    category: 'privacy',
    scope: 'built-in',
    icon: '🔒',
    verified: true,
    metadata: {
      serviceCount: 3,
      variableCount: 5,
      version: '1.0.0',
      sizeEstimate: 8.5,
    },
  };

  let mockActions: TemplateAction[];

  beforeEach(() => {
    vi.clearAllMocks();
    mockUsePlatform.mockReturnValue('desktop');

    // Recreate actions with fresh mocks for each test
    mockActions = [
      {
        id: 'install',
        label: 'Install',
        onClick: vi.fn(),
        variant: 'default',
      },
      {
        id: 'export',
        label: 'Export',
        onClick: vi.fn(),
        variant: 'outline',
      },
    ];
  });

  describe('Rendering', () => {
    it('renders template name', () => {
      renderWithWrapper(<ServiceTemplateCard template={mockTemplate} />);
      expect(screen.getByText('Privacy Stack')).toBeInTheDocument();
    });

    it('renders template description', () => {
      renderWithWrapper(<ServiceTemplateCard template={mockTemplate} />);
      expect(screen.getByText(/Complete privacy setup/i)).toBeInTheDocument();
    });

    it('renders verification badge for verified templates', () => {
      renderWithWrapper(<ServiceTemplateCard template={mockTemplate} />);
      const verifiedIcon = screen.getByTitle('Verified template');
      expect(verifiedIcon).toBeInTheDocument();
    });

    it('renders scope badge', () => {
      renderWithWrapper(<ServiceTemplateCard template={mockTemplate} />);
      expect(screen.getByText('Built-in')).toBeInTheDocument();
    });

    it('renders category', () => {
      renderWithWrapper(<ServiceTemplateCard template={mockTemplate} />);
      expect(screen.getByText('Privacy')).toBeInTheDocument();
    });

    it('renders service count', () => {
      renderWithWrapper(<ServiceTemplateCard template={mockTemplate} />);
      expect(screen.getByText('3')).toBeInTheDocument();
    });

    it('renders variable count', () => {
      renderWithWrapper(<ServiceTemplateCard template={mockTemplate} />);
      expect(screen.getByText('5 variables')).toBeInTheDocument();
    });

    it('renders version', () => {
      renderWithWrapper(<ServiceTemplateCard template={mockTemplate} />);
      expect(screen.getByText('v1.0.0')).toBeInTheDocument();
    });

    it('renders icon emoji', () => {
      renderWithWrapper(<ServiceTemplateCard template={mockTemplate} />);
      expect(screen.getByText('🔒')).toBeInTheDocument();
    });
  });

  describe('Scope variations', () => {
    it('renders custom scope badge', () => {
      const customTemplate = { ...mockTemplate, scope: 'custom' as const };
      renderWithWrapper(<ServiceTemplateCard template={customTemplate} />);
      expect(screen.getByText('Custom')).toBeInTheDocument();
    });

    it('renders shared scope badge', () => {
      const sharedTemplate = { ...mockTemplate, scope: 'shared' as const };
      renderWithWrapper(<ServiceTemplateCard template={sharedTemplate} />);
      expect(screen.getByText('Shared')).toBeInTheDocument();
    });
  });

  describe('Shared template metadata', () => {
    const sharedTemplate: ServiceTemplate = {
      ...mockTemplate,
      scope: 'shared',
      metadata: {
        ...mockTemplate.metadata,
        author: 'NetworkAdmin',
        downloads: 2450,
        rating: 4.8,
      },
    };

    it('renders author name', () => {
      renderWithWrapper(<ServiceTemplateCard template={sharedTemplate} showMetadata />);
      expect(screen.getByText('NetworkAdmin')).toBeInTheDocument();
    });

    it('renders formatted download count', () => {
      renderWithWrapper(<ServiceTemplateCard template={sharedTemplate} showMetadata />);
      expect(screen.getByText('2.5K')).toBeInTheDocument();
    });

    it('renders rating', () => {
      renderWithWrapper(<ServiceTemplateCard template={sharedTemplate} showMetadata />);
      expect(screen.getByText('4.8')).toBeInTheDocument();
    });

    it('hides metadata when showMetadata is false', () => {
      renderWithWrapper(<ServiceTemplateCard template={sharedTemplate} showMetadata={false} />);
      expect(screen.queryByText('NetworkAdmin')).not.toBeInTheDocument();
    });
  });

  describe('Actions', () => {
    it('renders primary action button', () => {
      renderWithWrapper(<ServiceTemplateCard template={mockTemplate} actions={mockActions} />);
      expect(screen.getByRole('button', { name: 'Install' })).toBeInTheDocument();
    });

    it('calls onClick when primary action is clicked', async () => {
      const user = userEvent.setup();
      renderWithWrapper(<ServiceTemplateCard template={mockTemplate} actions={mockActions} />);

      const installButton = screen.getByRole('button', { name: 'Install' });
      await user.click(installButton);

      expect(mockActions[0].onClick).toHaveBeenCalledTimes(1);
    });

    it('renders loading state for primary action', () => {
      const loadingActions: TemplateAction[] = [
        {
          id: 'install',
          label: 'Installing',
          onClick: vi.fn(),
          loading: true,
        },
      ];
      renderWithWrapper(<ServiceTemplateCard template={mockTemplate} actions={loadingActions} />);
      expect(screen.getByText('Installing')).toBeInTheDocument();
    });

    it('disables primary action when disabled prop is true', () => {
      const disabledActions: TemplateAction[] = [
        {
          id: 'install',
          label: 'Install',
          onClick: vi.fn(),
          disabled: true,
        },
      ];
      renderWithWrapper(<ServiceTemplateCard template={mockTemplate} actions={disabledActions} />);
      const installButton = screen.getByRole('button', { name: 'Install' });
      expect(installButton).toBeDisabled();
    });

    it('renders secondary actions in dropdown', () => {
      renderWithWrapper(<ServiceTemplateCard template={mockTemplate} actions={mockActions} />);
      // Dropdown trigger should be present for secondary actions
      const moreButton = screen.getByLabelText('More actions');
      expect(moreButton).toBeInTheDocument();
    });
  });

  describe('Click handlers', () => {
    it('calls onClick when card is clicked', async () => {
      const user = userEvent.setup();
      const handleClick = vi.fn();
      renderWithWrapper(
        <ServiceTemplateCard
          template={mockTemplate}
          onClick={handleClick}
        />
      );

      const card = screen.getByRole('article');
      await user.click(card);

      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('does not call card onClick when action button is clicked', async () => {
      const user = userEvent.setup();
      const handleClick = vi.fn();
      renderWithWrapper(
        <ServiceTemplateCard
          template={mockTemplate}
          actions={mockActions}
          onClick={handleClick}
        />
      );

      const installButton = screen.getByRole('button', { name: 'Install' });
      await user.click(installButton);

      // Card onClick should not be called
      expect(handleClick).not.toHaveBeenCalled();
      // Action onClick should be called
      expect(mockActions[0].onClick).toHaveBeenCalledTimes(1);
    });
  });

  describe('Platform switching', () => {
    it('renders mobile presenter when platform is mobile', () => {
      mockUsePlatform.mockReturnValue('mobile');

      const { container } = renderWithWrapper(<ServiceTemplateCard template={mockTemplate} />);
      // Mobile uses vertical layout with CardHeader
      expect(container.querySelector('.pb-3')).toBeInTheDocument(); // CardHeader has pb-3 on mobile
    });

    it('renders desktop presenter when platform is desktop', () => {
      mockUsePlatform.mockReturnValue('desktop');

      renderWithWrapper(<ServiceTemplateCard template={mockTemplate} />);
      // Desktop renders template name
      expect(screen.getByText('Privacy Stack')).toBeInTheDocument();
    });

    it('renders mobile presenter when platform is tablet', () => {
      mockUsePlatform.mockReturnValue('tablet');

      const { container } = renderWithWrapper(<ServiceTemplateCard template={mockTemplate} />);
      // Tablet uses mobile presenter (vertical layout)
      expect(container.querySelector('.pb-3')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has correct ARIA label on card', () => {
      renderWithWrapper(<ServiceTemplateCard template={mockTemplate} />);
      const card = screen.getByRole('article');
      expect(card).toHaveAttribute('aria-label', 'Privacy Stack template - Built-in');
    });

    it('has correct ARIA label on action button', () => {
      renderWithWrapper(<ServiceTemplateCard template={mockTemplate} actions={mockActions} />);
      expect(screen.getByRole('button', { name: 'Install' })).toBeInTheDocument();
    });

    it('marks icons as aria-hidden', () => {
      renderWithWrapper(<ServiceTemplateCard template={mockTemplate} />);
      const icon = screen.getByText('🔒');
      expect(icon).toHaveAttribute('aria-hidden', 'true');
    });
  });

  describe('Edge cases', () => {
    it('renders without description', () => {
      const templateWithoutDesc = { ...mockTemplate, description: undefined };
      renderWithWrapper(<ServiceTemplateCard template={templateWithoutDesc} />);
      expect(screen.getByText('Privacy Stack')).toBeInTheDocument();
    });

    it('renders with zero variables', () => {
      const templateNoVars = {
        ...mockTemplate,
        metadata: { ...mockTemplate.metadata, variableCount: 0 },
      };
      renderWithWrapper(<ServiceTemplateCard template={templateNoVars} />);
      expect(screen.getByText('No variables')).toBeInTheDocument();
    });

    it('renders without version', () => {
      const templateNoVersion = {
        ...mockTemplate,
        metadata: { ...mockTemplate.metadata, version: undefined },
      };
      renderWithWrapper(<ServiceTemplateCard template={templateNoVersion} />);
      expect(screen.queryByText(/^v/)).not.toBeInTheDocument();
    });

    it('renders without icon', () => {
      const templateNoIcon = { ...mockTemplate, icon: undefined };
      const { container } = renderWithWrapper(<ServiceTemplateCard template={templateNoIcon} />);
      expect(container.querySelector('.w-12.h-12')).not.toBeInTheDocument();
    });

    it('renders without actions', () => {
      renderWithWrapper(<ServiceTemplateCard template={mockTemplate} />);
      expect(screen.queryByRole('button')).not.toBeInTheDocument();
    });
  });
});
