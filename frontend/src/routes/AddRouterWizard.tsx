import { useReducer, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Plus, Radar } from 'lucide-react';
import {
  Button,
  Dialog,
  PageActions,
  PageHeader,
  PageShell,
  PageSubtitle,
  PageTitle,
} from '@nasnet/ui';
import type { Router } from '../api';
import { useRouterStore } from '../state/RouterStoreContext';
import { ScanStep } from './add-router/ScanStep';
import { TargetStep } from './add-router/TargetStep';
import { CredentialsDialog } from './add-router/CredentialsDialog';
import { useAddRouter } from './add-router/useAddRouter';
import { initialState, reducer, type Mode } from './add-router/state';

export function AddRouterWizard() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const requestedMode: Mode = params.get('mode') === 'scan' ? 'scan' : 'manual';
  const [state, dispatch] = useReducer(reducer, initialState(requestedMode));
  const [duplicate, setDuplicate] = useState<Router | null>(null);
  const { onConnect } = useAddRouter(state, dispatch, {
    onDuplicate: (router) => setDuplicate(router),
  });
  const { routers } = useRouterStore();

  return (
    <PageShell>
      <PageHeader>
        <div>
          <PageTitle>Add router</PageTitle>
          <PageSubtitle>Scan the network or add a router manually.</PageSubtitle>
        </div>
        <PageActions>
          <Button variant="secondary" onClick={() => navigate('/')}>
            <ArrowLeft size={16} aria-hidden /> Back
          </Button>
          {state.mode === 'scan' ? (
            <Button variant="success" onClick={() => navigate('/routers/new?mode=manual')}>
              <Plus size={16} aria-hidden /> Add manually
            </Button>
          ) : (
            <Button variant="success" onClick={() => navigate('/routers/new?mode=scan')}>
              <Radar size={16} aria-hidden /> Scan network
            </Button>
          )}
        </PageActions>
      </PageHeader>

      {state.mode === 'scan' ? (
        <ScanStep
          onSelect={(device) => {
            const existing = routers.find((r) => r.host === device.ip);
            if (existing) {
              setDuplicate(existing);
              return;
            }
            dispatch({ type: 'pickDevice', device });
          }}
        />
      ) : (
        <TargetStep
          state={state}
          dispatch={dispatch}
          onBack={() => navigate('/')}
          onConnect={onConnect}
        />
      )}

      <CredentialsDialog state={state} dispatch={dispatch} onConnect={onConnect} />

      <Dialog
        open={!!duplicate}
        onClose={() => setDuplicate(null)}
        size="sm"
        title="Router already added"
        description={
          duplicate
            ? `A router at ${duplicate.host} is already on your list as "${duplicate.name}".`
            : undefined
        }
        footer={
          <>
            <Button variant="ghost" onClick={() => setDuplicate(null)}>
              Close
            </Button>
            {duplicate ? (
              <Button
                variant="primary"
                onClick={() => {
                  const id = duplicate.id;
                  setDuplicate(null);
                  navigate(`/router/${id}`);
                }}
              >
                Open router
              </Button>
            ) : null}
          </>
        }
      />
    </PageShell>
  );
}
