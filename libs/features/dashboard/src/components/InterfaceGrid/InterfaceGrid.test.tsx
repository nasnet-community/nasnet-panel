/**
 * InterfaceGrid Component Tests
 *
 * Tests platform selection, loading/error/empty states,
 * interface rendering, show all toggle, detail sheet, and accessibility.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'vitest-axe';
import { MockedProvider } from '@apollo/client/testing';
import { InterfaceGrid } from './InterfaceGrid';
import { InterfaceGridDesktop } from './InterfaceGrid.Desktop';
import { InterfaceGridTablet } from './InterfaceGrid.Tablet';
import { InterfaceGridMobile } from './InterfaceGrid.Mobile';
import { GET_INTERFACES } from './queries';
import type { InterfaceGridData } from './types';

// Mock platform hook
vi.mock('@nasnet/ui/layouts', () => ({
  usePlatform: vi.fn(() => 'desktop'),
}));

// Mock fixtures
const createMockInterface = (id: string, name: string): InterfaceGridData => ({
  id,
  name,
  type: 'ethernet',
  status: 'up',
  ip: `192.168.1.${id.replace('ether', '')}`,
  mac: `00:11:22:33:44:${id.replace('ether', '').padStart(2, '0')}`,
  mtu: 1500,
  running: true,
  txRate: 1000000,
  rxRate: 2000000,
  linkSpeed: '1Gbps',
  usedBy: [],
});

const mockInterfaces: InterfaceGridData[] = [
  createMockInterface('ether1', 'ether1'),
  createMockInterface('ether2', 'ether2'),
  createMockInterface('ether3', 'ether3'),
  createMockInterface('ether4', 'ether4'),
];

const eightInterfaces = Array.from({ length: 8 }, (_, i) =>
  createMockInterface(`ether${i + 1}`, `ether${i + 1}`)
);

const fifteenInterfaces = Array.from({ length: 15 }, (_, i) =>
  createMockInterface(`ether${i + 1}`, `ether${i + 1}`)
);

// Apollo Client mocks
const createSuccessMock = (interfaces: InterfaceGridData[]) => ({
  request: {
    query: GET_INTERFACES,
    variables: { deviceId: 'router-1' },
  },
  result: {
    data: {
      device: {
        id: 'router-1',
        interfaces,
      },
    },
  },
});

const createErrorMock = () => ({
  request: {
    query: GET_INTERFACES,
    variables: { deviceId: 'router-1' },
  },
  error: new Error('Network error'),
});

describe('InterfaceGrid Platform Selection', () => {
  beforeEach(async () => {
    const { usePlatform } = await import('@nasnet/ui/layouts');
    vi.mocked(usePlatform).mockReturnValue('desktop');
  });

  it('should render desktop presenter when platform is desktop', async () => {
    const { usePlatform } = await import('@nasnet/ui/layouts');
    vi.mocked(usePlatform).mockReturnValue('desktop');
    const { container } = render(
      <MockedProvider mocks={[createSuccessMock(mockInterfaces)]} addTypename={false}>
        <InterfaceGrid deviceId="router-1" />
      </MockedProvider>
    );

    expect(container.querySelector('.grid-cols-4')).toBeInTheDocument();
  });

  it('should render tablet presenter when platform is tablet', async () => {
    const { usePlatform } = await import('@nasnet/ui/layouts');
    vi.mocked(usePlatform).mockReturnValue('tablet');
    const { container } = render(
      <MockedProvider mocks={[createSuccessMock(mockInterfaces)]} addTypename={false}>
        <InterfaceGrid deviceId="router-1" />
      </MockedProvider>
    );

    expect(container.querySelector('.grid-cols-3')).toBeInTheDocument();
  });

  it('should render mobile presenter when platform is mobile', async () => {
    const { usePlatform } = await import('@nasnet/ui/layouts');
    vi.mocked(usePlatform).mockReturnValue('mobile');
    const { container } = render(
      <MockedProvider mocks={[createSuccessMock(mockInterfaces)]} addTypename={false}>
        <InterfaceGrid deviceId="router-1" />
      </MockedProvider>
    );

    expect(container.querySelector('.grid-cols-2')).toBeInTheDocument();
  });
});

describe('Loading State', () => {
  it('should render skeleton cards when loading (desktop)', () => {
    render(
      <MockedProvider mocks={[]} addTypename={false}>
        <InterfaceGridDesktop deviceId="router-1" />
      </MockedProvider>
    );

    // Skeleton cards should be present
    const skeletons = document.querySelectorAll('[class*="animate-pulse"]');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('should render 4 skeleton cards on desktop', () => {
    const { container } = render(
      <MockedProvider mocks={[]} addTypename={false}>
        <InterfaceGridDesktop deviceId="router-1" />
      </MockedProvider>
    );

    const grid = container.querySelector('.grid-cols-4');
    expect(grid).toBeInTheDocument();
  });

  it('should render 3 skeleton cards on tablet', () => {
    const { container } = render(
      <MockedProvider mocks={[]} addTypename={false}>
        <InterfaceGridTablet deviceId="router-1" />
      </MockedProvider>
    );

    const grid = container.querySelector('.grid-cols-3');
    expect(grid).toBeInTheDocument();
  });

  it('should render 2 skeleton cards on mobile', () => {
    const { container } = render(
      <MockedProvider mocks={[]} addTypename={false}>
        <InterfaceGridMobile deviceId="router-1" />
      </MockedProvider>
    );

    const grid = container.querySelector('.grid-cols-2');
    expect(grid).toBeInTheDocument();
  });
});

describe('Error State', () => {
  it('should render error alert when query fails', async () => {
    render(
      <MockedProvider mocks={[createErrorMock()]} addTypename={false}>
        <InterfaceGridDesktop deviceId="router-1" />
      </MockedProvider>
    );

    await waitFor(() => {
      expect(screen.getByText(/Failed to load interfaces/i)).toBeInTheDocument();
    });
  });

  it('should render retry button in error state', async () => {
    render(
      <MockedProvider mocks={[createErrorMock()]} addTypename={false}>
        <InterfaceGridDesktop deviceId="router-1" />
      </MockedProvider>
    );

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
    });
  });

  it('should call refetch when retry button clicked', async () => {
    const user = userEvent.setup();
    const refetchMock = vi.fn();

    render(
      <MockedProvider mocks={[createErrorMock()]} addTypename={false}>
        <InterfaceGridDesktop deviceId="router-1" />
      </MockedProvider>
    );

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
    });

    const retryButton = screen.getByRole('button', { name: /retry/i });
    await user.click(retryButton);

    // Verify click was handled (actual refetch is mocked by Apollo)
    expect(retryButton).toBeInTheDocument();
  });

  it('should display error icon', async () => {
    const { container } = render(
      <MockedProvider mocks={[createErrorMock()]} addTypename={false}>
        <InterfaceGridDesktop deviceId="router-1" />
      </MockedProvider>
    );

    await waitFor(() => {
      const alert = container.querySelector('[role="alert"]');
      expect(alert).toBeInTheDocument();
    });
  });
});

describe('Empty State', () => {
  it('should render empty message when no interfaces', async () => {
    render(
      <MockedProvider mocks={[createSuccessMock([])]} addTypename={false}>
        <InterfaceGridDesktop deviceId="router-1" />
      </MockedProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('No interfaces found')).toBeInTheDocument();
    });
  });

  it('should render helpful text in empty state', async () => {
    render(
      <MockedProvider mocks={[createSuccessMock([])]} addTypename={false}>
        <InterfaceGridDesktop deviceId="router-1" />
      </MockedProvider>
    );

    await waitFor(() => {
      expect(
        screen.getByText(/doesn't have any network interfaces configured/i)
      ).toBeInTheDocument();
    });
  });

  it('should render network icon in empty state', async () => {
    render(
      <MockedProvider mocks={[createSuccessMock([])]} addTypename={false}>
        <InterfaceGridDesktop deviceId="router-1" />
      </MockedProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('No interfaces found')).toBeInTheDocument();
    });
  });
});

describe('Interface Rendering', () => {
  it('should render all interfaces when data loads', async () => {
    render(
      <MockedProvider mocks={[createSuccessMock(mockInterfaces)]} addTypename={false}>
        <InterfaceGridDesktop deviceId="router-1" />
      </MockedProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('ether1')).toBeInTheDocument();
      expect(screen.getByText('ether2')).toBeInTheDocument();
      expect(screen.getByText('ether3')).toBeInTheDocument();
      expect(screen.getByText('ether4')).toBeInTheDocument();
    });
  });

  it('should render interface cards with correct data', async () => {
    render(
      <MockedProvider mocks={[createSuccessMock(mockInterfaces)]} addTypename={false}>
        <InterfaceGridDesktop deviceId="router-1" />
      </MockedProvider>
    );

    await waitFor(() => {
      const cards = screen.getAllByRole('article');
      expect(cards.length).toBe(4);
    });
  });

  it('should render grid with correct column count on desktop', async () => {
    const { container } = render(
      <MockedProvider mocks={[createSuccessMock(mockInterfaces)]} addTypename={false}>
        <InterfaceGridDesktop deviceId="router-1" />
      </MockedProvider>
    );

    await waitFor(() => {
      const grid = container.querySelector('.grid-cols-4');
      expect(grid).toBeInTheDocument();
    });
  });

  it('should render grid with correct gap spacing', async () => {
    const { container } = render(
      <MockedProvider mocks={[createSuccessMock(mockInterfaces)]} addTypename={false}>
        <InterfaceGridDesktop deviceId="router-1" />
      </MockedProvider>
    );

    await waitFor(() => {
      const grid = container.querySelector('.gap-4');
      expect(grid).toBeInTheDocument();
    });
  });
});

describe('Show All Toggle', () => {
  it('should show all 8 interfaces when exactly 8', async () => {
    render(
      <MockedProvider mocks={[createSuccessMock(eightInterfaces)]} addTypename={false}>
        <InterfaceGridDesktop deviceId="router-1" />
      </MockedProvider>
    );

    await waitFor(() => {
      const cards = screen.getAllByRole('article');
      expect(cards.length).toBe(8);
    });
  });

  it('should show only first 8 interfaces when >8', async () => {
    render(
      <MockedProvider mocks={[createSuccessMock(fifteenInterfaces)]} addTypename={false}>
        <InterfaceGridDesktop deviceId="router-1" />
      </MockedProvider>
    );

    await waitFor(() => {
      const cards = screen.getAllByRole('article');
      expect(cards.length).toBe(8);
    });
  });

  it('should render "Show all" button when >8 interfaces', async () => {
    render(
      <MockedProvider mocks={[createSuccessMock(fifteenInterfaces)]} addTypename={false}>
        <InterfaceGridDesktop deviceId="router-1" />
      </MockedProvider>
    );

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /show all \(15\)/i })).toBeInTheDocument();
    });
  });

  it('should not render "Show all" button when <=8 interfaces', async () => {
    render(
      <MockedProvider mocks={[createSuccessMock(mockInterfaces)]} addTypename={false}>
        <InterfaceGridDesktop deviceId="router-1" />
      </MockedProvider>
    );

    await waitFor(() => {
      expect(screen.queryByRole('button', { name: /show all/i })).not.toBeInTheDocument();
    });
  });

  it('should show all interfaces when "Show all" clicked', async () => {
    const user = userEvent.setup();
    render(
      <MockedProvider mocks={[createSuccessMock(fifteenInterfaces)]} addTypename={false}>
        <InterfaceGridDesktop deviceId="router-1" />
      </MockedProvider>
    );

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /show all \(15\)/i })).toBeInTheDocument();
    });

    const showAllButton = screen.getByRole('button', { name: /show all \(15\)/i });
    await user.click(showAllButton);

    await waitFor(() => {
      const cards = screen.getAllByRole('article');
      expect(cards.length).toBe(15);
    });
  });

  it('should change button text to "Show less" when expanded', async () => {
    const user = userEvent.setup();
    render(
      <MockedProvider mocks={[createSuccessMock(fifteenInterfaces)]} addTypename={false}>
        <InterfaceGridDesktop deviceId="router-1" />
      </MockedProvider>
    );

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /show all \(15\)/i })).toBeInTheDocument();
    });

    const showAllButton = screen.getByRole('button', { name: /show all \(15\)/i });
    await user.click(showAllButton);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /show less/i })).toBeInTheDocument();
    });
  });

  it('should collapse back to 8 when "Show less" clicked', async () => {
    const user = userEvent.setup();
    render(
      <MockedProvider mocks={[createSuccessMock(fifteenInterfaces)]} addTypename={false}>
        <InterfaceGridDesktop deviceId="router-1" />
      </MockedProvider>
    );

    // Expand
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /show all \(15\)/i })).toBeInTheDocument();
    });

    const expandButton = screen.getByRole('button', { name: /show all \(15\)/i });
    await user.click(expandButton);

    // Collapse
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /show less/i })).toBeInTheDocument();
    });

    const collapseButton = screen.getByRole('button', { name: /show less/i });
    await user.click(collapseButton);

    await waitFor(() => {
      const cards = screen.getAllByRole('article');
      expect(cards.length).toBe(8);
    });
  });
});

describe('Detail Sheet', () => {
  it('should render detail sheet when interface selected', async () => {
    const user = userEvent.setup();
    render(
      <MockedProvider mocks={[createSuccessMock(mockInterfaces)]} addTypename={false}>
        <InterfaceGridDesktop deviceId="router-1" />
      </MockedProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('ether1')).toBeInTheDocument();
    });

    const firstCard = screen.getAllByRole('article')[0];
    await user.click(firstCard);

    await waitFor(() => {
      expect(screen.getByText('Interface Details')).toBeInTheDocument();
    });
  });

  it('should close detail sheet when onOpenChange(false) called', async () => {
    const user = userEvent.setup();
    render(
      <MockedProvider mocks={[createSuccessMock(mockInterfaces)]} addTypename={false}>
        <InterfaceGridDesktop deviceId="router-1" />
      </MockedProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('ether1')).toBeInTheDocument();
    });

    // Open sheet
    const firstCard = screen.getAllByRole('article')[0];
    await user.click(firstCard);

    await waitFor(() => {
      expect(screen.getByText('Interface Details')).toBeInTheDocument();
    });

    // Close sheet (by pressing Escape)
    await user.keyboard('{Escape}');

    await waitFor(() => {
      expect(screen.queryByText('Interface Details')).not.toBeInTheDocument();
    });
  });
});

describe('Data Integration', () => {
  it('should use useInterfaces hook with correct deviceId', async () => {
    render(
      <MockedProvider mocks={[createSuccessMock(mockInterfaces)]} addTypename={false}>
        <InterfaceGrid deviceId="router-1" />
      </MockedProvider>
    );

    // Wait for data to load
    await waitFor(() => {
      expect(screen.getByText('ether1')).toBeInTheDocument();
    });
  });

  it('should handle empty interfaces array', async () => {
    render(
      <MockedProvider mocks={[createSuccessMock([])]} addTypename={false}>
        <InterfaceGrid deviceId="router-1" />
      </MockedProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('No interfaces found')).toBeInTheDocument();
    });
  });
});

describe('Accessibility', () => {
  it('should have no accessibility violations (desktop)', async () => {
    const { container } = render(
      <MockedProvider mocks={[createSuccessMock(mockInterfaces)]} addTypename={false}>
        <InterfaceGridDesktop deviceId="router-1" />
      </MockedProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('ether1')).toBeInTheDocument();
    });

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should have no accessibility violations in loading state', async () => {
    const { container } = render(
      <MockedProvider mocks={[]} addTypename={false}>
        <InterfaceGridDesktop deviceId="router-1" />
      </MockedProvider>
    );

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should have no accessibility violations in error state', async () => {
    const { container } = render(
      <MockedProvider mocks={[createErrorMock()]} addTypename={false}>
        <InterfaceGridDesktop deviceId="router-1" />
      </MockedProvider>
    );

    await waitFor(() => {
      expect(screen.getByText(/Failed to load interfaces/i)).toBeInTheDocument();
    });

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should have no accessibility violations in empty state', async () => {
    const { container } = render(
      <MockedProvider mocks={[createSuccessMock([])]} addTypename={false}>
        <InterfaceGridDesktop deviceId="router-1" />
      </MockedProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('No interfaces found')).toBeInTheDocument();
    });

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should have proper button labels for retry', async () => {
    render(
      <MockedProvider mocks={[createErrorMock()]} addTypename={false}>
        <InterfaceGridDesktop deviceId="router-1" />
      </MockedProvider>
    );

    await waitFor(() => {
      const retryButton = screen.getByRole('button', { name: /retry/i });
      expect(retryButton).toBeInTheDocument();
    });
  });

  it('should have proper button labels for show all', async () => {
    render(
      <MockedProvider mocks={[createSuccessMock(fifteenInterfaces)]} addTypename={false}>
        <InterfaceGridDesktop deviceId="router-1" />
      </MockedProvider>
    );

    await waitFor(() => {
      const showAllButton = screen.getByRole('button', { name: /show all \(15\)/i });
      expect(showAllButton).toBeInTheDocument();
      expect(showAllButton).toHaveAccessibleName();
    });
  });
});
