/**
 * DNS Configuration Page
 *
 * Main page for managing DNS settings, servers, and static entries.
 *
 * Story: NAS-6.4 - Implement DNS Configuration
 */

import { memo, useState, useCallback } from 'react';
import { useParams } from '@tanstack/react-router';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Skeleton,
  Alert,
  AlertTitle,
  AlertDescription,
  Button,
  Dialog,
  DialogContent,
  Icon,
} from '@nasnet/ui/primitives';
import { AlertTriangle } from 'lucide-react';
import { PageHeader } from '@nasnet/ui/patterns';
import {
  useUpdateDNSSettings,
  useCreateDNSStaticEntry,
  useUpdateDNSStaticEntry,
  useDeleteDNSStaticEntry,
} from '@nasnet/api-client/queries';
import { DnsServerList } from '../components/dns-server-list';
import { DnsSettingsForm } from '../components/dns-settings-form';
import { DnsStaticEntriesList } from '../components/dns-static-entries-list';
import { DnsStaticEntryForm } from '../components/dns-static-entry-form';
import { useDnsPage } from '../hooks';
import type { DNSStaticEntry } from '@nasnet/core/types';
import type { DNSSettingsFormValues, DNSStaticEntryFormValues } from '../schemas';

/**
 * DNS Configuration Page
 *
 * Provides complete DNS management interface including:
 * - DNS server configuration (static and dynamic)
 * - Remote requests security setting
 * - Cache size configuration
 * - Static DNS entries (hostname-to-IP mappings)
 *
 * Features:
 * - Platform-responsive design
 * - Real-time updates via Apollo Client
 * - Drag-and-drop server reordering
 * - Duplicate detection
 * - Security warnings
 *
 * @description Complete DNS management page with server and static entry management
 */
