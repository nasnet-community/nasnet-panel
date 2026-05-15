import { isIPv4, isPort, isRequired, isSsid, isWifiPassword } from '../../utils/validators';
import type { State } from './state';

const FORBIDDEN_SSID_WORDS = ['star', 'starlink', 'vpn', 'iran'];

function ssidContainsForbiddenWord(ssid: string): string | null {
  const lower = ssid.toLowerCase();
  const hit = FORBIDDEN_SSID_WORDS.find((w) => lower.includes(w));
  return hit ? `SSID cannot contain "${hit}".` : null;
}

export function canAdvance(state: State): string | null {
  switch (state.currentStep) {
    case 'mode':
      return state.mode ? null : 'Pick a mode to continue.';
    case 'wan':
      if (!isRequired(state.starlinkInterface)) return 'Select the Starlink interface.';
      if (state.starlinkInterfaceType === 'wireless') {
        if (!isRequired(state.starlinkWanSsid)) return 'Starlink wireless SSID is required.';
        if (state.starlinkWanPassword.length < 8) {
          return 'Starlink wireless password must be at least 8 characters.';
        }
      }
      if (state.mode === 'dual-link') {
        if (!isRequired(state.domesticInterface)) return 'Select the domestic interface.';
        if (state.domesticInterfaceType === 'wireless') {
          if (!isRequired(state.domesticWanSsid)) return 'Domestic wireless SSID is required.';
          if (state.domesticWanPassword.length < 8) {
            return 'Domestic wireless password must be at least 8 characters.';
          }
        }
        if (state.domesticMode === 'pppoe') {
          if (!isRequired(state.pppoeUser) || !isRequired(state.pppoePassword)) {
            return 'PPPoE credentials are required.';
          }
        }
        if (state.domesticMode === 'static' && !isIPv4(state.staticIp.split('/')[0] ?? '')) {
          return 'Provide a valid static IP.';
        }
      }
      return null;
    case 'ipmask':
      if (!state.ipMaskEnabled) return null;
      if (state.ipMaskKind === 'wireguard') {
        if (!isRequired(state.wgEndpoint) || !isPort(state.wgEndpointPort)) {
          return 'Endpoint and port are required.';
        }
        if (!isRequired(state.wgPeerPublicKey)) {
          return 'Peer public key is required.';
        }
      }
      if (state.ipMaskKind === 'l2tp') {
        if (!isRequired(state.l2tpServer)) return 'L2TP server address is required.';
        if (!isRequired(state.l2tpUsername) || !isRequired(state.l2tpPassword)) {
          return 'L2TP credentials are required.';
        }
        if (state.l2tpUseIpsec && !isRequired(state.l2tpIpsecSecret)) {
          return 'IPsec secret is required when IPsec encryption is enabled.';
        }
      }
      return null;
    case 'wifi': {
      const bands: Array<{
        on: boolean;
        ssid: string;
        password: string;
        label: string;
      }> = [
        {
          on: state.wifi24Enabled,
          ssid: state.ssid,
          password: state.wifiPassword,
          label: '2.4 GHz',
        },
        {
          on: state.wifi5Enabled,
          ssid: state.ssid5,
          password: state.wifiPassword5,
          label: '5 GHz',
        },
        {
          on: state.wifi6Enabled,
          ssid: state.ssid6,
          password: state.wifiPassword6,
          label: '6 GHz',
        },
      ];
      for (const b of bands) {
        if (!b.on) continue;
        if (!isSsid(b.ssid)) return `${b.label} SSID is required.`;
        const forbidden = ssidContainsForbiddenWord(b.ssid);
        if (forbidden) return forbidden;
        if (!isWifiPassword(b.password)) {
          return `${b.label} password must be 8–63 characters.`;
        }
      }
      return null;
    }
    case 'vpnsrv':
      if (!state.vpnServerEnabled) return null;
      if (!isRequired(state.vpnServerCertPassphrase)) {
        return 'Certificate passphrase is required.';
      }
      if (!isRequired(state.firstUserName)) return 'Username is required.';
      if (!isRequired(state.firstUserKey)) return 'Password is required.';
      return null;
    default:
      return null;
  }
}
