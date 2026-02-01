import { createFileRoute } from '@tanstack/react-router';
import { WifiPage } from '@/app/pages/wifi';

export const Route = createFileRoute('/wifi')({
  component: WifiPage,
});
