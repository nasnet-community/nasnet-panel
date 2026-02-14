/**
 * ReviewStep Component
 *
 * Second step of template installation wizard.
 * Review configuration and estimated resources before installation.
 */

import * as React from 'react';
import { Info, Server, HardDrive, Cpu, Network } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle, Badge, Separator } from '@nasnet/ui/primitives';
import type { ServiceTemplate } from '@nasnet/api-client/generated';

/**
 * Props for ReviewStep
 */
export interface ReviewStepProps {
  /** Template being installed */
  template: ServiceTemplate;
  /** Variable values to review */
  variables: Record<string, unknown>;
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
export function ReviewStep({ template, variables }: ReviewStepProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Review Configuration</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Review your configuration before installation
        </p>
      </div>

      {/* Services to Install */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Server className="h-4 w-4" />
            Services ({template.services.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {template.services.map((service, index) => (
            <div key={index} className="flex items-start gap-3">
              <div className="flex-1">
                <p className="font-medium">{service.name}</p>
                <p className="text-sm text-muted-foreground">
                  Type: {service.serviceType}
                </p>
                {service.dependsOn && service.dependsOn.length > 0 && (
                  <p className="text-xs text-muted-foreground mt-1">
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
      {Object.keys(variables).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Configuration</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {Object.entries(variables).map(([key, value]) => {
                const variable = template.configVariables.find((v) => v.name === key);
                return (
                  <div
                    key={key}
                    className="flex items-center justify-between py-2 border-b last:border-0"
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
              <Cpu className="h-4 w-4" />
              Estimated Resources
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Memory</p>
                <p className="font-medium">
                  {template.estimatedResources.totalMemoryMB} MB
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Disk Space</p>
                <p className="font-medium">
                  {template.estimatedResources.diskSpaceMB} MB
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Network Ports</p>
                <p className="font-medium">
                  {template.estimatedResources.networkPorts}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">VLANs</p>
                <p className="font-medium">
                  {template.estimatedResources.vlansRequired}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Prerequisites Warning */}
      {template.prerequisites && template.prerequisites.length > 0 && (
        <Card className="border-warning">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2 text-warning">
              <Info className="h-4 w-4" />
              Prerequisites
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="list-disc list-inside space-y-1 text-sm">
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
