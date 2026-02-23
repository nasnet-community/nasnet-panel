/**
 * DNS Lookup Tool - Error Display Component
 *
 * Displays DNS lookup errors with user-friendly messages and actionable suggestions
 * based on the error type (NXDOMAIN, SERVFAIL, TIMEOUT, REFUSED, NETWORK_ERROR).
 *
 * @see Story NAS-5.9 - Implement DNS Lookup Tool - Task 5.9.8
 */

import { memo } from 'react';
import { Alert, AlertDescription, cn } from '@nasnet/ui/primitives';
import type { DnsLookupResult } from './DnsLookupTool.types';
import { getErrorMessage } from './dnsLookup.utils';

export interface DnsErrorProps {
  result: DnsLookupResult;
  className?: string;
}

export const DnsError = memo(function DnsError({ result, className }: DnsErrorProps) {
  const errorMessage = result.error || getErrorMessage(result.status);

  // Get specific suggestion based on error status
  const getSuggestion = () => {
    switch (result.status) {
      case 'NXDOMAIN':
        return 'Double-check the spelling or verify that the domain is registered.';
      case 'SERVFAIL':
        return 'Try again in a moment or select a different DNS server.';
      case 'TIMEOUT':
        return 'Increase the timeout value or try a different DNS server.';
      case 'REFUSED':
        return 'The DNS server may have query restrictions configured.';
      case 'NETWORK_ERROR':
        return 'Check router connectivity and network configuration.';
      default:
        return 'Please try again or check your configuration.';
    }
  };

  // Get icon based on error type
  const getIcon = () => {
    switch (result.status) {
      case 'NXDOMAIN':
        return '❌';
      case 'SERVFAIL':
        return '⚠️';
      case 'TIMEOUT':
        return '⏱️';
      case 'REFUSED':
        return '🚫';
      case 'NETWORK_ERROR':
        return '🌐';
      default:
        return '⚠️';
    }
  };

  return (
    <div className={cn('space-y-4', className)}>
      <Alert variant="destructive" role="alert" aria-live="assertive">
        <div className="flex items-start gap-3">
          <span className="text-2xl flex-shrink-0" aria-hidden="true">
            {getIcon()}
          </span>
          <div className="flex-1 space-y-2">
            <AlertDescription className="font-medium">{errorMessage}</AlertDescription>
            <p className="text-sm opacity-90">{getSuggestion()}</p>
          </div>
        </div>
      </Alert>

      {/* Query Details */}
      <div className="p-4 bg-muted/50 rounded-lg space-y-2">
        <h4 className="text-sm font-semibold">Query Details</h4>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div>
            <span className="text-muted-foreground">Hostname:</span>
            <span className="ml-2 font-mono">{result.hostname}</span>
          </div>
          <div>
            <span className="text-muted-foreground">Record Type:</span>
            <span className="ml-2 font-mono">{result.recordType}</span>
          </div>
          <div>
            <span className="text-muted-foreground">Server:</span>
            <span className="ml-2 font-mono">{result.server}</span>
          </div>
          <div>
            <span className="text-muted-foreground">Status:</span>
            <span className="ml-2 font-mono text-error">{result.status}</span>
          </div>
        </div>
      </div>
    </div>
  );
});

DnsError.displayName = 'DnsError';
