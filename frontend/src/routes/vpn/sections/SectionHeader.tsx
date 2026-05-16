import { Plus } from 'lucide-react';
import { Badge, Button, CardDescription, CardHeader, CardTitle, Input } from '@nasnet/ui';
import styles from '../../VPNPage.module.scss';

interface Props {
  title: string;
  count?: number;
  description: string;
  search?: {
    value: string;
    placeholder: string;
    ariaLabel: string;
    onChange: (value: string) => void;
  };
  action?: {
    label: string;
    disabled?: boolean;
    onClick: () => void;
  };
}

export function SectionHeader({ title, count, description, search, action }: Props) {
  return (
    <CardHeader className={styles.sectionHeader}>
      <div>
        <CardTitle>
          {title}
          {count !== undefined ? (
            <>
              {' '}
              <Badge tone="info">{count}</Badge>
            </>
          ) : null}
        </CardTitle>
        <CardDescription>{description}</CardDescription>
      </div>
      <div className={styles.headerActions}>
        {search ? (
          <Input
            className={styles.headerSearch}
            value={search.value}
            onChange={(e) => search.onChange(e.target.value)}
            placeholder={search.placeholder}
            aria-label={search.ariaLabel}
          />
        ) : null}
        {action ? (
          <Button variant="success" onClick={action.onClick} disabled={action.disabled}>
            <Plus size={14} aria-hidden /> {action.label}
          </Button>
        ) : null}
      </div>
    </CardHeader>
  );
}
