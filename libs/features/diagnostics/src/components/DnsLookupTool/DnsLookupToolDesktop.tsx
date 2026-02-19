/**
 * DNS Lookup Tool - Desktop Presenter
 *
 * Desktop layout with side-by-side form and results panel.
 * Follows Headless + Platform Presenter pattern (ADR-018).
 *
 * @see Story NAS-5.9 - Implement DNS Lookup Tool - Task 5.9.5
 */

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { memo } from 'react';
import {
  Button,
  Input,
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
  Label,
  Card,
  CardHeader,
  CardContent,
  cn,
} from '@nasnet/ui/primitives';
import { useDnsLookup } from './useDnsLookup';
import { dnsLookupFormSchema, type DnsLookupFormValues } from './dnsLookup.schema';
import { DNS_RECORD_TYPES } from './DnsLookupTool.types';
import { getRecordTypeDescription } from './dnsLookup.utils';
import { DnsResults } from './DnsResults';
import { DnsServerComparison } from './DnsServerComparison';
import { DnsError } from './DnsError';
import type { DnsLookupToolProps } from './DnsLookupTool';

export const DnsLookupToolDesktop = memo(function DnsLookupToolDesktop({
  deviceId,
  className,
}: DnsLookupToolProps) {
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isValid },
  } = useForm<DnsLookupFormValues>({
    resolver: zodResolver(dnsLookupFormSchema) as any,
    mode: 'onChange',
    defaultValues: {
      recordType: 'A',
      timeout: 2000,
    },
  });

  const {
    isLoading,
    isSuccess,
    isError,
    result,
    comparisonResults,
    dnsServers,
    lookup,
    lookupAll,
    reset,
  } = useDnsLookup({
    deviceId,
  });

  const recordType = watch('recordType');
  const server = watch('server');

  const onSubmit = async (values: DnsLookupFormValues) => {
    if (values.server === 'all') {
      await lookupAll(values);
    } else {
      await lookup(values);
    }
  };

  const handleReset = () => {
    reset();
  };

  return (
    <div className={cn('grid grid-cols-2 gap-6', className)}>
      {/* Left Panel: Form */}
      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold">DNS Lookup</h2>
          <p className="text-sm text-muted-foreground">
            Query DNS records from the router
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Hostname Input */}
            <div className="space-y-2">
              <Label htmlFor="dns-hostname">Hostname</Label>
              <Input
                id="dns-hostname"
                aria-describedby="dns-hostname-description"
                placeholder="Enter domain (e.g., google.com)"
                {...register('hostname')}
                disabled={isLoading}
              />
              {errors.hostname && (
                <p className="text-sm text-destructive" role="alert">
                  {errors.hostname.message}
                </p>
              )}
              <p id="dns-hostname-description" className="text-sm text-muted-foreground">
                Domain name or IP address for reverse lookup
              </p>
            </div>

            {/* Record Type Select */}
            <div className="space-y-2">
              <Label htmlFor="record-type">Record Type</Label>
              <Select
                value={recordType}
                onValueChange={(value) => setValue('recordType', value as any)}
                disabled={isLoading}
              >
                <SelectTrigger id="record-type" aria-describedby="record-type-description">
                  <SelectValue placeholder="Select record type" />
                </SelectTrigger>
                <SelectContent>
                  {DNS_RECORD_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type} - {getRecordTypeDescription(type)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p id="record-type-description" className="text-sm text-muted-foreground">
                Type of DNS record to query
              </p>
            </div>

            {/* DNS Server Select */}
            <div className="space-y-2">
              <Label htmlFor="dns-server">DNS Server</Label>
              <Select
                value={server || 'default'}
                onValueChange={(value) =>
                  setValue('server', value === 'default' ? undefined : value)
                }
                disabled={isLoading}
              >
                <SelectTrigger id="dns-server" aria-describedby="dns-server-description">
                  <SelectValue placeholder="Select DNS server" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="default">Default Server</SelectItem>
                  {dnsServers.map((srv) => (
                    <SelectItem key={srv.address} value={srv.address}>
                      {srv.address}
                      {srv.isPrimary && ' (Primary)'}
                      {srv.isSecondary && ' (Secondary)'}
                    </SelectItem>
                  ))}
                  {dnsServers.length > 1 && <SelectItem value="all">All Servers</SelectItem>}
                </SelectContent>
              </Select>
              <p id="dns-server-description" className="text-sm text-muted-foreground">
                DNS server to query (or compare all)
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2">
              <Button type="submit" disabled={!isValid || isLoading} className="flex-1" aria-label="Run DNS lookup">
                {isLoading ? 'Looking up...' : 'Lookup'}
              </Button>
              {(isSuccess || isError) && (
                <Button type="button" variant="outline" onClick={handleReset} aria-label="Clear results">
                  Clear
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Right Panel: Results */}
      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold">Results</h2>
        </CardHeader>
        <CardContent role="status" aria-label="DNS lookup results">
          {!result && !isLoading && (
            <div className="flex items-center justify-center h-64 text-muted-foreground">
              <p>Enter a hostname and click Lookup to see results</p>
            </div>
          )}

          {isLoading && (
            <div className="flex items-center justify-center h-64" role="status" aria-label="Loading DNS results">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
          )}

          {isError && result && <DnsError result={result} />}

          {isSuccess && comparisonResults.length > 1 && (
            <DnsServerComparison results={comparisonResults} />
          )}

          {isSuccess && comparisonResults.length <= 1 && result && (
            <DnsResults result={result} />
          )}
        </CardContent>
      </Card>
    </div>
  );
});

DnsLookupToolDesktop.displayName = 'DnsLookupToolDesktop';
