import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('');
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const close = () => navigate('/');

  const onConnect = async () => {
    if (!username.trim()) {
      setError('Username is required.');
      return;
    }
    setConnecting(true);
    setError(null);
    try {
      await testCredentials(router.host, username, password);
      setCredentials(router.id, { username, password });
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        setError('Invalid username or password');
      } else {
        setError(err instanceof Error ? err.message : 'Connection failed');
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
      title={`Connect to ${router.name || router.host}`}
      description={`Enter credentials for ${router.host}.`}
      size="sm"
      labelledBy="router-credentials-title"
      footer={
        <>
          <Button variant="ghost" onClick={close} disabled={connecting}>
            Cancel
          </Button>
          <Button
            variant="success"
            onClick={() => {
              void onConnect();
            }}
            loading={connecting}
          >
            Connect
          </Button>
        </>
      }
    >
      <Stack>
        <FieldRow>
          <Label>
            <span>Username</span>
            <Input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
              aria-label="Username"
              autoFocus
            />
          </Label>
          <Label>
            <span>Password</span>
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
              aria-label="Password"
            />
          </Label>
        </FieldRow>
        {error ? <FormError>{error}</FormError> : null}
      </Stack>
    </Dialog>
  );
}
