import { useMemo, useRef, type KeyboardEvent } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { DomesticListUpdateCard } from './settings/DomesticListUpdateCard';
import styles from './settings/SettingsPage.module.scss';
import { useSession } from '../state/SessionContext';
import { useRouter } from '../state/RouterStoreContext';
import type { SystemCredentials } from '../api';

const cx = (...parts: Array<string | undefined | false>) => parts.filter(Boolean).join(' ');

type SectionId = 'domestic';

interface Section {
  id: SectionId;
  label: string;
}

export function SettingsPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter(id);
  const { getCredentials } = useSession();
  const { t } = useTranslation('tools');
  const [params, setParams] = useSearchParams();
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);

  const creds = useMemo<SystemCredentials | null>(() => {
    if (!id) return null;
    const c = getCredentials(id);
    const host = router?.host;
    if (!c || !host) return null;
    return { host, username: c.username, password: c.password };
  }, [id, router?.host, getCredentials]);

  const sections: Section[] = [{ id: 'domestic', label: t('settings.tabs.domestic') }];
  const active = sections.find((s) => s.id === params.get('tab')) ?? sections[0];

  const select = (section: Section) =>
    setParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set('tab', section.id);
      return next;
    });

  // Arrow keys move between tabs; the list is vertical on desktop and horizontal on phones.
  const onKeyDown = (e: KeyboardEvent<HTMLButtonElement>, index: number) => {
    const step = { ArrowDown: 1, ArrowRight: 1, ArrowUp: -1, ArrowLeft: -1 }[e.key];
    let target: number | null = null;
    if (step !== undefined) target = (index + step + sections.length) % sections.length;
    if (e.key === 'Home') target = 0;
    if (e.key === 'End') target = sections.length - 1;
    if (target === null) return;
    e.preventDefault();
    select(sections[target]);
    tabRefs.current[target]?.focus();
  };

  return (
    <div className={styles.layout}>
      <div
        className={styles.tabList}
        role="tablist"
        aria-orientation="vertical"
        aria-label={t('settings.tabs.label')}
      >
        {sections.map((section, index) => {
          const selected = section.id === active.id;
          return (
            <button
              key={section.id}
              ref={(el) => {
                tabRefs.current[index] = el;
              }}
              type="button"
              role="tab"
              id={`settings-tab-${section.id}`}
              aria-selected={selected}
              aria-controls={`settings-panel-${section.id}`}
              tabIndex={selected ? 0 : -1}
              className={cx(styles.tab, selected && styles.tabActive)}
              onClick={() => select(section)}
              onKeyDown={(e) => onKeyDown(e, index)}
            >
              {section.label}
            </button>
          );
        })}
      </div>
      <div
        className={styles.panel}
        role="tabpanel"
        id={`settings-panel-${active.id}`}
        aria-labelledby={`settings-tab-${active.id}`}
      >
        {active.id === 'domestic' ? <DomesticListUpdateCard key={id} creds={creds} /> : null}
      </div>
    </div>
  );
}
