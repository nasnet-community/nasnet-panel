import { useParams } from 'react-router-dom';
import { Button, FormError, Inline, Stack, Stepper } from '@nasnet/ui';
import styles from './EasyConfigWizard.module.scss';
import { stepOrder, stepTitles } from './easy-config/state';
import { useEasyConfig } from './easy-config/useEasyConfig';
import { ModeStep } from './easy-config/steps/ModeStep';
import { WanStep } from './easy-config/steps/WanStep';
import { IpMaskStep } from './easy-config/steps/IpMaskStep';
import { WifiStep } from './easy-config/steps/WifiStep';
import { VpnServerStep } from './easy-config/steps/VpnServerStep';
import { ShowStep } from './easy-config/steps/ShowStep';

export function EasyConfigWizard() {
  const { id } = useParams<{ id: string }>();
  const { state, dispatch, interfaces, script, onApply, goNext, goPrev, advanceProblem } =
    useEasyConfig(id);
  const activeIndex = stepOrder.indexOf(state.currentStep);
  const canSave = advanceProblem === null;

  const footer = (
    <div className={styles.stepFooter}>
      {state.error ? <FormError>{state.error}</FormError> : null}
      <Inline>
        <Button variant="ghost" onClick={goPrev} disabled={activeIndex === 0}>
          Back
        </Button>
        <span
          aria-live="polite"
          style={{
            color: canSave ? 'var(--color-success, #16a34a)' : 'var(--color-warning, #d97706)',
            fontSize: 'var(--font-sm)',
            marginRight: 'auto',
          }}
        >
          {canSave ? 'Configuration complete' : 'Configuration incomplete'}
        </span>
        <Button variant="success" onClick={goNext} disabled={!canSave}>
          Save
        </Button>
      </Inline>
    </div>
  );

  const renderStep = () => {
    switch (state.currentStep) {
      case 'mode':
        return <ModeStep state={state} dispatch={dispatch} footer={footer} />;
      case 'wan':
        return (
          <WanStep state={state} dispatch={dispatch} interfaces={interfaces} footer={footer} />
        );
      case 'ipmask':
        return <IpMaskStep state={state} dispatch={dispatch} footer={footer} />;
      case 'wifi':
        return (
          <WifiStep state={state} dispatch={dispatch} interfaces={interfaces} footer={footer} />
        );
      case 'vpnsrv':
        return <VpnServerStep state={state} dispatch={dispatch} routerId={id} footer={footer} />;
      case 'show':
        return <ShowStep script={script} state={state} onApply={onApply} onBack={goPrev} />;
      default:
        return null;
    }
  };

  return (
    <Stack>
      <Stepper
        orientation="horizontal"
        activeIndex={activeIndex}
        steps={stepOrder.map((stepId) => ({
          id: stepId,
          title: stepTitles[stepId].title,
          description: stepTitles[stepId].description,
        }))}
      />
      {renderStep()}
    </Stack>
  );
}
