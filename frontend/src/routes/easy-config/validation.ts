import { isCIDR, isIPv4, isPort, isRequired, isSsid, isWifiPassword } from '../../utils/validators';
import type { State } from './state';

export function canAdvance(state: State): string | null {
  switch (state.currentStep) {
    case 'mode':
      return state.mode ? null : 'Pick a mode to continue.';
    case 'wan':
      if (!isRequired(state.starlinkInterface)) return 'Select the Starlink interface.';
      if (state.mode === 'dual-link') {
        if (!isRequired(state.domesticInterface)) return 'Select the domestic interface.';
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
      }
      return null;
    case 'wifi':
      if (!isSsid(state.ssid)) return 'SSID is required.';
      if (!isWifiPassword(state.wifiPassword)) return 'Wi-Fi password must be 8–63 characters.';
      if (state.splitBands) {
        if (!isSsid(state.ssid5)) return '5 GHz SSID is required.';
        if (!isWifiPassword(state.wifiPassword5)) {
          return '5 GHz password must be 8–63 characters.';
        }
      }
      return null;
    case 'vpnsrv':
      if (!state.vpnServerEnabled) return null;
      if (!isPort(state.vpnServerPort)) return 'Valid listen port is required.';
      if (!isCIDR(state.vpnServerIpPool)) return 'VPN server needs a valid IP pool CIDR.';
      if (!isRequired(state.firstUserName)) return 'First user name is required.';
      if (!isRequired(state.firstUserKey)) {
        return state.vpnServerProtocol === 'wireguard'
          ? 'First user public key is required.'
          : 'First user password is required.';
      }
      return null;
    default:
      return null;
  }
}
