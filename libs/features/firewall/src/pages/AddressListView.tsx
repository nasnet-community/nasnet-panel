/**
 * AddressListView Page Component
 *
 * Main page for managing MikroTik firewall address lists.
 * Orchestrates the AddressListManager pattern component with data fetching and dialogs.
 *
 * Layer 3 Domain Component - Fetches data and manages state
 *
 * Features:
 * - View all address lists with entry counts
 * - Add new entries via form dialog
 * - Import bulk entries via CSV
 * - Export address lists
 * - Delete lists and entries
 * - Loading, error, and empty states
 *
 * @see NAS-7.3: Implement Address Lists - Task 7
 * @module @nasnet/features/firewall/pages
 */

import { useState, useCallback, memo } from 'react';
import { useTranslation } from 'react-i18next';
import { useConnectionStore } from '@nasnet/state/stores';
import { usePlatform } from '@nasnet/ui/patterns';
import {
  useAddressLists,
  useCreateAddressListEntry,
  useDeleteAddressListEntry,
  useBulkCreateAddressListEntries,
} from '@nasnet/api-client/queries/firewall';
import { AddressListManager } from '@nasnet/ui/patterns/address-list-manager';
import { AddressListEntryForm } from '../components/AddressListEntryForm';
import { AddressListImportDialog } from '../components/AddressListImportDialog';
import { AddressListExportDialog } from '../components/AddressListExportDialog';
import {
  Button,
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Alert,
  AlertDescription,
} from '@nasnet/ui/primitives';
import { Plus, Upload, AlertCircle } from 'lucide-react';
import { cn } from '@nasnet/ui/utils';
import type { AddressListEntryFormData } from '../schemas/addressListSchemas';
import type { BulkAddressInput } from '@nasnet/api-client/queries/firewall';

// ============================================================================
// Empty State Component
// ============================================================================

/**
 * EmptyState Component
 * @description Displays when no address lists are available
 */
interface EmptyStateProps {
  onAddEntry: () => void;
  onImport: () => void;
}

const EmptyState = memo(function EmptyState({ onAddEntry, onImport }: EmptyStateProps) {
  const { t } = useTranslation('firewall');

  return (
    <Card className="border-dashed">
      <CardHeader className="text-center">
        <CardTitle>{t('addressLists.emptyStates.noLists.title')}</CardTitle>
        <CardDescription>
          {t('addressLists.emptyStates.noLists.description')}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex justify-center gap-component-sm">
        <Button onClick={onAddEntry} aria-label={t('addressLists.emptyStates.noLists.actions.create')}>
          <Plus className="h-4 w-4 mr-component-sm" aria-hidden="true" />
          {t('addressLists.emptyStates.noLists.actions.create')}
        </Button>
        <Button variant="outline" onClick={onImport} aria-label={t('addressLists.emptyStates.noLists.actions.import')}>
          <Upload className="h-4 w-4 mr-component-sm" aria-hidden="true" />
          {t('addressLists.emptyStates.noLists.actions.import')}
        </Button>
      </CardContent>
    </Card>
  );
});

// ============================================================================
// Loading Skeleton Component
// ============================================================================

/**
 * LoadingSkeleton Component
 * @description Skeleton loader for address list content
 */
const LoadingSkeleton = memo(function LoadingSkeleton() {
  return (
    <div className="space-y-component-md">
      <div className="animate-pulse space-y-component-md">
        <div className="h-16 bg-muted rounded" />
        <div className="h-16 bg-muted rounded" />
        <div className="h-16 bg-muted rounded" />
      </div>
    </div>
  );
});

// ============================================================================
// Main Component
// ============================================================================

/**
 * AddressListView Component
 * @description Main page for address list management with CRUD operations
 *
 * @returns Address list view page component
 */
