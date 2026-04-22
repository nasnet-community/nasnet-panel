import type { DiscoveredDevice } from '../../api';

export type Mode = 'scan' | 'manual';
export type Step = 'scan' | 'target' | 'credentials';

export interface WizardState {
  mode: Mode;
  name: string;
  host: string;
  username: string;
  password: string;
  currentStep: Step;
  selectedDeviceIp: string | null;
  error: string | null;
  applying: boolean;
}

export type Action =
  | {
      type: 'setField';
      field: keyof Pick<WizardState, 'name' | 'host' | 'username' | 'password'>;
      value: string;
    }
  | { type: 'pickDevice'; device: DiscoveredDevice }
  | { type: 'step'; step: Step }
  | { type: 'error'; message: string | null }
  | { type: 'applying'; value: boolean };

const randomRouterName = () => `Nasnet ${Math.floor(10 + Math.random() * 90)}`;

export const initialState = (mode: Mode): WizardState => ({
  mode,
  name: randomRouterName(),
  host: '192.168.1.1',
  username: 'admin',
  password: '',
  currentStep: mode === 'scan' ? 'scan' : 'target',
  selectedDeviceIp: null,
  error: null,
  applying: false,
});

export function reducer(state: WizardState, action: Action): WizardState {
  switch (action.type) {
    case 'setField':
      return { ...state, [action.field]: action.value };
    case 'pickDevice': {
      const suggestedName =
        state.name ||
        (action.device.hostname
          ? action.device.hostname
          : `${action.device.vendor} ${action.device.type}`.trim());
      return {
        ...state,
        host: action.device.ip,
        name: suggestedName,
        selectedDeviceIp: action.device.ip,
        currentStep: 'credentials',
      };
    }
    case 'step':
      return { ...state, currentStep: action.step, error: null };
    case 'error':
      return { ...state, error: action.message };
    case 'applying':
      return { ...state, applying: action.value };
    default:
      return state;
  }
}
