import { BrowserRouter, Route, Routes, Navigate, useSearchParams } from 'react-router-dom';
import { GlobalStyle, ToastProvider } from '@nasnet/ui';
import { AppThemeProvider } from './state/ThemeContext';
import { RouterStoreProvider } from './state/RouterStoreContext';
import { SessionProvider } from './state/SessionContext';
import { AppShell } from './layout/AppShell';
import { RouterListPage } from './routes/RouterListPage';
import { AddRouterWizard } from './routes/AddRouterWizard';
import { RouterDashboard } from './routes/RouterDashboard';
import { OverviewTab } from './routes/OverviewTab';
import { EasyConfigWizard } from './routes/EasyConfigWizard';
import { VPNPage } from './routes/VPNPage';
import { WirelessPage } from './routes/WirelessPage';
import { UsersPage } from './routes/UsersPage';
import { LogsPage } from './routes/LogsPage';
import { UpdatesPage } from './routes/UpdatesPage';
import { DHCPPage } from './routes/DHCPPage';
import { DNSPage } from './routes/StubTabs';

function AddRouterEntry() {
  const [params] = useSearchParams();
  const mode = params.get('mode') === 'scan' ? 'scan' : 'manual';
  return <AddRouterWizard key={mode} />;
}

export function App() {
  return (
    <AppThemeProvider>
      <GlobalStyle />
      <RouterStoreProvider>
        <SessionProvider>
          <ToastProvider>
            <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
              <Routes>
                <Route path="/" element={<RouterListPage />} />
                <Route
                  path="/routers/new"
                  element={
                    <AppShell>
                      <AddRouterEntry />
                    </AppShell>
                  }
                />
                <Route
                  path="/router/:id"
                  element={
                    <AppShell>
                      <RouterDashboard />
                    </AppShell>
                  }
                >
                  <Route index element={<OverviewTab />} />
                  <Route path="config" element={<EasyConfigWizard />} />
                  <Route path="vpn" element={<VPNPage />} />
                  <Route path="wireless" element={<WirelessPage />} />
                  <Route path="users" element={<UsersPage />} />
                  <Route path="logs" element={<LogsPage />} />
                  <Route path="dhcp" element={<DHCPPage />} />
                  <Route path="dns" element={<DNSPage />} />
                </Route>
                <Route
                  path="/updates"
                  element={
                    <AppShell>
                      <UpdatesPage />
                    </AppShell>
                  }
                />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </BrowserRouter>
          </ToastProvider>
        </SessionProvider>
      </RouterStoreProvider>
    </AppThemeProvider>
  );
}
