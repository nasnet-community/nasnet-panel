import { useTranslation } from 'react-i18next';
import { Code, Textarea } from '@nasnet/ui';
import styles from '../../../EasyConfigWizard.module.scss';

interface Props {
  editing: boolean;
  script: string;
  onScriptChange: (value: string) => void;
}

export function ScriptEditor({ editing, script, onScriptChange }: Props) {
  const { t } = useTranslation('easyConfig');
  if (editing) {
    return (
      <Textarea
        data-testid="easy-config-script"
        className={styles.scriptEditor}
        value={script}
        onChange={(e) => onScriptChange(e.target.value)}
        spellCheck={false}
        aria-label={t('review.scriptAria')}
      />
    );
  }
  return <Code data-testid="easy-config-script">{script}</Code>;
}
