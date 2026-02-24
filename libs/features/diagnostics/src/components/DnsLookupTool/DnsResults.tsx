/**
 * DNS Lookup Tool - Results Display Component
 *
 * Displays DNS lookup results including query metadata, record table,
 * and expandable record details with copy functionality.
 *
 * @see Story NAS-5.9 - Implement DNS Lookup Tool - Task 5.9.6
 */

import { memo } from 'react';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  Badge,
  cn,
} from '@nasnet/ui/primitives';
import { CopyButton } from '@nasnet/ui/patterns';
import type { DnsLookupResult } from './DnsLookupTool.types';
import { formatRecordValue, formatTTL, sortRecordsByPriority } from './dnsLookup.utils';

export interface DnsResultsProps {
  result: DnsLookupResult;
  className?: string;
}

export const DnsResults = memo(function DnsResults({ result, className }: DnsResultsProps) {
  // Sort records by priority for MX and SRV types
  const sortedRecords =
    result.recordType === 'MX' || result.recordType === 'SRV'
      ? sortRecordsByPriority(result.records)
      : result.records;

  // Helper to get query time color
  const getQueryTimeColor = (queryTimeMs: number): string => {
    if (queryTimeMs < 50) return 'text-success';
    if (queryTimeMs < 200) return 'text-warning';
    return 'text-error';
  };

  return (
    <div className={cn('space-y-component-md', className)}>
      {/* Query Metadata Header */}
      <div className="flex flex-wrap items-center gap-component-sm pb-component-sm border-border border-b">
        <div className="flex items-center gap-component-sm">
          <span className="text-sm text-muted-foreground">Server:</span>
          <span className="text-sm font-mono">{result.server}</span>
        </div>
        <div className="flex items-center gap-component-sm">
          <span className="text-sm text-muted-foreground">Query Time:</span>
          <span className={cn('text-sm font-mono', getQueryTimeColor(result.queryTime))}>
            {result.queryTime}ms
          </span>
        </div>
        {result.authoritative && (
          <Badge variant="secondary" className="text-xs">
            Authoritative
          </Badge>
        )}
        <Badge variant="outline" className="text-xs">
          {result.recordType}
        </Badge>
      </div>

      {/* Results Table */}
      {sortedRecords.length > 0 ? (
        <Table aria-label="DNS lookup results">
          <TableHeader>
            <TableRow>
              <TableHead scope="col" className="font-mono font-display">Type</TableHead>
              <TableHead scope="col" className="font-mono font-display">Name</TableHead>
              <TableHead scope="col" className="font-mono font-display">Value</TableHead>
              <TableHead scope="col" className="font-mono font-display">TTL</TableHead>
              <TableHead scope="col" className="w-12">
                {/* Copy button column */}
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedRecords.map((record, index) => (
              <TableRow key={index}>
                <TableCell>
                  <Badge variant="outline" className="font-mono text-xs">
                    {record.type}
                  </Badge>
                </TableCell>
                <TableCell className="font-mono text-sm">{record.name}</TableCell>
                <TableCell className="font-mono text-sm">
                  {formatRecordValue(record)}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {formatTTL(record.ttl)}
                </TableCell>
                <TableCell>
                  <CopyButton value={record.data} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      ) : (
        <div className="flex items-center justify-center py-8 text-muted-foreground">
          <p>No records found</p>
        </div>
      )}

      {/* Record Count */}
      <div className="text-sm text-muted-foreground text-right font-mono">
        {sortedRecords.length} {sortedRecords.length === 1 ? 'record' : 'records'} found
      </div>
    </div>
  );
});

DnsResults.displayName = 'DnsResults';
