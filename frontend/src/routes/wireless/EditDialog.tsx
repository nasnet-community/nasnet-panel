import { useState } from 'react';
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
  const [draft, setDraft] = useState<WirelessSettings>(settings);
  const patch = <K extends keyof WirelessSettings>(k: K, v: WirelessSettings[K]) =>
    setDraft((d) => ({ ...d, [k]: v }));
  return (
    <Dialog
      open
      onClose={onClose}
      title="Edit wireless settings"
      size="md"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="success" onClick={() => onSave(draft)}>
            Save
          </Button>
        </>
      }
    >
      <WirelessFields draft={draft} onPatch={patch} hideMode={isVirtual} />
    </Dialog>
  );
}
