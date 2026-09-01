import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@nasnet/ui';
import { setUnauthorizedHandler } from '../api';
import { useSession } from './SessionContext';

export function AuthErrorRedirect() {
  const navigate = useNavigate();
  const toast = useToast();
  const { activeRouterId, getCredentials, clearCredentials } = useSession();

  useEffect(() => {
    setUnauthorizedHandler(() => {
      if (!activeRouterId) {
        navigate('/', { replace: true });
        return;
      }
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
  }, [activeRouterId, getCredentials, clearCredentials, navigate, toast]);

  return null;
}
