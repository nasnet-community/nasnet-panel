import type { RouterConfig } from "@nas-net/ros-cmd-generator";
import type {
    Socks5ServerConfig,
    VSCredentials
} from "@nas-net/star-context";
// import type { Networks } from "@nas-net/star-context/CommonType";
// import { mergeMultipleConfigs } from "../../../utils/ConfigGeneratorUtil";

export const Socks5Server = (config: Socks5ServerConfig): RouterConfig => {
    if (!config.enabled) {
        return {};
    }

    const routerConfig: RouterConfig = {
        "/ip socks": [
            `set auth-method=password enabled=yes port=${config.Port} version=5`
        ],
    };

    return routerConfig;
};

export const Socks5ServerUsers = ( users: VSCredentials[], _config?: Socks5ServerConfig ): RouterConfig => {
    const routerConfig: RouterConfig = {
        "/ip socks users": [],
    };

    // Filter users that have Socks5 in their VPNType array
    const socks5Users = users.filter((user) =>
        user.VPNType.includes("Socks5")
    );

    // Only add users if there are Socks5 users
    if (socks5Users.length === 0) {
        return {};
    }

    // Add each Socks5 user
    socks5Users.forEach((user) => {
        routerConfig["/ip socks users"].push(
            `add name="${user.Username}" password="${user.Password}" \\
    comment="Socks5 Server User - ${user.Username}"`
        );
    });

    return routerConfig;
};


export const Scoks5ServerFirewall = (): RouterConfig => {
    const config: RouterConfig = {

    }

    return config

}
export const Scoks5ServerWrapper = (): RouterConfig => {
    const config: RouterConfig = {

    }

    return config

}

















