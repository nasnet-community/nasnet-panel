/**
 * NAT Rules Page Component
 *
 * Main page for managing NAT rules with chain tabs and action buttons.
 *
 * Features:
 * - Tabs for chain filtering (All / Source NAT / Destination NAT)
 * - Header with action buttons:
 *   * "Quick Masquerade" → MasqueradeQuickDialog
 *   * "Port Forward Wizard" → PortForwardWizardDialog
 *   * "Add NAT Rule" → NATRuleBuilder
 * - NATRulesTable component (desktop: DataTable, mobile: Card list)
 * - Row actions: Edit, Delete (with SafetyConfirmation), Toggle disable
 * - Loading states, error handling
 * - Empty states with helpful CTAs
 *
 * @see NAS-7.2: Implement NAT Configuration - Task 9
 */

import { memo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNATUIStore, useConnectionStore } from '@nasnet/state/stores';
import { useNATRules } from '@nasnet/api-client/queries';
import { NATRulesTable } from '../components/NATRulesTable';
import { NATRulesTableMobile } from '../components/NATRulesTableMobile';
import { MasqueradeQuickDialog } from '../components/MasqueradeQuickDialog';
import { PortForwardWizardDialog } from '../components/PortForwardWizardDialog';
import { NATRuleBuilder } from '@nasnet/ui/patterns/security/nat-rule-builder';
import type { NatChain, NATRule } from '@nasnet/core/types';
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
} from '@nasnet/ui/primitives';
import { Plus, Zap, Globe } from 'lucide-react';
import { cn } from '@nasnet/ui/utils';
import { usePlatform } from '@nasnet/ui/patterns';

// ============================================================================
// Empty State Component
// ============================================================================

interface EmptyStateProps {
  chain?: NatChain;
  onAddRule: () => void;
  onQuickMasquerade: () => void;
  onPortForward: () => void;
}

/**
 * @description Empty state shown when no NAT rules exist
 */
