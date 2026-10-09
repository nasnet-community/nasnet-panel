import { useState } from 'react';
import { Button, Dialog, FieldStack, Switch } from '@nasnet/ui';
import { useTranslation } from 'react-i18next';
import type { RoutingTopology } from '@nasnet/mocks';
import { nodeLabel } from './layout';

interface EditState {
  hopId: string;
  isActive: boolean;
}

export interface HopEditDialogProps {
  topology: RoutingTopology;
  hopId: string;
  onClose: () => void;
  onSave: (next: { hopId: string; isActive: boolean }) => Promise<void>;
}

export function HopEditDialog({ topology, hopId, onClose, onSave }: HopEditDialogProps) {
  const { t } = useTranslation('internet');
  const hop = topology.hops.find((h) => h.id === hopId);
  const fromNode = hop ? topology.nodes.find((n) => n.id === hop.fromId) : undefined;
  const toNode = hop ? topology.nodes.find((n) => n.id === hop.toId) : undefined;

  const [draft, setDraft] = useState<EditState | null>(
    hop ? { hopId: hop.id, isActive: hop.isActive } : null,
  );
  const [saving, setSaving] = useState(false);

  if (!hop || !toNode || !fromNode || !draft) return null;

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave({ hopId: draft.hopId, isActive: draft.isActive });
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog
      open
      onClose={onClose}
      title={t('internet.hopDialog.title', {
        from: nodeLabel(fromNode),
        to: nodeLabel(toNode),
      })}
      description={t('internet.hopDialog.description')}
      size="sm"
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={saving}>
            {t('internet.hopDialog.cancel')}
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? t('internet.hopDialog.saving') : t('internet.hopDialog.save')}
          </Button>
        </>
      }
    >
      <FieldStack>
        <Switch
          id="hop-active"
          label={t('internet.hopDialog.active')}
          checked={draft.isActive}
          onChange={(e) => setDraft({ ...draft, isActive: e.target.checked })}
        />
      </FieldStack>
    </Dialog>
  );
}
