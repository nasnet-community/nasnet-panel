/**
 * NATRulesTableMobile Component
 * @description Card-based list view for NAT rules optimized for mobile devices
 * Epic 0.6, Story 0.6.2
 */

import { memo, useState, useCallback } from 'react';
import { useNATRules, useDeleteNATRule, useToggleNATRule } from '@nasnet/api-client/queries';
import { useConnectionStore, useNATUIStore } from '@nasnet/state/stores';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Badge,
  Button,
  toast,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@nasnet/ui/primitives';
import { SafetyConfirmation } from '@nasnet/ui/patterns';
import { MoreVertical, Eye, EyeOff, Edit, Trash2 } from 'lucide-react';
import type { NATRule } from '@nasnet/core/types';

// ============================================================================
// CONSTANTS
// ============================================================================

const NAT_ACTION_VARIANTS: Record<
  string,
  'default' | 'info' | 'secondary' | 'warning' | 'outline'
> = {
  masquerade: 'info',
  'dst-nat': 'secondary',
  'src-nat': 'default',
  redirect: 'warning',
};

// ============================================================================
// Action Badge Component
// ============================================================================

/**
 * NATActionBadge Component
 * @description Badge displaying NAT action type with semantic color
 */
const NATActionBadge = memo(function NATActionBadge({ action }: { action: string }) {
  const variant = NAT_ACTION_VARIANTS[action] || 'outline';

  return (
    <Badge
      variant={variant}
      className="text-xs"
      role="img"
      aria-label={`NAT action: ${action}`}
    >
      {action}
    </Badge>
  );
});

// ============================================================================
// Chain Badge Component
// ============================================================================

/**
 * ChainBadge Component
 * @description Badge displaying NAT chain name in monospace font
 */
const ChainBadge = memo(function ChainBadge({ chain }: { chain: string }) {
  return (
    <Badge
      variant="secondary"
      className="font-mono text-xs"
      role="img"
      aria-label={`Chain: ${chain}`}
    >
      {chain}
    </Badge>
  );
});

// ============================================================================
// Rule Card Component
// ============================================================================

/**
 * RuleCardProps
 * @description Props for single NAT rule card
 */
interface RuleCardProps {
  rule: NATRule;
  onEdit: (rule: NATRule) => void;
  onDelete: (ruleId: string) => void;
  onToggle: (ruleId: string, disabled: boolean) => void;
}

/**
 * RuleCard Component
 * @description Card displaying single NAT rule with inline actions
 */
