import { useToast } from '@nasnet/ui';
import i18n from '../../../i18n';
import { api, type VPNPeer, type VPNServer } from '../../../api';

export function usePeerActions(
  routerId: string,
  defaultServer: VPNServer | undefined,
  onChanged: () => void,
) {
  const toast = useToast();

  const add = async (draft: Partial<VPNPeer>) => {
    if (!defaultServer) return;
    await api.vpn.createPeer({
      routerId,
      serverId: defaultServer.id,
      name: draft.name ?? 'peer',
      allowedIps: draft.allowedIps ?? '10.8.0.2/32',
      publicKey: draft.publicKey ?? 'PEER_PUBLIC_KEY_PLACEHOLDER',
      enabled: true,
    });
    onChanged();
    toast.notify({ title: i18n.t('peers.toast.added', { ns: 'vpn' }), tone: 'success' });
  };

  const remove = async (id: string) => {
    await api.vpn.deletePeer(id);
    onChanged();
    toast.notify({ title: i18n.t('peers.toast.deleted', { ns: 'vpn' }), tone: 'info' });
  };

  return { add, remove };
}
