import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, Dialog, FieldRow, FieldStack, Input, Label, Select } from '@nasnet/ui';
import { getProtocolOptions, type VPNClient, type VPNProtocol } from '../../../api';

interface Props {
  value: Partial<VPNClient>;
  onCancel: () => void;
  onSave: (draft: Partial<VPNClient>) => void;
}

export function ClientFormDialog({ value, onCancel, onSave }: Props) {
  const { t } = useTranslation('vpn');
  const [draft, setDraft] = useState<Partial<VPNClient>>(value);
  return (
    <Dialog
      open
      onClose={onCancel}
      title={value.id ? t('clients.form.editTitle') : t('clients.form.newTitle')}
      size="md"
      footer={
        <>
          <Button variant="ghost" onClick={onCancel}>
            {t('shared.cancel')}
          </Button>
          <Button onClick={() => onSave(draft)}>{t('shared.save')}</Button>
        </>
      }
    >
      <FieldStack>
        <FieldRow>
          <Label>
            <span>{t('shared.name')}</span>
            <Input
              value={draft.name ?? ''}
              onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
              aria-label={t('shared.name')}
            />
          </Label>
          <Label>
            <span>{t('shared.protocol')}</span>
            <Select
              aria-label={t('shared.protocol')}
              value={draft.protocol ?? 'wireguard'}
              onChange={(v) => setDraft((d) => ({ ...d, protocol: v as VPNProtocol }))}
              options={getProtocolOptions().map((p) => ({ value: p, label: p }))}
            />
          </Label>
        </FieldRow>
        <FieldRow>
          <Label>
            <span>{t('clients.form.endpointHost')}</span>
            <Input
              value={draft.endpoint ?? ''}
              onChange={(e) => setDraft((d) => ({ ...d, endpoint: e.target.value }))}
              aria-label={t('clients.form.endpointHost')}
              dir="ltr"
            />
          </Label>
          <Label>
            <span>{t('clients.form.endpointPort')}</span>
            <Input
              value={String(draft.endpointPort ?? '')}
              onChange={(e) =>
                setDraft((d) => ({ ...d, endpointPort: Number(e.target.value) || undefined }))
              }
              aria-label={t('clients.form.endpointPort')}
              dir="ltr"
            />
          </Label>
        </FieldRow>
      </FieldStack>
    </Dialog>
  );
}
