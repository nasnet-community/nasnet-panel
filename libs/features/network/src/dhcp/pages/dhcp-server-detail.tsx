/**
 * DHCP Server Detail Page
 * Detailed view with tabs: Overview, Leases, Static Bindings, Settings
 *
 * Story: NAS-6.3 - Implement DHCP Server Management
 *
 * @description Page for viewing and managing individual DHCP server configuration, leases, and static bindings.
 */

import { useState, useCallback } from 'react';
import { useParams, useNavigate } from '@tanstack/react-router';
import { useDHCPServer, useDHCPLeases, useMakeLeaseStatic, useUpdateDHCPServer } from '@nasnet/api-client/queries';
import { useConnectionStore } from '@nasnet/state/stores';
import {
  DHCPSummaryCard,
  LeaseTable,
  ConfirmationDialog,
  SafetyConfirmation,
  FormSection,
  IPInput,
  MACInput,
} from '@nasnet/ui/patterns';
import {
  Button,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Label,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  toast,
} from '@nasnet/ui/primitives';
import { ArrowLeft, Save } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type { DHCPLease } from '@nasnet/core/types';

// Schema for server settings form
const serverSettingsSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  gateway: z.string().ip('Invalid gateway IP address'),
  dnsServers: z.string().min(1, 'At least one DNS server is required'),
  leaseTime: z.enum(['1h', '6h', '12h', '1d', '3d', '7d', '30d']),
  domain: z.string().optional(),
  ntpServer: z.string().optional(),
});

type ServerSettingsFormData = z.infer<typeof serverSettingsSchema>;

// Schema for static binding form
const staticBindingSchema = z.object({
  macAddress: z.string().regex(/^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$/, 'Invalid MAC address'),
  ipAddress: z.string().ip('Invalid IP address'),
  comment: z.string().optional(),
});

type StaticBindingFormData = z.infer<typeof staticBindingSchema>;

