import { createFileRoute } from '@tanstack/react-router';

import { VPNDashboard } from '@/app/pages/vpn';

export const Route = createFileRoute('/router/$id/vpn/')({
  component: VPNDashboard,
});
