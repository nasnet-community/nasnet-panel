/**
 * Settings Route
 * Parent route for all settings pages
 */

import { createFileRoute, Outlet } from '@tanstack/react-router';

export const Route = createFileRoute('/settings')({
  component: SettingsLayout,
});

function SettingsLayout() {
  return <Outlet />;
}
