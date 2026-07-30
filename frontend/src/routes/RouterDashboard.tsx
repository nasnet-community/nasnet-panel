import { useEffect } from 'react';
import { Navigate, Outlet, useLocation, useNavigate, useParams } from 'react-router-dom';
import { Tabs } from '@nasnet/ui';
import { useRouter } from '../state/RouterStoreContext';
import { useSession } from '../state/SessionContext';
import { useWizardGate } from '../state/WizardGateContext';
import { ROUTER_SECTIONS as TABS } from '../layout/routerSections';
import { RouterCredentialsDialog } from './RouterCredentialsDialog';
import styles from './RouterDashboard.module.scss';

export function RouterDashboard() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter(id);
  const location = useLocation();
  const navigate = useNavigate();
  const { setActiveRouterId, getCredentials } = useSession();
  const { statusFor } = useWizardGate();

  useEffect(() => {
    setActiveRouterId(id ?? null);
    return () => setActiveRouterId(null);
  }, [id, setActiveRouterId]);

  if (!router) {
    return (
      <div className={styles.contentShell}>
        <div className={styles.notFound}>Router not found.</div>
      </div>
    );
  }

  if (!getCredentials(router.id)) {
    return (
      <div className={styles.contentShell}>
        <RouterCredentialsDialog router={router} />
      </div>
    );
  }

  const wizardStatus = statusFor(router.id);

  const activeTab =
    TABS.find((t) => {
      const full = `/router/${router.id}${t.path ? `/${t.path}` : ''}`;
      return t.path === '' ? location.pathname === full : location.pathname.startsWith(full);
    })?.id ?? 'overview';

  if (wizardStatus === 'fresh' && activeTab !== 'wizard') {
    return <Navigate to={`/router/${router.id}/config`} replace />;
  }

  return (
    <>
      {wizardStatus === 'completed' ? (
        <div className={styles.tabBarBand}>
          <div className={styles.tabBarInner}>
            <Tabs
              items={TABS}
              activeId={activeTab}
              onChange={(tabId) => {
                const item = TABS.find((t) => t.id === tabId);
                if (!item) return;
                navigate(`/router/${router.id}${item.path ? `/${item.path}` : ''}`);
              }}
              ariaLabel="Router sections"
            />
          </div>
        </div>
      ) : null}
      <div className={styles.contentShell}>
        <Outlet />
      </div>
    </>
  );
}
