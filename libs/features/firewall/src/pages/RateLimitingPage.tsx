/**
 * Rate Limiting Page Component
 *
 * Main page for managing rate limiting rules with 3 tabs.
 *
 * Features:
 * - Rate Limits tab with RateLimitRulesTable
 * - SYN Flood Protection tab with SynFloodConfigPanel
 * - Statistics tab with RateLimitStatsOverview and BlockedIPsTable
 * - Loading skeletons
 * - Empty states
 * - Tab persistence via Zustand
 *
 * @see NAS-7.11: Implement Connection Rate Limiting - Task 6
 */

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useRateLimitingUIStore } from '@nasnet/state/stores';
import { useConnectionStore } from '@nasnet/state/stores';
import {
  RateLimitRulesTable,
  RateLimitRuleEditor,
  SynFloodConfigPanel,
  BlockedIPsTable,
  RateLimitStatsOverview,
} from '@nasnet/ui/patterns';
import {
  Button,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Alert,
  AlertDescription,
} from '@nasnet/ui/primitives';
import { Plus, RefreshCw, Download, AlertTriangle, Info } from 'lucide-react';

// ============================================================================
// Platform Detection Hook
// ============================================================================

function usePlatform() {
  const [platform, setPlatform] = useState<'mobile' | 'tablet' | 'desktop'>('desktop');

  // Simple platform detection based on window width
  // In production, this would use a more robust hook
  if (typeof window !== 'undefined') {
    const width = window.innerWidth;
    if (width < 640) return 'mobile';
    if (width < 1024) return 'tablet';
    return 'desktop';
  }

  return platform;
}

// ============================================================================
// Empty State Component
// ============================================================================

interface EmptyStateProps {
  tab: 'rate-limits' | 'syn-flood' | 'statistics';
  onAddRule: () => void;
}

