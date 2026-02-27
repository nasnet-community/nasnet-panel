/**
 * DNS Lookup Tool - Mobile Presenter
 *
 * Mobile layout with stacked form and expandable results.
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

export const DnsLookupToolMobile = memo(function DnsLookupToolMobile({
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
    <div className={cn('gap-component-md flex flex-col', className)}>
      {/* Form Card */}
      <Card>
        <CardHeader>
          <h2 className="font-display text-category-networking text-lg font-semibold">
            DNS Lookup
          </h2>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={handleSubmit(onSubmit)}
            className="space-y-component-md"
          >
            {/* Hostname Input */}
            <div className="space-y-component-sm">
              <Label htmlFor="dns-hostname-mobile">Hostname</Label>
              <Input
                id="dns-hostname-mobile"
                placeholder="e.g., google.com"
                {...register('hostname')}
                disabled={isLoading}
                className="min-h-[44px]"
              />
              {errors.hostname && (
                <p
                  className="text-error text-sm"
                  role="alert"
                >
                  {errors.hostname.message}
                </p>
              )}
            </div>

            {/* Record Type Select */}
            <div className="space-y-component-sm">
              <Label htmlFor="record-type-mobile">Record Type</Label>
              <Select
                value={recordType}
                onValueChange={(value) => setValue('recordType', value as any)}
                disabled={isLoading}
              >
                <SelectTrigger
                  id="record-type-mobile"
                  className="min-h-[44px]"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DNS_RECORD_TYPES.map((type) => (
                    <SelectItem
                      key={type}
                      value={type}
                      className="min-h-[44px]"
                    >
                      {type} - {getRecordTypeDescription(type)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* DNS Server Select */}
            <div className="space-y-component-sm">
              <Label htmlFor="dns-server-mobile">DNS Server</Label>
              <Select
                value={server || 'default'}
                onValueChange={(value) =>
                  setValue('server', value === 'default' ? undefined : value)
                }
                disabled={isLoading}
              >
                <SelectTrigger
                  id="dns-server-mobile"
                  className="min-h-[44px]"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem
                    value="default"
                    className="min-h-[44px]"
                  >
                    Default Server
                  </SelectItem>
                  {dnsServers.map((srv) => (
                    <SelectItem
                      key={srv.address}
                      value={srv.address}
                      className="min-h-[44px]"
                    >
                      {srv.address}
                      {srv.isPrimary && ' (Primary)'}
                    </SelectItem>
                  ))}
                  {dnsServers.length > 1 && (
                    <SelectItem
                      value="all"
                      className="min-h-[44px]"
                    >
                      All Servers
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>

            {/* Action Buttons */}
            <div className="gap-component-sm flex">
              <Button
                type="submit"
                disabled={!isValid || isLoading}
                className="focus-visible:ring-ring min-h-[44px] flex-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                aria-label="Run DNS lookup"
              >
                {isLoading ? 'Looking up...' : 'Lookup'}
              </Button>
              {(isSuccess || isError) && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleReset}
                  className="focus-visible:ring-ring min-h-[44px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                  aria-label="Clear results"
                >
                  Clear
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Results Card */}
      {(result || isLoading) && (
        <Card>
          <CardHeader>
            <h2 className="font-display text-category-networking text-lg font-semibold">Results</h2>
          </CardHeader>
          <CardContent>
            {isLoading && (
              <div
                className="flex items-center justify-center py-12"
                role="status"
                aria-label="Loading DNS results"
              >
                <div
                  className="border-primary h-8 w-8 animate-spin rounded-full border-b-2"
                  aria-hidden="true"
                />
              </div>
            )}

            {isError && result && <DnsError result={result} />}

            {isSuccess && comparisonResults.length > 1 && (
              <DnsServerComparison results={comparisonResults} />
            )}

            {isSuccess && comparisonResults.length <= 1 && result && <DnsResults result={result} />}
          </CardContent>
        </Card>
      )}
    </div>
  );
});

DnsLookupToolMobile.displayName = 'DnsLookupToolMobile';
