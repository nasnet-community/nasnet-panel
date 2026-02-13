/**
 * RAW Page Component
 *
 * Main page for managing RAW firewall rules with chain tabs and wizards.
 *
 * Features:
 * - Chain tabs (prerouting, output)
 * - Quick action buttons (Add Rule, Bogon Filter)
 * - Notice banner explaining RAW table purpose
 * - Performance explanation section (collapsible)
 * - RawRulesTable integration
 * - Loading skeletons
 * - Empty state when chain has no rules
 *
 * @see NAS-7.X: Implement RAW Firewall Rules - Phase B - Task 11
 */

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useRawUIStore } from '@nasnet/state/stores';
import { useConnectionStore } from '@nasnet/state/stores';
import { useRawRules } from '@nasnet/api-client/queries/firewall';
import { RawRulesTable } from '../components/RawRulesTable';
import { RawRuleEditor, BogonFilterDialog } from '@nasnet/ui/patterns';
import type { RawChain } from '@nasnet/core/types';
import {
  Button,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Alert,
  AlertDescription,
  AlertTitle,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@nasnet/ui/primitives';
import { Plus, Shield, ChevronDown, AlertTriangle, Zap, Info } from 'lucide-react';

// ============================================================================
// Platform Detection Hook
// ============================================================================

function usePlatform() {
  const [platform, setPlatform] = useState<'mobile' | 'tablet' | 'desktop'>('desktop');

  // Simple platform detection based on window width
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
  chain?: RawChain;
  onAddRule: () => void;
  onBogonFilter: () => void;
}

function EmptyState({ chain, onAddRule, onBogonFilter }: EmptyStateProps) {
  const { t } = useTranslation('firewall');

  return (
    <Card className="border-dashed">
      <CardHeader className="text-center">
        <CardTitle>
          {chain
            ? t('raw.emptyStates.noRulesInChain.title', 'No rules in {{chain}}', { chain })
            : t('raw.emptyStates.noRules.title', 'No RAW rules found')}
        </CardTitle>
        <CardDescription>
          {chain
            ? t('raw.emptyStates.noRulesInChain.description', 'This chain has no RAW rules configured.')
            : t('raw.emptyStates.noRules.description', 'RAW rules process packets before connection tracking for performance optimization.')}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col sm:flex-row gap-2 justify-center">
        <Button onClick={onAddRule}>
          <Plus className="h-4 w-4 mr-2" />
          {t('raw.buttons.addRule', 'Add RAW Rule')}
        </Button>
        <Button variant="outline" onClick={onBogonFilter}>
          <Shield className="h-4 w-4 mr-2" />
          {t('raw.buttons.bogonFilter', 'Bogon Filter')}
        </Button>
      </CardContent>
    </Card>
  );
}

// ============================================================================
// Performance Explanation Component
// ============================================================================

function PerformanceExplanation() {
  const { t } = useTranslation('firewall');
  const { performanceSectionExpanded, setPerformanceSectionExpanded } = useRawUIStore();

  return (
    <Collapsible
      open={performanceSectionExpanded}
      onOpenChange={setPerformanceSectionExpanded}
    >
      <Card className="mt-4">
        <CardHeader className="pb-3">
          <CollapsibleTrigger asChild>
            <button className="flex items-center justify-between w-full text-left hover:opacity-80 transition-opacity">
              <div className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-amber-500" />
                <CardTitle className="text-lg">
                  {t('raw.performance.title', 'Why use RAW table?')}
                </CardTitle>
              </div>
              <ChevronDown
                className={`h-5 w-5 transition-transform ${performanceSectionExpanded ? 'rotate-180' : ''}`}
              />
            </button>
          </CollapsibleTrigger>
          <CardDescription>
            {t('raw.performance.subtitle', 'Performance optimization and DDoS protection')}
          </CardDescription>
        </CardHeader>
        <CollapsibleContent>
          <CardContent className="space-y-4">
            {/* Main Explanation */}
            <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <p className="text-sm">
                {t('raw.performance.explanation',
                  'The RAW table processes packets BEFORE connection tracking. This is critical for performance because connection tracking is expensive (CPU and memory). By dropping unwanted traffic in RAW, you prevent connection tracking overhead.'
                )}
              </p>
            </div>

            {/* Benefits */}
            <div>
              <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                <Info className="h-4 w-4 text-green-600 dark:text-green-400" />
                {t('raw.performance.benefits.title', 'Key Benefits')}
              </h4>
              <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
                <li className="flex gap-2">
                  <span className="text-green-600 dark:text-green-400">✓</span>
                  <span>
                    {t('raw.performance.tips.tip_drop',
                      'Packets dropped in RAW table bypass connection tracking, saving CPU and memory'
                    )}
                  </span>
                </li>
                <li className="flex gap-2">
                  <span className="text-green-600 dark:text-green-400">✓</span>
                  <span>
                    {t('raw.performance.benefits.items.0',
                      'Ideal for DDoS protection - drop attacks before they consume resources'
                    )}
                  </span>
                </li>
                <li className="flex gap-2">
                  <span className="text-green-600 dark:text-green-400">✓</span>
                  <span>
                    {t('raw.performance.tips.tip_notrack',
                      'Notrack action skips connection tracking for high-volume traffic'
                    )}
                  </span>
                </li>
                <li className="flex gap-2">
                  <span className="text-green-600 dark:text-green-400">✓</span>
                  <span>
                    {t('raw.performance.benefits.items.4',
                      'Reduces connection table size by preventing tracked connections for dropped packets'
                    )}
                  </span>
                </li>
              </ul>
            </div>

            {/* Use Cases */}
            <div>
              <h4 className="font-semibold text-sm mb-2">
                {t('raw.performance.useCases.title', 'Common Use Cases')}
              </h4>
              <ul className="space-y-1 text-sm text-slate-600 dark:text-slate-400 list-disc list-inside">
                {[0, 1, 2, 3, 4].map((i) => (
                  <li key={i}>
                    {t(`raw.performance.useCases.items.${i}`, `Use case ${i + 1}`)}
                  </li>
                ))}
              </ul>
            </div>

            {/* Warnings */}
            <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
              <h4 className="font-semibold text-sm mb-2 flex items-center gap-2 text-amber-800 dark:text-amber-200">
                <AlertTriangle className="h-4 w-4" />
                {t('raw.performance.warnings.title', 'Important Warnings')}
              </h4>
              <ul className="space-y-1 text-sm text-amber-800 dark:text-amber-200 list-disc list-inside">
                {[0, 1, 2, 3, 4].map((i) => (
                  <li key={i}>
                    {t(`raw.performance.warnings.items.${i}`, `Warning ${i + 1}`)}
                  </li>
                ))}
              </ul>
            </div>
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}

// ============================================================================
// Main Component
// ============================================================================

/**
 * RawPage Component
 *
 * Main page for RAW rules management with chain-based tabs.
 *
 * @returns RAW page component
 */
export function RawPage() {
  const { t } = useTranslation('firewall');
  const platform = usePlatform();
  const isMobile = platform === 'mobile';

  const routerIp = useConnectionStore((state) => state.currentRouterIp) || '';
  const {
    selectedChain,
    setSelectedChain,
    ddosWizardOpen,
    bogonFilterOpen,
    setDdosWizardOpen,
    setBogonFilterOpen,
  } = useRawUIStore();

  const [showAddRule, setShowAddRule] = useState(false);

  const chains: RawChain[] = ['prerouting', 'output'];

  // Fetch rules for current chain
  const { data: rules, isLoading } = useRawRules(routerIp, {
    chain: selectedChain,
  });

  const handleAddRule = () => {
    setShowAddRule(true);
  };

  const handleBogonFilter = () => {
    setBogonFilterOpen(true);
  };

  const handleDdosWizard = () => {
    setDdosWizardOpen(true);
  };

  const handleTabChange = (value: string) => {
    setSelectedChain(value as RawChain);
  };

  return (
    <div className="h-full flex flex-col">
      {/* Page Header */}
      <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              {t('raw.title', 'RAW Firewall Rules')}
            </h1>
            <p className="text-sm text-muted-foreground">
              {t('raw.subtitle', 'Pre-connection tracking packet processing')}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={handleBogonFilter}>
              <Shield className="h-4 w-4 mr-2" />
              {t('raw.buttons.bogonFilter', 'Bogon Filter')}
            </Button>
            <Button onClick={handleAddRule}>
              <Plus className="h-4 w-4 mr-2" />
              {t('raw.buttons.addRule', 'Add Rule')}
            </Button>
          </div>
        </div>
      </div>

      {/* Notice Banner */}
      <div className="p-4 pb-0">
        <Alert>
          <Info className="h-4 w-4" />
          <AlertTitle>{t('raw.performance.title', 'Why use RAW table?')}</AlertTitle>
          <AlertDescription>
            {t('raw.description',
              'Process packets BEFORE connection tracking for performance optimization and DDoS protection'
            )}
          </AlertDescription>
        </Alert>
      </div>

      {/* Chain Tabs */}
      <div className="flex-1 overflow-hidden">
        <Tabs
          value={selectedChain}
          onValueChange={handleTabChange}
          className="h-full flex flex-col"
        >
          <div className="border-b px-4">
            <TabsList className={isMobile ? 'w-full justify-start' : ''}>
              {chains.map((chain) => (
                <TabsTrigger key={chain} value={chain} className="capitalize">
                  {t(`raw.chains.${chain}`, chain)}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>

          <div className="flex-1 overflow-y-auto">
            {/* Individual Chain Tabs */}
            {chains.map((chain) => (
              <TabsContent key={chain} value={chain} className="p-4 m-0 space-y-4">
                {isLoading ? (
                  <div className="space-y-4">
                    <div className="animate-pulse space-y-4">
                      <div className="h-16 bg-slate-200 dark:bg-slate-700 rounded" />
                      <div className="h-16 bg-slate-200 dark:bg-slate-700 rounded" />
                    </div>
                  </div>
                ) : !rules || rules.length === 0 ? (
                  <EmptyState
                    chain={chain}
                    onAddRule={handleAddRule}
                    onBogonFilter={handleBogonFilter}
                  />
                ) : (
                  <RawRulesTable chain={chain} />
                )}

                {/* Performance Explanation (only show if rules exist) */}
                {rules && rules.length > 0 && <PerformanceExplanation />}
              </TabsContent>
            ))}
          </div>
        </Tabs>
      </div>

      {/* Add Rule Editor */}
      <RawRuleEditor
        routerId={routerIp}
        initialRule={{ chain: selectedChain }}
        open={showAddRule}
        onClose={() => setShowAddRule(false)}
        onSave={() => {
          setShowAddRule(false);
        }}
        mode="create"
      />

      {/* Bogon Filter Dialog */}
      <BogonFilterDialog
        routerId={routerIp}
        open={bogonFilterOpen}
        onClose={() => setBogonFilterOpen(false)}
      />
    </div>
  );
}

/**
 * Export for route configuration
 */
export default RawPage;
