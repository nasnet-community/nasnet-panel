import { lazy } from 'react';

/**
 * Service Ports Management Route
 *
 * Lazy-loads the ServicePortsPage component for managing custom service port
 * definitions and service groups. Enables users to:
 * - Define custom service names (e.g., "my-app" → port 9999)
 * - Create service groups for quick selection (e.g., "web" → ports 80, 443, 8080)
 * - Use service names instead of port numbers in firewall rules
 *
 * @see libs/features/firewall/src/pages/ServicePortsPage.tsx
 */
const ServicePortsPage = lazy(() =>
  import('@nasnet/features/firewall').then((m) => ({ default: m.ServicePortsPage }))
);

export default function ServicePortsRoute() {
  return <ServicePortsPage />;
}
