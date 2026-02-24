/**
 * ReviewStep Component
 *
 * Second step of template installation wizard.
 * Displays configuration and resource estimates for review before installation.
 *
 * @example
 * ```tsx
 * <ReviewStep
 *   template={template}
 *   variables={variables}
 * />
 * ```
 *
 * @see docs/design/ux-design/6-component-library.md#wizard-steps
 */

import { memo, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Server, Cpu, Info } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle, Badge, Icon } from '@nasnet/ui/primitives';
import { cn } from '@nasnet/ui/utils';
import type { ServiceTemplate } from '@nasnet/api-client/generated';

/**
 * Props for ReviewStep
 */
export interface ReviewStepProps {
  /** Template being installed */
  template: ServiceTemplate;
  /** Variable values to review */
  variables: Record<string, unknown>;
  /** Optional CSS class name */
  className?: string;
}

/**
 * ReviewStep - Review configuration before installation
 *
 * Features:
 * - Service list with dependencies
 * - Variable values summary
 * - Resource estimates
 * - Prerequisites check
 */
function ReviewStepComponent({ template, variables, className }: ReviewStepProps) {
  const { t } = useTranslation('services');

  // Memoize service info to prevent unnecessary recalculations
  const serviceCount = useMemo(() => template.services.length, [template.services]);
  const variableCount = useMemo(
    () => Object.keys(variables).length,
    [variables]
  );

  return (
    <div className={cn('space-y-component-lg', className)}>
      <div>
        <h2 className="text-lg font-semibold">
          {t('wizard.reviewConfiguration', 'Review Configuration')}
        </h2>
        <p className="text-sm text-muted-foreground mt-component-sm">
          {t('wizard.reviewConfigurationDesc', 'Review your configuration before installation')}
        </p>
      </div>

      {/* Services to Install */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Icon icon={Server} className="h-4 w-4" aria-hidden="true" />
            {t('wizard.services', 'Services')} ({serviceCount})
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-component-md">
          {template.services.map((service, index) => (
            <div key={index} className="flex items-start gap-component-md">
              <div className="flex-1">
                <p className="font-medium">{service.name}</p>
                <p className="text-sm text-muted-foreground">
                  Type: {service.serviceType}
                </p>
                {service.dependsOn && service.dependsOn.length > 0 && (
                  <p className="text-xs text-muted-foreground mt-component-sm">
                    Depends on: {service.dependsOn.join(', ')}
                  </p>
                )}
              </div>
              {service.memoryLimitMB && (
                <Badge variant="secondary" className="text-xs">
                  {service.memoryLimitMB} MB
                </Badge>
              )}
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Configuration Variables */}
      {variableCount > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t('common.configuration', 'Configuration')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-component-sm">
              {Object.entries(variables).map(([key, value]) => {
                const variable = template.configVariables.find((v) => v.name === key);
                return (
                  <div
                    key={key}
                    className="flex items-center justify-between py-component-sm border-b border-border last:border-0"
                  >
                    <span className="text-sm font-medium">
                      {variable?.label || key}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      {typeof value === 'boolean'
                        ? value
                          ? 'Enabled'
                          : 'Disabled'
                        : String(value)}
                    </span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Resource Estimates */}
      {template.estimatedResources && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Icon icon={Cpu} className="h-4 w-4" aria-hidden="true" />
              {t('wizard.estimatedResources', 'Estimated Resources')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-component-md">
              <div className="space-y-component-sm">
                <p className="text-sm text-muted-foreground">{t('common.memory', 'Memory')}</p>
                <p className="font-medium font-mono">
                  {template.estimatedResources.totalMemoryMB} MB
                </p>
              </div>
              <div className="space-y-component-sm">
                <p className="text-sm text-muted-foreground">{t('common.diskSpace', 'Disk Space')}</p>
                <p className="font-medium font-mono">
                  {template.estimatedResources.diskSpaceMB} MB
                </p>
              </div>
              <div className="space-y-component-sm">
                <p className="text-sm text-muted-foreground">{t('common.networkPorts', 'Network Ports')}</p>
                <p className="font-medium font-mono">
                  {template.estimatedResources.networkPorts}
                </p>
              </div>
              <div className="space-y-component-sm">
                <p className="text-sm text-muted-foreground">{t('common.vlans', 'VLANs')}</p>
                <p className="font-medium font-mono">
                  {template.estimatedResources.vlansRequired}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Prerequisites Warning */}
      {template.prerequisites && template.prerequisites.length > 0 && (
        <Card className="border-warning border-2" role="alert" aria-label="Prerequisites">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-component-md text-warning">
              <Icon icon={Info} className="h-4 w-4" aria-hidden="true" />
              {t('common.prerequisites', 'Prerequisites')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="list-disc list-inside space-y-component-sm text-sm">
              {template.prerequisites.map((prereq, index) => (
                <li key={index}>{prereq}</li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export const ReviewStep = memo(ReviewStepComponent);
ReviewStep.displayName = 'ReviewStep';
