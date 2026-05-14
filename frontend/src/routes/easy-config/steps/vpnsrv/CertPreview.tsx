import { ShieldCheck } from 'lucide-react';
import styles from './CertPreview.module.scss';

interface Props {
  username: string;
}

const VARIANTS: Array<{ proto: 'TCP' | 'UDP'; suffix: string }> = [
  { proto: 'TCP', suffix: 'ovpn-tcp' },
  { proto: 'UDP', suffix: 'ovpn-udp' },
];

export function CertPreview({ username }: Props) {
  const name = username.trim() || 'YourUsername';
  const isPlaceholder = !username.trim();
  return (
    <div className={styles.wrap} aria-live="polite">
      {VARIANTS.map((v) => (
        <div key={v.suffix} className={styles.tile}>
          <div className={`${styles.iconWrap} ${isPlaceholder ? styles.iconWrapMuted : ''}`}>
            <ShieldCheck size={48} strokeWidth={1.75} />
          </div>
          <div className={`${styles.title} ${isPlaceholder ? styles.titlePlaceholder : ''}`}>
            {name}-{v.suffix}
          </div>
          <p className={styles.proto}>{v.proto}</p>
        </div>
      ))}
    </div>
  );
}
