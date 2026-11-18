import { useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { Stack } from '@nasnet/ui';
import { BackupsCard } from './BackupsCard';
import { useSession } from '../state/SessionContext';
import { useRouter } from '../state/RouterStoreContext';
import type { SystemCredentials } from '../api';

export function BackupsPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter(id);
  const { getCredentials } = useSession();

  const creds = useMemo<SystemCredentials | null>(() => {
    if (!id) return null;
    const c = getCredentials(id);
    const host = router?.host;
    if (!c || !host) return null;
    return { host, username: c.username, password: c.password };
  }, [id, router?.host, getCredentials]);

  return (
    <Stack>
      <BackupsCard key={id} creds={creds} />
    </Stack>
  );
}
