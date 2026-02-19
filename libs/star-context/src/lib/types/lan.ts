import type { Ethernet, Sfp } from "./common";
// import type { BaseNetworksType } from "./common";
import type { Subnets } from "../utils/Subnets";
import type { Tunnel } from "../utils/TunnelType";
import type { VPNServer } from "../utils/VPNServerType";

export type WirelessInterfaceType = "Master" | "Slave";

export type WifiTarget =
  | "Domestic" 
  | "Foreign" 
  | "VPN"
  | "Split"  
  | "SingleDomestic" 
  | "SingleForeign" 
  | "SingleVPN" 

export interface WirelessConfig {
  SSID: string;
  Password: string;
  isHide: boolean;
  isDisabled: boolean;
  SplitBand: boolean;
  WifiTarget: WifiTarget;
  NetworkName: string;
}

export interface EthernetInterfaceConfig {
  name: Ethernet | Sfp;
  bridge: string;
}


export interface LANState {
  Wireless?: WirelessConfig[];
  VPNServer?: VPNServer;
  Tunnel?: Tunnel;
  Interface?: EthernetInterfaceConfig[];
  Subnets?: Subnets;
}
