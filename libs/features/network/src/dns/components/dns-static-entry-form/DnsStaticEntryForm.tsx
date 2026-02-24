/**
 * DNS Static Entry Form Component
 *
 * Form for creating/editing static DNS hostname-to-IP mappings.
 *
 * @description
 * React Hook Form + Zod-based form for managing static DNS entries with
 * RFC 1123 hostname validation, IPv4 address input, TTL configuration, and
 * duplicate hostname detection.
 *
 * Story: NAS-6.4 - Implement DNS Configuration
 */

import { useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Input,
  Label,
  Textarea,
  Button,
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from '@nasnet/ui/primitives';
import { IPInput } from '@nasnet/ui/patterns';
import {
  dnsStaticEntrySchema,
  type DNSStaticEntryFormValues,
} from '../../schemas';
import { isDuplicateHostname } from '../../utils';
import type { DNSStaticEntry } from '@nasnet/core/types';

/** Default TTL in seconds (1 day) */
const DEFAULT_TTL_SECONDS = 86400;

/**
 * DNS Static Entry Form Props
 */
export interface DnsStaticEntryFormProps {
  /** Initial values (for edit mode) */
  initialValues?: Partial<DNSStaticEntryFormValues>;
  /** Existing entries (for duplicate detection) */
  existingEntries: Array<{ id?: string; name: string }>;
  /** Current entry ID (when editing, to exclude from duplicate check) */
  currentEntryId?: string;
  /** Callback when form is submitted */
  onSubmit: (values: DNSStaticEntryFormValues) => void | Promise<void>;
  /** Callback to cancel form */
  onCancel: () => void;
  /** Whether submit operation is in progress */
  isLoading?: boolean;
  /** Form mode (create or edit) */
  mode?: 'create' | 'edit';
}

/**
 * DNS Static Entry Form
 *
 * Manages creation and editing of static DNS entries with validation.
 *
 * Features:
 * - RFC 1123 hostname validation
 * - IPv4 address input with IPInput component
 * - TTL configuration (0-7 days)
 * - Optional comment field
 * - Duplicate hostname detection
 *
 * @example
 * ```tsx
 * <DnsStaticEntryForm
 *   mode="create"
 *   existingEntries={entries}
 *   onSubmit={handleCreate}
 *   onCancel={handleCancel}
 * />
 * ```
 */
export function DnsStaticEntryForm({
  initialValues = {},
  existingEntries,
  currentEntryId,
  onSubmit,
  onCancel,
  isLoading = false,
  mode = 'create',
}: DnsStaticEntryFormProps) {
  const form = useForm({
    resolver: zodResolver(dnsStaticEntrySchema),
    defaultValues: {
      name: initialValues.name || '',
      address: initialValues.address || '',
      ttl: initialValues.ttl || DEFAULT_TTL_SECONDS,
      comment: initialValues.comment || '',
    },
  });

  // Custom validation for duplicate hostname (memoized)
  useEffect(() => {
    const subscription = form.watch((value, { name: fieldName }) => {
      if (fieldName === 'name' && value.name) {
        const isDuplicate = isDuplicateHostname(
          value.name,
          existingEntries,
          currentEntryId
        );

        if (isDuplicate) {
          form.setError('name', {
            type: 'manual',
            message: `Hostname "${value.name}" already exists`,
          });
        } else {
          form.clearErrors('name');
        }
      }
    });

    return () => subscription.unsubscribe();
  }, [form, existingEntries, currentEntryId]);

  // Memoized handlers
  const handleCancel = useCallback(() => {
    onCancel();
  }, [onCancel]);

  const handleSubmit = useCallback(
    (values: DNSStaticEntryFormValues) => {
      onSubmit(values);
    },
    [onSubmit]
  );

  const handleAddressChange = useCallback(
    (value: string) => {
      form.setValue('address', value);
    },
    [form]
  );

  return (
    <Card>
      <form onSubmit={form.handleSubmit(handleSubmit)}>
        <CardHeader>
          <CardTitle>
            {mode === 'create' ? 'Add Static DNS Entry' : 'Edit Static DNS Entry'}
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-component-md">
          {/* Hostname Field */}
          <div className="space-y-component-sm">
            <Label htmlFor="name" className="required font-display">
              Hostname
            </Label>
            <Input
              id="name"
              placeholder="nas.local"
              disabled={isLoading}
              className="font-mono"
              {...form.register('name')}
              aria-describedby="name-error name-help"
              aria-invalid={!!form.formState.errors.name}
            />
            {form.formState.errors.name && (
              <p id="name-error" className="text-sm text-error" role="alert">
                {form.formState.errors.name.message}
              </p>
            )}
            <p id="name-help" className="text-xs text-muted-foreground">
              RFC 1123 format: letters, digits, hyphens, dots (max 253 chars)
            </p>
          </div>

          {/* IP Address Field */}
          <div className="space-y-component-sm">
            <Label htmlFor="address" className="required font-display">
              IP Address
            </Label>
            <IPInput
              id="address"
              value={form.watch('address')}
              onChange={handleAddressChange}
              disabled={isLoading}
              placeholder="192.168.1.50"
              aria-describedby="address-error"
              aria-invalid={!!form.formState.errors.address}
            />
            {form.formState.errors.address && (
              <p
                id="address-error"
                className="text-sm text-error"
                role="alert"
              >
                {form.formState.errors.address.message}
              </p>
            )}
          </div>

          {/* TTL Field */}
          <div className="space-y-component-sm">
            <Label htmlFor="ttl" className="font-display">Time to Live (TTL)</Label>
            <Input
              id="ttl"
              type="number"
              min={0}
              max={604800}
              step={60}
              disabled={isLoading}
              className="font-mono"
              {...form.register('ttl', { valueAsNumber: true })}
              aria-describedby="ttl-error ttl-help"
              aria-invalid={!!form.formState.errors.ttl}
            />
            {form.formState.errors.ttl && (
              <p id="ttl-error" className="text-sm text-error" role="alert">
                {form.formState.errors.ttl.message}
              </p>
            )}
            <p id="ttl-help" className="text-xs text-muted-foreground">
              Seconds (0–604800). Default: 86400 (1 day). Common: 3600 (1 hour),
              86400 (1 day), 604800 (7 days)
            </p>
          </div>

          {/* Comment Field */}
          <div className="space-y-component-sm">
            <Label htmlFor="comment" className="font-display">Comment (Optional)</Label>
            <Textarea
              id="comment"
              placeholder="Network storage"
              rows={2}
              maxLength={255}
              disabled={isLoading}
              {...form.register('comment')}
              aria-describedby="comment-error comment-help"
              aria-invalid={!!form.formState.errors.comment}
            />
            {form.formState.errors.comment && (
              <p
                id="comment-error"
                className="text-sm text-error"
                role="alert"
              >
                {form.formState.errors.comment.message}
              </p>
            )}
            <p id="comment-help" className="text-xs text-muted-foreground">
              Optional description (max 255 characters)
            </p>
          </div>
        </CardContent>

        <CardFooter className="flex gap-component-sm justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={handleCancel}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={isLoading || !form.formState.isValid}
          >
            {isLoading
              ? 'Saving...'
              : mode === 'create'
                ? 'Create Entry'
                : 'Save Changes'}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
