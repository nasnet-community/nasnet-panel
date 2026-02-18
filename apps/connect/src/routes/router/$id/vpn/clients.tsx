import { createFileRoute } from '@tanstack/react-router';

import { VPNClientsPage } from '@/app/pages/vpn';

export const Route = createFileRoute('/router/$id/vpn/clients')({
  component: VPNClientsPage,
});
