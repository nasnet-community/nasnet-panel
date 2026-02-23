/**
 * BogonFilterDialogMobile - Mobile Platform Presenter
 *
 * Sheet-based presentation optimized for mobile viewports (<640px).
 * Features bottom-sheet layout, 44px touch targets, progressive disclosure.
 *
 * Platform-Specific Optimizations:
 * - Bottom sheet (side="bottom") for thumb-friendly navigation
 * - 44px minimum touch targets on all interactive elements
 * - Card-based vertical layout (single column)
 * - Simplified category display (no grid, stackable cards)
 * - Full-width action buttons
 * - Touch-friendly spacing (p-3, gap-3)
 * - Swipe-to-close gesture support (native Sheet behavior)
 *
 * @component
 * @internal Used by BogonFilterDialog platform detection wrapper
 *
 * @example
 * ```tsx
 * <BogonFilterDialogMobile
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
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
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
 * Mobile presenter for bogon filter dialog.
 *
 * Renders a bottom Sheet with:
 * - 44px minimum touch targets for accessibility
 * - Card-based vertical layout
 * - Simplified category display (stacked, not gridded)
 * - Full-width action buttons (h-11 for comfortable tapping)
 * - Warning alert for private address blocking
 * - Progress indicator during batch rule creation
 * - Touch-friendly spacing and swipe gesture support
 *
 * @param props - Standard bogon filter dialog props
 * @returns Rendered mobile presentation
 */
export const BogonFilterDialogMobile = memo(function BogonFilterDialogMobile({
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
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent side="bottom" className="h-[90vh] overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            Bogon Filter
          </SheetTitle>
          <SheetDescription>
            Block non-routable IPs to prevent spoofing
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-4 py-4">
          {/* Interface Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">WAN Interface</CardTitle>
            </CardHeader>
            <CardContent>
              <Select
                value={dialog.selectedInterface}
                onValueChange={dialog.setSelectedInterface}
                disabled={isGenerating}
              >
                <SelectTrigger className="h-11">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {availableInterfaces.map((iface) => (
                    <SelectItem key={iface} value={iface} className="py-3">
                      {iface}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          {/* Private Warning */}
          {dialog.showPrivateWarning && (
            <Alert variant="warning">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription className="text-sm">
                <strong>Warning:</strong> Blocking private addresses may prevent LAN access. Only use on WAN.
              </AlertDescription>
            </Alert>
          )}

          {/* Categories Card */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">
                  Categories ({dialog.selectedCategories.size})
                </CardTitle>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={dialog.selectAllCategories}
                    disabled={isGenerating}
                  >
                    All
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
            </CardHeader>
            <CardContent className="space-y-3">
              {dialog.allCategories.map((category) => (
                <div
                  key={category}
                  className={cn(
                    'p-3 border rounded-lg cursor-pointer transition-colors',
                    dialog.isCategorySelected(category)
                      ? 'border-primary bg-primary/5'
                      : 'hover:border-primary/50'
                  )}
                  onClick={() => !isGenerating && dialog.toggleCategory(category)}
                >
                  <div className="flex items-start gap-3">
                    <Checkbox
                      checked={dialog.isCategorySelected(category)}
                      onCheckedChange={() => dialog.toggleCategory(category)}
                      disabled={isGenerating}
                      className="mt-1"
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
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Progress */}
          {isGenerating && progress && (
            <Card>
              <CardContent className="p-4">
                <p className="text-sm font-medium mb-2">
                  Creating... ({progress.current} / {progress.total})
                </p>
                <Progress value={progress.percentage} className="h-2" />
              </CardContent>
            </Card>
          )}
        </div>

        <SheetFooter className="flex flex-col gap-2">
          <Button
            type="button"
            onClick={handleGenerate}
            disabled={!dialog.isValid || isGenerating}
            className="w-full h-11"
          >
            {isGenerating
              ? 'Generating...'
              : `Generate ${dialog.ruleCount} Rules`}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isGenerating}
            className="w-full h-11"
          >
            Cancel
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
});

BogonFilterDialogMobile.displayName = 'BogonFilterDialogMobile';
