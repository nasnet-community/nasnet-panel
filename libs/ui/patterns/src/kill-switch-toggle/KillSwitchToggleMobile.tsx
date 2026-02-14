/**
 * Kill Switch Toggle Mobile Presenter
 *
 * Mobile optimized view for kill switch toggle.
 * Large touch targets (44px), vertical stacking, simplified layout.
 */

import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@nasnet/ui/primitives/card';
import { Label } from '@nasnet/ui/primitives/label';
import { Switch } from '@nasnet/ui/primitives/switch';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@nasnet/ui/primitives/select';
import { Badge } from '@nasnet/ui/primitives/badge';
import { AlertCircle, Shield, ShieldAlert, ShieldCheck } from 'lucide-react';
import { cn } from '@nasnet/ui/utils';

import { useKillSwitchToggle } from './useKillSwitchToggle';
import type { KillSwitchToggleProps, KillSwitchMode } from './types';

/**
 * Mobile presenter for Kill Switch Toggle
 *
 * Displays kill switch controls in a vertical layout with large touch targets
 * optimized for mobile screens (<640px).
 */
export function KillSwitchToggleMobile(props: KillSwitchToggleProps) {
  const { deviceName, disabled, className } = props;

  const state = useKillSwitchToggle(props);

  const {
    enabled,
    mode,
    isActive,
    fallbackInterfaceId,
    handleToggle,
    handleModeChange,
    handleFallbackChange,
    isLoading,
    isSaving,
    availableInterfaces,
    showFallbackSelector,
    statusText,
    statusColor,
    activationTimeText,
  } = state;

  // Determine status variant
  const statusVariant =
    statusColor === 'success'
      ? 'default'
      : statusColor === 'error'
        ? 'destructive'
        : statusColor === 'warning'
          ? 'secondary'
          : 'outline';

  // Determine icon
  const StatusIcon = isActive ? ShieldAlert : enabled ? ShieldCheck : Shield;

  const isDisabled = disabled || isLoading || isSaving;

  return (
    <Card className={cn('', className)}>
      <CardHeader className="space-y-3">
        <div className="flex items-center gap-2">
          <StatusIcon className="size-5 shrink-0" />
          <CardTitle className="text-base">Kill Switch</CardTitle>
          <Badge variant={statusVariant} className="ml-auto text-xs">
            {statusText}
          </Badge>
        </div>
        {deviceName && (
          <CardDescription className="text-sm">
            Protection for {deviceName}
          </CardDescription>
        )}
        <CardDescription className="text-sm">
          Automatically blocks traffic when service becomes unhealthy
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Enable/Disable Switch - Large touch target (44px min height) */}
        <div className="flex min-h-[44px] items-center justify-between gap-4 rounded-lg border border-border bg-muted/30 px-4 py-3">
          <Label htmlFor="kill-switch-enabled" className="font-medium">
            Enable Kill Switch
          </Label>
          <Switch
            id="kill-switch-enabled"
            checked={enabled}
            onCheckedChange={handleToggle}
            disabled={isDisabled}
            className="data-[state=checked]:bg-primary"
          />
        </div>

        {enabled && (
          <>
            {/* Mode selector - Large touch target */}
            <div className="space-y-2">
              <Label htmlFor="kill-switch-mode-mobile" className="text-sm font-medium">
                Behavior Mode
              </Label>
              <Select
                value={mode}
                onValueChange={(value) => handleModeChange(value as KillSwitchMode)}
                disabled={isDisabled}
              >
                <SelectTrigger
                  id="kill-switch-mode-mobile"
                  className="min-h-[44px] text-base"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="BLOCK_ALL" className="min-h-[44px] text-base">
                    Block All Traffic
                  </SelectItem>
                  <SelectItem value="ALLOW_DIRECT" className="min-h-[44px] text-base">
                    Allow Direct Access
                  </SelectItem>
                  <SelectItem
                    value="FALLBACK_SERVICE"
                    className="min-h-[44px] text-base"
                  >
                    Fallback Service
                  </SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                {mode === 'BLOCK_ALL' && 'Blocks all traffic from this device'}
                {mode === 'ALLOW_DIRECT' && 'Allows direct internet access (no VPN)'}
                {mode === 'FALLBACK_SERVICE' && 'Routes through a backup service'}
              </p>
            </div>

            {/* Fallback interface selector */}
            {showFallbackSelector && (
              <div className="space-y-2">
                <Label htmlFor="fallback-interface-mobile" className="text-sm font-medium">
                  Fallback Service
                </Label>
                <Select
                  value={fallbackInterfaceId}
                  onValueChange={handleFallbackChange}
                  disabled={isDisabled || availableInterfaces.length === 0}
                >
                  <SelectTrigger
                    id="fallback-interface-mobile"
                    className="min-h-[44px] text-base"
                  >
                    <SelectValue placeholder="Select fallback service" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableInterfaces.map((iface) => (
                      <SelectItem
                        key={iface.id}
                        value={iface.id}
                        className="min-h-[44px] text-base"
                      >
                        {iface.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {availableInterfaces.length === 0 && (
                  <p className="flex items-center gap-1.5 text-sm text-destructive">
                    <AlertCircle className="size-4 shrink-0" />
                    No fallback services available
                  </p>
                )}
              </div>
            )}

            {/* Active state indicator */}
            {isActive && activationTimeText && (
              <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4">
                <div className="flex items-start gap-3">
                  <ShieldAlert className="mt-1 size-5 shrink-0 text-destructive" />
                  <div className="flex-1 space-y-1">
                    <p className="font-medium text-destructive">Kill Switch Active</p>
                    <p className="text-sm text-muted-foreground">
                      Triggered {activationTimeText} due to service health failure
                    </p>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
