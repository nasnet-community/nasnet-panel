/**
 * LogFilters Component Tests
 * Tests for the log topic and severity filter components
 * Epic 0.8: System Logs - Stories 0.8.2 & 0.8.3
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LogFilters } from './LogFilters';
import type { LogTopic, LogSeverity } from '@nasnet/core/types/router';

describe('LogFilters', () => {
  const mockOnTopicsChange = vi.fn();
  const mockOnSeveritiesChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  // Helper function to render LogFilters with default props
  const renderLogFilters = (
    topics: LogTopic[] = [],
    severities: LogSeverity[] = []
  ) => {
    return render(
      <LogFilters
        topics={topics}
        onTopicsChange={mockOnTopicsChange}
        severities={severities}
        onSeveritiesChange={mockOnSeveritiesChange}
      />
    );
  };

  describe('Render and Initial State', () => {
    it('should render topic filter button', () => {
      render(
        <LogFilters
          topics={[]}
          onTopicsChange={mockOnTopicsChange}
          severities={[]}
          onSeveritiesChange={mockOnSeveritiesChange}
        />
      );

      const filterButton = screen.getByRole('button', { name: /filter by topic/i });
      expect(filterButton).toBeInTheDocument();
    });

    it('should render severity filter button', () => {
      render(
        <LogFilters
          topics={[]}
          onTopicsChange={mockOnTopicsChange}
          severities={[]}
          onSeveritiesChange={mockOnSeveritiesChange}
        />
      );

      const filterButton = screen.getByRole('button', { name: /filter by severity/i });
      expect(filterButton).toBeInTheDocument();
    });

    it('should show count badge when topics are selected', () => {
      const selectedTopics: LogTopic[] = ['firewall', 'wireless'];
      render(
        <LogFilters
          topics={selectedTopics}
          onTopicsChange={mockOnTopicsChange}
          severities={[]}
          onSeveritiesChange={mockOnSeveritiesChange}
        />
      );

      expect(screen.getByText('2')).toBeInTheDocument();
    });

    it('should show count badge when severities are selected', () => {
      const selectedSeverities: LogSeverity[] = ['error', 'critical'];
      render(
        <LogFilters
          topics={[]}
          onTopicsChange={mockOnTopicsChange}
          severities={selectedSeverities}
          onSeveritiesChange={mockOnSeveritiesChange}
        />
      );

      expect(screen.getByText('2')).toBeInTheDocument();
    });

    it('should not show count badge when no filters selected', () => {
      render(
        <LogFilters
          topics={[]}
          onTopicsChange={mockOnTopicsChange}
          severities={[]}
          onSeveritiesChange={mockOnSeveritiesChange}
        />
      );

      expect(screen.queryByText('0')).not.toBeInTheDocument();
    });

    it('should display selected topics as badges', () => {
      const selectedTopics: LogTopic[] = ['firewall', 'wireless', 'dhcp'];
      render(<LogFilters topics={selectedTopics} onTopicsChange={mockOnTopicsChange} />);

      expect(screen.getByText('Firewall')).toBeInTheDocument();
      expect(screen.getByText('Wireless')).toBeInTheDocument();
      expect(screen.getByText('Dhcp')).toBeInTheDocument();
    });

    it('should not display badges when no topics selected', () => {
      render(<LogFilters topics={[]} onTopicsChange={mockOnTopicsChange} />);

      expect(screen.queryByText('Firewall')).not.toBeInTheDocument();
      expect(screen.queryByText('Wireless')).not.toBeInTheDocument();
    });
  });

  describe('Dropdown Behavior', () => {
    it('should show dropdown when filter button is clicked', async () => {
      const user = userEvent.setup();
      render(<LogFilters topics={[]} onTopicsChange={mockOnTopicsChange} />);

      const filterButton = screen.getByRole('button', { name: /filter by topic/i });
      await user.click(filterButton);

      // Wait for dropdown to appear
      await waitFor(() => {
        expect(screen.getByRole('checkbox', { name: /system/i })).toBeInTheDocument();
      });
    });

    it('should display all 14 topic options in dropdown', async () => {
      const user = userEvent.setup();
      render(<LogFilters topics={[]} onTopicsChange={mockOnTopicsChange} />);

      const filterButton = screen.getByRole('button', { name: /filter by topic/i });
      await user.click(filterButton);

      const allTopics = [
        'System',
        'Firewall',
        'Wireless',
        'Dhcp',
        'Dns',
        'Ppp',
        'Vpn',
        'Interface',
        'Route',
        'Script',
        'Critical',
        'Info',
        'Warning',
        'Error',
      ];

      await waitFor(() => {
        allTopics.forEach((topic) => {
          expect(screen.getByText(topic)).toBeInTheDocument();
        });
      });
    });

    it('should check selected topics in dropdown', async () => {
      const user = userEvent.setup();
      const selectedTopics: LogTopic[] = ['firewall', 'wireless'];
      render(<LogFilters topics={selectedTopics} onTopicsChange={mockOnTopicsChange} />);

      const filterButton = screen.getByRole('button', { name: /filter by topic/i });
      await user.click(filterButton);

      await waitFor(() => {
        const firewallCheckbox = screen.getByRole('checkbox', { name: /firewall/i });
        const wirelessCheckbox = screen.getByRole('checkbox', { name: /wireless/i });
        const systemCheckbox = screen.getByRole('checkbox', { name: /system/i });

        expect(firewallCheckbox).toBeChecked();
        expect(wirelessCheckbox).toBeChecked();
        expect(systemCheckbox).not.toBeChecked();
      });
    });

    it('should close dropdown when clicking outside', async () => {
      const user = userEvent.setup();
      render(
        <div>
          <LogFilters topics={[]} onTopicsChange={mockOnTopicsChange} />
          <button>Outside Button</button>
        </div>
      );

      const filterButton = screen.getByRole('button', { name: /filter by topic/i });
      await user.click(filterButton);

      await waitFor(() => {
        expect(screen.getByRole('checkbox', { name: /system/i })).toBeInTheDocument();
      });

      const outsideButton = screen.getByRole('button', { name: /outside button/i });
      await user.click(outsideButton);

      await waitFor(() => {
        expect(screen.queryByRole('checkbox', { name: /system/i })).not.toBeInTheDocument();
      });
    });
  });

  describe('Topic Selection', () => {
    it('should call onTopicsChange when checking a topic', async () => {
      const user = userEvent.setup();
      render(<LogFilters topics={[]} onTopicsChange={mockOnTopicsChange} />);

      const filterButton = screen.getByRole('button', { name: /filter by topic/i });
      await user.click(filterButton);

      const firewallCheckbox = await screen.findByRole('checkbox', { name: /firewall/i });
      await user.click(firewallCheckbox);

      expect(mockOnTopicsChange).toHaveBeenCalledWith(['firewall']);
    });

    it('should call onTopicsChange when unchecking a topic', async () => {
      const user = userEvent.setup();
      const selectedTopics: LogTopic[] = ['firewall', 'wireless'];
      render(<LogFilters topics={selectedTopics} onTopicsChange={mockOnTopicsChange} />);

      const filterButton = screen.getByRole('button', { name: /filter by topic/i });
      await user.click(filterButton);

      const firewallCheckbox = await screen.findByRole('checkbox', { name: /firewall/i });
      await user.click(firewallCheckbox);

      expect(mockOnTopicsChange).toHaveBeenCalledWith(['wireless']);
    });

    it('should add multiple topics when checking multiple checkboxes', async () => {
      const user = userEvent.setup();
      render(<LogFilters topics={[]} onTopicsChange={mockOnTopicsChange} />);

      const filterButton = screen.getByRole('button', { name: /filter by topic/i });
      await user.click(filterButton);

      const firewallCheckbox = await screen.findByRole('checkbox', { name: /firewall/i });
      await user.click(firewallCheckbox);

      expect(mockOnTopicsChange).toHaveBeenCalledWith(['firewall']);

      // Simulate selecting wireless (LogFilters would be re-rendered with updated topics)
      const { rerender } = render(
        <LogFilters topics={['firewall']} onTopicsChange={mockOnTopicsChange} />
      );

      await user.click(filterButton);
      const wirelessCheckbox = await screen.findByRole('checkbox', { name: /wireless/i });
      await user.click(wirelessCheckbox);

      expect(mockOnTopicsChange).toHaveBeenCalledWith(['firewall', 'wireless']);
    });
  });

  describe('Topic Badge Removal', () => {
    it('should show clear filters button when topics are selected', () => {
      const selectedTopics: LogTopic[] = ['firewall'];
      render(<LogFilters topics={selectedTopics} onTopicsChange={mockOnTopicsChange} />);

      expect(screen.getByRole('button', { name: /clear filters/i })).toBeInTheDocument();
    });

    it('should not show clear filters button when no topics selected', () => {
      render(<LogFilters topics={[]} onTopicsChange={mockOnTopicsChange} />);

      expect(screen.queryByRole('button', { name: /clear filters/i })).not.toBeInTheDocument();
    });

    it('should call onTopicsChange with empty array when clear filters clicked', async () => {
      const user = userEvent.setup();
      const selectedTopics: LogTopic[] = ['firewall', 'wireless'];
      render(<LogFilters topics={selectedTopics} onTopicsChange={mockOnTopicsChange} />);

      const clearButton = screen.getByRole('button', { name: /clear filters/i });
      await user.click(clearButton);

      expect(mockOnTopicsChange).toHaveBeenCalledWith([]);
    });

    it('should remove topic when badge X button is clicked', async () => {
      const user = userEvent.setup();
      const selectedTopics: LogTopic[] = ['firewall', 'wireless', 'dhcp'];
      render(<LogFilters topics={selectedTopics} onTopicsChange={mockOnTopicsChange} />);

      const removeFirewallButton = screen.getByRole('button', {
        name: /remove firewall filter/i,
      });
      await user.click(removeFirewallButton);

      expect(mockOnTopicsChange).toHaveBeenCalledWith(['wireless', 'dhcp']);
    });

    it('should have remove icon on each topic badge', () => {
      const selectedTopics: LogTopic[] = ['firewall', 'wireless'];
      const { container } = render(
        <LogFilters topics={selectedTopics} onTopicsChange={mockOnTopicsChange} />
      );

      // Each badge should have an X icon
      const removeButtons = container.querySelectorAll('button[aria-label*="Remove"]');
      expect(removeButtons.length).toBe(2);
    });
  });

  describe('Custom Class Names', () => {
    it('should apply custom className', () => {
      const { container } = render(
        <LogFilters
          topics={[]}
          onTopicsChange={mockOnTopicsChange}
          className="custom-filter-class"
        />
      );

      const filterContainer = container.firstChild as HTMLElement;
      expect(filterContainer.className).toContain('custom-filter-class');
    });

    it('should preserve default classes with custom className', () => {
      const { container } = render(
        <LogFilters
          topics={[]}
          onTopicsChange={mockOnTopicsChange}
          className="custom-class"
        />
      );

      const filterContainer = container.firstChild as HTMLElement;
      expect(filterContainer.className).toContain('custom-class');
      expect(filterContainer.className).toContain('flex');
      expect(filterContainer.className).toContain('flex-col');
    });
  });

  describe('Accessibility', () => {
    it('should have accessible filter button', () => {
      render(<LogFilters topics={[]} onTopicsChange={mockOnTopicsChange} />);

      const filterButton = screen.getByRole('button', { name: /filter by topic/i });
      expect(filterButton).toHaveAccessibleName();
    });

    it('should have accessible remove buttons for topic badges', () => {
      const selectedTopics: LogTopic[] = ['firewall', 'wireless'];
      render(<LogFilters topics={selectedTopics} onTopicsChange={mockOnTopicsChange} />);

      const removeFirewallButton = screen.getByRole('button', {
        name: /remove firewall filter/i,
      });
      const removeWirelessButton = screen.getByRole('button', {
        name: /remove wireless filter/i,
      });

      expect(removeFirewallButton).toHaveAccessibleName();
      expect(removeWirelessButton).toHaveAccessibleName();
    });

    it('should use checkboxes for topic selection', async () => {
      const user = userEvent.setup();
      render(<LogFilters topics={[]} onTopicsChange={mockOnTopicsChange} />);

      const filterButton = screen.getByRole('button', { name: /filter by topic/i });
      await user.click(filterButton);

      const checkboxes = await screen.findAllByRole('checkbox');
      expect(checkboxes.length).toBe(14); // All 14 topics
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty topics array', () => {
      render(<LogFilters topics={[]} onTopicsChange={mockOnTopicsChange} />);

      expect(screen.getByRole('button', { name: /filter by topic/i })).toBeInTheDocument();
      expect(screen.queryByText('Clear filters')).not.toBeInTheDocument();
    });

    it('should handle all topics selected', async () => {
      const user = userEvent.setup();
      const allTopics: LogTopic[] = [
        'system',
        'firewall',
        'wireless',
        'dhcp',
        'dns',
        'ppp',
        'vpn',
        'interface',
        'route',
        'script',
        'critical',
        'info',
        'warning',
        'error',
      ];
      render(<LogFilters topics={allTopics} onTopicsChange={mockOnTopicsChange} />);

      // Should show count of 14
      expect(screen.getByText('14')).toBeInTheDocument();

      const filterButton = screen.getByRole('button', { name: /filter by topic/i });
      await user.click(filterButton);

      // All checkboxes should be checked
      const checkboxes = await screen.findAllByRole('checkbox');
      checkboxes.forEach((checkbox) => {
        expect(checkbox).toBeChecked();
      });
    });

    it('should handle rapid topic selection/deselection', async () => {
      const user = userEvent.setup();
      render(<LogFilters topics={[]} onTopicsChange={mockOnTopicsChange} />);

      const filterButton = screen.getByRole('button', { name: /filter by topic/i });
      await user.click(filterButton);

      const firewallCheckbox = await screen.findByRole('checkbox', { name: /firewall/i });

      // Rapidly toggle checkbox
      await user.click(firewallCheckbox);
      await user.click(firewallCheckbox);
      await user.click(firewallCheckbox);

      // Should have been called 3 times
      expect(mockOnTopicsChange).toHaveBeenCalledTimes(3);
    });

    it('should handle single topic selection', () => {
      const selectedTopics: LogTopic[] = ['firewall'];
      render(<LogFilters topics={selectedTopics} onTopicsChange={mockOnTopicsChange} />);

      expect(screen.getByText('1')).toBeInTheDocument();
      expect(screen.getByText('Firewall')).toBeInTheDocument();
    });
  });

  describe('Topic Badge Styling', () => {
    it('should apply color-coded badges for different topics', () => {
      const selectedTopics: LogTopic[] = ['firewall', 'system', 'wireless'];
      const { container } = render(
        <LogFilters topics={selectedTopics} onTopicsChange={mockOnTopicsChange} />
      );

      // Each topic should have its own color styling
      const firewallBadge = screen.getByText('Firewall');
      const systemBadge = screen.getByText('System');
      const wirelessBadge = screen.getByText('Wireless');

      // Should have different background colors
      expect(firewallBadge.className).toContain('bg-orange');
      expect(systemBadge.className).toContain('bg-slate');
      expect(wirelessBadge.className).toContain('bg-purple');
    });

    it('should show hover effect on topic badges', () => {
      const selectedTopics: LogTopic[] = ['firewall'];
      render(<LogFilters topics={selectedTopics} onTopicsChange={mockOnTopicsChange} severities={[]} onSeveritiesChange={mockOnSeveritiesChange} />);

      const badge = screen.getByRole('button', { name: /remove firewall filter/i });
      expect(badge.className).toContain('hover:opacity-80');
    });
  });

  describe('Severity Filter Functionality', () => {
    it('should display all 5 severity options in dropdown', async () => {
      const user = userEvent.setup();
      renderLogFilters();

      const filterButton = screen.getByRole('button', { name: /filter by severity/i });
      await user.click(filterButton);

      await waitFor(() => {
        expect(screen.getByText('Debug')).toBeInTheDocument();
        expect(screen.getByText('Info')).toBeInTheDocument();
        expect(screen.getByText('Warning')).toBeInTheDocument();
        expect(screen.getByText('Error')).toBeInTheDocument();
        expect(screen.getByText('Critical')).toBeInTheDocument();
      });
    });

    it('should call onSeveritiesChange when selecting a severity', async () => {
      const user = userEvent.setup();
      renderLogFilters();

      const filterButton = screen.getByRole('button', { name: /filter by severity/i });
      await user.click(filterButton);

      const errorCheckbox = await screen.findByRole('checkbox', { name: /error/i });
      await user.click(errorCheckbox);

      expect(mockOnSeveritiesChange).toHaveBeenCalledWith(['error']);
    });

    it('should call onSeveritiesChange when deselecting a severity', async () => {
      const user = userEvent.setup();
      const selectedSeverities: LogSeverity[] = ['error', 'critical'];
      renderLogFilters([], selectedSeverities);

      const filterButton = screen.getByRole('button', { name: /filter by severity/i });
      await user.click(filterButton);

      const errorCheckbox = await screen.findByRole('checkbox', { name: /error/i });
      await user.click(errorCheckbox);

      expect(mockOnSeveritiesChange).toHaveBeenCalledWith(['critical']);
    });

    it('should display selected severities as colored badges', () => {
      const selectedSeverities: LogSeverity[] = ['error', 'warning', 'critical'];
      renderLogFilters([], selectedSeverities);

      expect(screen.getByText('Error')).toBeInTheDocument();
      expect(screen.getByText('Warning')).toBeInTheDocument();
      expect(screen.getByText('Critical')).toBeInTheDocument();
    });

    it('should remove severity when badge X button is clicked', async () => {
      const user = userEvent.setup();
      const selectedSeverities: LogSeverity[] = ['error', 'warning'];
      renderLogFilters([], selectedSeverities);

      const removeErrorButton = screen.getByRole('button', { name: /remove error filter/i });
      await user.click(removeErrorButton);

      expect(mockOnSeveritiesChange).toHaveBeenCalledWith(['warning']);
    });

    it('should clear both topics and severities when clear filters clicked', async () => {
      const user = userEvent.setup();
      const selectedTopics: LogTopic[] = ['firewall'];
      const selectedSeverities: LogSeverity[] = ['error'];
      renderLogFilters(selectedTopics, selectedSeverities);

      const clearButton = screen.getByRole('button', { name: /clear filters/i });
      await user.click(clearButton);

      expect(mockOnTopicsChange).toHaveBeenCalledWith([]);
      expect(mockOnSeveritiesChange).toHaveBeenCalledWith([]);
    });
  });

  describe('Combined Topic and Severity Filters', () => {
    it('should display both topic and severity badges when both are selected', () => {
      const selectedTopics: LogTopic[] = ['firewall', 'wireless'];
      const selectedSeverities: LogSeverity[] = ['error', 'critical'];
      renderLogFilters(selectedTopics, selectedSeverities);

      // Topic badges
      expect(screen.getByText('Firewall')).toBeInTheDocument();
      expect(screen.getByText('Wireless')).toBeInTheDocument();

      // Severity badges
      expect(screen.getByText('Error')).toBeInTheDocument();
      expect(screen.getByText('Critical')).toBeInTheDocument();
    });

    it('should show clear filters button when either topics or severities are selected', () => {
      const { rerender } = renderLogFilters(['firewall'], []);
      expect(screen.getByRole('button', { name: /clear filters/i })).toBeInTheDocument();

      rerender(
        <LogFilters
          topics={[]}
          onTopicsChange={mockOnTopicsChange}
          severities={['error']}
          onSeveritiesChange={mockOnSeveritiesChange}
        />
      );
      expect(screen.getByRole('button', { name: /clear filters/i })).toBeInTheDocument();
    });

    it('should not show clear filters button when no filters selected', () => {
      renderLogFilters();
      expect(screen.queryByRole('button', { name: /clear filters/i })).not.toBeInTheDocument();
    });
  });

  describe('Severity Badge Colors', () => {
    it('should display severity badges with correct colors', () => {
      const selectedSeverities: LogSeverity[] = ['debug', 'info', 'warning', 'error', 'critical'];
      renderLogFilters([], selectedSeverities);

      const debugBadge = screen.getByText('Debug');
      const infoBadge = screen.getByText('Info');
      const warningBadge = screen.getByText('Warning');
      const errorBadge = screen.getByText('Error');
      const criticalBadge = screen.getByText('Critical');

      // Check for severity-specific color classes
      expect(debugBadge.className).toContain('text-gray');
      expect(infoBadge.className).toContain('text-blue');
      expect(warningBadge.className).toContain('text-amber');
      expect(errorBadge.className).toContain('text-red');
      expect(criticalBadge.className).toContain('text-red');
      expect(criticalBadge.className).toContain('font-bold');
    });
  });
});
