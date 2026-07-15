import { Link } from 'react-router-dom';
import { HeaderActions } from './HeaderActions';
import { useSession } from '../state/SessionContext';
import { useRouter, useRouterStore } from '../state/RouterStoreContext';
import styles from './AppHeader.module.scss';

export function AppHeader() {
  const { activeRouterId } = useSession();
  const { lastConnectedRouterId, selectedRouterId } = useRouterStore();
  const targetId = activeRouterId ?? lastConnectedRouterId ?? selectedRouterId ?? null;
  const router = useRouter(targetId ?? undefined);
  const logoTarget = targetId ? `/router/${targetId}` : '/';
  return (
    <header className={styles.headerRoot}>
      <div className={styles.wrap}>
        <Link to={logoTarget} className={styles.brand}>
          <img src="/favicon.png" alt="Nasnet Panel" className={styles.logoImg} />
          <div className={styles.brandText}>
            <span className={styles.brandTitle}>Nasnet Panel</span>
          </div>
        </Link>
        <div className={styles.actionsRight}>
          <HeaderActions routerName={router?.name} />
        </div>
      </div>
    </header>
  );
}
