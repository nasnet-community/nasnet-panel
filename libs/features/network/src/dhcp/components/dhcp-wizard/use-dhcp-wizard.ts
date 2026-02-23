/**
 * DHCP Wizard Hook
 * @description Wraps useStepper with DHCP-specific configuration and validation.
 * Manages multi-step DHCP server creation flow with validation at each step.
 *
 * Story: NAS-6.3 - Implement DHCP Server Management
 */

import { useCallback } from 'react';
import { useStepper, type StepConfig } from '@nasnet/ui/patterns';
import { useCreateDHCPServer } from '@nasnet/api-client/queries';
import { useConnectionStore } from '@nasnet/state/stores';
import { toast } from '@nasnet/ui/primitives';
import {
  calculateSuggestedPool,
  isInSubnet,
  poolOverlapsWithIP,
  compareIPs,
} from '../../utils/pool-calculator';
import type {
  InterfaceStepFormData,
  PoolStepFormData,
  NetworkStepFormData,
} from './dhcp-wizard.schema';

/** Maximum DNS servers allowed per DHCP configuration */
const MAX_DNS_SERVERS = 3;
/** Minimum required DNS servers */
const MIN_DNS_SERVERS = 1;

/**
 * Hook for DHCP wizard state management
 * @description Manages multi-step DHCP server configuration with validation and submission
 *
 * @returns Object with stepper hook and loading state
 * @returns {object.stepper} - useStepper hook for navigation and state
 * @returns {object.isCreating} - Boolean indicating if server creation is in progress
 */
export function useDHCPWizard() {
  const routerIp = useConnectionStore((state) => state.currentRouterIp);
  const createServerMutation = useCreateDHCPServer(routerIp || '');

  /**
   * Validate interface step
   * @description Checks that an interface has been selected
   */
  const validateInterfaceStep = useCallback(
    async (data: unknown): Promise<{ valid: boolean; errors: Record<string, string> }> => {
      const stepData = data as InterfaceStepFormData;
      const errors: Record<string, string> = {};

      if (!stepData.interface) {
        errors.interface = 'Please select an interface';
      }

      return {
        valid: Object.keys(errors).length === 0,
        errors,
      };
    },
    []
  );

  /**
   * Validate pool step
   * @description Validates DHCP pool configuration for valid range and subnet membership
   */
  const validatePoolStep = useCallback(
    async (data: unknown): Promise<{ valid: boolean; errors: Record<string, string> }> => {
      const stepData = data as PoolStepFormData & { interfaceIP?: string };
      const errors: Record<string, string> = {};

      if (!stepData.poolStart) {
        errors.poolStart = 'Pool start IP is required';
      }

      if (!stepData.poolEnd) {
        errors.poolEnd = 'Pool end IP is required';
      }

      if (stepData.poolStart && stepData.poolEnd) {
        // Validate pool range using compareIPs utility
        const rangeComparison = compareIPs(stepData.poolEnd, stepData.poolStart);

        if (rangeComparison < 0) {
          errors.poolEnd = 'Pool end must be greater than or equal to pool start';
        }

        // Check overlap with interface IP
        if (stepData.interfaceIP) {
          const interfaceIP = stepData.interfaceIP.split('/')[0];
          if (poolOverlapsWithIP(stepData.poolStart, stepData.poolEnd, interfaceIP)) {
            errors.poolStart = 'Pool range overlaps with interface IP';
            errors.poolEnd = 'Pool range overlaps with interface IP';
          }

          // Check if pool is in same subnet
          const subnet = stepData.interfaceIP;
          if (!isInSubnet(stepData.poolStart, subnet)) {
            errors.poolStart = 'Pool start must be in the same subnet as interface';
          }
          if (!isInSubnet(stepData.poolEnd, subnet)) {
            errors.poolEnd = 'Pool end must be in the same subnet as interface';
          }
        }
      }

      return {
        valid: Object.keys(errors).length === 0,
        errors,
      };
    },
    []
  );

  /**
   * Validate network step
   * @description Validates gateway, DNS servers, and lease time configuration
   */
  const validateNetworkStep = useCallback(
    async (data: unknown): Promise<{ valid: boolean; errors: Record<string, string> }> => {
      const stepData = data as NetworkStepFormData;
      const errors: Record<string, string> = {};

      if (!stepData.gateway) {
        errors.gateway = 'Gateway IP is required';
      }

      if (!stepData.dnsServers || stepData.dnsServers.length < MIN_DNS_SERVERS) {
        errors.dnsServers = `At least ${MIN_DNS_SERVERS} DNS server is required`;
      }

      if (stepData.dnsServers && stepData.dnsServers.length > MAX_DNS_SERVERS) {
        errors.dnsServers = `Maximum ${MAX_DNS_SERVERS} DNS servers allowed`;
      }

      if (!stepData.leaseTime) {
        errors.leaseTime = 'Lease time is required';
      }

      return {
        valid: Object.keys(errors).length === 0,
        errors,
      };
    },
    []
  );

  /**
   * DHCP wizard step configuration
   * @description Define all steps and their validation functions for the wizard flow
   */
  const DHCP_WIZARD_STEPS: StepConfig[] = [
    {
      id: 'interface',
      title: 'Select Interface',
      description: 'Choose the interface for DHCP server',
      validate: validateInterfaceStep,
    },
    {
      id: 'pool',
      title: 'Address Pool',
      description: 'Configure IP address range',
      validate: validatePoolStep,
    },
    {
      id: 'network',
      title: 'Network Settings',
      description: 'Set gateway, DNS, and lease time',
      validate: validateNetworkStep,
    },
    {
      id: 'review',
      title: 'Review & Create',
      description: 'Review settings and create server',
      // No validation for review step
    },
  ];

  const handleWizardComplete = useCallback(
    async (data: Map<string, unknown>) => {
      // Combine all step data
      const interfaceData = data.get('interface') as InterfaceStepFormData;
      const poolData = data.get('pool') as PoolStepFormData;
      const networkData = data.get('network') as NetworkStepFormData;

      if (!routerIp) {
        toast({
          variant: 'destructive',
          title: 'No router connected',
          description: 'Please connect to a router first',
        });
        return;
      }

      try {
        await createServerMutation.mutateAsync({
          name: `dhcp-${interfaceData.interface}`,
          interface: interfaceData.interface,
          poolStart: poolData.poolStart,
          poolEnd: poolData.poolEnd,
          network: interfaceData.interfaceIP || '',
          gateway: networkData.gateway,
          dnsServers: networkData.dnsServers,
          leaseTime: networkData.leaseTime,
          domain: networkData.domain,
          ntpServer: networkData.ntpServer,
        });

        // Success handled by mutation's onSuccess
      } catch (error) {
        // Error handled by mutation's onError
        console.error('Failed to create DHCP server:', error);
      }
    },
    [routerIp, createServerMutation]
  );

  const stepper = useStepper({
    steps: DHCP_WIZARD_STEPS,
    validateOnChange: true,
    initialStep: 0,
    onComplete: handleWizardComplete,
  });

  return {
    stepper,
    isCreating: createServerMutation.isPending,
  };
}
