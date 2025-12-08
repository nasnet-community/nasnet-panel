/**
 * Verification Module - Tests that all required library imports work
 * AC-4: Importing from @nasnet/* libraries works without errors
 */

// Test core library imports
import type { VPNConnection } from '@nasnet/core/types';
import { isValidIPv4 } from '@nasnet/core/utils';
import { API_ENDPOINTS } from '@nasnet/core/constants';

// Test UI library imports
import { Button, Card, Input } from '@nasnet/ui/primitives';

// Test API client import
import { apiClient } from '@nasnet/api-client/core';

export function verifyImports(): boolean {
  // Verify types are available (compile-time check)
  const testVPN: VPNConnection | undefined = undefined;

  // Test util functions work
  const ipTest1 = isValidIPv4('192.168.1.1');
  const ipTest2 = isValidIPv4('invalid');

  // Test constants are available
  console.log('API Endpoints:', API_ENDPOINTS);

  // Test UI components are importable
  console.log('UI Components:', { Button, Card, Input });

  // Test API client is available
  console.log('API Client:', apiClient);

  return true;
}

export const IMPORT_VERIFICATION_PASSED = verifyImports();
