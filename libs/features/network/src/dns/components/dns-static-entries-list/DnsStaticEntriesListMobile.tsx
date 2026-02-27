/**
 * DNS Static Entries List - Mobile Presenter
 *
 * Mobile optimized view with card layout.
 *
 * Story: NAS-6.4 - Implement DNS Configuration
 */

import { useMemo, useState } from 'react';
import { Button, Card, CardContent, Badge } from '@nasnet/ui/primitives';
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
  const [entryToDelete, setEntryToDelete] = useState<DNSStaticEntry | null>(null);

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
      <div className="space-y-component-md category-networking">
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
      <div className="space-y-component-md category-networking">
        {/* Entries List */}
        <div className="space-y-component-sm">
          {sortedEntries.map((entry) => (
            <Card
              key={entry['.id']}
              className="bg-card overflow-hidden"
            >
              <CardContent className="p-component-sm">
                <div className="space-y-component-sm">
                  {/* Hostname */}
                  <div className="gap-component-sm flex items-start">
                    <Globe className="text-primary mt-0.5 h-5 w-5 flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                      <div className="truncate font-medium">{entry.name}</div>
                      <div className="text-muted-foreground font-mono text-sm">{entry.address}</div>
                    </div>
                  </div>

                  {/* TTL and Comment */}
                  <div className="gap-component-sm text-muted-foreground flex items-center text-xs">
                    <Badge
                      variant="secondary"
                      className="text-xs"
                    >
                      TTL: {formatTTL(parseInt(entry.ttl))}
                    </Badge>
                    {entry.comment && <span className="flex-1 truncate">{entry.comment}</span>}
                  </div>

                  {/* Actions */}
                  <div className="gap-component-sm flex pt-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onEdit(entry)}
                      disabled={isLoading}
                      className="h-11 flex-1"
                      aria-label={`Edit DNS entry ${entry.name}`}
                    >
                      <Edit2 className="mr-2 h-4 w-4" />
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setEntryToDelete(entry)}
                      disabled={isLoading}
                      className="h-11 flex-1"
                      aria-label={`Delete DNS entry ${entry.name}`}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
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
          className="h-11 w-full" // 44px touch target
        >
          <Plus className="mr-2 h-5 w-5" />
          Add Static Entry
        </Button>
      </div>

      {/* Delete Confirmation Dialog */}
      <ConfirmationDialog
        open={!!entryToDelete}
        onOpenChange={(open) => !open && setEntryToDelete(null)}
        title="Delete Entry"
        description={
          entryToDelete ?
            `Delete "${entryToDelete.name}"? This hostname will no longer resolve.`
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