const EmptyState = memo(function EmptyState({
  chain,
  onAddRule,
  onQuickMasquerade,
  onPortForward,
}: EmptyStateProps) {
  const { t } = useTranslation('firewall');

  // Chain-specific empty states
  if (chain === 'srcnat') {
    return (
      <Card className="border-dashed">
        <CardHeader className="text-center">
          <CardTitle>No Source NAT Rules</CardTitle>
          <CardDescription>
            Create masquerade rules to hide internal IPs behind your router's WAN interface.
          </CardDescription>
        </CardHeader>
        <CardContent className="gap-component-sm flex flex-col justify-center sm:flex-row">
          <Button
            onClick={onQuickMasquerade}
            aria-label="Quick Masquerade"
          >
            <Zap
              className="mr-component-sm h-4 w-4"
              aria-hidden="true"
            />
            Quick Masquerade
          </Button>
          <Button
            variant="outline"
            onClick={onAddRule}
            aria-label="Add Custom Rule"
          >
            <Plus
              className="mr-component-sm h-4 w-4"
              aria-hidden="true"
            />
            Add Custom Rule
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (chain === 'dstnat') {
    return (
      <Card className="border-dashed">
        <CardHeader className="text-center">
          <CardTitle>No Destination NAT Rules</CardTitle>
          <CardDescription>
            Create port forwarding rules to expose internal services to the internet.
          </CardDescription>
        </CardHeader>
        <CardContent className="gap-component-sm flex flex-col justify-center sm:flex-row">
          <Button
            onClick={onPortForward}
            aria-label="Port Forward Wizard"
          >
            <Globe
              className="mr-component-sm h-4 w-4"
              aria-hidden="true"
            />
            Port Forward Wizard
          </Button>
          <Button
            variant="outline"
            onClick={onAddRule}
            aria-label="Add Custom Rule"
          >
            <Plus
              className="mr-component-sm h-4 w-4"
              aria-hidden="true"
            />
            Add Custom Rule
          </Button>
        </CardContent>
      </Card>
    );
  }

  // All chains empty state
  return (
    <Card className="border-dashed">
      <CardHeader className="text-center">
        <CardTitle>No NAT Rules Configured</CardTitle>
        <CardDescription>
          Get started by creating a masquerade rule or setting up port forwarding.
        </CardDescription>
      </CardHeader>
      <CardContent className="gap-component-sm flex flex-col justify-center sm:flex-row">
        <Button
          onClick={onQuickMasquerade}
          aria-label="Quick Masquerade"
        >
          <Zap
            className="mr-component-sm h-4 w-4"
            aria-hidden="true"
          />
          Quick Masquerade
        </Button>
        <Button
          onClick={onPortForward}
          aria-label="Port Forward Wizard"
        >
          <Globe
            className="mr-component-sm h-4 w-4"
            aria-hidden="true"
          />
          Port Forward Wizard
        </Button>
        <Button
          variant="outline"
          onClick={onAddRule}
          aria-label="Add NAT Rule"
        >
          <Plus
            className="mr-component-sm h-4 w-4"
            aria-hidden="true"
          />
          Add NAT Rule
        </Button>
      </CardContent>
    </Card>
  );
});

// ============================================================================
// Main Component
// ============================================================================

/**
 * NATRulesPage Component
 *
 * Main page for NAT rules management with chain-based tabs.
 * Supports source NAT (masquerade), destination NAT (port forwarding), and custom rules.
 *
 * @description NAT rule configuration and management
 * @returns NAT rules page component
 */
export const NATRulesPage = memo(function NATRulesPage() {
  const { t } = useTranslation('firewall');
  const platform = usePlatform();
  const isMobile = platform === 'mobile';

  const routerIp = useConnectionStore((state) => state.currentRouterIp) || '';
  const { selectedChain, setSelectedChain } = useNATUIStore();

  const [showAddRule, setShowAddRule] = useState(false);
  const [showMasqueradeDialog, setShowMasqueradeDialog] = useState(false);
  const [showPortForwardWizard, setShowPortForwardWizard] = useState(false);
  const [editingRule, setEditingRule] = useState<NATRule | null>(null);

  const chains: NatChain[] = ['srcnat', 'dstnat'];

  // Fetch rules for current chain
  const { data: rules, isLoading, refetch } = useNATRules(routerIp);

  // Filter rules by selected chain
  const filteredRules =
    selectedChain === 'all' ? rules : rules?.filter((r) => (r.chain as string) === selectedChain);

  // ========================================
  // Handlers
  // ========================================

  const handleAddRule = () => {
    setEditingRule(null);
    setShowAddRule(true);
  };

  const handleQuickMasquerade = () => {
    setShowMasqueradeDialog(true);
  };

  const handlePortForward = () => {
    setShowPortForwardWizard(true);
  };

  const handleTabChange = (value: string) => {
    setSelectedChain(value as NatChain | 'all');
  };

  const handleEditRule = (rule: NATRule) => {
    setEditingRule(rule);
    setShowAddRule(true);
  };

  const handleRuleSaved = async () => {
    await refetch();
  };

  const handleSuccess = async () => {
    await refetch();
  };

  // ========================================
  // Render
  // ========================================

  return (
    <div className="flex h-full flex-col">
      {/* Page Header */}
      <div className="border-border bg-background/95 supports-[backdrop-filter]:bg-background/60 border-b backdrop-blur">
        <div className="p-component-md flex items-center justify-between">
          <div>
            <h1 className="font-display text-2xl font-bold tracking-tight">NAT Rules</h1>
            <p className="text-muted-foreground text-sm">
              Manage network address translation for traffic routing
            </p>
          </div>
          <div className="gap-component-sm flex">
            {!isMobile && (
              <>
                <Button
                  variant="outline"
                  onClick={handleQuickMasquerade}
                  aria-label="Quick Masquerade"
                >
                  <Zap
                    className="mr-component-sm h-4 w-4"
                    aria-hidden="true"
                  />
                  Quick Masquerade
                </Button>
                <Button
                  variant="outline"
                  onClick={handlePortForward}
                  aria-label="Port Forward Wizard"
                >
                  <Globe
                    className="mr-component-sm h-4 w-4"
                    aria-hidden="true"
                  />
                  Port Forward Wizard
                </Button>
              </>
            )}
            <Button
              onClick={handleAddRule}
              aria-label="Add NAT Rule"
            >
              <Plus
                className="mr-component-sm h-4 w-4"
                aria-hidden="true"
              />
              Add NAT Rule
            </Button>
          </div>
        </div>

        {/* Mobile Action Buttons */}
        {isMobile && (
          <div className="gap-component-sm px-component-md pb-component-md flex">
            <Button
              variant="outline"
              size="sm"
              onClick={handleQuickMasquerade}
              className="flex-1"
              aria-label="Masquerade"
            >
              <Zap
                className="mr-component-sm h-4 w-4"
                aria-hidden="true"
              />
              Masquerade
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handlePortForward}
              className="flex-1"
              aria-label="Port Forward"
            >
              <Globe
                className="mr-component-sm h-4 w-4"
                aria-hidden="true"
              />
              Port Forward
            </Button>
          </div>
        )}
      </div>

      {/* Chain Tabs */}
      <div className="flex-1 overflow-hidden">
        <Tabs
          value={selectedChain}
          onValueChange={handleTabChange}
          className="flex h-full flex-col"
        >
          <div className="border-border px-component-md border-b">
            <TabsList className={isMobile ? 'w-full justify-start overflow-x-auto' : ''}>
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="srcnat">Source NAT</TabsTrigger>
              <TabsTrigger value="dstnat">Destination NAT</TabsTrigger>
            </TabsList>
          </div>

          <div className="flex-1 overflow-y-auto">
            {/* All Chains Tab */}
            <TabsContent
              value="all"
              className="p-component-md m-0"
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
                    <div className="bg-muted h-16 rounded" />
                  </div>
                </div>
              : !filteredRules || filteredRules.length === 0 ?
                <EmptyState
                  onAddRule={handleAddRule}
                  onQuickMasquerade={handleQuickMasquerade}
                  onPortForward={handlePortForward}
                />
              : isMobile ?
                <NATRulesTableMobile onEditRule={handleEditRule} />
              : <NATRulesTable onEditRule={handleEditRule} />}
            </TabsContent>

            {/* Individual Chain Tabs */}
            {chains.map((chain) => (
              <TabsContent
                key={chain}
                value={chain}
                className="p-component-md m-0"
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
                : !filteredRules || filteredRules.length === 0 ?
                  <EmptyState
                    chain={chain}
                    onAddRule={handleAddRule}
                    onQuickMasquerade={handleQuickMasquerade}
                    onPortForward={handlePortForward}
                  />
                : isMobile ?
                  <NATRulesTableMobile
                    chain={chain}
                    onEditRule={handleEditRule}
                  />
                : <NATRulesTable
                    chain={chain}
                    onEditRule={handleEditRule}
                  />
                }
              </TabsContent>
            ))}
          </div>
        </Tabs>
      </div>

      {/* NAT Rule Builder */}
      <NATRuleBuilder
        routerId={routerIp}
        initialRule={
          editingRule ?
            ({
              chain: editingRule.chain,
              action: editingRule.action,
              protocol: editingRule.protocol,
              srcAddress: editingRule.srcAddress,
              dstAddress: editingRule.dstAddress,
              srcPort: editingRule.srcPort,
              dstPort: editingRule.dstPort,
              inInterface: editingRule.inInterface,
              outInterface: editingRule.outInterface,
              toAddresses: editingRule.toAddresses,
              toPorts: editingRule.toPorts,
              comment: editingRule.comment,
            } as any)
          : undefined
        }
        open={showAddRule}
        onClose={() => {
          setShowAddRule(false);
          setEditingRule(null);
        }}
        onSave={async () => {
          await handleRuleSaved();
          setShowAddRule(false);
          setEditingRule(null);
        }}
        mode={editingRule ? 'edit' : 'create'}
      />

      {/* Masquerade Quick Dialog */}
      <MasqueradeQuickDialog
        open={showMasqueradeDialog}
        onOpenChange={setShowMasqueradeDialog}
        routerIp={routerIp}
        onSuccess={handleSuccess}
      />

      {/* Port Forward Wizard Dialog */}
      <PortForwardWizardDialog
        open={showPortForwardWizard}
        onOpenChange={setShowPortForwardWizard}
        routerIp={routerIp}
        onSuccess={handleSuccess}
      />
    </div>
  );
});

NATRulesPage.displayName = 'NATRulesPage';

export default NATRulesPage;
