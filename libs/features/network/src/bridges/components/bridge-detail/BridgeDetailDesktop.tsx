import { memo } from 'react';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  Alert,
  AlertDescription,
  Skeleton,
} from '@nasnet/ui/primitives';
import { AlertCircle } from 'lucide-react';
import type { Bridge } from '@nasnet/api-client/generated';
import { BridgeForm, type BridgeFormData } from './bridge-form';

export interface BridgeDetailDesktopProps {
  bridge: Bridge | null | undefined;
  loading: boolean;
  error: Error | null;
  open: boolean;
  onClose: () => void;
  onSubmit: (data: BridgeFormData) => Promise<void>;
  isSubmitting: boolean;
}

export const BridgeDetailDesktop = memo(function BridgeDetailDesktop({
  bridge,
  loading,
  error,
  open,
  onClose,
  onSubmit,
  isSubmitting,
}: BridgeDetailDesktopProps) {
  const isCreating = bridge === null;

  return (
    <Sheet
      open={open}
      onOpenChange={(isOpen) => !isOpen && onClose()}
    >
      <SheetContent className="overflow-y-auto sm:max-w-xl">
        <SheetHeader>
          <SheetTitle>{isCreating ? 'Create Bridge' : `Bridge: ${bridge?.name}`}</SheetTitle>
          <SheetDescription>
            {isCreating ?
              'Create a new bridge to connect multiple interfaces'
            : 'View and edit bridge configuration'}
          </SheetDescription>
        </SheetHeader>

        <div className="mt-component-lg">
          {/* Loading State */}
          {loading && !isCreating && (
            <div className="space-y-component-md">
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
              <AlertDescription>Failed to load bridge: {error.message}</AlertDescription>
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
      </SheetContent>
    </Sheet>
  );
});
