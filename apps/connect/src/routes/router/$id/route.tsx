import { createFileRoute, Outlet } from '@tanstack/react-router';

import { RouterPanel } from '@/app/routes/router-panel/RouterPanel';

export const Route = createFileRoute('/router/$id')({
  component: RouterPanelLayout,
});

function RouterPanelLayout() {
  const { id } = Route.useParams();

  return (
    <RouterPanel routerId={id}>
      <Outlet />
    </RouterPanel>
  );
}
