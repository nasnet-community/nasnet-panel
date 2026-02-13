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

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useMangleUIStore } from '@nasnet/state/stores';
import { useConnectionStore } from '@nasnet/state/stores';
import { useMangleRules } from '@nasnet/api-client/queries/firewall';
import { MangleRulesTable } from '../components/MangleRulesTable';
import { MangleRulesTableMobile } from '../components/MangleRulesTableMobile';
import { MangleRuleEditor } from '@nasnet/ui/patterns/mangle-rule-editor';
import { MangleFlowDiagram } from '@nasnet/ui/patterns/mangle-flow-diagram';
import type { MangleChain } from '@nasnet/core/types';
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@nasnet/ui/primitives';
import { Plus, Workflow } from 'lucide-react';

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
  chain?: MangleChain;
  onAddRule: () => void;
}

function EmptyState({ chain, onAddRule }: EmptyStateProps) {
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
        <Button onClick={onAddRule}>
          <Plus className="h-4 w-4 mr-2" />
          {chain
            ? t('mangle.emptyStates.noRulesInChain.action', { chain })
            : t('mangle.emptyStates.noRules.actions.create')}
        </Button>
      </CardContent>
    </Card>
  );
}

// ============================================================================
// Main Component
// ============================================================================

/**
 * ManglePage Component
 *
 * Main page for mangle rules management with chain-based tabs.
 *
 * @returns Mangle page component
 */
export function ManglePage() {
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
    selectedChain === 'all' ? undefined : selectedChain
  );

  const handleAddRule = () => {
    setShowAddRule(true);
  };

  const handleViewFlow = () => {
    setShowFlowDiagram(true);
  };

  const handleTabChange = (value: string) => {
    setSelectedChain(value as MangleChain | 'all');
  };

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
            <Button variant="outline" onClick={handleViewFlow}>
              <Workflow className="h-4 w-4 mr-2" />
              {t('mangle.buttons.viewFlow')}
            </Button>
            <Button onClick={handleAddRule}>
              <Plus className="h-4 w-4 mr-2" />
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
                <div className="space-y-4">
                  <div className="animate-pulse space-y-4">
                    <div className="h-16 bg-slate-200 dark:bg-slate-700 rounded" />
                    <div className="h-16 bg-slate-200 dark:bg-slate-700 rounded" />
                    <div className="h-16 bg-slate-200 dark:bg-slate-700 rounded" />
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
                  <div className="space-y-4">
                    <div className="animate-pulse space-y-4">
                      <div className="h-16 bg-slate-200 dark:bg-slate-700 rounded" />
                      <div className="h-16 bg-slate-200 dark:bg-slate-700 rounded" />
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
              rule={{ chain: selectedChain === 'all' ? 'prerouting' : selectedChain }}
              onClose={() => setShowAddRule(false)}
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
}

/**
 * Export for route configuration
 */
export default ManglePage;
