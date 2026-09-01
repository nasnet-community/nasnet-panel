import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { Check, Lock, Sparkles } from 'lucide-react';
import { Button, Dialog, useToast } from '@nasnet/ui';
import { fetchNasnetVpnCredentials } from '../../../../api';
import { useSession } from '../../../../state/SessionContext';
import { useRouter } from '../../../../state/RouterStoreContext';
import styles from './HyperSpeedClaimDialog.module.scss';

export interface ClaimedVpnCredentials {
  server: string;
  username: string;
  password: string;
}

interface Props {
  open: boolean;
  onClose: () => void;
  onClaimed: (creds: ClaimedVpnCredentials) => void;
}

export function HyperSpeedClaimDialog({ open, onClose, onClaimed }: Props) {
  const { id: routerId } = useParams<{ id: string }>();
  const { getCredentials } = useSession();
  const router = useRouter(routerId);
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  const claim = async () => {
    const creds = routerId ? getCredentials(routerId) : undefined;
    const host = router?.host;
    if (!creds || !host) {
      toast.notify({
        title: 'Missing router credentials',
        description: 'Connect to the router before claiming a VPN.',
        tone: 'danger',
      });
      return;
    }

    setLoading(true);
    try {
      const data = await fetchNasnetVpnCredentials({ host, ...creds });
      onClaimed({ server: data.server, username: data.username, password: data.password });
      toast.notify({
        title: 'Free VPN credentials applied',
        description: data.expiryDate ? `Valid until ${data.expiryDate}.` : undefined,
        tone: 'success',
      });
      onClose();
    } catch (err) {
      const message = (err as Error).message || 'Something went wrong';
      toast.notify({
        title: 'Claim failed',
        description: message,
        tone: 'danger',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={loading ? () => undefined : onClose}
      size="md"
      labelledBy="hyper-speed-title"
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button variant="success" onClick={claim} loading={loading}>
            <Sparkles size={14} strokeWidth={2} /> Claim a free VPN
          </Button>
        </>
      }
    >
      <div className={styles.promo}>
        <span className={styles.badgeRow}>
          <span className={styles.badge}>Hot Deal</span>
          <span>Available now</span>
        </span>
        <h3 id="hyper-speed-title" className={styles.title}>
          FREE Hyper Speed VPN powered by NasNet Connect
        </h3>
        <p className={styles.subtitle}>Optimized for Starlink & built for NasNet Connect users.</p>
      </div>
      <div className={styles.body}>
        <ul className={styles.bullets}>
          <li className={styles.bullet}>
            <Check size={14} strokeWidth={2.5} className={styles.bulletCheck} />
            Unlimited bandwidth
          </li>
          <li className={styles.bullet}>
            <Check size={14} strokeWidth={2.5} className={styles.bulletCheck} />
            No throttling
          </li>
          <li className={styles.bullet}>
            <Check size={14} strokeWidth={2.5} className={styles.bulletCheck} />
            Global servers
          </li>
          <li className={styles.bullet}>
            <Check size={14} strokeWidth={2.5} className={styles.bulletCheck} />
            Auto-configuration
          </li>
        </ul>
        <p style={{ display: 'inline-flex', alignItems: 'center', gap: 6, margin: 0 }}>
          <Lock size={14} strokeWidth={2} />
          Credentials valid for 6 months. And you can reclaim again after expiration.
        </p>
      </div>
    </Dialog>
  );
}
