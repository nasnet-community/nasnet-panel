/**
 * Kill Switch Toggle Mobile Presenter
 *
 * Mobile optimized view for kill switch toggle.
 * Large touch targets (44px), vertical stacking, simplified layout.
 */

import { AlertCircle, Shield, ShieldAlert, ShieldCheck } from 'lucide-react';

import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  Label,
  Switch,
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
  Badge,
  cn,
} from '@nasnet/ui/primitives';

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
    statusColor === 'success' ? 'default'
    : statusColor === 'error' ? 'error'
    : statusColor === 'warning' ? 'secondary'
    : 'outline';

  // Determine icon
  const StatusIcon =
    isActive ? ShieldAlert
    : enabled ? ShieldCheck
    : Shield;

  const isDisabled = disabled || isLoading || isSaving;

  return (
    <Card className={cn('', className)}>
      <CardHeader className="space-y-3">
        <div className="flex items-center gap-2">
          <StatusIcon className="size-5 shrink-0" />
          <CardTitle className="text-base">Kill Switch</CardTitle>
          <Badge
            variant={statusVariant}
            className="ml-auto text-xs"
          >
            {statusText}
          </Badge>
        </div>
        {deviceName && (
          <CardDescription className="text-sm">Protection for {deviceName}</CardDescription>
        )}
        <CardDescription className="text-sm">
          Automatically blocks traffic when service becomes unhealthy
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Enable/Disable Switch - Large touch target (44px min height) */}
        <div className="border-border bg-muted/30 flex min-h-[44px] items-center justify-between gap-4 rounded-lg border px-4 py-3">
          <Label
            htmlFor="kill-switch-enabled"
            className="font-medium"
          >
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
              <Label
                htmlFor="kill-switch-mode-mobile"
                className="text-sm font-medium"
              >
                Behavior Mode
              </Label>
              <Select
                value={mode}
                onValueChange={(value: string) => handleModeChange(value as KillSwitchMode)}
                disabled={isDisabled}
              >
                <SelectTrigger
                  id="kill-switch-mode-mobile"
                  className="min-h-[44px] text-base"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem
                    value="BLOCK_ALL"
                    className="min-h-[44px] text-base"
                  >
                    Block All Traffic
                  </SelectItem>
                  <SelectItem
                    value="ALLOW_DIRECT"
                    className="min-h-[44px] text-base"
                  >
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
              <p className="text-muted-foreground text-xs">
                {mode === 'BLOCK_ALL' && 'Blocks all traffic from this device'}
                {mode === 'ALLOW_DIRECT' && 'Allows direct internet access (no VPN)'}
                {mode === 'FALLBACK_SERVICE' && 'Routes through a backup service'}
              </p>
            </div>

            {/* Fallback interface selector */}
            {showFallbackSelector && (
              <div className="space-y-2">
                <Label
                  htmlFor="fallback-interface-mobile"
                  className="text-sm font-medium"
                >
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
                  <p className="text-error flex items-center gap-1.5 text-sm">
                    <AlertCircle className="size-4 shrink-0" />
                    No fallback services available
                  </p>
                )}
              </div>
            )}

            {/* Active state indicator */}
            {isActive && activationTimeText && (
              <div className="border-l-error border-error bg-error-light rounded-lg border border-l-4 p-4 transition-colors duration-150">
                <div className="flex items-start gap-3">
                  <ShieldAlert className="text-error mt-1 size-5 shrink-0" />
                  <div className="flex-1 space-y-1">
                    <p className="text-error-dark font-medium">Kill Switch Active</p>
                    <p className="text-muted-foreground text-sm">
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
