import { useState } from 'react';
import { Button, Card, CardDescription, CardHeader, CardTitle, Inline, Stack } from '@nasnet/ui';
import styles from '../../EasyConfigWizard.module.scss';
import type { State } from '../state';
import { ApplyDialog } from './show/ApplyDialog';
import { EditToolbar } from './show/EditToolbar';
import { ScriptEditor } from './show/ScriptEditor';
import { useApplyDialog } from './show/useApplyDialog';

interface Props {
  script: string;
  state: State;
  onApply: (override?: string) => void;
  onBack: () => void;
}

export function ShowStep({ script, state, onApply, onBack }: Props) {
  const [edited, setEdited] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const currentScript = edited ?? script;
  const { dialogOpen, openDialog, closeDialog, goToOverview } = useApplyDialog(
    state.applying,
    state.applied,
  );

  const handleApply = () => {
    openDialog();
    onApply(currentScript);
  };

  return (
    <Card className={styles.reviewCard}>
      <EditToolbar
        editing={editing}
        edited={edited !== null}
        applied={state.applied}
        onStartEdit={() => setEditing(true)}
        onDone={() => setEditing(false)}
        onReset={() => {
          setEdited(null);
          setEditing(false);
        }}
      />
      <CardHeader>
        <CardTitle>Review & apply</CardTitle>
        <CardDescription>
          Generated RouterOS script — edit directly if you need tweaks. Applying runs these commands
          via the batch executor.
        </CardDescription>
      </CardHeader>
      <Stack>
        <ScriptEditor editing={editing} script={currentScript} onScriptChange={setEdited} />
        <Inline>
          <Button variant="ghost" onClick={onBack}>
            Back
          </Button>
          <Button
            variant="success"
            onClick={handleApply}
            loading={state.applying}
            disabled={state.applied}
          >
            {state.applied ? 'Applied' : 'Apply'}
          </Button>
        </Inline>
      </Stack>
      <ApplyDialog
        open={dialogOpen}
        applying={state.applying}
        applied={state.applied}
        progress={state.progress}
        error={state.error}
        managementWifiSsid={state.managementWifiSsid}
        managementWifiPassword={state.managementWifiPassword}
        onClose={closeDialog}
        onRetry={() => onApply(currentScript)}
        onDone={goToOverview}
      />
    </Card>
  );
}
