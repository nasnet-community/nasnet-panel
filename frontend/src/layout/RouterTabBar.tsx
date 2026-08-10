import { useNavigate } from 'react-router-dom';
import { Tabs } from '@nasnet/ui';
import { useSession } from '../state/SessionContext';
import { useRouterStore } from '../state/RouterStoreContext';
import { ROUTER_SECTIONS } from './routerSections';
import styles from './RouterTabBar.module.scss';

export function RouterTabBar({
  routerId,
  activeId,
}: {
  routerId?: string | null;
  activeId?: string;
}) {
  const navigate = useNavigate();
  const { activeRouterId } = useSession();
  const { routers, lastConnectedRouterId, selectedRouterId } = useRouterStore();
  const targetId =
    routerId ??
    activeRouterId ??
    lastConnectedRouterId ??
    selectedRouterId ??
    routers[0]?.id ??
    null;

  if (!targetId) return null;

  return (
    <div className={styles.tabBarBand}>
      <div className={styles.tabBarInner}>
        <Tabs
          items={ROUTER_SECTIONS}
          activeId={activeId ?? ''}
          onChange={(tabId) => {
            const item = ROUTER_SECTIONS.find((t) => t.id === tabId);
            if (!item) return;
            navigate(`/router/${targetId}${item.path ? `/${item.path}` : ''}`);
          }}
          ariaLabel="Router sections"
        />
      </div>
    </div>
  );
}
