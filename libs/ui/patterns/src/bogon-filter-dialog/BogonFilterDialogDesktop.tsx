/**
 * BogonFilterDialogDesktop - Desktop Platform Presenter
 *
 * Dialog-based presentation optimized for desktop viewports (>1024px).
 * Features dense checkbox grid layout, all details visible, keyboard navigation support.
 *
 * Platform-Specific Optimizations:
 * - Floating Dialog with max-width constraint
 * - 2-column checkbox grid for efficient space usage
 * - All category descriptions and recommendations visible
 * - Full interface selector dropdown
 * - Supports tab navigation and Enter/Space activation
 * - Hover states for better discoverability
 *
 * @component
 * @internal Used by BogonFilterDialog platform detection wrapper
 *
 * @example
 * ```tsx
 * <BogonFilterDialogDesktop
 *   routerId="router-1"
 *   open={true}
 *   onClose={() => {}}
 *   onSuccess={(count) => console.log(`Created ${count} rules`)}
 *   availableInterfaces={['ether1-wan', 'pppoe-out1']}
 * />
 * ```
 *
 * @module @nasnet/ui/patterns/bogon-filter-dialog
 * @see [BogonFilterDialog](./BogonFilterDialog.tsx) - Auto-detecting wrapper
 * @see [useBogonFilterDialog](./use-bogon-filter-dialog.ts) - Headless logic hook
 */

import { memo, useState } from 'react';

import { Shield, AlertTriangle, Check, Info } from 'lucide-react';

import { useBatchCreateRawRules } from '@nasnet/api-client/queries';
import type { BatchProgress } from '@nasnet/api-client/queries';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  Button,
  Card,
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
  Checkbox,
  Alert,
  AlertDescription,
  Progress,
} from '@nasnet/ui/primitives';
import { cn } from '@nasnet/ui/utils';

import { useBogonFilterDialog } from './use-bogon-filter-dialog';

import type { BogonFilterDialogProps } from './bogon-filter-dialog.types';

/**
 * Desktop presenter for bogon filter dialog.
 *
 * Renders a floating Dialog with:
 * - 2-column checkbox grid for category selection
 * - Dropdown interface selector
 * - Per-category descriptions and security recommendations
 * - Warning alert for private address blocking
 * - Progress indicator during batch rule creation
 * - Accessible keyboard navigation (Tab, Enter, Space)
 *
 * @param props - Standard bogon filter dialog props
 * @returns Rendered desktop presentation
 */
export const BogonFilterDialogDesktop = memo(function BogonFilterDialogDesktop({
  routerId,
  open,
  onClose,
  onSuccess,
  availableInterfaces = ['ether1', 'ether2', 'pppoe-out1'],
}: BogonFilterDialogProps) {
  const batchMutation = useBatchCreateRawRules(routerId);
  const [progress, setProgress] = useState<BatchProgress | null>(null);

  const dialog = useBogonFilterDialog({
    availableInterfaces,
  });

  const handleGenerate = async () => {
    const rules = dialog.generateRules();

    try {
      const result = await batchMutation.mutateAsync({
        rules,
        onProgress: setProgress,
      });

      onSuccess?.(result.success);
      onClose();
    } catch (error) {
      console.error('Failed to create bogon filter rules:', error);
    }
  };

  const isGenerating = batchMutation.isPending;

  return (
    <Dialog
      open={open}
      onOpenChange={onClose}
    >
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="text-primary h-5 w-5" />
            Bogon Filter Setup
          </DialogTitle>
          <DialogDescription>
            Block non-routable IP addresses (bogons) to prevent spoofing and malicious traffic.
            Select categories to filter at your WAN interface.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Interface Selection */}
          <div>
            <label
              htmlFor="wan-interface-select"
              className="mb-2 block text-sm font-medium"
            >
              WAN Interface
            </label>
            <Select
              value={dialog.selectedInterface}
              onValueChange={dialog.setSelectedInterface}
              disabled={isGenerating}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select interface" />
              </SelectTrigger>
              <SelectContent>
                {availableInterfaces.map((iface) => (
                  <SelectItem
                    key={iface}
                    value={iface}
                  >
                    {iface}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-muted-foreground mt-1 text-xs">
              Rules will be applied to incoming traffic on this interface
            </p>
          </div>

          {/* Private Address Warning */}
          {dialog.showPrivateWarning && (
            <Alert variant="warning">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <strong>Warning:</strong> Blocking private addresses (10.0.0.0/8, 172.16.0.0/12,
                192.168.0.0/16) may prevent access from your LAN. Only enable this on WAN
                interfaces.
              </AlertDescription>
            </Alert>
          )}

          {/* Category Selection */}
          <div>
            <div className="mb-3 flex items-center justify-between">
              <label
                htmlFor="bogon-categories"
                className="text-sm font-medium"
              >
                Bogon Categories ({dialog.selectedCategories.size} selected)
              </label>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={dialog.selectAllCategories}
                  disabled={isGenerating}
                >
                  Select All
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={dialog.clearCategories}
                  disabled={isGenerating}
                >
                  Clear
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {dialog.allCategories.map((category) => (
                <Card
                  key={category}
                  className={cn(
                    'cursor-pointer p-4 transition-colors',
                    dialog.isCategorySelected(category) ?
                      'border-primary bg-primary/5'
                    : 'hover:border-primary/50'
                  )}
                  onClick={() => !isGenerating && dialog.toggleCategory(category)}
                >
                  <div className="flex items-start gap-3">
                    <Checkbox
                      checked={dialog.isCategorySelected(category)}
                      onCheckedChange={() => dialog.toggleCategory(category)}
                      disabled={isGenerating}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="mb-1 flex items-center gap-2">
                        <p className="text-sm font-medium capitalize">
                          {category.replace(/([A-Z])/g, ' $1').trim()}
                        </p>
                        {dialog.isCategorySelected(category) && (
                          <Check className="text-primary h-4 w-4" />
                        )}
                      </div>
                      <p className="text-muted-foreground mb-1 text-xs">
                        {dialog.getCategoryDescription(category)}
                      </p>
                      <p className="text-muted-foreground flex items-start gap-1 text-xs">
                        <Info className="mt-0.5 h-3 w-3 flex-shrink-0" />
                        {dialog.getSecurityRecommendation(category)}
                      </p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>

          {/* Progress Indicator */}
          {isGenerating && progress && (
            <Card className="p-4">
              <p className="mb-2 text-sm font-medium">
                Creating rules... ({progress.current} / {progress.total})
              </p>
              <Progress
                value={progress.percentage}
                className="h-2"
              />
              {progress.currentItem && (
                <p className="text-muted-foreground mt-2 text-xs">{progress.currentItem}</p>
              )}
            </Card>
          )}
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isGenerating}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleGenerate}
            disabled={!dialog.isValid || isGenerating}
          >
            {isGenerating ? 'Generating...' : `Generate ${dialog.ruleCount} Rules`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
});

BogonFilterDialogDesktop.displayName = 'BogonFilterDialogDesktop';
