/**
 * Mangle Page Component
 *
 * Main page for managing mangle rules with chain tabs and flow diagram.
 *
 * Features:
 * - Chain tabs (prerouting, input, forward, output, postrouting)
 * - "Add Rule" button → MangleRuleEditor in Sheet/Dialog
 * - "View Flow" button → MangleFlowDiagram in Dialog
 * - MangleRulesTable integration
 * - Loading skeletons
 * - Empty state when chain has no rules
 *
 * @see NAS-7.5: Implement Mangle Rules - Task 8
 */

import { memo, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { usePlatform } from '@nasnet/ui/patterns';
import { Button, Tabs, TabsContent, TabsList, TabsTrigger, Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, Card, CardContent, CardDescription, CardHeader, CardTitle } from '@nasnet/ui/primitives';
import { useMangleUIStore, useConnectionStore } from '@nasnet/state/stores';
import { useMangleRules } from '@nasnet/api-client/queries/firewall';
import { MangleRulesTable } from '../components/MangleRulesTable';
import { MangleRulesTableMobile } from '../components/MangleRulesTableMobile';
import { MangleRuleEditor } from '@nasnet/ui/patterns/mangle-rule-editor';
import { MangleFlowDiagram } from '@nasnet/ui/patterns/mangle-flow-diagram';
import type { MangleChain } from '@nasnet/core/types';
import { Plus, Workflow } from 'lucide-react';

// ============================================================================
// Empty State Component
// ============================================================================

/**
 * @description Empty state displayed when no mangle rules exist in the current chain
 */
interface EmptyStateProps {
  chain?: MangleChain;
  onAddRule: () => void;
}

const EmptyState = memo(function EmptyState({ chain, onAddRule }: EmptyStateProps) {
  const { t } = useTranslation('firewall');

  return (
    <Card className="border-dashed">
      <CardHeader className="text-center">
        <CardTitle>
          {chain
            ? t('mangle.emptyStates.noRulesInChain.title', { chain })
            : t('mangle.emptyStates.noRules.title')}
        </CardTitle>
        <CardDescription>
          {chain
            ? t('mangle.emptyStates.noRulesInChain.description')
            : t('mangle.emptyStates.noRules.description')}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex justify-center">
        <Button onClick={onAddRule} aria-label={chain ? t('mangle.emptyStates.noRulesInChain.action', { chain }) : t('mangle.emptyStates.noRules.actions.create')}>
          <Plus className="h-4 w-4 mr-2" aria-hidden="true" />
          {chain
            ? t('mangle.emptyStates.noRulesInChain.action', { chain })
            : t('mangle.emptyStates.noRules.actions.create')}
        </Button>
      </CardContent>
    </Card>
  );
});

EmptyState.displayName = 'EmptyState';

// ============================================================================
// Main Component
// ============================================================================

/**
 * ManglePage Component
 *
 * @description Main page for mangle rules management with chain-based tabs, add rule button, and flow diagram view.
 * Provides tab-based navigation across firewall packet modification chains (prerouting, input, forward, output, postrouting).
 *
 * @returns Mangle page component
 */
export const ManglePage = memo(function ManglePage() {
  const { t } = useTranslation('firewall');
  const platform = usePlatform();
  const isMobile = platform === 'mobile';

  const routerIp = useConnectionStore((state) => state.currentRouterIp) || '';
  const { selectedChain, setSelectedChain } = useMangleUIStore();

  const [showAddRule, setShowAddRule] = useState(false);
  const [showFlowDiagram, setShowFlowDiagram] = useState(false);

  const chains: MangleChain[] = ['prerouting', 'input', 'forward', 'output', 'postrouting'];

  // Fetch rules for current chain
  const { data: rules, isLoading } = useMangleRules(
    routerIp,
    selectedChain === 'all' ? undefined : { chain: selectedChain }
  );

  const handleAddRule = useCallback(() => {
    setShowAddRule(true);
  }, []);

  const handleViewFlow = useCallback(() => {
    setShowFlowDiagram(true);
  }, []);

  const handleTabChange = useCallback((value: string) => {
    setSelectedChain(value as MangleChain | 'all');
  }, [setSelectedChain]);

  return (
    <div className="h-full flex flex-col">
      {/* Page Header */}
      <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex items-center justify-between p-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{t('mangle.title')}</h1>
            <p className="text-sm text-muted-foreground">{t('mangle.subtitle')}</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleViewFlow} aria-label={t('mangle.buttons.viewFlow')}>
              <Workflow className="h-4 w-4 mr-2" aria-hidden="true" />
              {t('mangle.buttons.viewFlow')}
            </Button>
            <Button onClick={handleAddRule} aria-label={t('mangle.buttons.addRule')}>
              <Plus className="h-4 w-4 mr-2" aria-hidden="true" />
              {t('mangle.buttons.addRule')}
            </Button>
          </div>
        </div>
      </div>

      {/* Chain Tabs */}
      <div className="flex-1 overflow-hidden">
        <Tabs
          value={selectedChain}
          onValueChange={handleTabChange}
          className="h-full flex flex-col"
        >
          <div className="border-b px-4">
            <TabsList className={isMobile ? 'w-full justify-start overflow-x-auto' : ''}>
              <TabsTrigger value="all">
                {t('common:button.selectAll', { defaultValue: 'All' })}
              </TabsTrigger>
              {chains.map((chain) => (
                <TabsTrigger key={chain} value={chain}>
                  {t(`mangle.chains.${chain}`)}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>

          <div className="flex-1 overflow-y-auto">
            {/* All Chains Tab */}
            <TabsContent value="all" className="p-4 m-0">
              {isLoading ? (
                <div className="space-y-4" role="status" aria-label={t('common:loading', { defaultValue: 'Loading' })}>
                  <div className="animate-pulse space-y-4">
                    <div className="h-16 bg-muted rounded" />
                    <div className="h-16 bg-muted rounded" />
                    <div className="h-16 bg-muted rounded" />
                  </div>
                </div>
              ) : !rules || rules.length === 0 ? (
                <EmptyState onAddRule={handleAddRule} />
              ) : isMobile ? (
                <MangleRulesTableMobile />
              ) : (
                <MangleRulesTable />
              )}
            </TabsContent>

            {/* Individual Chain Tabs */}
            {chains.map((chain) => (
              <TabsContent key={chain} value={chain} className="p-4 m-0">
                {isLoading ? (
                  <div className="space-y-4" role="status" aria-label={t('common:loading', { defaultValue: 'Loading' })}>
                    <div className="animate-pulse space-y-4">
                      <div className="h-16 bg-muted rounded" />
                      <div className="h-16 bg-muted rounded" />
                    </div>
                  </div>
                ) : !rules || rules.length === 0 ? (
                  <EmptyState chain={chain} onAddRule={handleAddRule} />
                ) : isMobile ? (
                  <MangleRulesTableMobile chain={chain} />
                ) : (
                  <MangleRulesTable chain={chain} />
                )}
              </TabsContent>
            ))}
          </div>
        </Tabs>
      </div>

      {/* Add Rule Sheet */}
      <Sheet open={showAddRule} onOpenChange={setShowAddRule}>
        <SheetContent
          side={isMobile ? 'bottom' : 'right'}
          className={isMobile ? 'h-[90vh]' : 'w-full sm:max-w-2xl'}
        >
          <SheetHeader>
            <SheetTitle>{t('mangle.dialogs.addRule.title')}</SheetTitle>
            <SheetDescription>
              {t('mangle.dialogs.addRule.description')}
            </SheetDescription>
          </SheetHeader>
          <div className="mt-6">
            <MangleRuleEditor
              routerId={routerIp}
              initialRule={{ chain: selectedChain === 'all' ? 'prerouting' : selectedChain }}
              open={showAddRule}
              onClose={() => setShowAddRule(false)}
              onSave={async () => { setShowAddRule(false); }}
            />
          </div>
        </SheetContent>
      </Sheet>

      {/* Flow Diagram Dialog */}
      <Dialog open={showFlowDiagram} onOpenChange={setShowFlowDiagram}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t('mangle.dialogs.flowDiagram.title')}</DialogTitle>
            <DialogDescription>
              {t('mangle.dialogs.flowDiagram.description')}
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4">
            <MangleFlowDiagram />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
});

ManglePage.displayName = 'ManglePage';
