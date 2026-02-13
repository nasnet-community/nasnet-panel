/**
 * AddressListEntryForm Component
 *
 * Form for creating address list entries with validation.
 * Supports IP addresses, CIDR notation, and IP ranges.
 *
 * Layer 3 Domain Component - Uses Apollo Client hooks for data operations
 *
 * @module @nasnet/features/firewall/components
 */

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import { Button } from '@nasnet/ui/primitives';
import { Input } from '@nasnet/ui/primitives';
import { Label } from '@nasnet/ui/primitives';
import { Textarea } from '@nasnet/ui/primitives';
import { Select } from '@nasnet/ui/primitives';
import { IPInput } from '@nasnet/ui/patterns';

import { addressListEntrySchema } from '../schemas/addressListSchemas';
import type { AddressListEntryFormData } from '../schemas/addressListSchemas';

// ============================================
// TYPES
// ============================================

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

// ============================================
// COMPONENT
// ============================================

/**
 * Form for creating address list entries
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
export function AddressListEntryForm({
  existingLists = [],
  defaultList,
  onSubmit,
  onCancel,
  isLoading = false,
  className,
}: AddressListEntryFormProps) {
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

  // Auto-detect address format from input
  useEffect(() => {
    if (!watchedAddress) {
      setAddressFormat('ip');
      return;
    }

    if (watchedAddress.includes('/')) {
      setAddressFormat('cidr');
    } else if (watchedAddress.includes('-')) {
      setAddressFormat('range');
    } else {
      setAddressFormat('ip');
    }
  }, [watchedAddress]);

  const handleFormSubmit = async (data: AddressListEntryFormData) => {
    try {
      await onSubmit(data);
      reset(); // Reset form after successful submission
    } catch (error) {
      // Error handling is done by the parent component
      console.error('Form submission error:', error);
    }
  };

  const listOptions = showCreateNewList
    ? []
    : existingLists.map((list) => ({ value: list, label: list }));

  return (
    <form
      onSubmit={handleSubmit(handleFormSubmit)}
      className={className}
      noValidate
    >
      <div className="space-y-4">
        {/* List Selection */}
        <div className="space-y-2">
          <Label htmlFor="list" className="text-sm font-medium">
            List Name <span className="text-destructive">*</span>
          </Label>

          {showCreateNewList ? (
            <div className="space-y-2">
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
            <div className="space-y-2">
              {existingLists.length > 0 ? (
                <Select
                  id="list"
                  {...register('list')}
                  disabled={isLoading || isSubmitting}
                  aria-invalid={!!errors.list}
                  aria-describedby={errors.list ? 'list-error' : undefined}
                >
                  <option value="">Select a list...</option>
                  {existingLists.map((list) => (
                    <option key={list} value={list}>
                      {list}
                    </option>
                  ))}
                </Select>
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
            <p id="list-error" className="text-sm text-destructive">
              {errors.list.message}
            </p>
          )}
        </div>

        {/* Address Input */}
        <div className="space-y-2">
          <Label htmlFor="address" className="text-sm font-medium">
            Address <span className="text-destructive">*</span>
          </Label>

          <div className="space-y-1">
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
              <span className="font-mono font-semibold">
                {addressFormat === 'ip' && 'Single IP'}
                {addressFormat === 'cidr' && 'CIDR Subnet'}
                {addressFormat === 'range' && 'IP Range'}
              </span>
            </div>
          </div>

          {errors.address ? (
            <p id="address-error" className="text-sm text-destructive">
              {errors.address.message}
            </p>
          ) : (
            <p id="address-help" className="text-xs text-muted-foreground">
              Enter IP address, CIDR notation (e.g., 192.168.1.0/24), or range (e.g., 192.168.1.1-192.168.1.100)
            </p>
          )}
        </div>

        {/* Timeout Field */}
        <div className="space-y-2">
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
            <p id="timeout-error" className="text-sm text-destructive">
              {errors.timeout.message}
            </p>
          ) : (
            <p id="timeout-help" className="text-xs text-muted-foreground">
              Duration after which entry is removed (e.g., &quot;1d&quot; = 1 day, &quot;12h&quot; = 12 hours, &quot;30m&quot; = 30 minutes)
            </p>
          )}
        </div>

        {/* Comment Field */}
        <div className="space-y-2">
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
            maxLength={200}
          />

          {errors.comment && (
            <p id="comment-error" className="text-sm text-destructive">
              {errors.comment.message}
            </p>
          )}

          <p className="text-xs text-muted-foreground text-right">
            {watch('comment')?.length || 0} / 200 characters
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-2 pt-4">
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
            className="bg-category-firewall hover:bg-category-firewall/90"
          >
            {isSubmitting || isLoading ? 'Adding...' : 'Add Entry'}
          </Button>
        </div>
      </div>
    </form>
  );
}
