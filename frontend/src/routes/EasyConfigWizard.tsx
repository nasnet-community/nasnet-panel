import { useParams } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { Button, FormError, Stack, Stepper } from '@nasnet/ui';
import styles from './EasyConfigWizard.module.scss';
import { stepOrder, stepTitles } from './easy-config/state';
import { useEasyConfig } from './easy-config/useEasyConfig';
import { ModeStep } from './easy-config/steps/ModeStep';
import { WanStep } from './easy-config/steps/WanStep';
import { IpMaskStep } from './easy-config/steps/IpMaskStep';
import { WifiStep } from './easy-config/steps/WifiStep';
import { VpnServerStep } from './easy-config/steps/VpnServerStep';
import { ApplyDialog } from './easy-config/steps/show/ApplyDialog';
import { useApplyDialog } from './easy-config/steps/show/useApplyDialog';

export function EasyConfigWizard() {
  const { id } = useParams<{ id: string }>();
  const {
    state,
    dispatch,
    interfaces,
    interfacesLoading,
    wifiInterfaces,
    wifiSupported,
    onApply,
    goNext,
    goPrev,
    advanceProblem,
  } = useEasyConfig(id);
  const activeIndex = stepOrder.indexOf(state.currentStep);
  const canSave = advanceProblem === null;
  const isLastStep = activeIndex === stepOrder.length - 1;
  const { dialogOpen, openDialog, closeDialog, goToOverview } = useApplyDialog(
    state.applying,
    state.applied,
  );

  const handleApply = () => {
    openDialog();
    onApply();
  };

  const onPrimary = () => {
    if (isLastStep) {
      handleApply();
    } else {
      goNext();
    }
  };

  const footer = (
    <div className={styles.stepFooter}>
      {state.error && !dialogOpen ? <FormError>{state.error}</FormError> : null}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-start',
          gap: 'var(--space-sm)',
          width: '100%',
        }}
      >
        {activeIndex > 0 ? (
          <Button variant="ghost" onClick={goPrev} disabled={state.applying}>
            Back
          </Button>
        ) : null}
        <Button
          variant="success"
          onClick={onPrimary}
          disabled={!canSave || state.applying || state.applied}
          loading={state.applying}
        >
          {isLastStep ? (
            state.applied ? (
              'Applied'
            ) : (
              'Apply'
            )
          ) : (
            <>
              Next <ArrowRight size={16} strokeWidth={2} />
            </>
          )}
        </Button>
      </div>
    </div>
  );

  const renderStep = () => {
    switch (state.currentStep) {
      case 'mode':
        return <ModeStep state={state} dispatch={dispatch} footer={footer} />;
      case 'wan':
        return (
          <WanStep
            state={state}
            dispatch={dispatch}
            interfaces={interfaces}
            interfacesLoading={interfacesLoading}
            footer={footer}
          />
        );
      case 'ipmask':
        return <IpMaskStep state={state} dispatch={dispatch} footer={footer} />;
      case 'wifi':
        return (
          <WifiStep
            state={state}
            dispatch={dispatch}
            interfaces={interfaces}
            wifiInterfaces={wifiInterfaces}
            wifiSupported={wifiSupported}
            footer={footer}
          />
        );
      case 'vpnsrv':
        return <VpnServerStep state={state} dispatch={dispatch} footer={footer} />;
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
      <ApplyDialog
        open={dialogOpen}
        applying={state.applying}
        applied={state.applied}
        progress={state.progress}
        error={state.error}
        managementWifiSsid={state.managementWifiSsid}
        managementWifiPassword={state.managementWifiPassword}
        onClose={closeDialog}
        onRetry={() => onApply()}
        onDone={goToOverview}
      />
    </Stack>
  );
}
