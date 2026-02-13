/**
 * BogonFilterDialogDesktop - Desktop Platform Presenter
 *
 * Dialog with checkbox grid and interface selector.
 * Optimized for keyboard navigation and dense layout.
 *
 * @module @nasnet/ui/patterns/bogon-filter-dialog
 */

import { memo, useState } from 'react';
import { Shield, AlertTriangle, Check, Info } from 'lucide-react';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@nasnet/ui/primitives';
import {
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

import { useBatchCreateRawRules } from '@nasnet/api-client/queries';
import { useBogonFilterDialog } from './use-bogon-filter-dialog';
import type { BogonFilterDialogProps } from './bogon-filter-dialog.types';
import type { BatchProgress } from '@nasnet/api-client/queries';

/**
 * Desktop presenter for bogon filter dialog.
 *
 * Features:
 * - Dialog with checkbox grid layout
 * - Interface selector dropdown
 * - Category descriptions and security recommendations
 * - Warning for private address selection
 * - Progress indicator during rule creation
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
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
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
            <label className="text-sm font-medium mb-2 block">
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
                  <SelectItem key={iface} value={iface}>
                    {iface}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground mt-1">
              Rules will be applied to incoming traffic on this interface
            </p>
          </div>

          {/* Private Address Warning */}
          {dialog.showPrivateWarning && (
            <Alert variant="warning">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <strong>Warning:</strong> Blocking private addresses (10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16) may prevent access from your LAN. Only enable this on WAN interfaces.
              </AlertDescription>
            </Alert>
          )}

          {/* Category Selection */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="text-sm font-medium">
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
                  className={`p-4 cursor-pointer transition-colors ${
                    dialog.isCategorySelected(category)
                      ? 'border-primary bg-primary/5'
                      : 'hover:border-primary/50'
                  }`}
                  onClick={() => !isGenerating && dialog.toggleCategory(category)}
                >
                  <div className="flex items-start gap-3">
                    <Checkbox
                      checked={dialog.isCategorySelected(category)}
                      onCheckedChange={() => dialog.toggleCategory(category)}
                      disabled={isGenerating}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-medium text-sm capitalize">
                          {category.replace(/([A-Z])/g, ' $1').trim()}
                        </p>
                        {dialog.isCategorySelected(category) && (
                          <Check className="h-4 w-4 text-primary" />
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mb-1">
                        {dialog.getCategoryDescription(category)}
                      </p>
                      <p className="text-xs text-muted-foreground flex items-start gap-1">
                        <Info className="h-3 w-3 mt-0.5 flex-shrink-0" />
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
              <p className="text-sm font-medium mb-2">
                Creating rules... ({progress.current} / {progress.total})
              </p>
              <Progress value={progress.percentage} className="h-2" />
              {progress.currentItem && (
                <p className="text-xs text-muted-foreground mt-2">
                  {progress.currentItem}
                </p>
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
            {isGenerating
              ? 'Generating...'
              : `Generate ${dialog.ruleCount} Rules`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
});

BogonFilterDialogDesktop.displayName = 'BogonFilterDialogDesktop';
