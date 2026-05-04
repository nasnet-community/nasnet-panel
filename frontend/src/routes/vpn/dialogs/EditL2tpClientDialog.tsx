import { useMemo, useState } from 'react';
import {
  Button,
  Dialog,
  FieldRow,
  FieldStack,
  FormError,
  Input,
  Label,
  PasswordInput,
  Switch,
} from '@nasnet/ui';
import type { UpdateL2TPClientRequest } from '../../../api';
import { validateHostOrIp } from '../../../utils/validators';

interface Draft {
  connectTo: string;
  user: string;
  password: string;
  ipsecSecret: string;
  disabled: boolean;
}

interface Props {
  clientName: string;
  initialDisabled: boolean;
  onCancel: () => void;
  onSubmit: (req: UpdateL2TPClientRequest) => Promise<void>;
}

export function EditL2tpClientDialog({ clientName, initialDisabled, onCancel, onSubmit }: Props) {
  const [draft, setDraft] = useState<Draft>({
    connectTo: '',
    user: '',
    password: '',
    ipsecSecret: '',
    disabled: initialDisabled,
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const set = <K extends keyof Draft>(key: K, value: Draft[K]) =>
    setDraft((d) => ({ ...d, [key]: value }));

  const markTouched = (key: string) => setTouched((t) => (t[key] ? t : { ...t, [key]: true }));

  const errors = useMemo(
    () => ({
      connectTo: draft.connectTo.trim() === '' ? null : validateHostOrIp(draft.connectTo),
    }),
    [draft.connectTo],
  );

  const hasErrors = Object.values(errors).some(Boolean);
  const canSubmit = !submitting && !hasErrors;

  const handleSubmit = async () => {
    setTouched({ connectTo: true });
    if (!canSubmit) return;
    setError(null);
    setSubmitting(true);

    const body: UpdateL2TPClientRequest = {
      disabled: draft.disabled,
    };
    if (draft.connectTo.trim() !== '') body.connectTo = draft.connectTo.trim();
    if (draft.user.trim() !== '') body.user = draft.user.trim();
    if (draft.password !== '') body.password = draft.password;
    if (draft.ipsecSecret.trim() !== '') body.ipsecSecret = draft.ipsecSecret.trim();

    try {
      await onSubmit(body);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update L2TP client.');
      setSubmitting(false);
      return;
    }
    setSubmitting(false);
  };

  return (
    <Dialog
      open
      onClose={submitting ? () => undefined : onCancel}
      title={`Edit L2TP client - ${clientName}`}
      description="Leave any field blank to keep its current value."
      size="md"
      footer={
        <>
          <Button variant="ghost" onClick={onCancel} disabled={submitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!canSubmit}>
            {submitting ? 'Saving…' : 'Save changes'}
          </Button>
        </>
      }
    >
      <FieldStack>
        <FieldRow>
          <Label>
            <span>Connect to</span>
            <Input
              value={draft.connectTo}
              onChange={(e) => set('connectTo', e.target.value)}
              onBlur={() => markTouched('connectTo')}
              placeholder="Leave blank to keep current"
              aria-label="Connect to"
              aria-invalid={touched.connectTo && !!errors.connectTo}
            />
            {touched.connectTo && errors.connectTo ? (
              <FormError>{errors.connectTo}</FormError>
            ) : null}
          </Label>
          <Label>
            <span>User</span>
            <Input
              value={draft.user}
              onChange={(e) => set('user', e.target.value)}
              placeholder="Leave blank to keep current"
              aria-label="User"
              autoComplete="off"
            />
          </Label>
        </FieldRow>
        <FieldRow>
          <Label>
            <span>New password</span>
            <PasswordInput
              value={draft.password}
              onChange={(e) => set('password', e.target.value)}
              placeholder="Leave blank to keep current"
              aria-label="New password"
              autoComplete="new-password"
            />
          </Label>
          <Label>
            <span>New IPsec secret</span>
            <PasswordInput
              value={draft.ipsecSecret}
              onChange={(e) => set('ipsecSecret', e.target.value)}
              placeholder="Leave blank to keep current"
              aria-label="New IPsec secret"
              autoComplete="off"
            />
          </Label>
        </FieldRow>
        <FieldRow>
          <Label as="div">
            <Switch
              label="Enabled"
              checked={!draft.disabled}
              onChange={(e) => set('disabled', !e.target.checked)}
            />
          </Label>
        </FieldRow>
        {error ? <FormError role="alert">{error}</FormError> : null}
      </FieldStack>
    </Dialog>
  );
}
