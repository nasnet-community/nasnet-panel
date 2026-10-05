import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Button,
  Dialog,
  FieldRow,
  FormError,
  Input,
  Label,
  PasswordInput,
  Stack,
} from '@nasnet/ui';
import { ApiError, testCredentials, type Router } from '../api';
import { useSession } from '../state/SessionContext';

interface Props {
  router: Router;
}

export function RouterCredentialsDialog({ router }: Props) {
  const navigate = useNavigate();
  const { setCredentials } = useSession();
  const { t } = useTranslation('routerList');
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('');
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const close = () => navigate('/');

  const onConnect = async () => {
    if (!username.trim()) {
      setError(t('credentials.usernameRequired'));
      return;
    }
    setConnecting(true);
    setError(null);
    try {
      await testCredentials(router.host, username, password);
      setCredentials(router.id, { username, password });
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        setError(t('credentials.invalidCredentials'));
      } else {
        setError(err instanceof Error ? err.message : t('credentials.connectionFailed'));
      }
    } finally {
      setConnecting(false);
    }
  };

  return (
    <Dialog
      open
      onClose={() => {
        if (!connecting) close();
      }}
      title={t('credentials.title', { name: router.name || router.host })}
      description={t('credentials.description', { host: router.host })}
      size="sm"
      labelledBy="router-credentials-title"
      footer={
        <>
          <Button variant="ghost" onClick={close} disabled={connecting}>
            {t('credentials.cancel')}
          </Button>
          <Button
            variant="success"
            onClick={() => {
              void onConnect();
            }}
            loading={connecting}
          >
            {t('credentials.connect')}
          </Button>
        </>
      }
    >
      <Stack>
        <FieldRow>
          <Label>
            <span>{t('credentials.username')}</span>
            <Input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
              aria-label={t('credentials.username')}
              autoFocus
            />
          </Label>
          <Label>
            <span>{t('credentials.password')}</span>
            <PasswordInput
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !connecting) {
                  e.preventDefault();
                  void onConnect();
                }
              }}
              autoComplete="current-password"
              aria-label={t('credentials.password')}
            />
          </Label>
        </FieldRow>
        {error ? <FormError>{error}</FormError> : null}
      </Stack>
    </Dialog>
  );
}