export const AddressListView = memo(function AddressListView() {
  const { t } = useTranslation('firewall');
  const platform = usePlatform();
  const isMobile = platform === 'mobile';

  const routerIp = useConnectionStore((state) => state.currentRouterIp) || '';

  // Dialog state
  const [showAddEntry, setShowAddEntry] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [showExport, setShowExport] = useState(false);
  const [selectedList, setSelectedList] = useState<string | null>(null);

  // Fetch address lists
  const { data: lists, isLoading, error } = useAddressLists(routerIp);

  // Mutation hooks
  const createEntry = useCreateAddressListEntry(routerIp);
  const deleteEntry = useDeleteAddressListEntry(routerIp);
  const bulkCreate = useBulkCreateAddressListEntries(routerIp);

  // ========================================
  // Event Handlers
  // ========================================

  const handleAddEntry = useCallback(() => {
    setShowAddEntry(true);
  }, []);

  const handleImport = useCallback(() => {
    setShowImport(true);
  }, []);

  const handleExport = useCallback(() => {
    setShowExport(true);
  }, []);

  const handleCreateEntry = useCallback(async (data: AddressListEntryFormData) => {
    await createEntry.mutateAsync({
      list: data.list,
      address: data.address,
      comment: data.comment,
      timeout: data.timeout,
    });
    setShowAddEntry(false);
  }, [createEntry]);

  const handleDeleteEntry = useCallback(async (entryId: string, listName: string) => {
    await deleteEntry.mutateAsync({ id: entryId, listName });
  }, [deleteEntry]);

  const handleBulkImport = useCallback(async (listName: string, entries: BulkAddressInput[]) => {
    const result = await bulkCreate.mutateAsync({
      listName,
      entries,
    });

    setShowImport(false);
    return result;
  }, [bulkCreate]);

  // Extract unique list names for the form
  const existingLists = lists?.map((list) => list.name) || [];

  // ========================================
  // Render
  // ========================================

  return (
    <div className="h-full flex flex-col">
      {/* Page Header */}
      <div className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex items-center justify-between p-component-md gap-component-md">
          <div>
            <h1 className="text-2xl font-bold tracking-tight font-display">
              {t('addressLists.title')}
            </h1>
            <p className="text-sm text-muted-foreground">
              {t('addressLists.subtitle')}
            </p>
          </div>
          <div className="flex gap-component-sm">
            <Button variant="outline" onClick={handleImport} aria-label={t('addressLists.buttons.import')}>
              <Upload className="h-4 w-4 mr-component-sm" aria-hidden="true" />
              {t('addressLists.buttons.import')}
            </Button>
            <Button onClick={handleAddEntry} aria-label={t('addressLists.buttons.addEntry')}>
              <Plus className="h-4 w-4 mr-component-sm" aria-hidden="true" />
              {t('addressLists.buttons.addEntry')}
            </Button>
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto p-component-md" role="main" aria-label="Address lists content">
        {/* Error State */}
        {error && (
          <Alert variant="destructive" className="mb-component-md">
            <AlertCircle className="h-4 w-4" aria-hidden="true" />
            <AlertDescription>
              {t('addressLists.notifications.error.load')}: {error.message}
            </AlertDescription>
          </Alert>
        )}

        {/* Loading State */}
        {isLoading && <LoadingSkeleton />}

        {/* Empty State */}
        {!isLoading && !error && (!lists || lists.length === 0) && (
          <EmptyState onAddEntry={handleAddEntry} onImport={handleImport} />
        )}

        {/* Address List Manager */}
        {!isLoading && !error && lists && lists.length > 0 && (
          <AddressListManager
            lists={lists as any}
            isLoading={isLoading}
            error={error}
            onDeleteEntry={(entryId: string) => handleDeleteEntry(entryId, '')}
            showBulkActions={true}
            enableVirtualization={true}
          />
        )}
      </div>

      {/* Add Entry Sheet */}
      <Sheet open={showAddEntry} onOpenChange={setShowAddEntry}>
        <SheetContent
          side={isMobile ? 'bottom' : 'right'}
          className={isMobile ? 'h-[90vh]' : 'w-full sm:max-w-2xl'}
        >
          <SheetHeader>
            <SheetTitle className="font-display">{t('addressLists.dialogs.addEntry.title')}</SheetTitle>
            <SheetDescription>
              {t('addressLists.dialogs.addEntry.description')}
            </SheetDescription>
          </SheetHeader>
          <div className="mt-component-lg">
            <AddressListEntryForm
              existingLists={existingLists}
              onSubmit={handleCreateEntry}
              onCancel={() => setShowAddEntry(false)}
              isLoading={createEntry.isPending}
            />
          </div>
        </SheetContent>
      </Sheet>

      {/* Import Dialog */}
      <Dialog open={showImport} onOpenChange={setShowImport}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display">{t('addressLists.dialogs.import.title')}</DialogTitle>
            <DialogDescription>
              {t('addressLists.dialogs.import.description')}
            </DialogDescription>
          </DialogHeader>
          <div className="mt-component-md">
            <AddressListImportDialog
              routerId={routerIp}
              existingLists={existingLists}
              onImport={handleBulkImport as any}
            />
          </div>
        </DialogContent>
      </Dialog>

      {/* Export Dialog */}
      <Dialog open={showExport} onOpenChange={setShowExport}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="font-display">{t('addressLists.dialogs.export.title')}</DialogTitle>
            <DialogDescription>
              {t('addressLists.dialogs.export.description')}
            </DialogDescription>
          </DialogHeader>
          <div className="mt-component-md">
            <AddressListExportDialog
              listName={selectedList || ''}
              entries={[]}
            />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
});

AddressListView.displayName = 'AddressListView';
