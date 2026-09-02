import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@nasnet/ui';
import { setUnauthorizedHandler } from '../api';
import { useRouter } from './RouterStoreContext';
import { useSession } from './SessionContext';

export function AuthErrorRedirect() {
  const navigate = useNavigate();
  const toast = useToast();
  const { activeRouterId, getCredentials, clearCredentials } = useSession();
  const activeHost = useRouter(activeRouterId ?? undefined)?.host;

  useEffect(() => {
    setUnauthorizedHandler((host) => {
      if (!activeRouterId || !activeHost || host !== activeHost) return;
      if (!getCredentials(activeRouterId)) return;
      clearCredentials(activeRouterId);
      toast.notify({
        title: 'Session expired',
        description: 'The saved credentials were rejected. Please sign in again.',
        tone: 'danger',
      });
      navigate(`/router/${activeRouterId}`, { replace: true });
    });
    return () => setUnauthorizedHandler(null);
  }, [activeRouterId, activeHost, getCredentials, clearCredentials, navigate, toast]);

  return null;
}
