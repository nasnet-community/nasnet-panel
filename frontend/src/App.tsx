import { BrowserRouter, Route, Routes, Navigate, useSearchParams } from 'react-router-dom';
import { GlobalStyle, ToastProvider } from '@nasnet/ui';
import { AppThemeProvider } from './state/ThemeContext';
import { RouterStoreProvider } from './state/RouterStoreContext';
import { SessionProvider } from './state/SessionContext';
import { WizardGateProvider } from './state/WizardGateContext';
import { AuthErrorRedirect } from './state/AuthErrorRedirect';
import { AppShell } from './layout/AppShell';
import { RouterListPage } from './routes/RouterListPage';
import { AddRouterWizard } from './routes/AddRouterWizard';
import { RouterDashboard } from './routes/RouterDashboard';
import { OverviewTab } from './routes/OverviewTab';
import { EasyConfigWizard } from './routes/EasyConfigWizard';
import { InternetPage } from './routes/InternetPage';
import { WanPage } from './routes/WanPage';
import { VPNPage } from './routes/VPNPage';
import { WirelessPage } from './routes/WirelessPage';
import { LogsPage } from './routes/LogsPage';
import { UpdatesPage } from './routes/UpdatesPage';
import { PluginsPage } from './routes/PluginsPage';
import { DHCPPage } from './routes/DHCPPage';
import { DNSPage } from './routes/DNSPage';
import { FirewallPage } from './routes/FirewallPage';
import { DiagnosticsPage } from './routes/DiagnosticsPage';
import { HelpPage } from './routes/HelpPage';

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
          <WizardGateProvider>
            <ToastProvider>
              <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
                <AuthErrorRedirect />
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
                    <Route path="internet" element={<InternetPage />} />
                    <Route path="wan" element={<WanPage />} />
                    <Route path="vpn" element={<VPNPage />} />
                    <Route path="wireless" element={<WirelessPage />} />
                    <Route path="logs" element={<LogsPage />} />
                    <Route path="lan" element={<DHCPPage />} />
                    <Route path="dns" element={<DNSPage />} />
                    <Route path="firewall" element={<FirewallPage />} />
                    <Route path="plugins" element={<PluginsPage />} />
                    <Route path="diagnostics" element={<DiagnosticsPage />} />
                    <Route path="help" element={<HelpPage />} />
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
          </WizardGateProvider>
        </SessionProvider>
      </RouterStoreProvider>
    </AppThemeProvider>
  );
}
