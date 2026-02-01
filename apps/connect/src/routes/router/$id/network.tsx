import { createFileRoute } from '@tanstack/react-router';
import { NetworkTab as RouterNetworkTab } from '@/app/routes/router-panel/tabs';

export const Route = createFileRoute('/router/$id/network')({
  component: RouterNetworkTab,
});