export const DnsPage = memo(function DnsPage() {
  // Get router ID from URL params
  const { id: deviceId } = useParams({ from: '/router/$id' });

  // Fetch DNS data
  const { settings, entries, isLoading, error, refetch } = useDnsPage(deviceId);

  // Mutations
  const [updateSettings] = useUpdateDNSSettings();
  const [createEntry] = useCreateDNSStaticEntry();
  const [updateEntry] = useUpdateDNSStaticEntry();
  const [deleteEntry] = useDeleteDNSStaticEntry();

  // UI state
  const [showAddServerDialog, setShowAddServerDialog] = useState(false);
  const [showEntryDialog, setShowEntryDialog] = useState(false);
  const [editingEntry, setEditingEntry] = useState<DNSStaticEntry | null>(null);
  const [newServerIp, setNewServerIp] = useState('');

  /**
   * Handle DNS server reordering
   */
  const handleReorderServers = useCallback(async (reorderedServers: any[]) => {
    if (!settings) return;

    // Extract only static servers (exclude dynamic)
    const staticServers = reorderedServers
      .filter((s) => !s.isDynamic)
      .map((s) => s.address);

    try {
      await updateSettings({
        variables: {
          deviceId,
          input: {
            servers: staticServers,
            allowRemoteRequests: settings.allowRemoteRequests,
            cacheSize: settings.cacheSize,
          },
        },
      });
    } catch (err) {
      console.error('Failed to reorder DNS servers:', err);
    }
  }, [settings, deviceId, updateSettings]);

  /**
   * Handle removing a static DNS server
   */
  const handleRemoveServer = useCallback(async (serverId: string) => {
    if (!settings) return;

    const updatedServers = settings.staticServers.filter((s) => s !== serverId);

    try {
      await updateSettings({
        variables: {
          deviceId,
          input: {
            servers: updatedServers,
            allowRemoteRequests: settings.allowRemoteRequests,
            cacheSize: settings.cacheSize,
          },
        },
      });
    } catch (err) {
      console.error('Failed to remove DNS server:', err);
    }
  }, [settings, deviceId, updateSettings]);

  /**
   * Handle adding a new static DNS server
   */
  const handleAddServer = useCallback(() => {
    setShowAddServerDialog(true);
  }, []);

  /**
   * Handle DNS settings form submission
   */
  const handleSettingsSubmit = useCallback(async (values: DNSSettingsFormValues) => {
    try {
      await updateSettings({
        variables: {
          deviceId,
          input: {
            servers: values.servers,
            allowRemoteRequests: values.allowRemoteRequests,
            cacheSize: values.cacheSize,
          },
        },
      });
    } catch (err) {
      console.error('Failed to update DNS settings:', err);
    }
  }, [deviceId, updateSettings]);

  /**
   * Handle adding a new static DNS entry
   */
  const handleAddEntry = useCallback(() => {
    setEditingEntry(null);
    setShowEntryDialog(true);
  }, []);

  /**
   * Handle editing an existing static DNS entry
   */
  const handleEditEntry = useCallback((entry: DNSStaticEntry) => {
    setEditingEntry(entry);
    setShowEntryDialog(true);
  }, []);

  /**
   * Handle static DNS entry form submission
   */
  const handleEntrySubmit = useCallback(async (values: DNSStaticEntryFormValues) => {
    try {
      if (editingEntry) {
        // Update existing entry
        await updateEntry({
          variables: {
            deviceId,
            entryId: editingEntry['.id'],
            input: values,
          },
        });
      } else {
        // Create new entry
        await createEntry({
          variables: {
            deviceId,
            input: values,
          },
        });
      }

      setShowEntryDialog(false);
      setEditingEntry(null);
    } catch (err) {
      console.error('Failed to save DNS entry:', err);
    }
  }, [editingEntry, deviceId, updateEntry, createEntry]);

  /**
   * Handle deleting a static DNS entry
   */
  const handleDeleteEntry = useCallback(async (entryId: string) => {
    try {
      await deleteEntry({
        variables: {
          deviceId,
          entryId,
        },
      });
    } catch (err) {
      console.error('Failed to delete DNS entry:', err);
    }
  }, [deviceId, deleteEntry]);

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-component-lg p-page-mobile md:p-page-tablet lg:p-page-desktop">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64" />
        <Skeleton className="h-64" />
      </div>
    );
  }

  // Error state
  if (error || !settings) {
    return (
      <div className="p-page-mobile md:p-page-tablet lg:p-page-desktop">
        <Alert variant="destructive">
          <Icon icon={AlertTriangle} className="h-4 w-4" />
          <AlertTitle>Failed to load DNS configuration</AlertTitle>
          <AlertDescription>
            {error?.message || 'Unable to fetch DNS settings'}
          </AlertDescription>
        </Alert>
        <Button onClick={refetch} className="mt-component-md min-h-[44px]" aria-label="Retry loading DNS configuration">
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-component-lg p-page-mobile md:p-page-tablet lg:p-page-desktop">
      <PageHeader title="DNS Configuration" />

      {/* DNS Servers Section */}
      <Card>
        <CardHeader>
          <CardTitle>DNS Servers</CardTitle>
        </CardHeader>
        <CardContent className="space-y-component-lg">
          {/* Server List */}
          <DnsServerList
            servers={[
              ...settings.staticServers.map((s) => ({
                id: s,
                address: s,
                isDynamic: false,
              })),
              ...settings.dynamicServers.map((s) => ({
                id: `dynamic-${s}`,
                address: s,
                isDynamic: true,
              })),
            ]}
            onReorder={handleReorderServers}
            onRemove={handleRemoveServer}
            onAdd={handleAddServer}
          />

          {/* DNS Settings Form */}
          <div className="pt-component-lg border-t border-border">
            <DnsSettingsForm
              initialValues={{
                servers: settings.staticServers,
                allowRemoteRequests: settings.allowRemoteRequests,
                cacheSize: settings.cacheSize,
              }}
              cacheUsed={settings.cacheUsed}
              cacheUsedPercent={settings.cacheUsedPercent}
              onSubmit={handleSettingsSubmit}
            />
          </div>
        </CardContent>
      </Card>

      {/* Static DNS Entries Section */}
      <Card>
        <CardHeader>
          <CardTitle>Static DNS Entries</CardTitle>
        </CardHeader>
        <CardContent>
          <DnsStaticEntriesList
            entries={entries}
            onEdit={handleEditEntry}
            onDelete={handleDeleteEntry}
            onAdd={handleAddEntry}
          />
        </CardContent>
      </Card>

      {/* Static Entry Dialog */}
      <Dialog open={showEntryDialog} onOpenChange={setShowEntryDialog}>
        <DialogContent className="max-w-lg">
          <DnsStaticEntryForm
            mode={editingEntry ? 'edit' : 'create'}
            initialValues={
              editingEntry
                ? {
                    name: editingEntry.name,
                    address: editingEntry.address,
                    ttl: parseInt(editingEntry.ttl),
                    comment: editingEntry.comment,
                  }
                : undefined
            }
            existingEntries={entries}
            currentEntryId={editingEntry?.['.id']}
            onSubmit={handleEntrySubmit}
            onCancel={() => {
              setShowEntryDialog(false);
              setEditingEntry(null);
            }}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
});

DnsPage.displayName = 'DnsPage';
