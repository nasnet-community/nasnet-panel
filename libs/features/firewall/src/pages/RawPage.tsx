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

import { memo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useRawUIStore, useConnectionStore } from '@nasnet/state/stores';
import { useRawRules } from '@nasnet/api-client/queries/firewall';
import { RawRulesTable } from '../components/RawRulesTable';
import { RawRuleEditor, BogonFilterDialog, usePlatform } from '@nasnet/ui/patterns';
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
import { cn } from '@nasnet/ui/utils';

// ============================================================================
// Empty State Component
// ============================================================================

interface EmptyStateProps {
  chain?: RawChain;
  onAddRule: () => void;
  onBogonFilter: () => void;
}

/**
 * @description Empty state shown when no RAW rules exist in a chain
 */
const EmptyState = memo(function EmptyState({ chain, onAddRule, onBogonFilter }: EmptyStateProps) {
  const { t } = useTranslation('firewall');

  return (
    <Card className="border-dashed">
      <CardHeader className="text-center">
        <CardTitle>
          {chain ?
            t('raw.emptyStates.noRulesInChain.title', 'No rules in {{chain}}', { chain })
          : t('raw.emptyStates.noRules.title', 'No RAW rules found')}
        </CardTitle>
        <CardDescription>
          {chain ?
            t(
              'raw.emptyStates.noRulesInChain.description',
              'This chain has no RAW rules configured.'
            )
          : t(
              'raw.emptyStates.noRules.description',
              'RAW rules process packets before connection tracking for performance optimization.'
            )
          }
        </CardDescription>
      </CardHeader>
      <CardContent className="gap-component-sm flex flex-col justify-center sm:flex-row">
        <Button
          onClick={onAddRule}
          aria-label={t('raw.buttons.addRule', 'Add RAW Rule')}
        >
          <Plus
            className="mr-component-sm h-4 w-4"
            aria-hidden="true"
          />
          {t('raw.buttons.addRule', 'Add RAW Rule')}
        </Button>
        <Button
          variant="outline"
          onClick={onBogonFilter}
          aria-label={t('raw.buttons.bogonFilter', 'Bogon Filter')}
        >
          <Shield
            className="mr-component-sm h-4 w-4"
            aria-hidden="true"
          />
          {t('raw.buttons.bogonFilter', 'Bogon Filter')}
        </Button>
      </CardContent>
    </Card>
  );
});

// ============================================================================
// Performance Explanation Component
// ============================================================================

/**
 * @description Collapsible performance explanation section
 */
