
      export interface PossibleTypesResultData {
        possibleTypes: {
          [key: string]: string[]
        }
      }
      const result: PossibleTypesResultData = {
  "possibleTypes": {
    "Connection": [
      "AddressListEntryConnection",
      "AlertConnection",
      "InterfaceConnection",
      "PortKnockAttemptConnection",
      "ResourceConnection",
      "RouterConnection",
      "WANConnectionEventConnection"
    ],
    "Edge": [
      "AddressListEntryEdge",
      "AlertEdge",
      "InterfaceEdge",
      "PortKnockAttemptEdge",
      "ResourceEdge",
      "RouterEdge",
      "WANConnectionEventEdge"
    ],
    "Node": [
      "AddressListEntry",
      "Alert",
      "AlertEscalation",
      "AlertRule",
      "AlertRuleTemplate",
      "AlertTemplate",
      "Bridge",
      "BridgePort",
      "BridgeResource",
      "DHCPServerResource",
      "DhcpClient",
      "FeatureResource",
      "FirewallRule",
      "FirewallRuleResource",
      "Interface",
      "IpAddress",
      "LANNetwork",
      "LteModem",
      "NatRule",
      "NotificationLog",
      "PortForward",
      "PortKnockAttempt",
      "PortKnockSequence",
      "PortMirror",
      "PppoeClient",
      "Route",
      "RouteResource",
      "Router",
      "ServiceInstance",
      "StaticIPConfig",
      "Tunnel",
      "User",
      "Vlan",
      "WANInterface",
      "WANLink",
      "Webhook",
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
    