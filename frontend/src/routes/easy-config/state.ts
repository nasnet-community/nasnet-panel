export type Mode = 'starlink-only' | 'dual-link';
export type StepId = 'mode' | 'wan' | 'ipmask' | 'wifi' | 'vpnsrv';
export type InterfaceType = 'ethernet' | 'wireless' | 'sfp' | 'lte';
export type VpnServerProtocol = 'wireguard' | 'openvpn' | 'l2tp';

export interface State {
  mode: Mode | null;
  starlinkInterfaceType: InterfaceType;
  domesticInterfaceType: InterfaceType;
  starlinkWanSsid: string;
  starlinkWanPassword: string;
  domesticWanSsid: string;
  domesticWanPassword: string;
  starlinkInterface: string;
  domesticInterface: string;
  domesticMode: 'dhcp' | 'static' | 'pppoe';
  pppoeUser: string;
  pppoePassword: string;
  staticIp: string;
  staticGateway: string;
  staticDns: string;
  wifiInterface: string;
  wifi24Enabled: boolean;
  wifi5Enabled: boolean;
  wifi6Enabled: boolean;
  ssid: string;
  wifiPassword: string;
  ssid5: string;
  wifiPassword5: string;
  ssid6: string;
  wifiPassword6: string;
  security: 'WPA2-PSK' | 'WPA3-PSK';
  band: '2.4ghz' | '5ghz';
  countryCode: string;
  ipMaskEnabled: boolean;
  ipMaskKind: 'wireguard' | 'l2tp';
  wgConfig: string;
  wgEndpoint: string;
  wgEndpointPort: string;
  wgPeerPublicKey: string;
  wgPrivateKey: string;
  wgPublicKey: string;
  wgAllowedIps: string;
  wgKeepalive: string;
  wgMtu: string;
  l2tpServer: string;
  l2tpUsername: string;
  l2tpPassword: string;
  l2tpUseIpsec: boolean;
  l2tpIpsecSecret: string;
  l2tpProfile: string;
  vpnServerEnabled: boolean;
  vpnServerProtocol: VpnServerProtocol;
  vpnServerPort: string;
  vpnServerIpPool: string;
  vpnServerDns: string;
  firstUserName: string;
  firstUserKey: string;
  vpnServerCertPassphrase: string;
  currentStep: StepId;
  error: string | null;
  applying: boolean;
  applied: boolean;
}

export const initial: State = {
  mode: 'dual-link',
  starlinkInterfaceType: 'ethernet',
  domesticInterfaceType: 'ethernet',
  starlinkWanSsid: '',
  starlinkWanPassword: '',
  domesticWanSsid: '',
  domesticWanPassword: '',
  starlinkInterface: '',
  domesticInterface: '',
  domesticMode: 'dhcp',
  pppoeUser: '',
  pppoePassword: '',
  staticIp: '',
  staticGateway: '',
  staticDns: '',
  wifiInterface: '',
  wifi24Enabled: true,
  wifi5Enabled: false,
  wifi6Enabled: false,
  ssid: '',
  wifiPassword: '',
  ssid5: '',
  wifiPassword5: '',
  ssid6: '',
  wifiPassword6: '',
  security: 'WPA2-PSK',
  band: '5ghz',
  countryCode: 'US',
  ipMaskEnabled: true,
  ipMaskKind: 'wireguard',
  wgConfig: '',
  wgEndpoint: '',
  wgEndpointPort: '51820',
  wgPeerPublicKey: '',
  wgPrivateKey: '',
  wgPublicKey: '',
  wgAllowedIps: '0.0.0.0/0',
  wgKeepalive: '25',
  wgMtu: '1420',
  l2tpServer: '',
  l2tpUsername: '',
  l2tpPassword: '',
  l2tpUseIpsec: false,
  l2tpIpsecSecret: '',
  l2tpProfile: 'default-encryption',
  vpnServerEnabled: false,
  vpnServerProtocol: 'openvpn',
  vpnServerPort: '51820',
  vpnServerIpPool: '10.8.0.0/24',
  vpnServerDns: '',
  firstUserName: '',
  firstUserKey: '',
  vpnServerCertPassphrase: '',
  currentStep: 'mode',
  error: null,
  applying: false,
  applied: false,
};

export type Action =
  | { type: 'setMode'; mode: Mode }
  | { type: 'setField'; field: keyof State; value: State[keyof State] }
  | { type: 'setKeys'; privateKey: string; publicKey: string }
  | { type: 'step'; step: StepId }
  | { type: 'error'; message: string | null }
  | { type: 'applying'; value: boolean }
  | { type: 'applied' };

export function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'setMode':
      return { ...state, mode: action.mode };
    case 'setField':
      return { ...state, [action.field]: action.value } as State;
    case 'setKeys':
      return { ...state, wgPrivateKey: action.privateKey, wgPublicKey: action.publicKey };
    case 'step':
      return { ...state, currentStep: action.step, error: null };
    case 'error':
      return { ...state, error: action.message };
    case 'applying':
      return { ...state, applying: action.value };
    case 'applied':
      return { ...state, applied: true, applying: false };
    default:
      return state;
  }
}

export const stepOrder: StepId[] = ['mode', 'wan', 'ipmask', 'wifi', 'vpnsrv'];

export const stepTitles: Record<StepId, { title: string; description: string }> = {
  mode: { title: 'Choose', description: 'Setup type' },
  wan: { title: 'WAN', description: 'Uplink interfaces' },
  ipmask: { title: 'IP-Mask', description: 'Starlink VPN client' },
  wifi: { title: 'WiFi', description: 'Wireless network' },
  vpnsrv: { title: 'VPN Server', description: 'Inbound VPN' },
};
