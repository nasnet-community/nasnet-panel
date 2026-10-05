import { Plus, Wifi } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button, Card, CardDescription, CardHeader, CardTitle } from '@nasnet/ui';
import type { Interface, WirelessSettings } from '../../api';
import styles from '../WirelessPage.module.scss';
import { InterfaceRow } from './InterfaceRow';

interface Props {
  interfaces: Interface[];
  settings: WirelessSettings | null;
  onToggle: (ifaceName: string, running: boolean) => void;
  onEdit: (iface: Interface) => void;
  onAddVirtual: () => void;
  onDelete: (iface: Interface) => void;
}

export function InterfacesCard({
  interfaces,
  settings,
  onToggle,
  onEdit,
  onAddVirtual,
  onDelete,
}: Props) {
  const { t } = useTranslation('wireless');
  const total = interfaces.length;
  return (
    <Card>
      <CardHeader className={styles.cardHeaderRow}>
        <div>
          <CardTitle>{t('interfaces.title')}</CardTitle>
          <CardDescription>{t('interfaces.description')}</CardDescription>
        </div>
        {total > 0 ? (
          <Button size="sm" variant="success" onClick={onAddVirtual}>
            <Plus size={14} aria-hidden /> {t('interfaces.addVirtual')}
          </Button>
        ) : null}
      </CardHeader>
      {settings && total > 0 ? (
        <div className={styles.interfaceGrid}>
          {interfaces.map((iface) => (
            <InterfaceRow
              key={iface.name}
              iface={iface}
              settings={settings}
              onToggle={(running) => onToggle(iface.name, running)}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))}
        </div>
      ) : (
        <div className={styles.emptyBlock}>
          <Wifi size={28} aria-hidden />
          <span>{t('interfaces.empty')}</span>
        </div>
      )}
    </Card>
  );
}
