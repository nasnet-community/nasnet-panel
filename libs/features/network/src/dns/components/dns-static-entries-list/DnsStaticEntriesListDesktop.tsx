/**
 * DNS Static Entries List - Desktop Presenter
 *
 * Desktop/tablet optimized view with data table layout.
 *
 * @description
 * Displays static DNS entries in a sortable data table with edit/delete actions.
 * Shows hostname, IP address, TTL, and optional comment for each entry.
 *
 * Story: NAS-6.4 - Implement DNS Configuration
 */

import { useMemo, useState, useCallback } from 'react';
import { Button, Icon } from '@nasnet/ui/primitives';
import { DataTable, EmptyState, ConfirmationDialog } from '@nasnet/ui/patterns';
import { Edit2, Trash2, Plus, FileText } from 'lucide-react';
import { cn } from '@nasnet/ui/utils';
import { formatTTL } from '../../utils';
import type { DnsStaticEntriesListProps } from './DnsStaticEntriesList';
import type { DNSStaticEntry } from '@nasnet/core/types';

/**
 * Desktop presenter for DNS static entries list
 *
 * Uses DataTable component with sortable columns.
 * Shows hostname, IP address, TTL, comment, and actions.
 */
export function DnsStaticEntriesListDesktop({
  entries,
  onEdit,
  onDelete,
  onAdd,
  isLoading = false,
}: DnsStaticEntriesListProps) {
  const [entryToDelete, setEntryToDelete] = useState<DNSStaticEntry | null>(null);

  // Sort entries alphabetically by hostname
  const sortedEntries = useMemo(() => {
    return [...entries].sort((a, b) => a.name.localeCompare(b.name));
  }, [entries]);

  // Memoized handler callbacks
  const handleEdit = useCallback(
    (entry: DNSStaticEntry) => {
      onEdit(entry);
    },
    [onEdit]
  );

  const handleDeleteClick = useCallback((entry: DNSStaticEntry) => {
    setEntryToDelete(entry);
  }, []);

  // Table columns configuration
  const columns = useMemo(
    () => [
      {
        key: 'name' as const,
        header: 'Hostname',
        sortable: true,
        width: '25%',
      },
      {
        key: 'address' as const,
        header: 'IP Address',
        sortable: true,
        width: '20%',
        render: (entry: DNSStaticEntry) => (
          <span className="category-networking font-mono text-sm">{entry.address}</span>
        ),
      },
      {
        key: 'ttl' as const,
        header: 'TTL',
        sortable: true,
        width: '15%',
        render: (entry: DNSStaticEntry) => (
          <span className="text-sm">{formatTTL(parseInt(entry.ttl))}</span>
        ),
      },
      {
        key: 'comment' as const,
        header: 'Comment',
        sortable: false,
        width: '30%',
        render: (entry: DNSStaticEntry) => (
          <span className="text-muted-foreground truncate text-sm">{entry.comment || '—'}</span>
        ),
      },
      {
        key: 'actions' as const,
        header: 'Actions',
        sortable: false,
        width: '10%',
        align: 'right' as const,
        render: (entry: DNSStaticEntry) => (
          <div className="flex items-center justify-end gap-1">
            <Button
              size="icon"
              variant="ghost"
              onClick={() => handleEdit(entry)}
              disabled={isLoading}
              aria-label={`Edit ${entry.name}`}
              title="Edit entry"
            >
              <Icon
                icon={Edit2}
                className="h-4 w-4"
              />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              onClick={() => handleDeleteClick(entry)}
              disabled={isLoading}
              aria-label={`Delete ${entry.name}`}
              title="Delete entry"
            >
              <Icon
                icon={Trash2}
                className="h-4 w-4"
              />
            </Button>
          </div>
        ),
      },
    ],
    [handleEdit, handleDeleteClick, isLoading]
  );

  // Handle delete confirmation
  const handleConfirmDelete = useCallback(() => {
    if (entryToDelete) {
      onDelete(entryToDelete['.id']);
      setEntryToDelete(null);
    }
  }, [entryToDelete, onDelete]);

  const handleCancelDelete = useCallback(() => {
    setEntryToDelete(null);
  }, []);

  if (entries.length === 0) {
    return (
      <div className="space-y-component-md category-networking">
        <EmptyState
          icon={FileText}
          title="No Static DNS Entries"
          description="Static DNS entries allow you to map custom hostnames to IP addresses on your local network."
          action={{
            label: 'Add Static Entry',
            onClick: onAdd,
            variant: 'default',
          }}
        />
      </div>
    );
  }

  return (
    <>
      <div className="space-y-component-md category-networking">
        {/* Data Table */}
        <DataTable
          columns={columns}
          data={sortedEntries as any[]}
          isLoading={isLoading}
        />

        {/* Add Entry Button */}
        <Button
          onClick={onAdd}
          variant="outline"
          className="w-full"
        >
          <Icon
            icon={Plus}
            className="mr-2 h-4 w-4"
            aria-hidden="true"
          />
          Add Static Entry
        </Button>
      </div>

      {/* Delete Confirmation Dialog */}
      <ConfirmationDialog
        open={!!entryToDelete}
        onOpenChange={(open) => !open && handleCancelDelete()}
        title="Delete Static DNS Entry"
        description={
          entryToDelete ?
            `Are you sure you want to delete the static entry "${entryToDelete.name}"? This hostname will no longer resolve locally.`
          : ''
        }
        confirmLabel="Delete Entry"
        cancelLabel="Cancel"
        variant="destructive"
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
      />
    </>
  );
}
