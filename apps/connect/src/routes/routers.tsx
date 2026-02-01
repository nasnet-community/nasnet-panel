import { createFileRoute } from '@tanstack/react-router';
import { RouterListPage } from '@/app/routes/router-list';

export const Route = createFileRoute('/routers')({
  component: RouterListPage,
});
