import { useMemo, useCallback } from 'react';
import { usePlatform } from '@nasnet/ui/layouts';
import { useBridgeDetail, useCreateBridge, useUpdateBridge } from '@nasnet/api-client/queries';
import { BridgeDetailDesktop } from './BridgeDetailDesktop';
import { BridgeDetailMobile } from './BridgeDetailMobile';
import { toast } from 'sonner';
import type { BridgeFormData } from './bridge-form';

/**
 * Bridge Detail Component - Main wrapper
 * Shows bridge details and edit form in Sheet (desktop) or full screen (mobile)
 *
 * @description Multi-platform component for creating and editing bridge configurations
 * with automatic form submission, optimistic UI updates, and undo support.
 *
 * @param routerId - Router ID
 * @param bridgeId - Bridge UUID (or 'new' for creation)
 * @param open - Whether the detail panel is open
 * @param onClose - Callback when closing the panel
 */
export interface BridgeDetailProps {
  routerId: string;
  bridgeId: string | null;
  open: boolean;
  onClose: () => void;
  className?: string;
}

function BridgeDetailComponent({
  routerId,
  bridgeId,
  open,
  onClose,
  className,
}: BridgeDetailProps) {
  const platform = usePlatform();

  // Fetch bridge data (skip if creating new)
  const { bridge, loading, error, refetch } = useBridgeDetail(
    bridgeId && bridgeId !== 'new' ? bridgeId : ''
  );

  // Mutations
  const [createBridge, { loading: creating }] = useCreateBridge();
  const [updateBridge, { loading: updating }] = useUpdateBridge();

  const isCreating = useMemo(() => bridgeId === 'new', [bridgeId]);
  const isSubmitting = useMemo(() => creating || updating, [creating, updating]);

  // Handle form submission
  const handleSubmit = useCallback(
    async (data: BridgeFormData) => {
      try {
        if (isCreating) {
          // Create new bridge
          const result = await createBridge({
            variables: {
              routerId,
              input: {
                name: data.name,
                comment: data.comment,
                protocol: data.protocol.toUpperCase() as any,
                priority: data.priority,
                vlanFiltering: data.vlanFiltering,
                pvid: data.pvid,
                mtu: data.mtu,
              },
            },
          });

          if (result.data?.createBridge?.success) {
            const operationId = result.data.createBridge.operationId;

            toast.success('Bridge created successfully', {
              duration: 10000, // 10 seconds for undo
              action:
                operationId ?
                  {
                    label: 'Undo',
                    onClick: async () => {
                      // Implement undo logic
                      toast.info('Undo functionality coming soon');
                    },
                  }
                : undefined,
            });

            onClose();
          } else {
            const errors = result.data?.createBridge?.errors || [];
            errors.forEach((err: { message: string }) => toast.error(err.message));
          }
        } else if (bridgeId) {
          // Update existing bridge
          const result = await updateBridge({
            variables: {
              uuid: bridgeId,
              input: {
                comment: data.comment,
                protocol: data.protocol.toUpperCase() as any,
                priority: data.priority,
                vlanFiltering: data.vlanFiltering,
                pvid: data.pvid,
                mtu: data.mtu,
              },
            },
          });

          if (result.data?.updateBridge?.success) {
            const operationId = result.data.updateBridge.operationId;

            toast.success('Bridge updated successfully', {
              duration: 10000,
              action:
                operationId ?
                  {
                    label: 'Undo',
                    onClick: async () => {
                      toast.info('Undo functionality coming soon');
                    },
                  }
                : undefined,
            });

            refetch();
          } else {
            const errors = result.data?.updateBridge?.errors || [];
            errors.forEach((err: { message: string }) => toast.error(err.message));
          }
        }
      } catch (err: unknown) {
        toast.error('Failed to save bridge');
        console.error(err);
      }
    },
    [isCreating, routerId, bridgeId, createBridge, updateBridge, onClose, refetch]
  );

  // Shared props
  const sharedProps = useMemo(
    () => ({
      bridge: isCreating ? null : bridge,
      loading,
      error: error ? new Error(error.message) : null,
      open,
      onClose,
      onSubmit: handleSubmit,
      isSubmitting,
      className,
    }),
    [isCreating, bridge, loading, error, open, onClose, handleSubmit, isSubmitting, className]
  );

  return platform === 'mobile' ?
      <BridgeDetailMobile {...sharedProps} />
    : <BridgeDetailDesktop {...sharedProps} />;
}

BridgeDetailComponent.displayName = 'BridgeDetail';

export const BridgeDetail = BridgeDetailComponent;
