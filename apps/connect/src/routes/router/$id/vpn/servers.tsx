import { createFileRoute } from '@tanstack/react-router';
import { VPNServersPage } from '@/app/pages/vpn';

export const Route = createFileRoute('/router/$id/vpn/servers')({
  component: VPNServersPage,
});