const RuleCard = memo(function RuleCard({ rule, onEdit, onDelete, onToggle }: RuleCardProps) {
  return (
    <Card className={rule.disabled ? 'bg-muted/50 opacity-50' : ''}>
      <CardHeader className="pb-component-sm">
        <div className="gap-component-sm flex items-start justify-between">
          <div className="space-y-component-sm flex-1">
            <div className="gap-component-sm flex flex-wrap items-center">
              <span className="text-muted-foreground font-mono text-xs">#{rule.order}</span>
              <ChainBadge chain={rule.chain} />
              <NATActionBadge action={rule.action} />
            </div>
            {rule.comment && <CardTitle className="text-sm font-normal">{rule.comment}</CardTitle>}
          </div>

          {/* Actions Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="focus-visible:ring-ring min-h-[44px] min-w-[44px] focus-visible:ring-2 focus-visible:ring-offset-2"
                aria-label={`Actions for NAT rule ${rule.order}`}
              >
                <MoreVertical
                  className="h-4 w-4"
                  aria-hidden="true"
                />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onEdit(rule)}>
                <Edit
                  className="mr-component-sm h-4 w-4"
                  aria-hidden="true"
                />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onToggle(rule.id, !rule.disabled)}>
                {rule.disabled ?
                  <>
                    <Eye
                      className="mr-component-sm h-4 w-4"
                      aria-hidden="true"
                    />
                    Enable
                  </>
                : <>
                    <EyeOff
                      className="mr-component-sm h-4 w-4"
                      aria-hidden="true"
                    />
                    Disable
                  </>
                }
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => onDelete(rule.id)}
                className="text-error"
              >
                <Trash2
                  className="mr-component-sm h-4 w-4"
                  aria-hidden="true"
                />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>

      <CardContent className="space-y-component-sm text-sm">
        {/* Protocol */}
        {rule.protocol && (
          <div className="flex justify-between">
            <span className="text-muted-foreground">Protocol:</span>
            <span className={`font-mono text-sm ${rule.disabled ? 'line-through' : ''}`}>
              {rule.protocol.toUpperCase()}
            </span>
          </div>
        )}

        {/* Addresses */}
        {rule.srcAddress && (
          <div className="flex justify-between">
            <span className="text-muted-foreground">Src Address:</span>
            <span className={`font-mono text-sm ${rule.disabled ? 'line-through' : ''}`}>
              {rule.srcAddress}
            </span>
          </div>
        )}
        {rule.dstAddress && (
          <div className="flex justify-between">
            <span className="text-muted-foreground">Dst Address:</span>
            <span className={`font-mono text-sm ${rule.disabled ? 'line-through' : ''}`}>
              {rule.dstAddress}
            </span>
          </div>
        )}

        {/* Ports */}
        {rule.srcPort && (
          <div className="flex justify-between">
            <span className="text-muted-foreground">Src Port:</span>
            <span className={`font-mono text-sm ${rule.disabled ? 'line-through' : ''}`}>
              {rule.srcPort}
            </span>
          </div>
        )}
        {rule.dstPort && (
          <div className="flex justify-between">
            <span className="text-muted-foreground">Dst Port:</span>
            <span className={`font-mono text-sm ${rule.disabled ? 'line-through' : ''}`}>
              {rule.dstPort}
            </span>
          </div>
        )}

        {/* NAT Target */}
        {rule.toAddresses && (
          <div className="flex justify-between">
            <span className="text-muted-foreground">To Addresses:</span>
            <span
              className={`font-mono text-sm font-medium ${rule.disabled ? 'line-through' : ''}`}
            >
              {rule.toAddresses}
            </span>
          </div>
        )}
        {rule.toPorts && (
          <div className="flex justify-between">
            <span className="text-muted-foreground">To Ports:</span>
            <span
              className={`font-mono text-sm font-medium ${rule.disabled ? 'line-through' : ''}`}
            >
              {rule.toPorts}
            </span>
          </div>
        )}

        {/* Interfaces */}
        {rule.inInterface && (
          <div className="flex justify-between">
            <span className="text-muted-foreground">In Interface:</span>
            <span className={`font-mono text-sm ${rule.disabled ? 'line-through' : ''}`}>
              {rule.inInterface}
            </span>
          </div>
        )}
        {rule.outInterface && (
          <div className="flex justify-between">
            <span className="text-muted-foreground">Out Interface:</span>
            <span className={`font-mono text-sm ${rule.disabled ? 'line-through' : ''}`}>
              {rule.outInterface}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
});

// ============================================================================
// Main Component
// ============================================================================

export interface NATRulesTableMobileProps {
  chain?: string;
  onEditRule?: (rule: NATRule) => void;
}

export const NATRulesTableMobile = memo(function NATRulesTableMobile({
  chain,
  onEditRule,
}: NATRulesTableMobileProps) {
  const routerIp = useConnectionStore((state) => state.currentRouterIp) || '';
  const { data: allRules, isLoading, error } = useNATRules(routerIp);
  const { showDisabledRules } = useNATUIStore();

  const deleteRuleMutation = useDeleteNATRule(routerIp);
  const toggleRuleMutation = useToggleNATRule(routerIp);

  const [ruleToDelete, setRuleToDelete] = useState<string | null>(null);

  // Filter rules by chain if specified
  const rules = chain && chain !== 'all' ? allRules?.filter((r) => r.chain === chain) : allRules;

  // Filter out disabled rules if needed
  const filteredRules = showDisabledRules ? rules : rules?.filter((r) => !r.disabled);

  // ========================================
  // Handlers
  // ========================================

  const handleEdit = useCallback(
    (rule: NATRule) => {
      onEditRule?.(rule);
    },
    [onEditRule]
  );

  const handleDelete = useCallback((ruleId: string) => {
    setRuleToDelete(ruleId);
  }, []);

  const handleConfirmDelete = useCallback(async () => {
    if (!ruleToDelete) return;

    try {
      await deleteRuleMutation.mutateAsync(ruleToDelete);
      toast({
        title: 'NAT Rule Deleted',
        description: 'The NAT rule has been deleted successfully.',
        variant: 'default',
      });
      setRuleToDelete(null);
    } catch (error) {
      toast({
        title: 'Failed to Delete NAT Rule',
        description: error instanceof Error ? error.message : 'Unknown error occurred',
        variant: 'destructive',
      });
    }
  }, [ruleToDelete, deleteRuleMutation]);

  const handleToggle = useCallback(
    async (ruleId: string, disabled: boolean) => {
      try {
        await toggleRuleMutation.mutateAsync({ ruleId, disabled });
        toast({
          title: disabled ? 'NAT Rule Disabled' : 'NAT Rule Enabled',
          description: `The NAT rule has been ${disabled ? 'disabled' : 'enabled'}.`,
          variant: 'default',
        });
      } catch (error) {
        toast({
          title: 'Failed to Toggle NAT Rule',
          description: error instanceof Error ? error.message : 'Unknown error occurred',
          variant: 'destructive',
        });
      }
    },
    [toggleRuleMutation]
  );

  // ========================================
  // Render States
  // ========================================

  if (isLoading) {
    return (
      <div className="space-y-component-sm p-component-md">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="animate-pulse"
          >
            <div className="bg-muted h-32 rounded-lg" />
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div
        className="p-component-md text-error"
        role="alert"
      >
        Error loading NAT rules: {error.message}
      </div>
    );
  }

  if (!filteredRules || filteredRules.length === 0) {
    return (
      <div className="p-component-xl text-muted-foreground text-center">
        No NAT rules found {chain && chain !== 'all' ? `in ${chain} chain` : ''}
      </div>
    );
  }

  return (
    <>
      <div
        className="space-y-component-sm p-component-md"
        role="list"
        aria-label="NAT rules"
      >
        {filteredRules.map((rule) => (
          <div
            key={rule.id}
            role="listitem"
          >
            <RuleCard
              rule={rule}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onToggle={handleToggle}
            />
          </div>
        ))}
      </div>

      {/* Safety Confirmation for Delete */}
      <SafetyConfirmation
        open={!!ruleToDelete}
        onOpenChange={(open) => !open && setRuleToDelete(null)}
        title="Delete NAT Rule"
        description="You are about to permanently delete this NAT rule. This action cannot be undone."
        consequences={[
          'The NAT rule will be removed from the firewall',
          'Traffic matching this rule will no longer be translated',
          'Existing connections may be disrupted',
          'Port forwarding or masquerading will stop working',
        ]}
        confirmText="DELETE"
        countdownSeconds={3}
        onConfirm={handleConfirmDelete}
        onCancel={() => setRuleToDelete(null)}
      />
    </>
  );
});

NATRulesTableMobile.displayName = 'NATRulesTableMobile';
