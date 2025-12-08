import type { RouterConfig } from "@nas-net/ros-cmd-generator";
import type { WANState, Networks, Subnets, LTE, RouterModels } from "@nas-net/star-context";
import { VPNClientWrapper } from "@nas-net/ros-cmd-generator";
import { generateWANLinksConfig } from "@nas-net/ros-cmd-generator";
import { MainTableRoute } from "@nas-net/ros-cmd-generator";
import { mergeMultipleConfigs } from "@nas-net/ros-cmd-generator";
import { DNS } from "@nas-net/ros-cmd-generator";


export const WANCG = (WANState: WANState, networks: Networks, subnets?: Subnets, availableLTEInterfaces?: LTE[], routerModels?: RouterModels[]): RouterConfig => {
    const { WANLink, VPNClient } = WANState;

    const configs: RouterConfig[] = [];

    // 1. Generate WAN Links Configuration (interfaces, connections, routes)
    configs.push(generateWANLinksConfig(WANLink, availableLTEInterfaces, routerModels));

    // 2. Generate VPN Client Configuration (all VPN protocols)
    // Pass WANLink to calculate proper check IP offset
    if (VPNClient) {
        configs.push(VPNClientWrapper(VPNClient, WANLink));
    }

    // 3. Generate Main Table Routes (failover routing for all WAN links and VPN clients)
    configs.push(MainTableRoute(VPNClient, WANLink));

    // 4. Generate DNS Configuration (forwarders, mDNS, IRTLD, blocking, DOH)
    // Pass WANLink and VPNClient to ensure DNS forwarders use same CheckIPs as routing
    configs.push(DNS(networks, subnets, WANLink, VPNClient));

    return mergeMultipleConfigs(...configs);
};
