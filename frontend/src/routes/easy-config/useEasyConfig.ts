import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from 'react';
import {
  fetchInterfaces,
  fetchWifiInterfaces,
  fetchWizardStatus,
  finalizeWizard,
  type FinalizeWizardInterface,
  type FinalizeWizardRequest,
  type InterfaceResponse,
  type VPNCredentials,
  type WifiInterfaceResponse,
} from '../../api';
import { useSession } from '../../state/SessionContext';
import { useRouter } from '../../state/RouterStoreContext';
import { useWizardGate } from '../../state/WizardGateContext';
import { buildEasyConfigScript, type EasyConfigInput } from '../../utils/rsc-builder';
import { canAdvance } from './validation';
import { initial, reducer, stepOrder, type State } from './state';

const POLL_INTERVAL_MS = 2000;
const POLL_TIMEOUT_MS = 6 * 60 * 1000;

function wanInterface(
  type: State['starlinkInterfaceType'],
  name: string,
  ssid: string,
  password: string,
): FinalizeWizardInterface {
  if (type === 'wireless') {
    return { type: 'wifi', interface: name, ssid, password };
  }
  return { type: 'ether', interface: name };
}

function toDefaultName(name: string, interfaces: InterfaceResponse[]): string {
  const match = interfaces.find((i) => i.name === name);
  return match?.defaultName || name;
}

function buildFinalizePayload(
  state: State,
  interfaces: InterfaceResponse[],
): FinalizeWizardRequest {
  const payload: FinalizeWizardRequest = {
    foreign: wanInterface(
      state.starlinkInterfaceType,
      toDefaultName(state.starlinkInterface, interfaces),
      state.starlinkWanSsid,
      state.starlinkWanPassword,
    ),
  };

  if (state.mode === 'dual-link') {
    payload.domestic = wanInterface(
      state.domesticInterfaceType,
      toDefaultName(state.domesticInterface, interfaces),
      state.domesticWanSsid,
      state.domesticWanPassword,
    );
  }

  if (state.ipMaskEnabled) {
    if (state.ipMaskKind === 'l2tp') {
      payload.l2tpClient = {
        connectTo: state.l2tpServer,
        user: state.l2tpUsername,
        password: state.l2tpPassword,
        ipsecSecret: state.l2tpUseIpsec ? state.l2tpIpsecSecret : '',
      };
    } else if (state.ipMaskKind === 'wireguard') {
      payload.wireguardClient = { config: state.wgConfig };
    }
  }

  if (state.wifiEnabled) {
    payload.wifiAp = { ssid: state.ssid, password: state.wifiPassword };
  }

  if (state.vpnServerEnabled) {
    payload.ovpnServer = {
      clientCertificatePassword: state.vpnServerCertPassphrase,
      users:
        state.firstUserName && state.firstUserKey
          ? [{ username: state.firstUserName, password: state.firstUserKey }]
          : [],
    };
  }

  return payload;
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
      splitBands: state.wifiSplit,
      band24: state.wifiSplit
        ? { ssid: `${state.ssid}-2.4`, password: state.wifiPassword }
        : undefined,
      band5: state.wifiSplit
        ? { ssid: `${state.ssid}-5`, password: state.wifiPassword }
        : undefined,
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
  const { markCompleted } = useWizardGate();
  const [state, dispatch] = useReducer(reducer, initial);
  const [interfaces, setInterfaces] = useState<InterfaceResponse[]>([]);
  const [interfacesLoading, setInterfacesLoading] = useState<boolean>(false);
  const [wifiInterfaces, setWifiInterfaces] = useState<WifiInterfaceResponse[]>([]);
  const [wifiSupported, setWifiSupported] = useState<boolean>(true);

  useEffect(() => {
    if (!routerId) return;
    const creds = getCredentials(routerId);
    const host = router?.host;
    const controller = new AbortController();

    if (!creds || !host) {
      setInterfaces([]);
      setWifiInterfaces([]);
      setWifiSupported(true);
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
        setWifiSupported(list.length > 0);
        if (list.length === 0) {
          dispatch({ type: 'setField', field: 'wifiEnabled', value: false });
        }
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

  const poll = useRef<{ cancelled: boolean; timer?: ReturnType<typeof setTimeout> }>({
    cancelled: false,
  });

  useEffect(
    () => () => {
      poll.current.cancelled = true;
      if (poll.current.timer) clearTimeout(poll.current.timer);
    },
    [],
  );

  const trackProgress = useCallback(
    (creds: VPNCredentials) => {
      const ctl = poll.current;
      ctl.cancelled = false;
      const deadline = Date.now() + POLL_TIMEOUT_MS;

      const tick = async () => {
        if (ctl.cancelled) return;
        try {
          const status = await fetchWizardStatus(creds);
          if (ctl.cancelled) return;
          dispatch({ type: 'progress', value: status.progress });
          if (status.progress >= 100) {
            dispatch({ type: 'applied' });
            if (routerId) markCompleted(routerId);
            return;
          }
        } catch {
          // router drops off while its addressing is rewritten; keep polling until the deadline
        }
        if (ctl.cancelled) return;
        if (Date.now() > deadline) {
          dispatch({ type: 'error', message: 'Timed out waiting for the router to finish.' });
          dispatch({ type: 'applying', value: false });
          return;
        }
        ctl.timer = setTimeout(() => {
          void tick();
        }, POLL_INTERVAL_MS);
      };

      void tick();
    },
    [routerId, markCompleted],
  );

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
      const result = await finalizeWizard(
        { host, ...creds },
        buildFinalizePayload(state, interfaces),
      );
      dispatch({
        type: 'managementWifi',
        ssid: result.managementWiFiSSID ?? '',
        password: result.managementWiFiPassword ?? '',
      });
    } catch (err) {
      dispatch({ type: 'error', message: (err as Error).message ?? 'Apply failed' });
      dispatch({ type: 'applying', value: false });
      return;
    }
    trackProgress({ host, ...creds });
  }, [routerId, router?.host, getCredentials, state, interfaces, trackProgress]);

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
    wifiSupported,
    script,
    onApply,
    goNext,
    goPrev,
    advanceProblem,
  };
}
