import { useCallback, useEffect, useMemo, useReducer, useState } from 'react';
import { useToast } from '@nasnet/ui';
import { api, fetchInterfaces, type InterfaceResponse } from '../../api';
import { useSession } from '../../state/SessionContext';
import { useRouter } from '../../state/RouterStoreContext';
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
      ? state.ipMaskKind === 'l2tp'
        ? {
            kind: 'l2tp',
            server: state.l2tpServer,
            username: state.l2tpUsername,
            password: state.l2tpPassword,
            useIpsec: state.l2tpUseIpsec,
            ipsecSecret: state.l2tpIpsecSecret,
            profile: state.l2tpProfile,
          }
        : {
            kind: 'openvpn',
            server: state.ovpnServer,
            port: Number(state.ovpnPort) || 1194,
            username: state.ovpnUsername,
            password: state.ovpnPassword,
            cipher: state.ovpnCipher,
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
  const { getCredentials } = useSession();
  const router = useRouter(routerId);
  const [state, dispatch] = useReducer(reducer, initial);
  const [interfaces, setInterfaces] = useState<InterfaceResponse[]>([]);

  useEffect(() => {
    if (!routerId) return;
    const creds = getCredentials(routerId);
    const host = router?.host;
    const controller = new AbortController();

    const loadFromApi = async () => {
      if (!creds || !host) return null;
      try {
        return await fetchInterfaces({ host, ...creds }, controller.signal);
      } catch {
        return null;
      }
    };

    const loadFromMock = async () => {
      const list = await api.system.listInterfaces(routerId);
      return list.map((i) => ({
        id: i.name,
        name: i.name,
        type: i.type,
        running: i.running,
        disabled: i.disabled ?? false,
        mac: i.mac,
        comment: i.comment,
      })) satisfies InterfaceResponse[];
    };

    void (async () => {
      const fromApi = await loadFromApi();
      if (controller.signal.aborted) return;
      const list = fromApi ?? (await loadFromMock());
      if (controller.signal.aborted) return;
      setInterfaces(list.filter((i) => i.type === 'ether' || i.type === 'wireless'));
    })();

    return () => {
      controller.abort();
    };
  }, [routerId, router?.host, getCredentials]);

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
