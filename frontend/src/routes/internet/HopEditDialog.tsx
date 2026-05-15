import { useMemo, useState } from 'react';
import { Button, Dialog, FieldStack, Label, Select, Switch } from '@nasnet/ui';
import type { RoutingTopology } from '@nasnet/mocks';

interface EditState {
  hopId: string;
  fromId: string;
  isActive: boolean;
}

export interface HopEditDialogProps {
  topology: RoutingTopology;
  hopId: string;
  onClose: () => void;
  onSave: (next: { hopId: string; isActive: boolean; fromId?: string }) => Promise<void>;
}

export function HopEditDialog({ topology, hopId, onClose, onSave }: HopEditDialogProps) {
  const hop = topology.hops.find((h) => h.id === hopId);
  const fromNode = hop ? topology.nodes.find((n) => n.id === hop.fromId) : undefined;
  const toNode = hop ? topology.nodes.find((n) => n.id === hop.toId) : undefined;

  const [draft, setDraft] = useState<EditState | null>(
    hop ? { hopId: hop.id, fromId: hop.fromId, isActive: hop.isActive } : null,
  );
  const [saving, setSaving] = useState(false);

  const wanOptions = useMemo(
    () => topology.nodes.filter((n) => n.kind === 'wan'),
    [topology.nodes],
  );

  if (!hop || !toNode || !fromNode || !draft) return null;
  const canReassignUpstream = toNode.kind === 'vpn';

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave({
        hopId: draft.hopId,
        isActive: draft.isActive,
        fromId: canReassignUpstream && draft.fromId !== hop.fromId ? draft.fromId : undefined,
      });
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog
      open
      onClose={onClose}
      title={`${fromNode.label} → ${toNode.label}`}
      description="Reroute or toggle this hop. Changes take effect immediately."
      size="sm"
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? 'Saving…' : 'Save'}
          </Button>
        </>
      }
    >
      <FieldStack>
        <Switch
          id="hop-active"
          label="Active"
          checked={draft.isActive}
          onChange={(e) => setDraft({ ...draft, isActive: e.target.checked })}
        />
        {canReassignUpstream ? (
          <div>
            <Label htmlFor="hop-upstream">Tunnel through</Label>
            <Select
              id="hop-upstream"
              value={draft.fromId}
              onChange={(value) => setDraft({ ...draft, fromId: value })}
              options={wanOptions.map((w) => ({ value: w.id, label: w.label }))}
            />
          </div>
        ) : null}
      </FieldStack>
    </Dialog>
  );
}
