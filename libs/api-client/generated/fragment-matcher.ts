
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
      "ChainHop",
      "DHCPServerResource",
      "DhcpClient",
      "DiagnosticResult",
      "FeatureResource",
      "FirewallRule",
      "FirewallRuleResource",
      "Interface",
      "IpAddress",
      "LANNetwork",
      "LteModem",
      "NatRule",
      "NotificationLog",
      "PortAllocation",
      "PortForward",
      "PortKnockAttempt",
      "PortKnockSequence",
      "PortMirror",
      "PppoeClient",
      "Route",
      "RouteResource",
      "Router",
      "RoutingChain",
      "RoutingSchedule",
      "ServiceInstance",
      "ServiceTemplate",
      "StaticIPConfig",
      "Tunnel",
      "User",
      "VLANAllocation",
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
    ],
    "StorageMountEvent": [
      "StorageMountedEvent",
      "StorageUnmountedEvent"
    ]
  }
};
      export default result;
    