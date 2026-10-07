import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, Dialog } from '@nasnet/ui';
import type { WirelessSettings } from '../../api';
import { WirelessFields } from './WirelessFields';

interface Props {
  settings: WirelessSettings;
  isVirtual?: boolean;
  onClose: () => void;
  onSave: (s: WirelessSettings) => void;
}

export function EditDialog({ settings, isVirtual, onClose, onSave }: Props) {
  const { t } = useTranslation('wireless');
  const [draft, setDraft] = useState<WirelessSettings>(settings);
  const patch = <K extends keyof WirelessSettings>(k: K, v: WirelessSettings[K]) =>
    setDraft((d) => ({ ...d, [k]: v }));
  return (
    <Dialog
      open
      onClose={onClose}
      title={t('edit.title')}
      size="md"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            {t('common.cancel')}
          </Button>
          <Button variant="success" onClick={() => onSave(draft)}>
            {t('edit.save')}
          </Button>
        </>
      }
    >
      <WirelessFields draft={draft} onPatch={patch} hideMode={isVirtual} />
    </Dialog>
  );
}
