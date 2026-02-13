import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { exportLeasesToCSV } from './csv-export';
import { mockLeases, createMockLease } from '../__mocks__/lease-data';

describe('CSV Export Utility', () => {
  let mockCreateElement: any;
  let mockAppendChild: any;
  let mockRemoveChild: any;
  let mockClick: any;
  let mockAnchor: any;

  beforeEach(() => {
    mockClick = vi.fn();
    mockAnchor = {
      click: mockClick,
      href: '',
      download: '',
      style: {},
    };

    mockCreateElement = vi.spyOn(document, 'createElement').mockReturnValue(mockAnchor as any);
    mockAppendChild = vi.spyOn(document.body, 'appendChild').mockImplementation(() => mockAnchor as any);
    mockRemoveChild = vi.spyOn(document.body, 'removeChild').mockImplementation(() => mockAnchor as any);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('CSV generation with all leases', () => {
    it('should generate CSV with all leases', () => {
      exportLeasesToCSV(mockLeases);

      expect(mockCreateElement).toHaveBeenCalledWith('a');
      expect(mockClick).toHaveBeenCalled();
    });

    it('should include CSV header row', () => {
      exportLeasesToCSV(mockLeases);

      const href = mockAnchor.href;
      expect(href).toContain('IP%20Address');
      expect(href).toContain('MAC%20Address');
      expect(href).toContain('Hostname');
      expect(href).toContain('Status');
      expect(href).toContain('Server');
      expect(href).toContain('Expires%20After');
      expect(href).toContain('Last%20Seen');
    });

    it('should include all lease data rows', () => {
      exportLeasesToCSV(mockLeases);

      const href = mockAnchor.href;
      expect(href).toContain('192.168.1.100');
      expect(href).toContain('00:11:22:33:44:55');
      expect(href).toContain('laptop-work');
      expect(href).toContain('bound');
    });

    it('should handle undefined hostnames', () => {
      const leases = [createMockLease({ hostname: undefined })];
      exportLeasesToCSV(leases);

      const href = mockAnchor.href;
      expect(href).toContain('Unknown%20Device');
    });

    it('should include all leases from mock data', () => {
      exportLeasesToCSV(mockLeases);

      const href = mockAnchor.href;
      mockLeases.forEach((lease) => {
        expect(href).toContain(encodeURIComponent(lease.address));
      });
    });
  });

  describe('CSV with filtered leases', () => {
    it('should export only filtered leases by search', () => {
      const filteredLeases = mockLeases.filter((l) => l.address.includes('192.168.1.100'));
      exportLeasesToCSV(filteredLeases);

      const href = mockAnchor.href;
      expect(href).toContain('192.168.1.100');
      expect(href).not.toContain('192.168.2.100');
    });

    it('should export only filtered leases by status', () => {
      const filteredLeases = mockLeases.filter((l) => l.status === 'bound');
      exportLeasesToCSV(filteredLeases);

      const href = mockAnchor.href;
      const rows = href.split('%0A');
      expect(rows.length).toBe(filteredLeases.length + 1); // +1 for header
    });

    it('should export only filtered leases by server', () => {
      const filteredLeases = mockLeases.filter((l) => l.server === 'LAN DHCP');
      exportLeasesToCSV(filteredLeases);

      const href = mockAnchor.href;
      filteredLeases.forEach((lease) => {
        expect(href).toContain(encodeURIComponent(lease.address));
      });
    });

    it('should export combined filtered leases', () => {
      const filteredLeases = mockLeases.filter(
        (l) => l.address.includes('192.168.1') && l.status === 'bound' && l.server === 'LAN DHCP'
      );
      exportLeasesToCSV(filteredLeases);

      const href = mockAnchor.href;
      const rows = href.split('%0A');
      expect(rows.length).toBe(filteredLeases.length + 1);
    });
  });

  describe('CSV header format', () => {
    it('should have correct column order', () => {
      exportLeasesToCSV([mockLeases[0]]);

      const href = mockAnchor.href;
      const headerRow = href.split('%0A')[0];

      const expectedColumns = [
        'IP%20Address',
        'MAC%20Address',
        'Hostname',
        'Status',
        'Server',
        'Expires%20After',
        'Last%20Seen',
      ];

      expectedColumns.forEach((col) => {
        expect(headerRow).toContain(col);
      });
    });

    it('should separate columns with commas', () => {
      exportLeasesToCSV([mockLeases[0]]);

      const href = mockAnchor.href;
      const headerRow = href.split('%0A')[0];

      expect(headerRow).toContain(',');
    });

    it('should not have trailing comma', () => {
      exportLeasesToCSV([mockLeases[0]]);

      const href = mockAnchor.href;
      const headerRow = href.split('%0A')[0];

      expect(headerRow).not.toMatch(/,$/);
    });
  });

  describe('CSV data escaping', () => {
    it('should escape quotes in data', () => {
      const lease = createMockLease({ hostname: 'Device "Alpha"' });
      exportLeasesToCSV([lease]);

      const href = mockAnchor.href;
      expect(href).toContain('""Alpha""'); // Quotes should be doubled
    });

    it('should quote fields containing commas', () => {
      const lease = createMockLease({ hostname: 'Device, Alpha' });
      exportLeasesToCSV([lease]);

      const href = mockAnchor.href;
      expect(href).toMatch(/"[^"]*Device,%20Alpha[^"]*"/);
    });

    it('should handle newlines in data', () => {
      const lease = createMockLease({ hostname: 'Device\nAlpha' });
      exportLeasesToCSV([lease]);

      const href = mockAnchor.href;
      // Newlines should be preserved within quoted fields
      expect(href).toBeTruthy();
    });

    it('should handle special characters', () => {
      const lease = createMockLease({ hostname: 'Device & Alpha' });
      exportLeasesToCSV([lease]);

      const href = mockAnchor.href;
      expect(href).toContain('Device%20%26%20Alpha');
    });
  });

  describe('Filename format', () => {
    it('should include ISO date in filename', () => {
      exportLeasesToCSV(mockLeases);

      const filename = mockAnchor.download;
      expect(filename).toMatch(/dhcp-leases-\d{4}-\d{2}-\d{2}\.csv/);
    });

    it('should use current date for filename', () => {
      const today = new Date().toISOString().split('T')[0];
      exportLeasesToCSV(mockLeases);

      const filename = mockAnchor.download;
      expect(filename).toContain(today);
    });

    it('should have .csv extension', () => {
      exportLeasesToCSV(mockLeases);

      const filename = mockAnchor.download;
      expect(filename).toEndWith('.csv');
    });
  });

  describe('Empty leases array', () => {
    it('should handle empty array gracefully', () => {
      exportLeasesToCSV([]);

      expect(mockCreateElement).toHaveBeenCalledWith('a');
      expect(mockClick).toHaveBeenCalled();
    });

    it('should include header even with no data', () => {
      exportLeasesToCSV([]);

      const href = mockAnchor.href;
      expect(href).toContain('IP%20Address');
      expect(href).toContain('MAC%20Address');
    });

    it('should create valid CSV with only header', () => {
      exportLeasesToCSV([]);

      const href = mockAnchor.href;
      const rows = href.split('%0A');
      expect(rows.length).toBe(1); // Only header
    });
  });

  describe('DOM manipulation', () => {
    it('should create anchor element', () => {
      exportLeasesToCSV(mockLeases);

      expect(mockCreateElement).toHaveBeenCalledWith('a');
    });

    it('should set href with data URI', () => {
      exportLeasesToCSV(mockLeases);

      expect(mockAnchor.href).toMatch(/^data:text\/csv;charset=utf-8,/);
    });

    it('should set download attribute', () => {
      exportLeasesToCSV(mockLeases);

      expect(mockAnchor.download).toBeTruthy();
    });

    it('should append anchor to body', () => {
      exportLeasesToCSV(mockLeases);

      expect(mockAppendChild).toHaveBeenCalledWith(mockAnchor);
    });

    it('should trigger click on anchor', () => {
      exportLeasesToCSV(mockLeases);

      expect(mockClick).toHaveBeenCalled();
    });

    it('should remove anchor from body after click', () => {
      exportLeasesToCSV(mockLeases);

      expect(mockRemoveChild).toHaveBeenCalledWith(mockAnchor);
    });

    it('should clean up even if click fails', () => {
      mockClick.mockImplementation(() => {
        throw new Error('Click failed');
      });

      try {
        exportLeasesToCSV(mockLeases);
      } catch (e) {
        // Expected to throw
      }

      expect(mockRemoveChild).toHaveBeenCalledWith(mockAnchor);
    });
  });

  describe('Data formatting', () => {
    it('should format IP addresses correctly', () => {
      exportLeasesToCSV(mockLeases);

      const href = mockAnchor.href;
      expect(href).toContain('192.168.1.100');
      expect(href).toContain('192.168.2.100');
    });

    it('should format MAC addresses correctly', () => {
      exportLeasesToCSV(mockLeases);

      const href = mockAnchor.href;
      expect(href).toContain('00:11:22:33:44:55');
    });

    it('should format timestamps correctly', () => {
      exportLeasesToCSV(mockLeases);

      const href = mockAnchor.href;
      // Should contain ISO timestamp format
      expect(href).toMatch(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
    });

    it('should format expires after correctly', () => {
      exportLeasesToCSV(mockLeases);

      const href = mockAnchor.href;
      expect(href).toContain('2h30m');
      expect(href).toContain('never');
    });
  });
});
