/**
 * NAT Rules Table Mobile Component
 * Card-based list view optimized for mobile devices
 * Epic 0.6, Story 0.6.2
 */

import { memo, useState } from 'react';
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
// Action Badge Component
// ============================================================================

const NATActionBadge = memo(function NATActionBadge({ action }: { action: string }) {
  const variantMap: Record<string, 'default' | 'info' | 'secondary' | 'warning' | 'outline'> = {
    masquerade: 'info',
    'dst-nat': 'secondary',
    'src-nat': 'default',
    redirect: 'warning',
  };

  const variant = variantMap[action] || 'outline';

  return (
    <Badge variant={variant} className="text-xs">
      {action}
    </Badge>
  );
});

// ============================================================================
// Chain Badge Component
// ============================================================================

const ChainBadge = memo(function ChainBadge({ chain }: { chain: string }) {
  return (
    <Badge variant="secondary" className="font-mono text-xs">
      {chain}
    </Badge>
  );
});

// ============================================================================
// Rule Card Component
// ============================================================================

interface RuleCardProps {
  rule: NATRule;
  onEdit: (rule: NATRule) => void;
  onDelete: (ruleId: string) => void;
  onToggle: (ruleId: string, disabled: boolean) => void;
}

const RuleCard = memo(function RuleCard({ rule, onEdit, onDelete, onToggle }: RuleCardProps) {
  return (
    <Card className={rule.disabled ? 'opacity-50 bg-muted/50' : ''}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-mono text-xs text-muted-foreground">#{rule.order}</span>
              <ChainBadge chain={rule.chain} />
              <NATActionBadge action={rule.action} />
            </div>
            {rule.comment && (
              <CardTitle className="text-sm font-normal">{rule.comment}</CardTitle>
            )}
          </div>

          {/* Actions Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="min-h-[44px] min-w-[44px] focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                aria-label={`Actions for rule ${rule.order}`}
              >
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onEdit(rule)}>
                <Edit className="h-4 w-4 mr-2" aria-hidden="true" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onToggle(rule.id, !rule.disabled)}>
                {rule.disabled ? (
                  <>
                    <Eye className="h-4 w-4 mr-2" aria-hidden="true" />
                    Enable
                  </>
                ) : (
                  <>
                    <EyeOff className="h-4 w-4 mr-2" aria-hidden="true" />
                    Disable
                  </>
                )}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => onDelete(rule.id)} className="text-destructive">
                <Trash2 className="h-4 w-4 mr-2" aria-hidden="true" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>

      <CardContent className="space-y-2 text-sm">
        {/* Protocol */}
        {rule.protocol && (
          <div className="flex justify-between">
            <span className="text-muted-foreground">Protocol:</span>
            <span className={`font-mono ${rule.disabled ? 'line-through' : ''}`}>
              {rule.protocol.toUpperCase()}
            </span>
          </div>
        )}

        {/* Addresses */}
        {rule.srcAddress && (
          <div className="flex justify-between">
            <span className="text-muted-foreground">Src Address:</span>
            <span className={`font-mono ${rule.disabled ? 'line-through' : ''}`}>
              {rule.srcAddress}
            </span>
          </div>
        )}
        {rule.dstAddress && (
          <div className="flex justify-between">
            <span className="text-muted-foreground">Dst Address:</span>
            <span className={`font-mono ${rule.disabled ? 'line-through' : ''}`}>
              {rule.dstAddress}
            </span>
          </div>
        )}

        {/* Ports */}
        {rule.srcPort && (
          <div className="flex justify-between">
            <span className="text-muted-foreground">Src Port:</span>
            <span className={`font-mono ${rule.disabled ? 'line-through' : ''}`}>
              {rule.srcPort}
            </span>
          </div>
        )}
        {rule.dstPort && (
          <div className="flex justify-between">
            <span className="text-muted-foreground">Dst Port:</span>
            <span className={`font-mono ${rule.disabled ? 'line-through' : ''}`}>
              {rule.dstPort}
            </span>
          </div>
        )}

        {/* NAT Target */}
        {rule.toAddresses && (
          <div className="flex justify-between">
            <span className="text-muted-foreground">To Addresses:</span>
            <span className={`font-mono font-medium ${rule.disabled ? 'line-through' : ''}`}>
              {rule.toAddresses}
            </span>
          </div>
        )}
        {rule.toPorts && (
          <div className="flex justify-between">
            <span className="text-muted-foreground">To Ports:</span>
            <span className={`font-mono font-medium ${rule.disabled ? 'line-through' : ''}`}>
              {rule.toPorts}
            </span>
          </div>
        )}

        {/* Interfaces */}
        {rule.inInterface && (
          <div className="flex justify-between">
            <span className="text-muted-foreground">In Interface:</span>
            <span className={`font-mono ${rule.disabled ? 'line-through' : ''}`}>
              {rule.inInterface}
            </span>
          </div>
        )}
        {rule.outInterface && (
          <div className="flex justify-between">
            <span className="text-muted-foreground">Out Interface:</span>
            <span className={`font-mono ${rule.disabled ? 'line-through' : ''}`}>
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

export const NATRulesTableMobile = memo(function NATRulesTableMobile({ chain, onEditRule }: NATRulesTableMobileProps) {
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

  const handleEdit = (rule: NATRule) => {
    onEditRule?.(rule);
  };

  const handleDelete = (ruleId: string) => {
    setRuleToDelete(ruleId);
  };

  const handleConfirmDelete = async () => {
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
  };

  const handleToggle = async (ruleId: string, disabled: boolean) => {
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
  };

  // ========================================
  // Render States
  // ========================================

  if (isLoading) {
    return (
      <div className="space-y-3 p-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="animate-pulse">
            <div className="h-32 bg-muted rounded-lg" />
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 text-destructive" role="alert">
        Error loading NAT rules: {error.message}
      </div>
    );
  }

  if (!filteredRules || filteredRules.length === 0) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        No NAT rules found {chain && chain !== 'all' ? `in ${chain} chain` : ''}
      </div>
    );
  }

  return (
    <>
      <div className="space-y-3 p-4" role="list" aria-label="NAT rules">
        {filteredRules.map((rule) => (
          <div key={rule.id} role="listitem">
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
