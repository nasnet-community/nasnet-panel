import { createFileRoute } from '@tanstack/react-router';

import { OverviewTab } from '@/app/routes/router-panel/tabs';

export const Route = createFileRoute('/router/$id/')({
  component: OverviewTab,
});
