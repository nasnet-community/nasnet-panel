import type { WanInterfaceType } from '../../../../api';
import type { State } from '../../state';

interface WanFieldShape {
  wanType: WanInterfaceType;
  typeField: keyof State;
  nameField: keyof State;
  ssidField: keyof State;
  passwordField: keyof State;
  authTypeField: keyof State;
  ipModeField: keyof State;
  staticIpField: keyof State;
  gatewayField: keyof State;
}

/** The wizard state fields that hold one WAN link. */
export const WAN_FIELDS = {
  foreign: {
    wanType: 'foreign',
    typeField: 'starlinkInterfaceType',
    nameField: 'starlinkInterface',
    ssidField: 'starlinkWanSsid',
    passwordField: 'starlinkWanPassword',
    authTypeField: 'starlinkWanAuthType',
    ipModeField: 'starlinkIpMode',
    staticIpField: 'starlinkStaticIp',
    gatewayField: 'starlinkGateway',
  },
  domestic: {
    wanType: 'domestic',
    typeField: 'domesticInterfaceType',
    nameField: 'domesticInterface',
    ssidField: 'domesticWanSsid',
    passwordField: 'domesticWanPassword',
    authTypeField: 'domesticWanAuthType',
    ipModeField: 'domesticIpMode',
    staticIpField: 'domesticStaticIp',
    gatewayField: 'domesticGateway',
  },
} as const satisfies Record<WanInterfaceType, WanFieldShape>;

export type WanFieldSet = (typeof WAN_FIELDS)[WanInterfaceType];
