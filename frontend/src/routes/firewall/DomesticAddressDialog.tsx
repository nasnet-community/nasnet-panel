import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, Dialog, FormError, Input, Label, Stack } from '@nasnet/ui';
import type { DomesticAddress, UpdateDomesticAddressRequest } from '../../api';
import { isCIDR, isIPv4 } from '../../utils/validators';

// Same as routerOSTimePattern in the backend: 1d, 2h30m, 1w2d or 00:10:00.
const TIMEOUT_RE = /^(?:\d+w)?(?:\d+d)?(?:\d+h)?(?:\d+m)?(?:\d+s)?$|^\d+:\d{2}(?::\d{2})?$/;

// The backend rejects /0, which would match every address.
const isDomesticAddress = (value: string): boolean =>
  isIPv4(value) || (isCIDR(value) && !value.endsWith('/0'));

interface Props {
  entry: DomesticAddress | null;
  onCancel: () => void;
  onSubmit: (request: UpdateDomesticAddressRequest) => Promise<void>;
}

export function DomesticAddressDialog({ entry, onCancel, onSubmit }: Props) {
  const { t } = useTranslation('network');
  const [address, setAddress] = useState(entry?.address ?? '');
  const [timeoutValue, setTimeoutValue] = useState('');
  const [touched, setTouched] = useState({ address: false, timeout: false });
  const [busy, setBusy] = useState(false);

  const trimmedAddress = address.trim();
  const trimmedTimeout = timeoutValue.trim();
  const errors = {
    address: !trimmedAddress
      ? t('firewall.domestic.form.addressRequired')
      : !isDomesticAddress(trimmedAddress)
        ? t('firewall.domestic.form.addressInvalid')
        : null,
    timeout:
      trimmedTimeout && !TIMEOUT_RE.test(trimmedTimeout)
        ? t('firewall.domestic.form.timeoutInvalid')
        : null,
  };

  const submit = async () => {
    setTouched({ address: true, timeout: true });
    if (errors.address || errors.timeout) return;
    setBusy(true);
    try {
      await onSubmit({
        address: trimmedAddress,
        ...(entry && trimmedTimeout ? { timeout: trimmedTimeout } : {}),
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
              onBlur={() => setTouched((v) => ({ ...v, address: true }))}
              placeholder="203.0.113.0/24"
              autoComplete="off"
              dir="ltr"
              disabled={busy}
              aria-label={t('firewall.domestic.columns.address')}
              aria-invalid={touched.address && !!errors.address}
            />
            {touched.address && errors.address ? <FormError>{errors.address}</FormError> : null}
          </Label>
          {entry ? (
            <Label>
              <span>{t('firewall.domestic.columns.timeout')}</span>
              <Input
                value={timeoutValue}
                onChange={(e) => setTimeoutValue(e.target.value)}
                onBlur={() => setTouched((v) => ({ ...v, timeout: true }))}
                placeholder={entry.timeout || '1d'}
                autoComplete="off"
                dir="ltr"
                disabled={busy}
                aria-label={t('firewall.domestic.columns.timeout')}
                aria-invalid={touched.timeout && !!errors.timeout}
              />
              {touched.timeout && errors.timeout ? (
                <FormError>{errors.timeout}</FormError>
              ) : (
                <span>{t('firewall.domestic.form.timeoutHint')}</span>
              )}
            </Label>
          ) : null}
          <button type="submit" hidden aria-hidden tabIndex={-1} />
        </Stack>
      </form>
    </Dialog>
  );
}
