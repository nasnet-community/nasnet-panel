/**
 * DNS Static Entries List - Desktop Presenter
 *
 * Desktop/tablet optimized view with data table layout.
 *
 * Story: NAS-6.4 - Implement DNS Configuration
 */

import { useMemo, useState } from 'react';
import { Button } from '@nasnet/ui/primitives';
import { DataTable, EmptyState, ConfirmationDialog } from '@nasnet/ui/patterns';
import { Edit2, Trash2, Plus, FileText } from 'lucide-react';
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
  loading = false,
}: DnsStaticEntriesListProps) {
  const [entryToDelete, setEntryToDelete] = useState<DNSStaticEntry | null>(
    null
  );

  // Sort entries alphabetically by hostname
  const sortedEntries = useMemo(() => {
    return [...entries].sort((a, b) => a.name.localeCompare(b.name));
  }, [entries]);

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
          <span className="font-mono text-sm">{entry.address}</span>
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
          <span className="text-sm text-muted-foreground truncate">
            {entry.comment || '—'}
          </span>
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
              onClick={() => onEdit(entry)}
              disabled={loading}
              aria-label={`Edit ${entry.name}`}
              title="Edit entry"
            >
              <Edit2 className="h-4 w-4" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              onClick={() => setEntryToDelete(entry)}
              disabled={loading}
              aria-label={`Delete ${entry.name}`}
              title="Delete entry"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ),
      },
    ],
    [onEdit, loading]
  );

  // Handle delete confirmation
  const handleConfirmDelete = () => {
    if (entryToDelete) {
      onDelete(entryToDelete['.id']);
      setEntryToDelete(null);
    }
  };

  if (entries.length === 0) {
    return (
      <div className="space-y-4">
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
      <div className="space-y-4">
        {/* Data Table */}
        <DataTable
          columns={columns}
          data={sortedEntries as any[]}
          isLoading={loading}
        />

        {/* Add Entry Button */}
        <Button onClick={onAdd} variant="outline" className="w-full">
          <Plus className="h-4 w-4 mr-2" />
          Add Static Entry
        </Button>
      </div>

      {/* Delete Confirmation Dialog */}
      <ConfirmationDialog
        open={!!entryToDelete}
        onOpenChange={(open) => !open && setEntryToDelete(null)}
        title="Delete Static DNS Entry"
        description={
          entryToDelete
            ? `Are you sure you want to delete the static entry "${entryToDelete.name}"? This hostname will no longer resolve locally.`
            : ''
        }
        confirmLabel="Delete Entry"
        cancelLabel="Cancel"
        variant="destructive"
        onConfirm={handleConfirmDelete}
        onCancel={() => setEntryToDelete(null)}
      />
    </>
  );
}
