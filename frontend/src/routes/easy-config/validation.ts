import {
  OVPN_PASSWORD_MIN_LENGTH,
  isIPv4,
  isPort,
  isRequired,
  isSsid,
  isWifiPassword,
} from '../../utils/validators';
import type { Message, MessageKey, State } from './state';

const FORBIDDEN_SSID_WORDS = ['star', 'starlink', 'vpn', 'iran'];

const problem = (key: MessageKey, values?: Record<string, string | number>): Message => ({
  key,
  values,
});

function ssidContainsForbiddenWord(ssid: string): Message | null {
  const lower = ssid.toLowerCase();
  const hit = FORBIDDEN_SSID_WORDS.find((w) => lower.includes(w));
  return hit ? problem('validation.ssidForbiddenWord', { word: hit }) : null;
}

// Mirrors validateOvpnSecret from utils/validators, but returns a translatable message.
export function ovpnSecretProblem(
  value: string,
  subject: 'certPassphrase' | 'password' = 'password',
): Message | null {
  if (!isRequired(value)) return problem(`validation.${subject}Required`);
  if (value.length < OVPN_PASSWORD_MIN_LENGTH) {
    return problem(`validation.${subject}Short`, { min: OVPN_PASSWORD_MIN_LENGTH });
  }
  return null;
}

export function canAdvance(state: State): Message | null {
  switch (state.currentStep) {
    case 'mode':
      return state.mode ? null : problem('validation.pickMode');
    case 'wan':
      if (!isRequired(state.starlinkInterface)) return problem('validation.selectStarlink');
      if (state.starlinkInterfaceType === 'wireless') {
        if (!isRequired(state.starlinkWanSsid)) return problem('validation.starlinkSsidRequired');
        if (state.starlinkWanPassword.length < 8) {
          return problem('validation.starlinkPasswordShort');
        }
      }
      if (state.mode === 'dual-link') {
        if (!isRequired(state.domesticInterface)) return problem('validation.selectDomestic');
        if (state.domesticInterfaceType === 'wireless') {
          if (!isRequired(state.domesticWanSsid)) {
            return problem('validation.domesticSsidRequired');
          }
          if (state.domesticWanPassword.length < 8) {
            return problem('validation.domesticPasswordShort');
          }
        }
        if (state.domesticMode === 'pppoe') {
          if (!isRequired(state.pppoeUser) || !isRequired(state.pppoePassword)) {
            return problem('validation.pppoeRequired');
          }
        }
        if (state.domesticMode === 'static' && !isIPv4(state.staticIp.split('/')[0] ?? '')) {
          return problem('validation.staticIpInvalid');
        }
      }
      return null;
    case 'ipmask':
      if (!state.ipMaskEnabled) return null;
      if (state.ipMaskKind === 'wireguard') {
        if (!isRequired(state.wgEndpoint) || !isPort(state.wgEndpointPort)) {
          return problem('validation.endpointRequired');
        }
        if (!isRequired(state.wgPeerPublicKey)) {
          return problem('validation.peerKeyRequired');
        }
      }
      if (state.ipMaskKind === 'l2tp') {
        if (!isRequired(state.l2tpServer)) return problem('validation.l2tpServerRequired');
        if (!isRequired(state.l2tpUsername) || !isRequired(state.l2tpPassword)) {
          return problem('validation.l2tpCredentialsRequired');
        }
        if (state.l2tpUseIpsec && !isRequired(state.l2tpIpsecSecret)) {
          return problem('validation.ipsecSecretRequired');
        }
      }
      return null;
    case 'wifi': {
      if (!state.wifiEnabled) return null;
      if (!isSsid(state.ssid)) return problem('validation.ssidRequired');
      const forbidden = ssidContainsForbiddenWord(state.ssid);
      if (forbidden) return forbidden;
      if (!isWifiPassword(state.wifiPassword)) {
        return problem('validation.wifiPasswordLength');
      }
      return null;
    }
    case 'vpnsrv': {
      if (!state.vpnServerEnabled) return null;
      const passphraseProblem = ovpnSecretProblem(state.vpnServerCertPassphrase, 'certPassphrase');
      if (passphraseProblem) return passphraseProblem;
      if (!isRequired(state.firstUserName)) return problem('validation.usernameRequired');
      return ovpnSecretProblem(state.firstUserKey);
    }
    default:
      return null;
  }
}
