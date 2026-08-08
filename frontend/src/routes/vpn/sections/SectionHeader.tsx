import type { ReactNode } from 'react';
import { Plus } from 'lucide-react';
import { Badge, Button, CardDescription, CardHeader, CardTitle, Input } from '@nasnet/ui';
import styles from '../../VPNPage.module.scss';

interface Action {
  label: string;
  disabled?: boolean;
  onClick: () => void;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'success';
  showPlus?: boolean;
  icon?: ReactNode;
}

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
  action?: Action;
  extraActions?: Action[];
}

export function SectionHeader({ title, count, description, search, action, extraActions }: Props) {
  const actions = [...(extraActions ?? []), ...(action ? [action] : [])];
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
        {actions.map((a, i) => (
          <Button
            key={`${a.label}-${i}`}
            variant={a.variant ?? (a === action ? 'success' : 'secondary')}
            onClick={a.onClick}
            disabled={a.disabled}
          >
            {a.icon ??
              (a.showPlus !== false && a === action ? <Plus size={14} aria-hidden /> : null)}{' '}
            {a.label}
          </Button>
        ))}
      </div>
    </CardHeader>
  );
}
