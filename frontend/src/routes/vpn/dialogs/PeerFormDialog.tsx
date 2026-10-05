import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, Dialog, FieldStack, Input, Label } from '@nasnet/ui';
import type { VPNPeer } from '../../../api';

interface Props {
  onCancel: () => void;
  onSave: (draft: Partial<VPNPeer>) => void;
}

export function PeerFormDialog({ onCancel, onSave }: Props) {
  const { t } = useTranslation('vpn');
  const [draft, setDraft] = useState<Partial<VPNPeer>>({ allowedIps: '10.8.0.2/32' });
  return (
    <Dialog
      open
      onClose={onCancel}
      title={t('peers.form.title')}
      size="sm"
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
        <Label>
          <span>{t('shared.name')}</span>
          <Input
            value={draft.name ?? ''}
            onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
            aria-label={t('shared.name')}
          />
        </Label>
        <Label>
          <span>{t('shared.allowedIps')}</span>
          <Input
            value={draft.allowedIps ?? ''}
            onChange={(e) => setDraft((d) => ({ ...d, allowedIps: e.target.value }))}
            aria-label={t('shared.allowedIps')}
            dir="ltr"
          />
        </Label>
      </FieldStack>
    </Dialog>
  );
}