const PerformanceExplanation = memo(function PerformanceExplanation() {
  const { t } = useTranslation('firewall');
  const { performanceSectionExpanded, setPerformanceSectionExpanded } = useRawUIStore();

  return (
    <Collapsible
      open={performanceSectionExpanded}
      onOpenChange={setPerformanceSectionExpanded}
    >
      <Card className="mt-component-md">
        <CardHeader className="pb-component-sm">
          <CollapsibleTrigger asChild>
            <button
              className="focus-visible:ring-ring flex w-full items-center justify-between rounded-[var(--semantic-radius-button)] text-left transition-opacity hover:opacity-80 focus-visible:ring-2 focus-visible:ring-offset-2"
              aria-label={t('raw.performance.title', 'Why use RAW table?')}
              aria-expanded={performanceSectionExpanded}
            >
              <div className="gap-component-sm flex items-center">
                <Zap
                  className="text-warning h-5 w-5"
                  aria-hidden="true"
                />
                <CardTitle className="font-display text-lg">
                  {t('raw.performance.title', 'Why use RAW table?')}
                </CardTitle>
              </div>
              <ChevronDown
                className={`h-5 w-5 transition-transform ${performanceSectionExpanded ? 'rotate-180' : ''}`}
                aria-hidden="true"
              />
            </button>
          </CollapsibleTrigger>
          <CardDescription>
            {t('raw.performance.subtitle', 'Performance optimization and DDoS protection')}
          </CardDescription>
        </CardHeader>
        <CollapsibleContent>
          <CardContent className="space-y-component-md">
            {/* Main Explanation */}
            <div className="bg-muted border-border p-component-md rounded-[var(--semantic-radius-card)] border">
              <p className="text-sm">
                {t(
                  'raw.performance.explanation',
                  'The RAW table processes packets BEFORE connection tracking. This is critical for performance because connection tracking is expensive (CPU and memory). By dropping unwanted traffic in RAW, you prevent connection tracking overhead.'
                )}
              </p>
            </div>

            {/* Benefits */}
            <div>
              <h4 className="mb-component-sm gap-component-sm font-display flex items-center text-sm font-semibold">
                <Info
                  className="text-success h-4 w-4"
                  aria-hidden="true"
                />
                {t('raw.performance.benefits.title', 'Key Benefits')}
              </h4>
              <ul className="space-y-component-sm text-muted-foreground text-sm">
                <li className="gap-component-sm flex">
                  <span className="text-success">✓</span>
                  <span>
                    {t(
                      'raw.performance.tips.tip_drop',
                      'Packets dropped in RAW table bypass connection tracking, saving CPU and memory'
                    )}
                  </span>
                </li>
                <li className="gap-component-sm flex">
                  <span className="text-success">✓</span>
                  <span>
                    {t(
                      'raw.performance.benefits.items.0',
                      'Ideal for DDoS protection - drop attacks before they consume resources'
                    )}
                  </span>
                </li>
                <li className="gap-component-sm flex">
                  <span className="text-success">✓</span>
                  <span>
                    {t(
                      'raw.performance.tips.tip_notrack',
                      'Notrack action skips connection tracking for high-volume traffic'
                    )}
                  </span>
                </li>
                <li className="gap-component-sm flex">
                  <span className="text-success">✓</span>
                  <span>
                    {t(
                      'raw.performance.benefits.items.4',
                      'Reduces connection table size by preventing tracked connections for dropped packets'
                    )}
                  </span>
                </li>
              </ul>
            </div>

            {/* Use Cases */}
            <div>
              <h4 className="mb-component-sm font-display text-sm font-semibold">
                {t('raw.performance.useCases.title', 'Common Use Cases')}
              </h4>
              <ul className="space-y-component-sm text-muted-foreground list-inside list-disc text-sm">
                {[0, 1, 2, 3, 4].map((i) => (
                  <li key={i}>{t(`raw.performance.useCases.items.${i}`, `Use case ${i + 1}`)}</li>
                ))}
              </ul>
            </div>

            {/* Warnings */}
            <div
              className="bg-warning/10 border-warning p-component-md rounded-[var(--semantic-radius-card)] border"
              role="alert"
            >
              <h4 className="mb-component-sm gap-component-sm text-warning font-display flex items-center text-sm font-semibold">
                <AlertTriangle
                  className="h-4 w-4"
                  aria-hidden="true"
                />
                {t('raw.performance.warnings.title', 'Important Warnings')}
              </h4>
              <ul className="space-y-component-sm text-warning list-inside list-disc text-sm">
                {[0, 1, 2, 3, 4].map((i) => (
                  <li key={i}>{t(`raw.performance.warnings.items.${i}`, `Warning ${i + 1}`)}</li>
                ))}
              </ul>
            </div>
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
});

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
    <div className="flex h-full flex-col">
      {/* Page Header */}
      <div className="border-border bg-background/95 supports-[backdrop-filter]:bg-background/60 border-b backdrop-blur">
        <div className="p-component-md gap-component-md flex flex-col items-start justify-between sm:flex-row sm:items-center">
          <div>
            <h1 className="font-display text-2xl font-bold tracking-tight">
              {t('raw.title', 'RAW Firewall Rules')}
            </h1>
            <p className="text-muted-foreground text-sm">
              {t('raw.subtitle', 'Pre-connection tracking packet processing')}
            </p>
          </div>
          <div className="gap-component-sm flex flex-wrap">
            <Button
              variant="outline"
              onClick={handleBogonFilter}
              aria-label={t('raw.buttons.bogonFilter', 'Bogon Filter')}
            >
              <Shield
                className="mr-component-sm h-4 w-4"
                aria-hidden="true"
              />
              {t('raw.buttons.bogonFilter', 'Bogon Filter')}
            </Button>
            <Button
              onClick={handleAddRule}
              aria-label={t('raw.buttons.addRule', 'Add Rule')}
            >
              <Plus
                className="mr-component-sm h-4 w-4"
                aria-hidden="true"
              />
              {t('raw.buttons.addRule', 'Add Rule')}
            </Button>
          </div>
        </div>
      </div>

      {/* Notice Banner */}
      <div className="p-component-md pb-0">
        <Alert>
          <Info
            className="h-4 w-4"
            aria-hidden="true"
          />
          <AlertTitle>{t('raw.performance.title', 'Why use RAW table?')}</AlertTitle>
          <AlertDescription>
            {t(
              'raw.description',
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
          className="flex h-full flex-col"
        >
          <div className="border-border px-component-md border-b">
            <TabsList className={isMobile ? 'w-full justify-start' : ''}>
              {chains.map((chain) => (
                <TabsTrigger
                  key={chain}
                  value={chain}
                  className="capitalize"
                >
                  {t(`raw.chains.${chain}`, chain)}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>

          <div className="flex-1 overflow-y-auto">
            {/* Individual Chain Tabs */}
            {chains.map((chain) => (
              <TabsContent
                key={chain}
                value={chain}
                className="p-component-md space-y-component-md m-0"
              >
                {isLoading ?
                  <div
                    className="space-y-component-md"
                    role="status"
                    aria-label={t('common:loading', { defaultValue: 'Loading' })}
                  >
                    <div className="space-y-component-md animate-pulse">
                      <div className="bg-muted h-16 rounded" />
                      <div className="bg-muted h-16 rounded" />
                    </div>
                  </div>
                : !rules || rules.length === 0 ?
                  <EmptyState
                    chain={chain}
                    onAddRule={handleAddRule}
                    onBogonFilter={handleBogonFilter}
                  />
                : <RawRulesTable chain={chain} />}

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
