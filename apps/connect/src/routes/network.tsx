import { createFileRoute } from '@tanstack/react-router';

import { NetworkTab } from '@/app/pages/network';

export const Route = createFileRoute('/network')({
  component: NetworkTab,
});
