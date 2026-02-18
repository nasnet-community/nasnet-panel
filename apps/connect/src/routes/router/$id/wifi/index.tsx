import { createFileRoute } from '@tanstack/react-router';

import { WiFiTab } from '@/app/routes/router-panel/tabs';

export const Route = createFileRoute('/router/$id/wifi/')({
  component: WiFiTab,
});
