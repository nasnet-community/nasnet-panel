import { Radar } from 'lucide-react';
import { Button, FieldRow, Input, Label } from '@nasnet/ui';
import styles from '../AddRouterWizard.module.scss';

interface Props {
  subnet: string;
  scanning: boolean;
  onSubnetChange: (value: string) => void;
  onStart: () => void;
}

export function ScanToolbar({ subnet, scanning, onSubnetChange, onStart }: Props) {
  return (
    <FieldRow>
      <Label>
        <span>Subnet</span>
        <Input
          value={subnet}
          onChange={(e) => onSubnetChange(e.target.value)}
          placeholder="192.168.10.0/24"
          aria-label="Subnet"
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
          {scanning ? 'Scanning…' : 'Start scan'}
        </Button>
      </div>
    </FieldRow>
  );
}
