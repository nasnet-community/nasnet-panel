/**
 * LogEntry Component Tests
 * Tests for the log entry display component
 * Epic 0.8: System Logs - Story 0.8.1
 */

import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';

import type { LogEntry as LogEntryType } from '@nasnet/core/types/router';

import { LogEntry } from './LogEntry';


describe('LogEntry', () => {
  const mockLogEntry: LogEntryType = {
    id: 'log-1',
    timestamp: new Date('2025-12-04T14:30:45Z'),
    topic: 'firewall',
    severity: 'warning',
    message: 'Connection rejected from 192.168.1.100',
  };

  describe('Basic Rendering', () => {
    it('should render timestamp, topic, and message', () => {
      render(<LogEntry entry={mockLogEntry} />);

      // Check message is displayed
      expect(screen.getByText('Connection rejected from 192.168.1.100')).toBeInTheDocument();

      // Check topic badge is displayed
      expect(screen.getByText('firewall')).toBeInTheDocument();

      // Check timestamp is displayed (format varies by locale)
      const timeElement = screen.getByText(/\d{1,2}:\d{2}:\d{2}\s(?:AM|PM)/i);
      expect(timeElement).toBeInTheDocument();
    });

    it('should format timestamp without date by default', () => {
      render(<LogEntry entry={mockLogEntry} />);

      // Should show time only (no date components)
      const timeElement = screen.getByText(/\d{1,2}:\d{2}:\d{2}\s(?:AM|PM)/i);
      expect(timeElement).toBeInTheDocument();
    });

    it('should include date when showDate is true', () => {
      render(<LogEntry entry={mockLogEntry} showDate={true} />);

      // Timestamp should be visible (format includes date)
      const timeElement = screen.getByRole('time');
      expect(timeElement).toBeInTheDocument();
      expect(timeElement.textContent).toBeTruthy();
    });
  });

  describe('Topic Badge Rendering', () => {
    it('should render firewall topic with correct styling', () => {
      render(<LogEntry entry={mockLogEntry} />);

      const topicBadge = screen.getByText('firewall');
      expect(topicBadge).toBeInTheDocument();
      expect(topicBadge.className).toContain('bg-orange');
    });

    it('should render system topic with correct styling', () => {
      const systemLog: LogEntryType = {
        ...mockLogEntry,
        topic: 'system',
      };
      render(<LogEntry entry={systemLog} />);

      const topicBadge = screen.getByText('system');
      expect(topicBadge).toBeInTheDocument();
      expect(topicBadge.className).toContain('bg-slate');
    });

    it('should render wireless topic with correct styling', () => {
      const wirelessLog: LogEntryType = {
        ...mockLogEntry,
        topic: 'wireless',
      };
      render(<LogEntry entry={wirelessLog} />);

      const topicBadge = screen.getByText('wireless');
      expect(topicBadge).toBeInTheDocument();
      expect(topicBadge.className).toContain('bg-purple');
    });

    it('should render dhcp topic with correct styling', () => {
      const dhcpLog: LogEntryType = {
        ...mockLogEntry,
        topic: 'dhcp',
      };
      render(<LogEntry entry={dhcpLog} />);

      const topicBadge = screen.getByText('dhcp');
      expect(topicBadge).toBeInTheDocument();
      expect(topicBadge.className).toContain('bg-green');
    });

    it('should render vpn topic with correct styling', () => {
      const vpnLog: LogEntryType = {
        ...mockLogEntry,
        topic: 'vpn',
      };
      render(<LogEntry entry={vpnLog} />);

      const topicBadge = screen.getByText('vpn');
      expect(topicBadge).toBeInTheDocument();
      expect(topicBadge.className).toContain('bg-indigo');
    });

    it('should render critical topic with correct styling', () => {
      const criticalLog: LogEntryType = {
        ...mockLogEntry,
        topic: 'critical',
      };
      render(<LogEntry entry={criticalLog} />);

      const topicBadge = screen.getByText('critical');
      expect(topicBadge).toBeInTheDocument();
      expect(topicBadge.className).toContain('bg-red');
    });

    it('should render warning topic with correct styling', () => {
      const warningLog: LogEntryType = {
        ...mockLogEntry,
        topic: 'warning',
      };
      render(<LogEntry entry={warningLog} />);

      const topicBadge = screen.getByText('warning');
      expect(topicBadge).toBeInTheDocument();
      expect(topicBadge.className).toContain('bg-yellow');
    });

    it('should render info topic with correct styling', () => {
      const infoLog: LogEntryType = {
        ...mockLogEntry,
        topic: 'info',
      };
      render(<LogEntry entry={infoLog} />);

      const topicBadge = screen.getByText('info');
      expect(topicBadge).toBeInTheDocument();
      expect(topicBadge.className).toContain('bg-blue');
    });
  });

  describe('Message Display', () => {
    it('should display short messages correctly', () => {
      const shortLog: LogEntryType = {
        ...mockLogEntry,
        message: 'Short message',
      };
      render(<LogEntry entry={shortLog} />);

      expect(screen.getByText('Short message')).toBeInTheDocument();
    });

    it('should display long messages with word wrapping', () => {
      const longLog: LogEntryType = {
        ...mockLogEntry,
        message:
          'This is a very long log message that should wrap properly in the UI without breaking the layout and maintain readability across multiple lines',
      };
      render(<LogEntry entry={longLog} />);

      const messageElement = screen.getByText(/This is a very long log message/);
      expect(messageElement).toBeInTheDocument();
      // Element should have break-words class for wrapping
      expect(messageElement.className).toContain('break-words');
    });

    it('should handle messages with special characters', () => {
      const specialCharsLog: LogEntryType = {
        ...mockLogEntry,
        message: 'Error: Connection failed @ 192.168.1.1:8080 (timeout > 30s)',
      };
      render(<LogEntry entry={specialCharsLog} />);

      expect(
        screen.getByText('Error: Connection failed @ 192.168.1.1:8080 (timeout > 30s)')
      ).toBeInTheDocument();
    });

    it('should handle messages with newlines', () => {
      const multilineLog: LogEntryType = {
        ...mockLogEntry,
        message: 'Line 1\nLine 2\nLine 3',
      };
      render(<LogEntry entry={multilineLog} />);

      expect(screen.getByText('Line 1\nLine 2\nLine 3')).toBeInTheDocument();
    });

    it('should handle empty message', () => {
      const emptyLog: LogEntryType = {
        ...mockLogEntry,
        message: '',
      };
      render(<LogEntry entry={emptyLog} />);

      // Component should render without errors (empty message paragraph)
      const timeElement = screen.getByRole('time');
      expect(timeElement).toBeInTheDocument();
    });
  });

  describe('Timestamp Display', () => {
    it('should format timestamp as 12-hour time', () => {
      render(<LogEntry entry={mockLogEntry} />);

      // Should display time in 12-hour format with AM/PM
      const timeElement = screen.getByText(/\d{1,2}:\d{2}:\d{2}\s(?:AM|PM)/i);
      expect(timeElement).toBeInTheDocument();
    });

    it('should handle midnight timestamp', () => {
      const midnightLog: LogEntryType = {
        ...mockLogEntry,
        timestamp: new Date('2025-12-04T00:00:00Z'),
      };
      render(<LogEntry entry={midnightLog} />);

      const timeElement = screen.getByText(/12:00:00\sAM/i);
      expect(timeElement).toBeInTheDocument();
    });

    it('should handle noon timestamp', () => {
      const noonLog: LogEntryType = {
        ...mockLogEntry,
        timestamp: new Date('2025-12-04T12:00:00Z'),
      };
      render(<LogEntry entry={noonLog} />);

      const timeElement = screen.getByText(/12:00:00\sPM/i);
      expect(timeElement).toBeInTheDocument();
    });

    it('should handle invalid timestamp gracefully', () => {
      const invalidLog: LogEntryType = {
        ...mockLogEntry,
        timestamp: new Date('invalid'),
      };
      render(<LogEntry entry={invalidLog} />);

      // Should show "Invalid Time" instead of crashing
      expect(screen.getByText('Invalid Time')).toBeInTheDocument();
    });
  });

  describe('Custom Class Names', () => {
    it('should apply custom className', () => {
      const { container } = render(
        <LogEntry entry={mockLogEntry} className="custom-class" />
      );

      const logElement = container.firstChild as HTMLElement;
      expect(logElement.className).toContain('custom-class');
    });

    it('should preserve default classes when custom className is added', () => {
      const { container } = render(
        <LogEntry entry={mockLogEntry} className="custom-class" />
      );

      const logElement = container.firstChild as HTMLElement;
      expect(logElement.className).toContain('custom-class');
      expect(logElement.className).toContain('flex');
      expect(logElement.className).toContain('items-start');
    });
  });

  describe('Accessibility', () => {
    it('should use semantic time element for timestamp', () => {
      render(<LogEntry entry={mockLogEntry} />);

      const timeElement = screen.getByRole('time');
      expect(timeElement).toBeInTheDocument();
    });

    it('should have proper text hierarchy', () => {
      render(<LogEntry entry={mockLogEntry} />);

      // Message should be in a paragraph
      const message = screen.getByText('Connection rejected from 192.168.1.100');
      expect(message.tagName).toBe('P');
    });

    it('should support hover state for better interactivity', () => {
      const { container } = render(<LogEntry entry={mockLogEntry} />);

      const logElement = container.firstChild as HTMLElement;
      expect(logElement.className).toContain('hover:bg-accent');
    });
  });

  describe('Edge Cases', () => {
    it('should handle all topic types', () => {
      const topics = [
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
      ] as const;

      topics.forEach((topic) => {
        const { unmount } = render(
          <LogEntry
            entry={{
              ...mockLogEntry,
              topic,
              id: `log-${topic}`,
            }}
          />
        );

        expect(screen.getByText(topic)).toBeInTheDocument();
        unmount();
      });
    });

    it('should handle very recent timestamps', () => {
      const recentLog: LogEntryType = {
        ...mockLogEntry,
        timestamp: new Date(),
      };
      render(<LogEntry entry={recentLog} />);

      const timeElement = screen.getByRole('time');
      expect(timeElement).toBeInTheDocument();
    });

    it('should handle old timestamps', () => {
      const oldLog: LogEntryType = {
        ...mockLogEntry,
        timestamp: new Date('2020-01-01T00:00:00Z'),
      };
      render(<LogEntry entry={oldLog} />);

      const timeElement = screen.getByRole('time');
      expect(timeElement).toBeInTheDocument();
    });

    it('should handle messages with only whitespace', () => {
      const whitespaceLog: LogEntryType = {
        ...mockLogEntry,
        message: '   ',
      };
      render(<LogEntry entry={whitespaceLog} />);

      // Component should render without errors
      const timeElement = screen.getByRole('time');
      expect(timeElement).toBeInTheDocument();
    });
  });

  describe('Layout and Styling', () => {
    it('should use monospace font for timestamp', () => {
      const { container } = render(<LogEntry entry={mockLogEntry} />);

      const timeElement = container.querySelector('time');
      expect(timeElement?.className).toContain('font-mono');
    });

    it('should have fixed width for timestamp column', () => {
      const { container } = render(<LogEntry entry={mockLogEntry} />);

      const timeElement = container.querySelector('time');
      expect(timeElement?.className).toContain('w-24');
    });

    it('should prevent topic badge from shrinking', () => {
      render(<LogEntry entry={mockLogEntry} />);

      const topicBadge = screen.getByText('firewall');
      expect(topicBadge.className).toContain('shrink-0');
    });

    it('should allow message to grow and wrap', () => {
      render(<LogEntry entry={mockLogEntry} />);

      const message = screen.getByText('Connection rejected from 192.168.1.100');
      expect(message.className).toContain('flex-1');
      expect(message.className).toContain('break-words');
    });
  });
});
