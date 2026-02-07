/**
 * DHCP Wizard Hook
 * Wraps useStepper with DHCP-specific configuration and validation
 *
 * Story: NAS-6.3 - Implement DHCP Server Management
 */

import { useStepper, type StepConfig } from '@nasnet/ui/patterns';
import { useCreateDHCPServer } from '@nasnet/api-client/queries';
import { useConnectionStore } from '@nasnet/state/stores';
import { toast } from '@nasnet/ui/primitives';
import { calculateSuggestedPool, isInSubnet, poolOverlapsWithIP } from '../../utils/pool-calculator';
import type { InterfaceStepFormData, PoolStepFormData, NetworkStepFormData } from './dhcp-wizard.schema';

/**
 * Validate interface step
 */
async function validateInterfaceStep(data: unknown): Promise<{ valid: boolean; errors: Record<string, string> }> {
  const stepData = data as InterfaceStepFormData;
  const errors: Record<string, string> = {};

  if (!stepData.interface) {
    errors.interface = 'Please select an interface';
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}

/**
 * Validate pool step
 */
async function validatePoolStep(data: unknown): Promise<{ valid: boolean; errors: Record<string, string> }> {
  const stepData = data as PoolStepFormData & { interfaceIP?: string };
  const errors: Record<string, string> = {};

  if (!stepData.poolStart) {
    errors.poolStart = 'Pool start IP is required';
  }

  if (!stepData.poolEnd) {
    errors.poolEnd = 'Pool end IP is required';
  }

  if (stepData.poolStart && stepData.poolEnd) {
    // Validate pool range
    const start = stepData.poolStart.split('.').map(Number);
    const end = stepData.poolEnd.split('.').map(Number);

    let isValidRange = true;
    for (let i = 0; i < 4; i++) {
      if (end[i] < start[i]) {
        isValidRange = false;
        break;
      }
      if (end[i] > start[i]) break;
    }

    if (!isValidRange) {
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
}

/**
 * Validate network step
 */
async function validateNetworkStep(data: unknown): Promise<{ valid: boolean; errors: Record<string, string> }> {
  const stepData = data as NetworkStepFormData;
  const errors: Record<string, string> = {};

  if (!stepData.gateway) {
    errors.gateway = 'Gateway IP is required';
  }

  if (!stepData.dnsServers || stepData.dnsServers.length === 0) {
    errors.dnsServers = 'At least one DNS server is required';
  }

  if (stepData.dnsServers && stepData.dnsServers.length > 3) {
    errors.dnsServers = 'Maximum 3 DNS servers allowed';
  }

  if (!stepData.leaseTime) {
    errors.leaseTime = 'Lease time is required';
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}

/**
 * DHCP wizard step configuration
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

/**
 * Hook for DHCP wizard state management
 */
export function useDHCPWizard() {
  const routerIp = useConnectionStore((state) => state.currentRouterIp);
  const createServerMutation = useCreateDHCPServer(routerIp || '');

  const stepper = useStepper({
    steps: DHCP_WIZARD_STEPS,
    validateOnChange: true,
    initialStep: 0,
    onComplete: async (data) => {
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
  });

  return {
    stepper,
    isCreating: createServerMutation.isPending,
  };
}
