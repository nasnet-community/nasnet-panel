/**
 * Plugin Store Tab Component
 * Displays available services and templates for installation on the router
 *
 * Features:
 * - Services tab: Individual service instances (TOR, Nostr, V2Ray, MTProto)
 * - Templates tab: Multi-service templates for common use cases
 *
 * Design follows NasNetConnect UX Direction patterns:
 * - Clean minimal layout with large rounded corners
 * - Card-heavy dashboard style
 * - Dark/light theme aware surfaces
 */

import React, { useState } from 'react';

import {
  Shield,
  Zap,
  Lock,
  MessageSquare,
  Info
} from 'lucide-react';
import { useTranslation } from 'react-i18next';


import type { ServiceTemplate } from '@nasnet/api-client/generated';
import { TemplatesBrowser, TemplateInstallWizard } from '@nasnet/features/services';
import { PluginCard, type Plugin } from '@nasnet/ui/patterns';
import { Tabs, TabsContent, TabsList, TabsTrigger, useToast } from '@nasnet/ui/primitives';


/**
 * Mock plugin data for demonstration
 */
const createMockPlugins = (): Plugin[] => [
  {
    id: 'tor',
    name: 'TOR',
    description: 'The Onion Router - Anonymous communication and privacy protection through a worldwide volunteer overlay network.',
    icon: Shield,
    version: '0.4.7.13',
    status: 'running',
    stats: {
      connections: 47,
      bytesIn: 1024 * 1024 * 125, // 125 MB
      bytesOut: 1024 * 1024 * 89,  // 89 MB
      peersConnected: 12
    },
    logs: [
      {
        timestamp: new Date(Date.now() - 1000 * 60 * 2),
        message: 'Circuit established to relay node in Germany',
        type: 'success'
      },
      {
        timestamp: new Date(Date.now() - 1000 * 60 * 15),
        message: 'New guard node selected: FastRelay-EU',
        type: 'info'
      },
      {
        timestamp: new Date(Date.now() - 1000 * 60 * 45),
        message: 'Bootstrapped 100%: Done',
        type: 'success'
      }
    ],
    features: [
      'Anonymous browsing and communication',
      'Onion routing for enhanced privacy',
      'Access to .onion hidden services',
      'Censorship circumvention',
      'Exit node selection and configuration'
    ]
  },
  {
    id: 'nostr',
    name: 'Nostr',
    description: 'Notes and Other Stuff Transmitted by Relays - A simple, open protocol for decentralized social networking.',
    icon: MessageSquare,
    version: '1.2.4',
    status: 'installed',
    logs: [
      {
        timestamp: new Date(Date.now() - 1000 * 60 * 5),
        message: 'Relay server configured on port 7777',
        type: 'info'
      },
      {
        timestamp: new Date(Date.now() - 1000 * 60 * 30),
        message: 'Installation completed successfully',
        type: 'success'
      }
    ],
    features: [
      'Decentralized social media protocol',
      'Cryptographic key-based identity',
      'Relay-based message distribution',
      'Censorship-resistant communication',
      'Lightning Network integration support',
      'WebSocket relay server'
    ]
  },
  {
    id: 'v2ray',
    name: 'V2Ray',
    description: 'A platform for building proxies to bypass network restrictions with advanced routing capabilities and multiple protocols.',
    icon: Zap,
    version: '5.10.0',
    status: 'running',
    stats: {
      connections: 23,
      bytesIn: 1024 * 1024 * 456,  // 456 MB
      bytesOut: 1024 * 1024 * 234, // 234 MB
      peersConnected: 8
    },
    logs: [
      {
        timestamp: new Date(Date.now() - 1000 * 30),
        message: 'VMess protocol active on port 10086',
        type: 'success'
      },
      {
        timestamp: new Date(Date.now() - 1000 * 60 * 8),
        message: 'New client connected from 192.168.1.45',
        type: 'info'
      },
      {
        timestamp: new Date(Date.now() - 1000 * 60 * 20),
        message: 'Routing rules updated successfully',
        type: 'success'
      }
    ],
    features: [
      'Multiple protocol support (VMess, VLESS, Shadowsocks)',
      'Advanced routing and traffic distribution',
      'WebSocket and HTTP/2 transport',
      'TLS encryption support',
      'Flexible configuration and plugins',
      'Traffic statistics and monitoring'
    ]
  },
  {
    id: 'mtproto',
    name: 'MTProto Proxy',
    description: 'Telegram MTProto proxy server for secure and fast Telegram messaging, bypassing restrictions and ISP throttling.',
    icon: Lock,
    version: '2.1.3',
    status: 'available',
    features: [
      'Native Telegram protocol support',
      'Fast and lightweight proxy',
      'Sponsored channel rewards',
      'NAT traversal support',
      'Simple setup and configuration',
      'Low resource consumption'
    ]
  }
];

export interface PluginStoreTabProps {
  routerId: string;
}

