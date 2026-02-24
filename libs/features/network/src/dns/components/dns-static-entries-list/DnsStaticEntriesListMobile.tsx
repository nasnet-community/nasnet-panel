/**
 * DNS Static Entries List - Mobile Presenter
 *
 * Mobile optimized view with card layout.
 *
 * Story: NAS-6.4 - Implement DNS Configuration
 */

import { useMemo, useState } from 'react';
import {
  Button,
  Card,
  CardContent,
  Badge,
} from '@nasnet/ui/primitives';
import { EmptyState, ConfirmationDialog } from '@nasnet/ui/patterns';
import { Edit2, Trash2, Plus, FileText, Globe } from 'lucide-react';
import { formatTTL } from '../../utils';
import type { DnsStaticEntriesListProps } from './DnsStaticEntriesList';
import type { DNSStaticEntry } from '@nasnet/core/types';

/**
 * Mobile presenter for DNS static entries list
 *
 * Card-based layout optimized for touch interaction.
 * Shows key information in compact format.
 */
export function DnsStaticEntriesListMobile({
  entries,
  onEdit,
  onDelete,
  onAdd,
  isLoading = false,
}: DnsStaticEntriesListProps) {
  const [entryToDelete, setEntryToDelete] = useState<DNSStaticEntry | null>(
    null
  );

  // Sort entries alphabetically by hostname
  const sortedEntries = useMemo(() => {
    return [...entries].sort((a, b) => a.name.localeCompare(b.name));
  }, [entries]);

  // Handle delete confirmation
  const handleConfirmDelete = () => {
    if (entryToDelete) {
      onDelete(entryToDelete['.id']);
      setEntryToDelete(null);
    }
  };

  if (entries.length === 0) {
    return (
      <div className="space-y-component-md">
        <EmptyState
          icon={FileText}
          title="No Static Entries"
          description="Map custom hostnames to IP addresses"
          action={{
            label: 'Add Entry',
            onClick: onAdd,
            variant: 'default',
          }}
        />
      </div>
    );
  }

  return (
    <>
      <div className="space-y-component-md">
        {/* Entries List */}
        <div className="space-y-component-sm">
          {sortedEntries.map((entry) => (
            <Card key={entry['.id']} className="overflow-hidden">
              <CardContent className="p-component-sm">
                <div className="space-y-component-sm">
                  {/* Hostname */}
                  <div className="flex items-start gap-component-sm">
                    <Globe className="h-5 w-5 flex-shrink-0 text-primary mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">{entry.name}</div>
                      <div className="font-mono text-sm text-muted-foreground">
                        {entry.address}
                      </div>
                    </div>
                  </div>

                  {/* TTL and Comment */}
                  <div className="flex items-center gap-component-sm text-xs text-muted-foreground">
                    <Badge variant="secondary" className="text-xs">
                      TTL: {formatTTL(parseInt(entry.ttl))}
                    </Badge>
                    {entry.comment && (
                      <span className="truncate flex-1">{entry.comment}</span>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-component-sm pt-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onEdit(entry)}
                      disabled={isLoading}
                      className="flex-1 h-11"
                      aria-label={`Edit DNS entry ${entry.name}`}
                    >
                      <Edit2 className="h-4 w-4 mr-2" />
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setEntryToDelete(entry)}
                      disabled={isLoading}
                      className="flex-1 h-11"
                      aria-label={`Delete DNS entry ${entry.name}`}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Add Entry Button */}
        <Button
          onClick={onAdd}
          variant="outline"
          className="w-full h-11" // 44px touch target
        >
          <Plus className="h-5 w-5 mr-2" />
          Add Static Entry
        </Button>
      </div>

      {/* Delete Confirmation Dialog */}
      <ConfirmationDialog
        open={!!entryToDelete}
        onOpenChange={(open) => !open && setEntryToDelete(null)}
        title="Delete Entry"
        description={
          entryToDelete
            ? `Delete "${entryToDelete.name}"? This hostname will no longer resolve.`
            : ''
        }
        confirmLabel="Delete"
        cancelLabel="Cancel"
        variant="destructive"
        onConfirm={handleConfirmDelete}
        onCancel={() => setEntryToDelete(null)}
      />
    </>
  );
}
