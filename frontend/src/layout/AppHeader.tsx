import { Link } from 'react-router-dom';
import { HeaderActions } from './HeaderActions';
import { useSession } from '../state/SessionContext';
import { useRouter } from '../state/RouterStoreContext';
import styles from './AppHeader.module.scss';

export function AppHeader() {
  const { activeRouterId } = useSession();
  const router = useRouter(activeRouterId ?? undefined);
  const logoTarget = activeRouterId ? `/router/${activeRouterId}` : '/';
  return (
    <header className={styles.headerRoot}>
      <div className={styles.wrap}>
        <Link to={logoTarget} className={styles.brand}>
          <img src="/favicon.png" alt="Nasnet Panel" className={styles.logoImg} />
          <div className={styles.brandText}>
            <span className={styles.brandTitle}>Nasnet Panel</span>
            <span className={styles.brandSubtitle}>
              Enterprise MikroTik Router Management Platform
            </span>
          </div>
        </Link>
        <div className={styles.actionsRight}>
          <HeaderActions routerName={router?.name} />
        </div>
      </div>
    </header>
  );
}
