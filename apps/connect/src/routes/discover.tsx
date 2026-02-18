import { createFileRoute } from '@tanstack/react-router';

import { RouterDiscoveryPage } from '@/app/pages/router-discovery';

export const Route = createFileRoute('/discover')({
  component: RouterDiscoveryPage,
});
