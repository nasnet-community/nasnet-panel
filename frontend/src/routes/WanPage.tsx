import { useCallback, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useToast } from '@nasnet/ui';
import {
  api,
  ApiError,
  type DomesticUplink,
  type InterfaceResponse,
  type StarlinkUplink,
  type WanVpnClient,
} from '../api';
import { usePolling } from '../utils/usePolling';
import styles from './wan/WanPage.module.scss';
import { toInterfaceResponses } from './wan/adapters';
import { StarlinkSection } from './wan/sections/StarlinkSection';
import { DomesticUplinkSection } from './wan/sections/DomesticUplinkSection';
import { MaskingVpnSection } from './wan/sections/MaskingVpnSection';
import { DomesticVpnSection } from './wan/sections/DomesticVpnSection';

export function WanPage() {
  const { id } = useParams<{ id: string }>();
  const toast = useToast();

  const [starlink, setStarlink] = useState<StarlinkUplink[]>([]);
  const [domestic, setDomestic] = useState<DomesticUplink[]>([]);
  const [maskingVpn, setMaskingVpn] = useState<WanVpnClient[]>([]);
  const [domesticVpn, setDomesticVpn] = useState<WanVpnClient[]>([]);
  const [interfaces, setInterfaces] = useState<InterfaceResponse[]>([]);
  const [, setLoaded] = useState(false);

  const reload = useCallback(async () => {
    if (!id) return;
    try {
      const [sl, dom, mvpn, dvpn, ifaces] = await Promise.all([
        api.wan.listStarlink(id),
        api.wan.listDomestic(id),
        api.wan.listMaskingVpn(id),
        api.wan.listDomesticVpn(id),
        api.system.listInterfaces(id),
      ]);
      setStarlink(sl);
      setDomestic(dom);
      setMaskingVpn(mvpn);
      setDomesticVpn(dvpn);
      setInterfaces(toInterfaceResponses(ifaces));
      setLoaded(true);
    } catch (err) {
      const message =
        err instanceof ApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : 'Failed to load WAN data.';
      toast.notify({ title: 'Failed to load WAN', description: message, tone: 'danger' });
    }
  }, [id, toast]);

  usePolling(reload, 5000, !!id);

  if (!id) return null;

  return (
    <div className={styles.sectionGrid}>
      <StarlinkSection routerId={id} items={starlink} interfaces={interfaces} onChanged={reload} />
      <DomesticUplinkSection
        routerId={id}
        items={domestic}
        interfaces={interfaces}
        onChanged={reload}
      />
      <MaskingVpnSection routerId={id} items={maskingVpn} onChanged={reload} />
      <DomesticVpnSection routerId={id} items={domesticVpn} onChanged={reload} />
    </div>
  );
}
