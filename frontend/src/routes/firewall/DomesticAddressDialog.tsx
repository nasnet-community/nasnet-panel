import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, Dialog, FormError, Input, Label, Select, Stack } from '@nasnet/ui';
import type { DomesticAddress, UpdateDomesticAddressRequest } from '../../api';
import { isCIDR, isIPv4 } from '../../utils/validators';

// RouterOS times offered for the timeout. KEEP_TIMEOUT sends no timeout, which keeps the
// current one, since the backend cannot remove a timeout.
const TIMEOUTS = ['1h', '6h', '1d', '7d', '30d'] as const;
const KEEP_TIMEOUT = 'keep';

// The backend rejects a /0 range (also written /00), which would match every address.
const isDomesticAddress = (value: string): boolean =>
  isIPv4(value) || (isCIDR(value) && Number(value.split('/')[1]) !== 0);

interface Props {
  entry: DomesticAddress | null;
  onCancel: () => void;
  onSubmit: (request: UpdateDomesticAddressRequest) => Promise<void>;
}

export function DomesticAddressDialog({ entry, onCancel, onSubmit }: Props) {
  const { t } = useTranslation('network');
  const [address, setAddress] = useState(entry?.address ?? '');
  const [timeoutValue, setTimeoutValue] = useState<string>(KEEP_TIMEOUT);
  const [touched, setTouched] = useState(false);
  const [busy, setBusy] = useState(false);

  const trimmedAddress = address.trim();
  const addressError = !trimmedAddress
    ? t('firewall.domestic.form.addressRequired')
    : !isDomesticAddress(trimmedAddress)
      ? t('firewall.domestic.form.addressInvalid')
      : null;

  const timeoutOptions = [
    {
      value: KEEP_TIMEOUT,
      label: entry?.timeout
        ? t('firewall.domestic.form.keepTimeoutCurrent', { timeout: entry.timeout })
        : t('firewall.domestic.form.keepTimeoutNever'),
    },
    ...TIMEOUTS.map((value) => ({ value, label: t(`firewall.domestic.form.timeouts.${value}`) })),
  ];

  const submit = async () => {
    setTouched(true);
    if (addressError) return;
    setBusy(true);
    try {
      await onSubmit({
        address: trimmedAddress,
        ...(entry && timeoutValue !== KEEP_TIMEOUT ? { timeout: timeoutValue } : {}),
      });
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
      title={entry ? t('firewall.domestic.form.editTitle') : t('firewall.domestic.form.addTitle')}
      size="sm"
      footer={
        <>
          <Button variant="ghost" onClick={onCancel} disabled={busy}>
            {t('common.cancel')}
          </Button>
          <Button variant="primary" onClick={submit} disabled={busy}>
            {busy ? t('firewall.domestic.form.saving') : t('firewall.domestic.form.save')}
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
            <span>{t('firewall.domestic.columns.address')}</span>
            <Input
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              onBlur={() => setTouched(true)}
              placeholder="203.0.113.0/24"
              autoComplete="off"
              dir="ltr"
              disabled={busy}
              aria-label={t('firewall.domestic.columns.address')}
              aria-invalid={touched && !!addressError}
            />
            {touched && addressError ? <FormError>{addressError}</FormError> : null}
          </Label>
          {entry ? (
            <Label>
              <span>{t('firewall.domestic.columns.timeout')}</span>
              <Select
                aria-label={t('firewall.domestic.columns.timeout')}
                value={timeoutValue}
                onChange={setTimeoutValue}
                options={timeoutOptions}
                disabled={busy}
              />
            </Label>
          ) : null}
          <button type="submit" hidden aria-hidden tabIndex={-1} />
        </Stack>
      </form>
    </Dialog>
  );
}
