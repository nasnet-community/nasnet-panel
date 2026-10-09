import { Radar } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button, FieldRow, Input, Label } from '@nasnet/ui';
import styles from '../AddRouterWizard.module.scss';

interface Props {
  subnet: string;
  scanning: boolean;
  onSubnetChange: (value: string) => void;
  onStart: () => void;
}

export function ScanToolbar({ subnet, scanning, onSubnetChange, onStart }: Props) {
  const { t } = useTranslation('addRouter');
  return (
    <FieldRow>
      <Label>
        <span>{t('scan.subnet')}</span>
        <Input
          value={subnet}
          onChange={(e) => onSubnetChange(e.target.value)}
          placeholder="192.168.10.0/24"
          aria-label={t('scan.subnet')}
        />
      </Label>
      <div style={{ display: 'flex', alignItems: 'end' }}>
        <Button variant="success" onClick={onStart} disabled={scanning || !subnet}>
          {scanning ? (
            <span className={styles.spinningIcon} aria-hidden>
              <Radar size={16} />
            </span>
          ) : (
            <Radar size={16} aria-hidden />
          )}
          {scanning ? t('scan.scanning') : t('scan.start')}
        </Button>
      </div>
    </FieldRow>
  );
}