export const PluginStoreTab = React.memo(function PluginStoreTab({ routerId }: PluginStoreTabProps) {
  const { t } = useTranslation('services');
  const { toast } = useToast();
  const [plugins, setPlugins] = useState<Plugin[]>(createMockPlugins());

  // Template wizard state
  const [wizardOpen, setWizardOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<ServiceTemplate | null>(null);

  /**
   * Handle plugin installation
   * In production, this would call the router API
   */
  const handleInstall = (pluginId: string) => {
    setPlugins(prev =>
      prev.map(plugin =>
        plugin.id === pluginId
          ? { 
              ...plugin, 
              status: 'installed',
              logs: [
                {
                  timestamp: new Date(),
                  message: 'Installation completed successfully',
                  type: 'success'
                }
              ]
            }
          : plugin
      )
    );
  };

  /**
   * Handle plugin uninstallation
   * In production, this would call the router API
   */
  const handleUninstall = (pluginId: string) => {
    setPlugins(prev =>
      prev.map(plugin =>
        plugin.id === pluginId
          ? { 
              ...plugin, 
              status: 'available',
              stats: undefined,
              logs: undefined
            }
          : plugin
      )
    );
  };

  /**
   * Handle plugin configuration
   * In production, this would open a configuration dialog
   */
  const handleConfigure = (pluginId: string) => {
    const plugin = plugins.find(p => p.id === pluginId);
    console.log(`Configure plugin: ${plugin?.name}`);
    // TODO: Open configuration dialog/modal
  };

  /**
   * Handle template installation initiation
   * Opens the wizard modal with the selected template
   */
  const handleTemplateInstall = (template: ServiceTemplate) => {
    setSelectedTemplate(template);
    setWizardOpen(true);
  };

  /**
   * Handle wizard close
   * Resets selected template state
   */
  const handleWizardClose = () => {
    setWizardOpen(false);
    // Delay reset to avoid flash during close animation
    setTimeout(() => setSelectedTemplate(null), 300);
  };

  /**
   * Handle installation completion
   * Shows success toast and closes wizard
   */
  const handleInstallComplete = (instanceIDs: string[]) => {
    const count = instanceIDs.length;
    toast({
      title: t('marketplace.templateInstalledTitle'),
      description: t('marketplace.templateInstalledDescription', { count, name: selectedTemplate?.name || '' }),
      variant: 'success',
    });
    handleWizardClose();
  };

  // Count running plugins
  const runningCount = plugins.filter(p => p.status === 'running').length;
  const installedCount = plugins.filter(p => p.status === 'installed' || p.status === 'running').length;

  return (
    <div className="px-page-mobile md:px-page-tablet lg:px-page-desktop py-4 md:py-6 animate-fade-in-up">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Page Header */}
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-foreground font-display">
            {t('marketplace.title')}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {t('marketplace.description')}
          </p>
        </div>

        {/* Tabs Navigation */}
        <Tabs defaultValue="services" className="space-y-6">
          <TabsList>
            <TabsTrigger value="services">{t('marketplace.servicesTab')}</TabsTrigger>
            <TabsTrigger value="templates">{t('marketplace.templatesTab')}</TabsTrigger>
          </TabsList>

          {/* Services Tab Content */}
          <TabsContent value="services" className="space-y-6">

        {/* Status Summary Pills - Following demo pattern */}
        <div className="flex gap-2 flex-wrap">
          {runningCount > 0 && (
            <div className="flex items-center gap-2 bg-success/10 border border-success/30 rounded-full px-4 py-2">
              <span className="w-2 h-2 bg-success rounded-full animate-pulse" />
              <span className="text-success text-sm font-medium">
                {runningCount} {t('marketplace.running')}
              </span>
            </div>
          )}
          <div className="flex items-center gap-2 bg-muted border border-border rounded-full px-4 py-2">
            <span className="text-muted-foreground text-sm font-medium">
              {t('marketplace.installedCount', { installed: installedCount, total: plugins.length })}
            </span>
          </div>
        </div>

        {/* Info Banner - Blue tip style from demos */}
        <div className="bg-info/10 border border-info/30 rounded-2xl p-4 flex gap-3">
          <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-info/20 flex items-center justify-center">
            <Info className="w-4 h-4 text-info" />
          </div>
          <div className="flex-1">
            <p className="text-sm text-info">
              <span className="font-semibold">💡 {t('marketplace.tipLabel')}:</span> {t('marketplace.tipDescription')}
            </p>
          </div>
        </div>

        {/* Plugin Grid - 1 col mobile, 2 cols desktop with stagger animation */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 stagger-children">
          {plugins.map(plugin => (
            <div key={plugin.id} className="shadow-sm rounded-card-sm bg-card">
              <PluginCard
                plugin={plugin}
                onInstall={handleInstall}
                onUninstall={handleUninstall}
                onConfigure={handleConfigure}
              />
            </div>
          ))}
        </div>

            {/* Footer Note - Subtle */}
            <div className="pt-4 border-t border-border">
              <p className="text-xs text-muted-foreground">
                {t('marketplace.footerNote')}
              </p>
            </div>
          </TabsContent>

          {/* Templates Tab Content */}
          <TabsContent value="templates">
            <TemplatesBrowser
              routerId={routerId}
              onInstall={handleTemplateInstall}
            />
          </TabsContent>
        </Tabs>

        {/* Template Install Wizard Modal */}
        {selectedTemplate && (
          <TemplateInstallWizard
            routerId={routerId}
            template={selectedTemplate}
            open={wizardOpen}
            onClose={handleWizardClose}
            onComplete={handleInstallComplete}
          />
        )}
      </div>
    </div>
  );
});

PluginStoreTab.displayName = 'PluginStoreTab';
