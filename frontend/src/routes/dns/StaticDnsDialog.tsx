import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, Dialog, FormError, Input, Label, Stack } from '@nasnet/ui';
import type { CreateStaticDnsRequest, StaticDnsEntry } from '../../api';
import { isIPv4 } from '../../utils/validators';

// Mirrors the backend check: letters, digits and * _ . - only, at most 253 characters.
const NAME_RE = /^[A-Za-z0-9*_.-]+$/;
const NAME_MAX_LENGTH = 253;

interface Props {
  entry: StaticDnsEntry | null;
  onCancel: () => void;
  onSubmit: (request: CreateStaticDnsRequest) => Promise<void>;
}

export function StaticDnsDialog({ entry, onCancel, onSubmit }: Props) {
  const { t } = useTranslation('network');
  const [name, setName] = useState(entry?.name ?? '');
  const [address, setAddress] = useState(entry?.address ?? '');
  const [touched, setTouched] = useState({ name: false, address: false });
  const [busy, setBusy] = useState(false);

  const trimmedName = name.trim();
  const trimmedAddress = address.trim();
  const errors = {
    name: !trimmedName
      ? t('dns.static.form.nameRequired')
      : trimmedName.length > NAME_MAX_LENGTH || !NAME_RE.test(trimmedName)
        ? t('dns.static.form.nameInvalid')
        : null,
    address: !trimmedAddress
      ? t('dns.static.form.addressRequired')
      : !isIPv4(trimmedAddress)
        ? t('dns.static.form.addressInvalid')
        : null,
  };

  const submit = async () => {
    setTouched({ name: true, address: true });
    if (errors.name || errors.address) return;
    setBusy(true);
    try {
      await onSubmit({ name: trimmedName, address: trimmedAddress });
    } catch {
      // The caller shows the error toast and keeps the dialog open.
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog
      open
      onClose={() => (busy ? undefined : onCancel())}
      title={entry ? t('dns.static.form.editTitle') : t('dns.static.form.addTitle')}
      size="sm"
      footer={
        <>
          <Button variant="ghost" onClick={onCancel} disabled={busy}>
            {t('common.cancel')}
          </Button>
          <Button variant="primary" onClick={submit} disabled={busy}>
            {busy ? t('dns.static.form.saving') : t('dns.static.form.save')}
          </Button>
        </>
      }
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void submit();
        }}
      >
        <Stack $gap="var(--space-md)">
          <Label>
            <span>{t('dns.static.columns.name')}</span>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              onBlur={() => setTouched((v) => ({ ...v, name: true }))}
              placeholder="nas.lan"
              autoComplete="off"
              dir="ltr"
              disabled={busy}
              aria-label={t('dns.static.columns.name')}
              aria-invalid={touched.name && !!errors.name}
            />
            {touched.name && errors.name ? <FormError>{errors.name}</FormError> : null}
          </Label>
          <Label>
            <span>{t('dns.static.columns.address')}</span>
            <Input
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              onBlur={() => setTouched((v) => ({ ...v, address: true }))}
              placeholder="192.168.88.10"
              autoComplete="off"
              dir="ltr"
              disabled={busy}
              aria-label={t('dns.static.columns.address')}
              aria-invalid={touched.address && !!errors.address}
            />
            {touched.address && errors.address ? <FormError>{errors.address}</FormError> : null}
          </Label>
          <button type="submit" hidden aria-hidden tabIndex={-1} />
        </Stack>
      </form>
    </Dialog>
  );
}
