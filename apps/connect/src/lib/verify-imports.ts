/**
 * Verification Module - Tests that all required library imports work
 * AC-4: Importing from @nasnet/* libraries works without errors
 */

import { apiClient } from '@nasnet/api-client/core';
import { API_ENDPOINTS } from '@nasnet/core/constants';
import { Button, Card, Input } from '@nasnet/ui/primitives';

export function verifyImports(): boolean {
  // Test constants are available
  console.log('API Endpoints:', API_ENDPOINTS);

  // Test UI components are importable
  console.log('UI Components:', { Button, Card, Input });

  // Test API client is available
  console.log('API Client:', apiClient);

  return true;
}

export const IMPORT_VERIFICATION_PASSED = verifyImports();
