/**
 * DNS Lookup Tool - Utility Functions Tests
 *
 * Unit tests for DNS lookup utility functions covering formatting,
 * sorting, and error message generation.
 *
 * @see Story NAS-5.9 - Implement DNS Lookup Tool - Task 5.9.1
 */

import { describe, it, expect } from 'vitest';
import {
  formatRecordValue,
  formatTTL,
  sortRecordsByPriority,
  getRecordTypeDescription,
  getErrorMessage,
  isErrorStatus,
} from './dnsLookup.utils';
import type { DnsRecord, DnsLookupStatus } from './DnsLookupTool.types';

describe('formatRecordValue', () => {
  it('should format A record', () => {
    const record: DnsRecord = {
      name: 'example.com',
      type: 'A',
      ttl: 300,
      data: '93.184.216.34',
    };
    expect(formatRecordValue(record)).toBe('93.184.216.34');
  });

  it('should format AAAA record', () => {
    const record: DnsRecord = {
      name: 'example.com',
      type: 'AAAA',
      ttl: 300,
      data: '2606:2800:220:1:248:1893:25c8:1946',
    };
    expect(formatRecordValue(record)).toBe('2606:2800:220:1:248:1893:25c8:1946');
  });

  it('should format MX record with priority', () => {
    const record: DnsRecord = {
      name: 'gmail.com',
      type: 'MX',
      ttl: 3600,
      data: 'gmail-smtp-in.l.google.com',
      priority: 5,
    };
    expect(formatRecordValue(record)).toBe('5 gmail-smtp-in.l.google.com');
  });

  it('should format TXT record with quotes', () => {
    const record: DnsRecord = {
      name: 'example.com',
      type: 'TXT',
      ttl: 300,
      data: 'v=spf1 include:_spf.google.com ~all',
    };
    expect(formatRecordValue(record)).toBe('"v=spf1 include:_spf.google.com ~all"');
  });

  it('should format CNAME record', () => {
    const record: DnsRecord = {
      name: 'www.example.com',
      type: 'CNAME',
      ttl: 300,
      data: 'example.com',
    };
    expect(formatRecordValue(record)).toBe('example.com');
  });

  it('should format NS record', () => {
    const record: DnsRecord = {
      name: 'example.com',
      type: 'NS',
      ttl: 86400,
      data: 'ns1.example.com',
    };
    expect(formatRecordValue(record)).toBe('ns1.example.com');
  });

  it('should format PTR record', () => {
    const record: DnsRecord = {
      name: '34.216.184.93.in-addr.arpa',
      type: 'PTR',
      ttl: 3600,
      data: 'example.com',
    };
    expect(formatRecordValue(record)).toBe('example.com');
  });

  it('should format SOA record', () => {
    const record: DnsRecord = {
      name: 'example.com',
      type: 'SOA',
      ttl: 3600,
      data: 'ns1.example.com admin.example.com 2024010101 3600 600 86400 300',
    };
    expect(formatRecordValue(record)).toBe(
      'ns1.example.com admin.example.com 2024010101 3600 600 86400 300'
    );
  });

  it('should format SRV record with priority, weight, and port', () => {
    const record: DnsRecord = {
      name: '_xmpp._tcp.example.com',
      type: 'SRV',
      ttl: 300,
      data: 'xmpp.example.com',
      priority: 5,
      weight: 0,
      port: 5222,
    };
    expect(formatRecordValue(record)).toBe('5 0 5222 xmpp.example.com');
  });
});

describe('formatTTL', () => {
  it('should format seconds', () => {
    expect(formatTTL(30)).toBe('30s');
    expect(formatTTL(59)).toBe('59s');
  });

  it('should format minutes', () => {
    expect(formatTTL(60)).toBe('1m');
    expect(formatTTL(300)).toBe('5m');
    expect(formatTTL(3599)).toBe('59m');
  });

  it('should format hours', () => {
    expect(formatTTL(3600)).toBe('1h');
    expect(formatTTL(7200)).toBe('2h');
    expect(formatTTL(86399)).toBe('23h');
  });

  it('should format days', () => {
    expect(formatTTL(86400)).toBe('1d');
    expect(formatTTL(172800)).toBe('2d');
    expect(formatTTL(604800)).toBe('7d');
  });
});

