/**
 * AddToAddressListContextMenu Component
 *
 * Context menu for quickly adding IP addresses to address lists.
 * Desktop: Right-click context menu with nested list selection.
 * Mobile: Handled by IPAddressDisplay with Sheet.
 *
 * Layer 3 Domain Component
 *
 * @description Provides a context menu overlay for adding IPs to existing address lists
 * or creating new ones. Supports keyboard navigation and Enter to submit.
 *
 * @module @nasnet/features/firewall/components
 */

import { useState, useCallback, memo } from 'react';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  Button,
  Input,
  Label,
  useToast,
} from '@nasnet/ui/primitives';

// ============================================
// CONSTANTS
// ============================================

const SUBDROPDOWN_MAX_HEIGHT_PX = 300;

// ============================================
// TYPES
// ============================================

export interface AddToAddressListContextMenuProps {
  /** The IP address to add (e.g., "192.168.1.100") */
  ipAddress: string;
  /** Existing address lists for quick-add */
  existingLists?: string[];
  /** Callback when IP is added to a list */
  onAddToList?: (listName: string, ipAddress: string) => void | Promise<void>;
  /** Child element that triggers the context menu */
  children: React.ReactNode;
}

// ============================================
// COMPONENT
// ============================================

/**
 * Context menu for adding IP to address lists
 *
 * @example
 * ```tsx
 * <AddToAddressListContextMenu
 *   ipAddress="192.168.1.100"
 *   existingLists={['blocklist', 'allowlist']}
 *   onAddToList={handleAddToList}
 * >
 *   <span className="font-mono">192.168.1.100</span>
 * </AddToAddressListContextMenu>
 * ```
 */
function AddToAddressListContextMenuInner({
  ipAddress,
  existingLists = [],
  onAddToList,
  children,
}: AddToAddressListContextMenuProps) {
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newListName, setNewListName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const { toast } = useToast();

  // ============================================
  // HANDLERS
  // ============================================

  const handleAddToExistingList = useCallback(
    async (listName: string) => {
      if (!onAddToList) return;

      try {
        await onAddToList(listName, ipAddress);
        toast({
          title: 'Added to address list',
          description: `${ipAddress} has been added to "${listName}".`,
        });
      } catch (error) {
        toast({
          title: 'Failed to add to list',
          description:
            error instanceof Error ? error.message : 'Unable to add IP to list. Please try again.',
          variant: 'destructive',
        });
      }
    },
    [onAddToList, ipAddress, toast]
  );

  const handleCreateNewList = useCallback(async () => {
    if (!newListName.trim() || !onAddToList) return;

    setIsCreating(true);
    try {
      await onAddToList(newListName.trim(), ipAddress);
      toast({
        title: 'Created address list',
        description: `New list "${newListName}" created with ${ipAddress}.`,
      });
      setShowCreateDialog(false);
      setNewListName('');
    } catch (error) {
      toast({
        title: 'Failed to create list',
        description:
          error instanceof Error ?
            error.message
          : 'Unable to create address list. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsCreating(false);
    }
  }, [newListName, onAddToList, ipAddress, toast]);

  // ============================================
  // RENDER
  // ============================================

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>{children}</DropdownMenuTrigger>

        <DropdownMenuContent
          align="start"
          className="w-56"
        >
          {existingLists.length > 0 ?
            <>
              <DropdownMenuSub>
                <DropdownMenuSubTrigger>
                  <span>Add to existing list</span>
                </DropdownMenuSubTrigger>
                <DropdownMenuSubContent
                  className="overflow-y-auto"
                  style={{ maxHeight: `${SUBDROPDOWN_MAX_HEIGHT_PX}px` }}
                >
                  {existingLists.map((list) => (
                    <DropdownMenuItem
                      key={list}
                      onClick={() => handleAddToExistingList(list)}
                      className="font-mono"
                    >
                      <span className="font-mono">{list}</span>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuSubContent>
              </DropdownMenuSub>

              <DropdownMenuSeparator />
            </>
          : <DropdownMenuItem
              disabled
              className="text-muted-foreground"
            >
              No existing lists
            </DropdownMenuItem>
          }

          <DropdownMenuItem
            onClick={() => setShowCreateDialog(true)}
            className="text-primary"
          >
            Create new list with this IP
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Create New List Dialog */}
      <Dialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create New Address List</DialogTitle>
          </DialogHeader>

          <div className="space-y-component-md">
            <div className="space-y-component-sm gap-component-sm">
              <Label htmlFor="new-list-name">List Name</Label>
              <Input
                id="new-list-name"
                value={newListName}
                onChange={(e) => setNewListName(e.target.value)}
                placeholder="e.g., blocklist, trusted_devices"
                className="font-mono"
                disabled={isCreating}
                aria-describedby="list-name-hint"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && newListName.trim()) {
                    e.preventDefault();
                    handleCreateNewList();
                  }
                }}
                autoFocus
              />
              <p
                id="list-name-hint"
                className="text-muted-foreground text-xs"
              >
                Only letters, numbers, underscores, and hyphens allowed
              </p>
            </div>

            <div className="space-y-component-sm">
              <Label htmlFor="ip-display">IP Address</Label>
              <div className="px-component-sm py-component-xs bg-muted rounded-md">
                <code
                  id="ip-display"
                  className="font-mono text-sm"
                >
                  {ipAddress}
                </code>
              </div>
            </div>

            <div className="gap-component-sm flex justify-end">
              <Button
                variant="outline"
                onClick={() => {
                  setShowCreateDialog(false);
                  setNewListName('');
                }}
                disabled={isCreating}
              >
                Cancel
              </Button>
              <Button
                onClick={handleCreateNewList}
                disabled={!newListName.trim() || isCreating}
              >
                {isCreating ? 'Creating...' : 'Create List'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

AddToAddressListContextMenuInner.displayName = 'AddToAddressListContextMenu';

export const AddToAddressListContextMenu = memo(AddToAddressListContextMenuInner);