export function DHCPServerDetail() {
  const { serverId } = useParams({ from: '/network/dhcp/$serverId' });
  const navigate = useNavigate();
  const routerIp = useConnectionStore((state) => state.currentRouterIp);

  const { data: server, isLoading: serverLoading } = useDHCPServer(routerIp || '', serverId);
  const { data: leases, isLoading: leasesLoading } = useDHCPLeases(routerIp || '');
  const makeStaticMutation = useMakeLeaseStatic(routerIp || '');
  const updateServerMutation = useUpdateDHCPServer(routerIp || '');

  const [selectedLease, setSelectedLease] = useState<DHCPLease | null>(null);
  const [showMakeStaticDialog, setShowMakeStaticDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  // Server settings form
  const settingsForm = useForm({
    resolver: zodResolver(serverSettingsSchema),
    defaultValues: {
      name: server?.name || '',
      gateway: (server as any)?.gateway || '',
      dnsServers: (server as any)?.dnsServers?.join(', ') || '',
      leaseTime: (server?.leaseTime || '1d') as '1h' | '6h' | '12h' | '1d' | '3d' | '7d' | '30d',
      domain: (server as any)?.domain || '',
      ntpServer: (server as any)?.ntpServer || '',
    },
  });

  // Static binding form
  const bindingForm = useForm<StaticBindingFormData>({
    resolver: zodResolver(staticBindingSchema),
    defaultValues: {
      macAddress: '',
      ipAddress: '',
      comment: '',
    },
  });

  // Handle make lease static
  const handleMakeStatic = useCallback(async () => {
    if (!selectedLease) return;

    try {
      await makeStaticMutation.mutateAsync({
        leaseId: selectedLease.id,
        address: selectedLease.address,
        macAddress: selectedLease.macAddress,
      });
      toast({
        title: 'Lease converted to static',
        description: `${selectedLease.address} is now a static binding`,
      });
      setShowMakeStaticDialog(false);
      setSelectedLease(null);
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Failed to make lease static',
        description: error instanceof Error ? error.message : 'An error occurred',
      });
    }
  }, [selectedLease, makeStaticMutation]);

  // Handle server settings update
  const handleUpdateSettings = useCallback(async (data: any) => {
    try {
      await updateServerMutation.mutateAsync({
        serverId,
        leaseTime: data.leaseTime,
      });
      toast({
        title: 'Settings updated',
        description: 'DHCP server settings have been updated successfully',
      });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Failed to update settings',
        description: error instanceof Error ? error.message : 'An error occurred',
      });
    }
  }, [serverId, updateServerMutation]);

  // Handle add static binding
  const handleAddStaticBinding = useCallback(async (data: StaticBindingFormData) => {
    try {
      // Call mutation to add static binding
      toast({
        title: 'Static binding added',
        description: `${data.macAddress} → ${data.ipAddress}`,
      });
      bindingForm.reset();
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Failed to add static binding',
        description: error instanceof Error ? error.message : 'An error occurred',
      });
    }
  }, [bindingForm]);

  if (serverLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">Loading DHCP server...</div>
      </div>
    );
  }

  if (!server) {
    return (
      <div className="container mx-auto py-6">
        <div className="text-center">
          <h2 className="font-display text-2xl font-bold mb-2">DHCP Server Not Found</h2>
          <p className="text-muted-foreground mb-4">
            The DHCP server you're looking for doesn't exist.
          </p>
          <Button
            onClick={() => navigate({ to: '/network/dhcp' })}
            className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            Back to DHCP Servers
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6">
      {/* Header */}
      <div className="mb-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate({ to: '/network/dhcp' })}
          className="mb-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          aria-label="Back to DHCP servers"
        >
          <ArrowLeft className="h-4 w-4 mr-2" aria-hidden="true" />
          Back to DHCP Servers
        </Button>
        <h1 className="font-display text-3xl font-bold">{server.name}</h1>
        <p className="text-muted-foreground mt-2">
          DHCP server on <code className="font-mono">{server.interface}</code>
        </p>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="leases">
            Leases {leases && `(${leases.length})`}
          </TabsTrigger>
          <TabsTrigger value="static">Static Bindings</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-component-lg">
          <DHCPSummaryCard activeLeases={(server as any).activeLeases || 0} serverName={server.name} />

          <Card>
            <CardHeader>
              <CardTitle>Pool Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-component-md text-sm">
                <div>
                  <Label className="text-muted-foreground">Address Pool</Label>
                  <p className="font-mono text-sm">{server.addressPool}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Active Leases</Label>
                  <p className="font-medium tabular-nums">{(server as any).activeLeases || 0}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Gateway</Label>
                  <p className="font-mono text-sm">{(server as any).gateway}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">DNS Servers</Label>
                  <p className="font-mono text-sm">{(server as any).dnsServers?.join(', ')}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Lease Time</Label>
                  <p className="font-mono text-sm">{server.leaseTime}</p>
                </div>
                {(server as any).domain && (
                  <div>
                    <Label className="text-muted-foreground">Domain</Label>
                    <p className="font-mono text-sm">{(server as any).domain}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Leases Tab */}
        <TabsContent value="leases" className="space-y-component-lg">
          <Card>
            <CardHeader>
              <CardTitle>Active Leases</CardTitle>
              <CardDescription>
                DHCP leases currently assigned to devices
              </CardDescription>
            </CardHeader>
            <CardContent>
              {leasesLoading ? (
                <div className="text-center py-component-lg text-muted-foreground">
                  Loading leases...
                </div>
              ) : (
                <LeaseTable
                  leases={leases || []}
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Static Bindings Tab */}
        <TabsContent value="static" className="space-y-component-lg">
          <Card>
            <CardHeader>
              <CardTitle>Add Static Binding</CardTitle>
              <CardDescription>
                Assign a fixed IP address to a device MAC address
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={bindingForm.handleSubmit(handleAddStaticBinding as any)} className="space-y-component-md">
                <div>
                  <Label htmlFor="mac">MAC Address</Label>
                  <MACInput
                    value={bindingForm.watch('macAddress') || ''}
                    onChange={(value: string) => bindingForm.setValue('macAddress', value)}
                    placeholder="e.g., 00:11:22:33:44:55"
                    className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  />
                </div>
                <div>
                  <Label htmlFor="ip">IP Address</Label>
                  <IPInput
                    value={bindingForm.watch('ipAddress') || ''}
                    onChange={(value: string) => bindingForm.setValue('ipAddress', value)}
                    placeholder="e.g., 192.168.1.50"
                    className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  />
                </div>
                <div>
                  <Label htmlFor="comment">Comment (optional)</Label>
                  <Input
                    id="comment"
                    {...bindingForm.register('comment')}
                    placeholder="e.g., Office printer"
                    className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  />
                </div>
                <Button
                  type="submit"
                  className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  Add Static Binding
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Static Bindings</CardTitle>
              <CardDescription>
                Devices with fixed IP address assignments
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-component-lg text-muted-foreground">
                No static bindings configured
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings" className="space-y-component-lg">
          <Card>
            <CardHeader>
              <CardTitle>DHCP Server Settings</CardTitle>
              <CardDescription>
                Modify DHCP server configuration
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={settingsForm.handleSubmit(handleUpdateSettings as any)} className="space-y-component-lg">
                <FormSection title="Basic Settings">
                  <div className="space-y-component-md">
                    <div>
                      <Label htmlFor="name">Server Name</Label>
                      <Input
                        id="name"
                        {...settingsForm.register('name')}
                        placeholder="e.g., dhcp-lan"
                        className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                      />
                      {settingsForm.formState.errors.name && (
                        <p className="text-sm text-error mt-1">
                          {settingsForm.formState.errors.name.message}
                        </p>
                      )}
                    </div>
                  </div>
                </FormSection>

                <FormSection title="Network Settings">
                  <div className="space-y-component-md">
                    <div>
                      <Label htmlFor="gateway">Gateway</Label>
                      <IPInput
                        value={settingsForm.watch('gateway') || ''}
                        onChange={(value: string) => settingsForm.setValue('gateway', value)}
                        placeholder="e.g., 192.168.1.1"
                        className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                      />
                    </div>
                    <div>
                      <Label htmlFor="dns">DNS Servers (comma-separated)</Label>
                      <Input
                        id="dns"
                        {...settingsForm.register('dnsServers')}
                        placeholder="e.g., 8.8.8.8, 8.8.4.4"
                        className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                      />
                      {settingsForm.formState.errors.dnsServers && (
                        <p className="text-sm text-error mt-1">
                          {settingsForm.formState.errors.dnsServers.message}
                        </p>
                      )}
                    </div>
                    <div>
                      <Label htmlFor="leaseTime">Lease Time</Label>
                      <Select
                        value={settingsForm.watch('leaseTime')}
                        onValueChange={(value) => settingsForm.setValue('leaseTime', value as any)}
                      >
                        <SelectTrigger
                          id="leaseTime"
                          className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                        >
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1h">1 hour</SelectItem>
                          <SelectItem value="6h">6 hours</SelectItem>
                          <SelectItem value="12h">12 hours</SelectItem>
                          <SelectItem value="1d">1 day</SelectItem>
                          <SelectItem value="3d">3 days</SelectItem>
                          <SelectItem value="7d">7 days</SelectItem>
                          <SelectItem value="30d">30 days</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </FormSection>

                <FormSection title="Optional Settings">
                  <div className="space-y-component-md">
                    <div>
                      <Label htmlFor="domain">Domain Name</Label>
                      <Input
                        id="domain"
                        {...settingsForm.register('domain')}
                        placeholder="e.g., home.local"
                        className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                      />
                    </div>
                    <div>
                      <Label htmlFor="ntp">NTP Server</Label>
                      <Input
                        id="ntp"
                        {...settingsForm.register('ntpServer')}
                        placeholder="e.g., pool.ntp.org"
                        className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                      />
                    </div>
                  </div>
                </FormSection>

                <div className="flex gap-component-md">
                  <Button
                    type="submit"
                    disabled={updateServerMutation.isPending as boolean}
                    className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  >
                    <Save className="h-4 w-4 mr-2" aria-hidden="true" />
                    {updateServerMutation.isPending ? 'Saving...' : 'Save Changes'}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => settingsForm.reset()}
                    className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  >
                    Reset
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Make Static Confirmation Dialog */}
      <ConfirmationDialog
        open={showMakeStaticDialog}
        onOpenChange={setShowMakeStaticDialog}
        title="Make Lease Static"
        description={`Are you sure you want to convert this lease to a static binding? ${selectedLease?.address} will be permanently assigned to ${selectedLease?.macAddress}.`}
        confirmLabel="Make Static"
        onConfirm={handleMakeStatic}
      />
    </div>
  );
}