describe('sortRecordsByPriority', () => {
  it('should sort MX records by priority ascending', () => {
    const records: DnsRecord[] = [
      {
        name: 'gmail.com',
        type: 'MX',
        ttl: 3600,
        data: 'alt1.gmail-smtp-in.l.google.com',
        priority: 10,
      },
      {
        name: 'gmail.com',
        type: 'MX',
        ttl: 3600,
        data: 'gmail-smtp-in.l.google.com',
        priority: 5,
      },
      {
        name: 'gmail.com',
        type: 'MX',
        ttl: 3600,
        data: 'alt2.gmail-smtp-in.l.google.com',
        priority: 20,
      },
    ];

    const sorted = sortRecordsByPriority(records);

    expect(sorted[0].priority).toBe(5);
    expect(sorted[1].priority).toBe(10);
    expect(sorted[2].priority).toBe(20);
    expect(sorted[0].data).toBe('gmail-smtp-in.l.google.com');
  });

  it('should not modify order when priority is undefined', () => {
    const records: DnsRecord[] = [
      {
        name: 'example.com',
        type: 'A',
        ttl: 300,
        data: '93.184.216.34',
      },
      {
        name: 'example.com',
        type: 'A',
        ttl: 300,
        data: '93.184.216.35',
      },
    ];

    const sorted = sortRecordsByPriority(records);

    expect(sorted[0].data).toBe('93.184.216.34');
    expect(sorted[1].data).toBe('93.184.216.35');
  });

  it('should not mutate original array', () => {
    const records: DnsRecord[] = [
      {
        name: 'test.com',
        type: 'MX',
        ttl: 3600,
        data: 'mx2.test.com',
        priority: 20,
      },
      {
        name: 'test.com',
        type: 'MX',
        ttl: 3600,
        data: 'mx1.test.com',
        priority: 10,
      },
    ];

    const originalFirst = records[0];
    sortRecordsByPriority(records);

    expect(records[0]).toBe(originalFirst);
    expect(records[0].priority).toBe(20);
  });
});

describe('getRecordTypeDescription', () => {
  it('should return correct descriptions for all record types', () => {
    expect(getRecordTypeDescription('A')).toBe('IPv4 Address');
    expect(getRecordTypeDescription('AAAA')).toBe('IPv6 Address');
    expect(getRecordTypeDescription('MX')).toBe('Mail Exchange');
    expect(getRecordTypeDescription('TXT')).toBe('Text Record');
    expect(getRecordTypeDescription('CNAME')).toBe('Canonical Name (Alias)');
    expect(getRecordTypeDescription('NS')).toBe('Name Server');
    expect(getRecordTypeDescription('PTR')).toBe('Pointer (Reverse DNS)');
    expect(getRecordTypeDescription('SOA')).toBe('Start of Authority');
    expect(getRecordTypeDescription('SRV')).toBe('Service Record');
  });

  it('should return record type as fallback for unknown types', () => {
    expect(getRecordTypeDescription('UNKNOWN' as any)).toBe('UNKNOWN');
  });
});

describe('getErrorMessage', () => {
  it('should return correct error messages for all status types', () => {
    expect(getErrorMessage('NXDOMAIN')).toBe(
      'Domain does not exist. Check spelling or verify the domain is registered.'
    );
    expect(getErrorMessage('SERVFAIL')).toBe(
      'DNS server failed to resolve. The server may be experiencing issues.'
    );
    expect(getErrorMessage('TIMEOUT')).toBe(
      'Query timed out. Try a different DNS server or increase timeout.'
    );
    expect(getErrorMessage('REFUSED')).toBe(
      'Query refused by server. The DNS server may not allow this query.'
    );
    expect(getErrorMessage('NETWORK_ERROR')).toBe(
      'Cannot reach DNS server. Check network connectivity.'
    );
    expect(getErrorMessage('SUCCESS')).toBe('Unknown error occurred.');
  });
});

describe('isErrorStatus', () => {
  it('should return false for SUCCESS status', () => {
    expect(isErrorStatus('SUCCESS')).toBe(false);
  });

  it('should return true for all error statuses', () => {
    const errorStatuses: DnsLookupStatus[] = [
      'NXDOMAIN',
      'SERVFAIL',
      'TIMEOUT',
      'REFUSED',
      'NETWORK_ERROR',
    ];

    errorStatuses.forEach((status) => {
      expect(isErrorStatus(status)).toBe(true);
    });
  });
});