function EmptyState({ tab, onAddRule }: EmptyStateProps) {
  const { t } = useTranslation('firewall');

  if (tab === 'rate-limits') {
    return (
      <Card className="border-dashed">
        <CardHeader className="text-center">
          <CardTitle>{t('rateLimiting.emptyStates.noRules')}</CardTitle>
          <CardDescription>
            {t('rateLimiting.emptyStates.noRulesDescription')}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center">
          <Button onClick={onAddRule}>
            <Plus className="h-4 w-4 mr-2" />
            {t('rateLimiting.buttons.addRateLimit')}
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (tab === 'statistics') {
    return (
      <Card className="border-dashed">
        <CardHeader className="text-center">
          <CardTitle>{t('rateLimiting.emptyStates.noBlockedIPs')}</CardTitle>
          <CardDescription>
            {t('rateLimiting.emptyStates.noBlockedIPsDescription')}
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return null;
}

// ============================================================================
// Main Component
// ============================================================================

/**
 * RateLimitingPage Component
 *
 * Main page for rate limiting management with 3-tab layout.
 *
 * @returns Rate limiting page component
 */
export function RateLimitingPage() {
  const { t } = useTranslation('firewall');
  const platform = usePlatform();
  const isMobile = platform === 'mobile';

  const routerIp = useConnectionStore((state) => state.currentRouterIp) || '';
  const {
    selectedTab,
    setSelectedTab,
    showRuleEditor,
    openRuleEditor,
    closeRuleEditor,
    editingRule,
  } = useRateLimitingUIStore();

  const [isRefreshing, setIsRefreshing] = useState(false);

  // Mock data state - in production this would come from API
  const [hasRules, setHasRules] = useState(false);
  const [hasBlockedIPs, setHasBlockedIPs] = useState(false);

  const handleAddRule = () => {
    openRuleEditor();
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    // Simulate refresh
    await new Promise((resolve) => setTimeout(resolve, 500));
    setIsRefreshing(false);
  };

  const handleExportCSV = () => {
    // Export functionality - to be implemented
    console.log('Export CSV');
  };

  const handleClearBlockedIPs = () => {
    // Clear blocked IPs - to be implemented
    console.log('Clear blocked IPs');
  };

  const handleTabChange = (value: string) => {
    setSelectedTab(value as 'rate-limits' | 'syn-flood' | 'statistics');
  };

  return (
    <div className="h-full flex flex-col">
      {/* Page Header */}
      <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex items-center justify-between p-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              {t('rateLimiting.title')}
            </h1>
            <p className="text-sm text-muted-foreground">
              {t('rateLimiting.subtitle')}
            </p>
          </div>

          {/* Header Actions - Dynamic based on selected tab */}
          <div className="flex gap-2">
            {selectedTab === 'rate-limits' && (
              <Button onClick={handleAddRule}>
                <Plus className="h-4 w-4 mr-2" />
                {t('rateLimiting.buttons.addRateLimit')}
              </Button>
            )}

            {selectedTab === 'statistics' && (
              <>
                <Button
                  variant="outline"
                  onClick={handleRefresh}
                  disabled={isRefreshing}
                >
                  <RefreshCw
                    className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`}
                  />
                  {t('rateLimiting.statistics.refresh')}
                </Button>
                <Button variant="outline" onClick={handleExportCSV}>
                  <Download className="h-4 w-4 mr-2" />
                  {t('rateLimiting.statistics.exportCSV')}
                </Button>
                {hasBlockedIPs && (
                  <Button variant="destructive" onClick={handleClearBlockedIPs}>
                    {t('rateLimiting.buttons.clear')}
                  </Button>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Tab Layout */}
      <div className="flex-1 overflow-hidden">
        <Tabs
          value={selectedTab}
          onValueChange={handleTabChange}
          className="h-full flex flex-col"
        >
          <div className="border-b px-4">
            <TabsList className={isMobile ? 'w-full justify-start overflow-x-auto' : ''}>
              <TabsTrigger value="rate-limits">
                {t('rateLimiting.tabs.rateLimits')}
              </TabsTrigger>
              <TabsTrigger value="syn-flood">
                {t('rateLimiting.tabs.synFlood')}
              </TabsTrigger>
              <TabsTrigger value="statistics">
                {t('rateLimiting.tabs.statistics')}
              </TabsTrigger>
            </TabsList>
          </div>

          <div className="flex-1 overflow-y-auto">
            {/* Rate Limits Tab */}
            <TabsContent value="rate-limits" className="p-4 m-0">
              {!hasRules ? (
                <EmptyState tab="rate-limits" onAddRule={handleAddRule} />
              ) : (
                <RateLimitRulesTable />
              )}
            </TabsContent>

            {/* SYN Flood Protection Tab */}
            <TabsContent value="syn-flood" className="p-4 m-0 space-y-4">
              {/* Info Alert */}
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  {t('rateLimiting.synFlood.description')}
                </AlertDescription>
              </Alert>

              {/* Warning Alert */}
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  {t('rateLimiting.synFlood.warning')}
                </AlertDescription>
              </Alert>

              {/* SYN Flood Config Panel */}
              <SynFloodConfigPanel configHook={{} as any} />
            </TabsContent>

            {/* Statistics Tab */}
            <TabsContent value="statistics" className="p-4 m-0 space-y-6">
              {/* Stats Overview */}
              <RateLimitStatsOverview routerId={routerIp} />

              {/* Blocked IPs Table */}
              {!hasBlockedIPs ? (
                <EmptyState tab="statistics" onAddRule={handleAddRule} />
              ) : (
                <div>
                  <div className="mb-4">
                    <h2 className="text-lg font-semibold">
                      {t('rateLimiting.statistics.blockedIPsTable')}
                    </h2>
                    <p className="text-sm text-muted-foreground">
                      {t('rateLimiting.fieldHelp.whitelistInfo')}
                    </p>
                  </div>
                  <BlockedIPsTable blockedIPsTable={{} as any} />
                </div>
              )}
            </TabsContent>
          </div>
        </Tabs>
      </div>

      {/* Add/Edit Rule Sheet */}
      <Sheet open={showRuleEditor} onOpenChange={closeRuleEditor}>
        <SheetContent
          side={isMobile ? 'bottom' : 'right'}
          className={isMobile ? 'h-[90vh]' : 'w-full sm:max-w-2xl'}
        >
          <SheetHeader>
            <SheetTitle>
              {editingRule
                ? t('rateLimiting.dialogs.editRule.title')
                : t('rateLimiting.dialogs.addRule.title')}
            </SheetTitle>
            <SheetDescription>
              {editingRule
                ? t('rateLimiting.dialogs.editRule.description')
                : t('rateLimiting.dialogs.addRule.description')}
            </SheetDescription>
          </SheetHeader>
          <div className="mt-6">
            <RateLimitRuleEditor
              routerId={routerIp}
              initialRule={editingRule || undefined}
              open={showRuleEditor}
              onClose={closeRuleEditor}
              onSave={async () => { closeRuleEditor(); }}
            />
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}

/**
 * Export for route configuration
 */
export default RateLimitingPage;
