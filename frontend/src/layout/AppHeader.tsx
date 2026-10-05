import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { HeaderActions } from './HeaderActions';
import { activeRouterSectionId, routerSectionsWithPlugins } from './routerSections';
import { useSession } from '../state/SessionContext';
import { useRouter, useRouterStore } from '../state/RouterStoreContext';
import { useWizardGate } from '../state/WizardGateContext';
import { useInstalledPlugins } from '../state/InstalledPluginsContext';
import styles from './AppHeader.module.scss';

export function AppHeader() {
  const { activeRouterId } = useSession();
  const { lastConnectedRouterId, selectedRouterId } = useRouterStore();
  const { statusFor } = useWizardGate();
  const { plugins } = useInstalledPlugins();
  const location = useLocation();
  const { t } = useTranslation('layout');
  const targetId = activeRouterId ?? lastConnectedRouterId ?? selectedRouterId ?? null;
  const router = useRouter(targetId ?? undefined);
  const logoTarget = targetId ? `/router/${targetId}` : '/';
  return (
    <header className={styles.headerRoot}>
      <div className={styles.wrap}>
        <Link to={logoTarget} className={styles.brand}>
          <img src="/favicon.png" alt={t('brand.logoAlt')} className={styles.logoImg} />
          <div className={styles.brandText}>
            <span className={styles.brandTitle}>{t('brand.title')}</span>
          </div>
        </Link>
        <div className={styles.actionsRight}>
          <HeaderActions
            routerName={router?.name}
            routerId={targetId ?? undefined}
            sections={
              targetId && statusFor(targetId) === 'completed'
                ? routerSectionsWithPlugins(plugins)
                : undefined
            }
            activeSectionId={
              targetId ? activeRouterSectionId(location.pathname, targetId) : undefined
            }
          />
        </div>
      </div>
    </header>
  );
}
