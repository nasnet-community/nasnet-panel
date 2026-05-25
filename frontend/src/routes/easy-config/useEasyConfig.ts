import { useCallback, useEffect, useMemo, useReducer, useState } from 'react';
import {
  fetchInterfaces,
  fetchWifiInterfaces,
  finalizeWizard,
  type FinalizeWizardRequest,
  type FinalizeWizardWifiInterface,
  type InterfaceResponse,
  type WifiInterfaceResponse,
} from '../../api';
import { useSession } from '../../state/SessionContext';
import { useRouter } from '../../state/RouterStoreContext';
import { buildEasyConfigScript, type EasyConfigInput } from '../../utils/rsc-builder';
import { canAdvance } from './validation';
import { initial, reducer, stepOrder, type State } from './state';

function bandKeyForWifi(wi: WifiInterfaceResponse): '24' | '5' | '6' | null {
  const b = (wi.band ?? '').toLowerCase();
  if (b.startsWith('2')) return '24';
  if (b.startsWith('5')) return '5';
  if (b.startsWith('6')) return '6';
  const f = Number(wi.frequency);
  if (Number.isFinite(f)) {
    if (f >= 2400 && f < 2500) return '24';
    if (f >= 5000 && f < 5925) return '5';
    if (f >= 5925) return '6';
  }
  return null;
}

function buildFinalizePayload(
  state: State,
  wifiInterfaces: WifiInterfaceResponse[],
): FinalizeWizardRequest {
  const wifi: FinalizeWizardWifiInterface[] = [];
  const bandToFields: Record<
    '24' | '5' | '6',
    { enabled: boolean; ssid: string; password: string }
  > = {
    '24': { enabled: state.wifi24Enabled, ssid: state.ssid, password: state.wifiPassword },
    '5': { enabled: state.wifi5Enabled, ssid: state.ssid5, password: state.wifiPassword5 },
    '6': { enabled: state.wifi6Enabled, ssid: state.ssid6, password: state.wifiPassword6 },
  };
  for (const wi of wifiInterfaces) {
    const key = bandKeyForWifi(wi);
    if (!key) continue;
    const fields = bandToFields[key];
    if (!fields?.enabled) continue;
    wifi.push({ id: wi.id, ssid: fields.ssid, password: fields.password });
  }

  let maskingL2tp: FinalizeWizardRequest['maskingL2tp'] = null;
  let maskingWireGuard: FinalizeWizardRequest['maskingWireGuard'] = null;
  if (state.ipMaskEnabled) {
    if (state.ipMaskKind === 'l2tp') {
      maskingL2tp = {
        connectTo: state.l2tpServer,
        disabled: false,
        ipsecSecret: state.l2tpUseIpsec ? state.l2tpIpsecSecret : '',
        name: 'wan-mask-l2tp',
        password: state.l2tpPassword,
        user: state.l2tpUsername,
      };
    } else if (state.ipMaskKind === 'wireguard') {
      maskingWireGuard = { config: state.wgConfig };
    }
  }

  const ovpnServer = state.vpnServerEnabled
    ? {
        clientCertificatePassword: state.vpnServerCertPassphrase,
        users:
          state.firstUserName && state.firstUserKey
            ? [{ username: state.firstUserName, password: state.firstUserKey }]
            : [],
      }
    : null;

  return {
    foreignInterface: state.starlinkInterface,
    domesticInterface: state.mode === 'dual-link' ? state.domesticInterface : '',
    maskingL2tp,
    maskingWireGuard,
    wifiInterfaces: wifi,
    ovpnServer,
  };
}

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
      splitBands: state.wifi24Enabled && state.wifi5Enabled,
      band24: state.wifi24Enabled ? { ssid: state.ssid, password: state.wifiPassword } : undefined,
      band5: state.wifi5Enabled ? { ssid: state.ssid5, password: state.wifiPassword5 } : undefined,
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
            useIpsec: state.l2tpUseIpsec,
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
  const { getCredentials } = useSession();
  const router = useRouter(routerId);
  const [state, dispatch] = useReducer(reducer, initial);
  const [interfaces, setInterfaces] = useState<InterfaceResponse[]>([]);
  const [interfacesLoading, setInterfacesLoading] = useState<boolean>(false);
  const [wifiInterfaces, setWifiInterfaces] = useState<WifiInterfaceResponse[]>([]);

  useEffect(() => {
    if (!routerId) return;
    const creds = getCredentials(routerId);
    const host = router?.host;
    const controller = new AbortController();

    if (!creds || !host) {
      setInterfaces([]);
      setWifiInterfaces([]);
      setInterfacesLoading(false);
      return;
    }

    setInterfacesLoading(true);
    void (async () => {
      try {
        const list = await fetchInterfaces({ host, ...creds }, controller.signal);
        if (controller.signal.aborted) return;
        setInterfaces(
          list.filter((i) => ['ether', 'wireless', 'wifi', 'wlan', 'w60g', 'lte'].includes(i.type)),
        );
      } catch {
        if (controller.signal.aborted) return;
        setInterfaces([]);
      } finally {
        if (!controller.signal.aborted) setInterfacesLoading(false);
      }
    })();

    void (async () => {
      try {
        const list = await fetchWifiInterfaces({ host, ...creds }, controller.signal);
        if (controller.signal.aborted) return;
        setWifiInterfaces(list);
      } catch {
        if (controller.signal.aborted) return;
        setWifiInterfaces([]);
      }
    })();

    return () => {
      controller.abort();
    };
  }, [routerId, router?.host, getCredentials]);

  const script = useMemo(() => buildScript(state), [state]);
  const advanceProblem = useMemo(() => canAdvance(state), [state]);

  const onApply = useCallback(async () => {
    const creds = routerId ? getCredentials(routerId) : undefined;
    const host = router?.host;
    if (!creds || !host) {
      dispatch({ type: 'error', message: 'Missing router credentials.' });
      return;
    }

    dispatch({ type: 'applying', value: true });
    dispatch({ type: 'error', message: null });
    try {
      const payload = buildFinalizePayload(state, wifiInterfaces);
      await finalizeWizard({ host, ...creds }, payload);
      dispatch({ type: 'applied' });
    } catch (err) {
      dispatch({ type: 'error', message: (err as Error).message ?? 'Apply failed' });
      dispatch({ type: 'applying', value: false });
    }
  }, [routerId, router?.host, getCredentials, state, wifiInterfaces]);

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

  return {
    state,
    dispatch,
    interfaces,
    interfacesLoading,
    wifiInterfaces,
    script,
    onApply,
    goNext,
    goPrev,
    advanceProblem,
  };
}
