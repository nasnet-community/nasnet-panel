import { useToast } from '@nasnet/ui';
import { api, type VPNClient, type VPNProtocol } from '../../../api';

export function useClientActions(routerId: string, onChanged: () => void) {
  const toast = useToast();

  const save = async (draft: Partial<VPNClient>) => {
    if (draft.id) {
      await api.vpn.updateClient(draft.id, draft);
    } else {
      await api.vpn.createClient({
        routerId,
        name: draft.name ?? 'new-client',
        protocol: (draft.protocol ?? 'wireguard') as VPNProtocol,
        enabled: draft.enabled ?? true,
        running: false,
        endpoint: draft.endpoint,
        endpointPort: draft.endpointPort,
        username: draft.username,
        comment: draft.comment,
      });
    }
    onChanged();
    toast.notify({ title: 'Client saved', tone: 'success' });
  };

  const remove = async (id: string) => {
    await api.vpn.deleteClient(id);
    onChanged();
    toast.notify({ title: 'Client deleted', tone: 'info' });
  };

  return { save, remove };
}
