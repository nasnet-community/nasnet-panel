/**
 * AddressListEntryForm Component
 * @description Form for creating firewall address list entries with validation
 *
 * Features:
 * - IP address, CIDR notation, and IP range support
 * - Auto-detect address format from input
 * - Existing list dropdown or create new list option
 * - Optional timeout field (duration format: 1d, 12h, 30m)
 * - Optional comment field with character counter
 * - React Hook Form + Zod validation
 * - Professional error messages and field help text
 * - Accessible form with aria-labels and error descriptions
 */

import { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { cn } from '@nasnet/ui/utils';

import {
  Button,
  Input,
  Label,
  Textarea,
} from '@nasnet/ui/primitives';

import { addressListEntrySchema } from '../schemas/addressListSchemas';
import type { AddressListEntryFormData } from '../schemas/addressListSchemas';

// ============================================================================
// Constants
// ============================================================================

const MAX_COMMENT_LENGTH = 200;
const ADDRESS_FORMAT_OPTIONS = {
  IP: 'ip' as const,
  CIDR: 'cidr' as const,
  RANGE: 'range' as const,
};

export interface AddressListEntryFormProps {
  /** Existing address lists for autocomplete */
  existingLists?: string[];
  /** Default list name to pre-select */
  defaultList?: string;
  /** Callback when form is submitted successfully */
  onSubmit: (data: AddressListEntryFormData) => void | Promise<void>;
  /** Callback when form is cancelled */
  onCancel?: () => void;
  /** Whether the form is in loading state */
  isLoading?: boolean;
  /** Optional className for styling */
  className?: string;
}

/**
 * AddressListEntryForm Component
 * @description Form for creating firewall address list entries
 *
 * @example
 * ```tsx
 * <AddressListEntryForm
 *   existingLists={['blocklist', 'allowlist']}
 *   onSubmit={handleCreate}
 *   onCancel={handleCancel}
 * />
 * ```
 */
export const AddressListEntryForm = ({
  existingLists = [],
  defaultList,
  onSubmit,
  onCancel,
  isLoading = false,
  className,
}: AddressListEntryFormProps) => {
  const [addressFormat, setAddressFormat] = useState<'ip' | 'cidr' | 'range'>('ip');
  const [showCreateNewList, setShowCreateNewList] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    watch,
    setValue,
    reset,
  } = useForm<AddressListEntryFormData>({
    resolver: zodResolver(addressListEntrySchema),
    defaultValues: {
      list: defaultList || '',
      address: '',
      comment: '',
      timeout: '',
    },
  });

  const watchedAddress = watch('address');

  useEffect(() => {
    if (!watchedAddress) {
      setAddressFormat(ADDRESS_FORMAT_OPTIONS.IP);
      return;
    }

    if (watchedAddress.includes('/')) {
      setAddressFormat(ADDRESS_FORMAT_OPTIONS.CIDR);
    } else if (watchedAddress.includes('-')) {
      setAddressFormat(ADDRESS_FORMAT_OPTIONS.RANGE);
    } else {
      setAddressFormat(ADDRESS_FORMAT_OPTIONS.IP);
    }
  }, [watchedAddress]);

  const handleFormSubmit = useCallback(async (data: AddressListEntryFormData) => {
    try {
      await onSubmit(data);
      reset();
    } catch (error) {
      console.error('Form submission error:', error);
    }
  }, [onSubmit, reset]);

  const listOptions = showCreateNewList
    ? []
    : existingLists.map((list) => ({ value: list, label: list }));

  return (
    <form
      onSubmit={handleSubmit(handleFormSubmit)}
      className={cn(className)}
      noValidate
    >
      <div className="space-y-component-md">
        {/* List Selection */}
        <div className="space-y-component-sm">
          <Label htmlFor="list" className="text-sm font-medium">
            List Name <span className="text-error">*</span>
          </Label>

          {showCreateNewList ? (
            <div className="space-y-component-sm">
              <Input
                id="list"
                {...register('list')}
                placeholder="Enter new list name"
                disabled={isLoading || isSubmitting}
                aria-invalid={!!errors.list}
                aria-describedby={errors.list ? 'list-error' : undefined}
                className="font-mono"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setShowCreateNewList(false)}
                disabled={isLoading || isSubmitting}
                className="text-xs"
              >
                Choose existing list
              </Button>
            </div>
          ) : (
            <div className="space-y-component-sm">
              {existingLists.length > 0 ? (
                <select
                  id="list"
                  {...register('list')}
                  disabled={isLoading || isSubmitting}
                  aria-invalid={!!errors.list}
                  aria-describedby={errors.list ? 'list-error' : undefined}
                  className="flex h-10 w-full rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option value="">Select a list...</option>
                  {existingLists.map((list) => (
                    <option key={list} value={list}>
                      {list}
                    </option>
                  ))}
                </select>
              ) : (
                <Input
                  id="list"
                  {...register('list')}
                  placeholder="Enter new list name"
                  disabled={isLoading || isSubmitting}
                  aria-invalid={!!errors.list}
                  aria-describedby={errors.list ? 'list-error' : undefined}
                  className="font-mono"
                />
              )}
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setShowCreateNewList(true)}
                disabled={isLoading || isSubmitting}
                className="text-xs"
              >
                Create new list
              </Button>
            </div>
          )}

          {errors.list && (
            <p id="list-error" className="text-sm text-error">
              {errors.list.message}
            </p>
          )}
        </div>

        {/* Address Input */}
        <div className="space-y-component-sm">
          <Label htmlFor="address" className="text-sm font-medium">
            Address <span className="text-error">*</span>
          </Label>

          <div className="space-y-component-xs">
            <Input
              id="address"
              {...register('address')}
              placeholder="192.168.1.100 or 192.168.1.0/24 or 192.168.1.1-192.168.1.100"
              disabled={isLoading || isSubmitting}
              aria-invalid={!!errors.address}
              aria-describedby={errors.address ? 'address-error' : 'address-help'}
              className="font-mono"
            />

            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span>Format detected:</span>
              <span className="font-mono font-semibold text-foreground">
                {addressFormat === ADDRESS_FORMAT_OPTIONS.IP && 'Single IP'}
                {addressFormat === ADDRESS_FORMAT_OPTIONS.CIDR && 'CIDR Subnet'}
                {addressFormat === ADDRESS_FORMAT_OPTIONS.RANGE && 'IP Range'}
              </span>
            </div>
          </div>

          {errors.address ? (
            <p id="address-error" className="text-sm text-error">
              {errors.address.message}
            </p>
          ) : (
            <p id="address-help" className="text-xs text-muted-foreground">
              Enter IP address, CIDR notation (e.g., 192.168.1.0/24), or range (e.g., 192.168.1.1-192.168.1.100)
            </p>
          )}
        </div>

        {/* Timeout Field */}
        <div className="space-y-component-sm">
          <Label htmlFor="timeout" className="text-sm font-medium">
            Timeout (optional)
          </Label>

          <Input
            id="timeout"
            {...register('timeout')}
            placeholder="1d, 12h, 30m"
            disabled={isLoading || isSubmitting}
            aria-invalid={!!errors.timeout}
            aria-describedby={errors.timeout ? 'timeout-error' : 'timeout-help'}
            className="font-mono"
          />

          {errors.timeout ? (
            <p id="timeout-error" className="text-sm text-error">
              {errors.timeout.message}
            </p>
          ) : (
            <p id="timeout-help" className="text-xs text-muted-foreground">
              Duration after which entry is removed (e.g., &quot;1d&quot; = 1 day, &quot;12h&quot; = 12 hours, &quot;30m&quot; = 30 minutes)
            </p>
          )}
        </div>

        {/* Comment Field */}
        <div className="space-y-component-sm">
          <Label htmlFor="comment" className="text-sm font-medium">
            Comment (optional)
          </Label>

          <Textarea
            id="comment"
            {...register('comment')}
            placeholder="Description or note"
            disabled={isLoading || isSubmitting}
            aria-invalid={!!errors.comment}
            aria-describedby={errors.comment ? 'comment-error' : undefined}
            rows={3}
            maxLength={MAX_COMMENT_LENGTH}
          />

          {errors.comment && (
            <p id="comment-error" className="text-sm text-error">
              {errors.comment.message}
            </p>
          )}

          <p className="text-xs text-muted-foreground text-right">
            {watch('comment')?.length || 0} / {MAX_COMMENT_LENGTH} characters
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-component-sm pt-component-md">
          {onCancel && (
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isLoading || isSubmitting}
            >
              Cancel
            </Button>
          )}
          <Button
            type="submit"
            disabled={isLoading || isSubmitting}
          >
            {isSubmitting || isLoading ? 'Adding...' : 'Add Entry'}
          </Button>
        </div>
      </div>
    </form>
  );
};

AddressListEntryForm.displayName = 'AddressListEntryForm';
