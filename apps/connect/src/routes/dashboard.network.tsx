import { createFileRoute } from '@tanstack/react-router';
import { InterfaceListPage } from '@nasnet/features/network';

/**
 * Network interface management route
 * NAS-6.1: Interface List and Configuration
 */

export const Route = createFileRoute('/dashboard/network')({
  component: InterfaceListPage,
});
