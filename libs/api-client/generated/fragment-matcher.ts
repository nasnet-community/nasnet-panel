
      export interface PossibleTypesResultData {
        possibleTypes: {
          [key: string]: string[]
        }
      }
      const result: PossibleTypesResultData = {
  "possibleTypes": {
    "Connection": [
      "AlertConnection",
      "InterfaceConnection",
      "ResourceConnection",
      "RouterConnection",
      "WANConnectionEventConnection"
    ],
    "Edge": [
      "AlertEdge",
      "InterfaceEdge",
      "ResourceEdge",
      "RouterEdge",
      "WANConnectionEventEdge"
    ],
    "Node": [
      "Alert",
      "AlertRule",
      "Bridge",
      "BridgePort",
      "BridgeResource",
      "DHCPServerResource",
      "DhcpClient",
      "FeatureResource",
      "FirewallRuleResource",
      "Interface",
      "IpAddress",
      "LANNetwork",
      "LteModem",
      "PppoeClient",
      "Route",
      "RouteResource",
      "Router",
      "StaticIPConfig",
      "User",
      "Vlan",
      "WANInterface",
      "WANLink",
      "WireGuardClient"
    ],
    "Resource": [
      "BridgeResource",
      "DHCPServerResource",
      "FeatureResource",
      "FirewallRuleResource",
      "LANNetwork",
      "RouteResource",
      "WANLink",
      "WireGuardClient"
    ]
  }
};
      export default result;
    