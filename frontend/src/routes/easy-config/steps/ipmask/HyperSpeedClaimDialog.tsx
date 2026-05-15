import { useState } from 'react';
import { Check, Lock, Sparkles } from 'lucide-react';
import { Button, Dialog, useToast } from '@nasnet/ui';
import type { Action } from '../../state';
import styles from './HyperSpeedClaimDialog.module.scss';

const ENDPOINT = 'https://qhgkwmfqfehctenggfvp.supabase.co/functions/v1/l2tp-credentials';

// Supabase anon JWT for project qhgkwmfqfehctenggfvp.
// Header + payload are deterministic; signature is generated against the project's JWT secret.
// Replace the trailing segment if Supabase rotates the anon key.
const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFoZ2t3bWZxZmVoY3RlbmdnZnZwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDYzNjg0ODcsImV4cCI6MjA2MTk0NDQ4N30.REPLACE_ME_WITH_REAL_SIGNATURE';

interface CredentialsResponse {
  success: boolean;
  credentials?: {
    username: string;
    password: string;
    server: string;
    expiry_date?: string;
  };
  message?: string;
}

interface Props {
  open: boolean;
  onClose: () => void;
  dispatch: React.Dispatch<Action>;
}

export function HyperSpeedClaimDialog({ open, onClose, dispatch }: Props) {
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  const claim = async () => {
    setLoading(true);
    let succeeded = false;
    try {
      const res = await fetch(ENDPOINT, {
        method: 'POST',
        mode: 'cors',
        headers: {
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
          apikey: SUPABASE_ANON_KEY,
          'Content-Type': 'application/json',
        },
        body: '{}',
      });
      if (!res.ok) throw new Error(`Request failed (${res.status})`);
      const data: CredentialsResponse = await res.json();
      if (!data.success || !data.credentials) {
        throw new Error(data.message || 'Claim failed');
      }
      dispatch({ type: 'setField', field: 'l2tpServer', value: data.credentials.server });
      dispatch({ type: 'setField', field: 'l2tpUsername', value: data.credentials.username });
      dispatch({ type: 'setField', field: 'l2tpPassword', value: data.credentials.password });
      succeeded = true;
      toast.notify({
        title: 'Free VPN credentials applied',
        description: data.message,
        tone: 'success',
      });
    } catch (err) {
      const message = (err as Error).message || 'Something went wrong';
      const isNetwork =
        err instanceof TypeError || /failed to fetch|networkerror|load failed/i.test(message);
      toast.notify({
        title: isNetwork ? "Couldn't reach the VPN service" : 'Claim failed',
        description: isNetwork ? 'Check your connection or try again in a moment.' : message,
        tone: 'danger',
      });
    } finally {
      setLoading(false);
      if (succeeded) onClose();
      else onClose();
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
