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
import type { WirelessSettings } from '../../api';

const SECURITY_OPTIONS: Array<{ value: string; label: string }> = [
  { value: 'wpa-psk', label: 'WPA-PSK' },
  { value: 'wpa2-psk', label: 'WPA2-PSK' },
  { value: 'wpa3-psk', label: 'WPA3-PSK' },
];

const MODE_OPTIONS: Array<{ value: string; label: string }> = [
  { value: 'ap', label: 'AP' },
  { value: 'station', label: 'Station' },
];

interface Props {
  draft: WirelessSettings;
  onPatch: <K extends keyof WirelessSettings>(key: K, value: WirelessSettings[K]) => void;
}

export function WirelessFields({ draft, onPatch }: Props) {
  const toggleType = (value: string, on: boolean) => {
    const next = on
      ? Array.from(new Set([...draft.securityTypes, value]))
      : draft.securityTypes.filter((t) => t !== value);
    onPatch('securityTypes', next);
  };

  return (
    <FieldStack>
      <FieldRow>
        <Label>
          <span>SSID</span>
          <Input
            value={draft.ssid}
            onChange={(e) => onPatch('ssid', e.target.value)}
            aria-label="SSID"
          />
        </Label>
        <Label>
          <span>Password</span>
          <PasswordInput
            value={draft.password}
            onChange={(e) => onPatch('password', e.target.value)}
            aria-label="Password"
          />
        </Label>
      </FieldRow>
      <Label as="div">
        <span>Mode</span>
        <Select
          options={MODE_OPTIONS}
          value={draft.mode ?? 'ap'}
          onChange={(v) => onPatch('mode', v)}
          aria-label="Mode"
        />
      </Label>
      <Label as="div">
        <span>Security</span>
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
