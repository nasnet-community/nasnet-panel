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
  const variableCount = useMemo(() => Object.keys(variables).length, [variables]);

  return (
    <div className={cn('space-y-component-lg', className)}>
      <div>
        <h2 className="text-lg font-semibold">
          {t('wizard.reviewConfiguration', 'Review Configuration')}
        </h2>
        <p className="text-muted-foreground mt-component-sm text-sm">
          {t('wizard.reviewConfigurationDesc', 'Review your configuration before installation')}
        </p>
      </div>

      {/* Services to Install */}
      <Card>
        <CardHeader>
          <CardTitle className="gap-component-sm flex items-center text-base">
            <Icon
              icon={Server}
              className="h-4 w-4"
              aria-hidden="true"
            />
            {t('wizard.services', 'Services')} ({serviceCount})
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-component-md">
          {template.services.map((service, index) => (
            <div
              key={index}
              className="gap-component-md flex items-start"
            >
              <div className="flex-1">
                <p className="font-medium">{service.name}</p>
                <p className="text-muted-foreground text-sm">Type: {service.serviceType}</p>
                {service.dependsOn && service.dependsOn.length > 0 && (
                  <p className="text-muted-foreground mt-component-sm text-xs">
                    Depends on: {service.dependsOn.join(', ')}
                  </p>
                )}
              </div>
              {service.memoryLimitMB && (
                <Badge
                  variant="secondary"
                  className="text-xs"
                >
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
            <CardTitle className="text-base">
              {t('common.configuration', 'Configuration')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-component-sm">
              {Object.entries(variables).map(([key, value]) => {
                const variable = template.configVariables.find((v) => v.name === key);
                return (
                  <div
                    key={key}
                    className="py-component-sm border-border flex items-center justify-between border-b last:border-0"
                  >
                    <span className="text-sm font-medium">{variable?.label || key}</span>
                    <span className="text-muted-foreground font-mono text-sm">
                      {typeof value === 'boolean' ?
                        value ?
                          'Enabled'
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
            <CardTitle className="gap-component-sm flex items-center text-base">
              <Icon
                icon={Cpu}
                className="h-4 w-4"
                aria-hidden="true"
              />
              {t('wizard.estimatedResources', 'Estimated Resources')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="gap-component-md grid grid-cols-2">
              <div className="space-y-component-sm">
                <p className="text-muted-foreground text-sm">{t('common.memory', 'Memory')}</p>
                <p className="font-mono font-medium">
                  {template.estimatedResources.totalMemoryMB} MB
                </p>
              </div>
              <div className="space-y-component-sm">
                <p className="text-muted-foreground text-sm">
                  {t('common.diskSpace', 'Disk Space')}
                </p>
                <p className="font-mono font-medium">
                  {template.estimatedResources.diskSpaceMB} MB
                </p>
              </div>
              <div className="space-y-component-sm">
                <p className="text-muted-foreground text-sm">
                  {t('common.networkPorts', 'Network Ports')}
                </p>
                <p className="font-mono font-medium">{template.estimatedResources.networkPorts}</p>
              </div>
              <div className="space-y-component-sm">
                <p className="text-muted-foreground text-sm">{t('common.vlans', 'VLANs')}</p>
                <p className="font-mono font-medium">{template.estimatedResources.vlansRequired}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Prerequisites Warning */}
      {template.prerequisites && template.prerequisites.length > 0 && (
        <Card
          className="border-warning border-2"
          role="alert"
          aria-label="Prerequisites"
        >
          <CardHeader>
            <CardTitle className="gap-component-md text-warning flex items-center text-base">
              <Icon
                icon={Info}
                className="h-4 w-4"
                aria-hidden="true"
              />
              {t('common.prerequisites', 'Prerequisites')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-component-sm list-inside list-disc text-sm">
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
