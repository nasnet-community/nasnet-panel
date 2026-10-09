import {
  Checkbox,
  FieldRow,
  FieldStack,
  Inline,
  Input,
  Label,
  PasswordInput,
  Select,
} from '@nasnet/ui';
import { useTranslation } from 'react-i18next';
import type { WirelessSettings } from '../../api';

// Security mode identifiers: shown as-is in every language.
export const SECURITY_OPTIONS: Array<{ value: string; label: string }> = [
  { value: 'wpa-psk', label: 'WPA-PSK' },
  { value: 'wpa2-psk', label: 'WPA2-PSK' },
  { value: 'wpa3-psk', label: 'WPA3-PSK' },
];

// RouterOS mode names, kept as-is to match the mode badge on each interface.
const MODE_OPTIONS: Array<{ value: string; label: string }> = [
  { value: 'ap', label: 'AP' },
  { value: 'station', label: 'Station' },
];

interface Props {
  draft: WirelessSettings;
  onPatch: <K extends keyof WirelessSettings>(key: K, value: WirelessSettings[K]) => void;
  hideMode?: boolean;
}

export function WirelessFields({ draft, onPatch, hideMode }: Props) {
  const { t } = useTranslation('wireless');
  const toggleType = (value: string, on: boolean) => {
    const next = on
      ? Array.from(new Set([...draft.securityTypes, value]))
      : draft.securityTypes.filter((type) => type !== value);
    onPatch('securityTypes', next);
  };

  return (
    <FieldStack>
      <FieldRow>
        <Label>
          <span>{t('common.ssid')}</span>
          <Input
            value={draft.ssid}
            onChange={(e) => onPatch('ssid', e.target.value)}
            aria-label={t('common.ssid')}
            dir="auto"
          />
        </Label>
        <Label>
          <span>{t('common.password')}</span>
          <PasswordInput
            value={draft.password}
            onChange={(e) => onPatch('password', e.target.value)}
            aria-label={t('common.password')}
            dir="ltr"
          />
        </Label>
      </FieldRow>
      {hideMode ? null : (
        <Label as="div">
          <span>{t('edit.mode')}</span>
          <Select
            options={MODE_OPTIONS}
            value={draft.mode ?? 'ap'}
            onChange={(v) => onPatch('mode', v)}
            aria-label={t('edit.mode')}
          />
        </Label>
      )}
      <Label as="div">
        <span>{t('common.security')}</span>
        <Inline $gap="16px">
          {SECURITY_OPTIONS.map((opt) => (
            <Checkbox
              key={opt.value}
              label={opt.label}
              checked={draft.securityTypes.includes(opt.value)}
              onChange={(e) => toggleType(opt.value, e.target.checked)}
            />
          ))}
        </Inline>
      </Label>
    </FieldStack>
  );
}
