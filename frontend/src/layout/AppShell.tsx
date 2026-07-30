import React, { useEffect, useState } from 'react';
import { Badge, Inline } from '@nasnet/ui';
import { fetchHealth } from '../api';
import { AppHeader } from './AppHeader';
import styles from './AppShell.module.scss';

const isDev = process.env.NODE_ENV !== 'production';

export const AppShell: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [version, setVersion] = useState('');

  useEffect(() => {
    const controller = new AbortController();
    fetchHealth(controller.signal)
      .then((health) => setVersion(health.version))
      .catch(() => {});
    return () => controller.abort();
  }, []);

  return (
    <div className={styles.root}>
      <AppHeader />
      <main className={styles.main}>{children}</main>
      <footer className={styles.footer}>
        <Inline $gap="8px" $justify="center">
          <span>© 2026 Nasnet Panel{version ? ` ${version}` : ''}</span>
          {isDev ? <Badge tone="warning">DEV</Badge> : null}
        </Inline>
      </footer>
    </div>
  );
};
