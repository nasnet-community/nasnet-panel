import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@nasnet/ui/primitives';
import { Alert, AlertDescription } from '@nasnet/ui/primitives';
import { Skeleton } from '@nasnet/ui/primitives';
import { AlertCircle } from 'lucide-react';
import type { Bridge } from '@nasnet/api-client/generated';
import { BridgeForm, type BridgeFormData } from './bridge-form';

export interface BridgeDetailMobileProps {
  bridge: Bridge | null | undefined;
  loading: boolean;
  error: Error | null;
  open: boolean;
  onClose: () => void;
  onSubmit: (data: BridgeFormData) => Promise<void>;
  isSubmitting: boolean;
}

export function BridgeDetailMobile({
  bridge,
  loading,
  error,
  open,
  onClose,
  onSubmit,
  isSubmitting,
}: BridgeDetailMobileProps) {
  const isCreating = bridge === null;

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isCreating ? 'Create Bridge' : `Bridge: ${bridge?.name}`}
          </DialogTitle>
          <DialogDescription>
            {isCreating
              ? 'Create a new bridge to connect multiple interfaces'
              : 'View and edit bridge configuration'}
          </DialogDescription>
        </DialogHeader>

        <div className="mt-4">
          {/* Loading State */}
          {loading && !isCreating && (
            <div className="space-y-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          )}

          {/* Error State */}
          {error && !isCreating && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Failed to load bridge: {error.message}
              </AlertDescription>
            </Alert>
          )}

          {/* Form */}
          {(!loading || isCreating) && !error && (
            <BridgeForm
              bridge={bridge}
              onSubmit={onSubmit}
              onCancel={onClose}
              isSubmitting={isSubmitting}
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
