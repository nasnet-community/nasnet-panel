import { createFileRoute } from '@tanstack/react-router';
import { WifiDetailPage } from '@/app/pages/wifi/detail';

export const Route = createFileRoute('/router/$id/wifi/$interfaceName')({
  component: WifiDetailPage,
});
