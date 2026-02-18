import { createFileRoute } from '@tanstack/react-router';

import { RoutesPage } from '@nasnet/features/network';

/**
 * Static route management route
 * NAS-6.5: Static Route Management
 */

export const Route = createFileRoute('/dashboard/routes')({
  component: RoutesPage,
});
