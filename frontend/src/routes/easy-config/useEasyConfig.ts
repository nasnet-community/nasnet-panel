import { useCallback, useEffect, useMemo, useReducer, useState } from 'react';
import { useToast } from '@nasnet/ui';
import { api, type Interface } from '../../api';
import { buildEasyConfigScript, type EasyConfigInput } from '../../utils/rsc-builder';
import { canAdvance } from './validation';
import { initial, reducer, stepOrder, type State } from './state';

function buildScript(state: State): string {
  if (!state.mode) return '';
  const input: EasyConfigInput = {
    mode: state.mode,
    starlink: { interface: state.starlinkInterface || 'ether1' },
    domestic:
      state.mode === 'dual-link'
        ? {
            interface: state.domesticInterface || 'ether2',
            mode: state.domesticMode,
            pppoeUser: state.pppoeUser,
            pppoePassword: state.pppoePassword,
            staticIp: state.staticIp,
            staticGateway: state.staticGateway,
            staticDns: state.staticDns,
          }
        : undefined,
    wireless: {
      ssid: state.ssid,
      password: state.wifiPassword,
      security: state.security,
      band: state.band,
      countryCode: state.countryCode,
      splitBands: state.splitBands,
      band24: { ssid: state.ssid, password: state.wifiPassword },
      band5: { ssid: state.ssid5, password: state.wifiPassword5 },
    },
    ipMask: state.ipMaskEnabled
      ? state.ipMaskKind === 'wireguard'
        ? {
            kind: 'wireguard',
            endpoint: state.wgEndpoint,
            endpointPort: Number(state.wgEndpointPort) || 51820,
            peerPublicKey: state.wgPeerPublicKey,
            privateKey: state.wgPrivateKey,
            allowedIps: state.wgAllowedIps,
            persistentKeepalive: Number(state.wgKeepalive) || 25,
            mtu: Number(state.wgMtu) || 1420,
          }
        : {
            kind: 'l2tp',
            server: state.l2tpServer,
            username: state.l2tpUsername,
            password: state.l2tpPassword,
            ipsecSecret: state.l2tpIpsecSecret,
            profile: state.l2tpProfile,
          }
      : undefined,
    vpnServer: state.vpnServerEnabled
      ? {
          protocol: state.vpnServerProtocol,
          listenPort: Number(state.vpnServerPort) || 51820,
          ipPool: state.vpnServerIpPool,
          dns: state.vpnServerDns || undefined,
          firstUser:
            state.firstUserName && state.firstUserKey
              ? { name: state.firstUserName, key: state.firstUserKey }
              : undefined,
        }
      : undefined,
  };
  return buildEasyConfigScript(input);
}

export function useEasyConfig(routerId: string | undefined) {
  const toast = useToast();
  const [state, dispatch] = useReducer(reducer, initial);
  const [interfaces, setInterfaces] = useState<Interface[]>([]);

  useEffect(() => {
    if (!routerId) return;
    let cancelled = false;
    void api.system.listInterfaces(routerId).then((list) => {
      if (cancelled) return;
      setInterfaces(list.filter((i) => i.type === 'ether' || i.type === 'wireless'));
    });
    return () => {
      cancelled = true;
    };
  }, [routerId]);

  const script = useMemo(() => buildScript(state), [state]);
  const advanceProblem = useMemo(() => canAdvance(state), [state]);

  const onApply = useCallback(
    async (override?: string) => {
      dispatch({ type: 'applying', value: true });
      dispatch({ type: 'error', message: null });
      try {
        const result = await api.batch.applyConfig(override ?? script);
        if (result.status !== 'ok') {
          throw new Error(result.errors?.[0]?.message ?? 'Apply failed');
        }
        toast.notify({
          title: 'Configuration applied',
          description: `${result.appliedLines} lines applied`,
          tone: 'success',
        });
        dispatch({ type: 'applied' });
      } catch (err) {
        dispatch({ type: 'error', message: (err as Error).message ?? 'Apply failed' });
        dispatch({ type: 'applying', value: false });
      }
    },
    [script, toast],
  );

  const goNext = () => {
    if (advanceProblem) {
      dispatch({ type: 'error', message: advanceProblem });
      return;
    }
    const idx = stepOrder.indexOf(state.currentStep);
    const next = stepOrder[idx + 1];
    if (next) dispatch({ type: 'step', step: next });
  };

  const goPrev = () => {
    const idx = stepOrder.indexOf(state.currentStep);
    const prev = stepOrder[idx - 1];
    if (prev) dispatch({ type: 'step', step: prev });
  };

  return { state, dispatch, interfaces, script, onApply, goNext, goPrev, advanceProblem };
}
