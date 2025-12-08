import { RouterProvider, createBrowserRouter } from 'react-router-dom';
import { Toaster } from '@nasnet/ui/primitives';
import { AppShell } from '@nasnet/ui/layouts';
import { Providers } from './providers';
import { AppHeader } from './components/AppHeader';
import { useConnectionToast } from './hooks/useConnectionToast';
import { useConnectionHeartbeat } from './hooks/useConnectionHeartbeat';
import { HomePage } from './pages/home';
import { DashboardPage } from './pages/dashboard';
import { NetworkTab } from './pages/network';
import { WifiPage } from './pages/wifi';
import { WifiDetailPage } from './pages/wifi/detail';
import { VPNDashboard, VPNServersPage, VPNClientsPage } from './pages/vpn';
import { RouterListPage } from './routes/router-list';
import { RouterPanel } from './routes/router-panel/RouterPanel';
import { RouterDiscoveryPage } from './pages/router-discovery';
import {
  OverviewTab,
  WiFiTab,
  FirewallTab,
  DHCPTab,
  NetworkTab as RouterNetworkTab,
  LogsTab,
  PluginStoreTab,
} from './routes/router-panel/tabs';
import { ROUTES } from '@nasnet/core/constants';

const router = createBrowserRouter([
  // Router discovery landing page (Epic 0.1)
  { path: '/', element: <RouterDiscoveryPage /> },
  { path: '/discover', element: <RouterDiscoveryPage /> },
  // Existing routes
  { path: ROUTES.HOME, element: <HomePage /> },
  { path: ROUTES.DASHBOARD, element: <DashboardPage /> },
  { path: ROUTES.ROUTER_LIST, element: <RouterListPage /> },
  { path: ROUTES.NETWORK, element: <NetworkTab /> },
  { path: ROUTES.WIFI, element: <WifiPage /> },
  { path: ROUTES.WIFI_DETAIL, element: <WifiDetailPage /> },
  // VPN Dashboard routes
  { path: ROUTES.VPN, element: <VPNDashboard /> },
  { path: ROUTES.VPN_SERVERS, element: <VPNServersPage /> },
  { path: ROUTES.VPN_CLIENTS, element: <VPNClientsPage /> },
  // Router panel with nested tab routes (Epic 0.9)
  {
    path: '/router/:id',
    element: <RouterPanel />,
    children: [
      { index: true, element: <OverviewTab /> },
      { path: 'wifi', element: <WiFiTab /> },
      { path: 'vpn', element: <VPNDashboard /> },
      { path: 'firewall', element: <FirewallTab /> },
      { path: 'dhcp', element: <DHCPTab /> },
      { path: 'network', element: <RouterNetworkTab /> },
      { path: 'logs', element: <LogsTab /> },
      { path: 'plugins', element: <PluginStoreTab /> },
    ],
  },
]);

export function App() {
  // Enable connection toast notifications
  useConnectionToast();

  // Enable connection heartbeat monitoring (Epic 0.1, Story 0-1-7)
  useConnectionHeartbeat();

  return (
    <Providers>
      <AppShell header={<AppHeader />}>
        <RouterProvider router={router} />
        <Toaster />
      </AppShell>
    </Providers>
  );
}

export default App;
