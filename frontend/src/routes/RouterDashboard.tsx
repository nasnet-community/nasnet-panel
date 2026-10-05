import { useEffect } from 'react';
import { Navigate, Outlet, useLocation, useNavigate, useParams } from 'react-router-dom';
import { BookOpen } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button, Tabs } from '@nasnet/ui';
import { useRouter } from '../state/RouterStoreContext';
import { useSession } from '../state/SessionContext';
import { useWizardGate } from '../state/WizardGateContext';
import { useInstalledPlugins } from '../state/InstalledPluginsContext';
import { routerSectionsWithPlugins } from '../layout/routerSections';
import { RouterCredentialsDialog } from './RouterCredentialsDialog';
import { USER_GUIDE_SECTIONS, userGuideUrl } from './help/links';
import { useLanguage } from '../state/LanguageContext';
import styles from './RouterDashboard.module.scss';

export function RouterDashboard() {
  const { t } = useTranslation('overview');
  const { language } = useLanguage();
  const { id } = useParams<{ id: string }>();
  const router = useRouter(id);
  const location = useLocation();
  const navigate = useNavigate();
  const { setActiveRouterId, getCredentials } = useSession();
  const { statusFor, retry } = useWizardGate();
  const { plugins } = useInstalledPlugins();
  const TABS = routerSectionsWithPlugins(plugins);

  useEffect(() => {
    setActiveRouterId(id ?? null);
    return () => setActiveRouterId(null);
  }, [id, setActiveRouterId]);

  if (!router) {
    return (
      <div className={styles.contentShell}>
        <div className={styles.notFound}>{t('dashboard.notFound')}</div>
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

  const onWizard = location.pathname.startsWith(`/router/${router.id}/config`);
  const guideSection = USER_GUIDE_SECTIONS.get(
    location.pathname.slice(`/router/${router.id}`.length).split('/')[1] ?? '',
  );

  const activeTab = onWizard
    ? 'diagnostics'
    : (TABS.find((tab) => {
        const full = `/router/${router.id}${tab.path ? `/${tab.path}` : ''}`;
        return tab.path === '' ? location.pathname === full : location.pathname.startsWith(full);
      })?.id ?? 'overview');

  if (wizardStatus === 'unreachable' && !onWizard) {
    return (
      <div className={styles.contentShell}>
        <div className={styles.unreachable} role="alert">
          <h2 className={styles.unreachableTitle}>{t('dashboard.unreachableTitle')}</h2>
          <p>{t('dashboard.unreachableBody', { name: router.name || router.host })}</p>
          <Button variant="success" onClick={retry}>
            {t('dashboard.retry')}
          </Button>
        </div>
      </div>
    );
  }

  if (wizardStatus === 'fresh' && !onWizard) {
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
                const item = TABS.find((tab) => tab.id === tabId);
                if (!item) return;
                navigate(`/router/${router.id}${item.path ? `/${item.path}` : ''}`);
              }}
              ariaLabel={t('dashboard.sectionsAria')}
            />
          </div>
        </div>
      ) : null}
      <div className={styles.contentShell}>
        <Outlet />
        {guideSection ? (
          <footer className={styles.guideFooter}>
            <a
              className={styles.guideLink}
              href={`${userGuideUrl(language.code)}/${guideSection}/`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <BookOpen size={16} aria-hidden />
              {t('dashboard.userGuide')}
            </a>
          </footer>
        ) : null}
      </div>
    </>
  );
}
