/**
 * Kill Switch Toggle Desktop Presenter
 *
 * Desktop/Tablet optimized view for kill switch toggle.
 * Dense layout with inline controls for power users.
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
 cn } from '@nasnet/ui/primitives';

import { useKillSwitchToggle } from './useKillSwitchToggle';

import type { KillSwitchToggleProps, KillSwitchMode } from './types';

/**
 * Desktop presenter for Kill Switch Toggle
 *
 * Displays kill switch controls in a dense, horizontal layout
 * optimized for desktop and tablet screens.
 */
export function KillSwitchToggleDesktop(props: KillSwitchToggleProps) {
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
        ? 'error'
        : statusColor === 'warning'
          ? 'secondary'
          : 'outline';

  // Determine icon
  const StatusIcon = isActive ? ShieldAlert : enabled ? ShieldCheck : Shield;

  const isDisabled = disabled || isLoading || isSaving;

  return (
    <Card className={cn('', className)}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2 text-lg">
              <StatusIcon className="size-5" />
              Kill Switch
              {deviceName && (
                <span className="text-sm font-normal text-muted-foreground">
                  for {deviceName}
                </span>
              )}
            </CardTitle>
            <CardDescription>
              Automatically block traffic when service becomes unhealthy
            </CardDescription>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant={statusVariant} className="text-xs">
              {statusText}
            </Badge>
            <Switch
              checked={enabled}
              onCheckedChange={handleToggle}
              disabled={isDisabled}
              aria-label="Toggle kill switch"
            />
          </div>
        </div>
      </CardHeader>

      {enabled && (
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            {/* Mode selector */}
            <div className="space-y-2">
              <Label htmlFor="kill-switch-mode">Behavior Mode</Label>
              <Select
                value={mode}
                onValueChange={(value: string) => handleModeChange(value as KillSwitchMode)}
                disabled={isDisabled}
              >
                <SelectTrigger id="kill-switch-mode">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="BLOCK_ALL">Block All Traffic</SelectItem>
                  <SelectItem value="ALLOW_DIRECT">Allow Direct Access</SelectItem>
                  <SelectItem value="FALLBACK_SERVICE">Fallback to Another Service</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                {mode === 'BLOCK_ALL' && 'Block all traffic from this device'}
                {mode === 'ALLOW_DIRECT' && 'Allow direct internet access (no VPN)'}
                {mode === 'FALLBACK_SERVICE' && 'Route through a backup service'}
              </p>
            </div>

            {/* Fallback interface selector (shown only if mode is FALLBACK_SERVICE) */}
            {showFallbackSelector && (
              <div className="space-y-2">
                <Label htmlFor="fallback-interface">Fallback Service</Label>
                <Select
                  value={fallbackInterfaceId}
                  onValueChange={handleFallbackChange}
                  disabled={isDisabled || availableInterfaces.length === 0}
                >
                  <SelectTrigger id="fallback-interface">
                    <SelectValue placeholder="Select fallback service" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableInterfaces.map((iface) => (
                      <SelectItem key={iface.id} value={iface.id}>
                        {iface.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {availableInterfaces.length === 0 && (
                  <p className="flex items-center gap-1 text-xs text-error">
                    <AlertCircle className="size-3" />
                    No fallback services available
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Active state indicator */}
          {isActive && activationTimeText && (
            <div className="mt-4 rounded-md border border-l-4 border-l-error border-error bg-error-light p-3 transition-colors duration-150">
              <div className="flex items-start gap-2">
                <ShieldAlert className="mt-0.5 size-4 text-error" />
                <div className="flex-1 space-y-1">
                  <p className="text-sm font-medium text-error-dark">
                    Kill Switch Active
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Triggered {activationTimeText} due to service health failure
                  </p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}
