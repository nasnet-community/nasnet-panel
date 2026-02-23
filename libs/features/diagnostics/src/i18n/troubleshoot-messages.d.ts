/**
 * Localization messages for the troubleshooting wizard
 * @description All user-facing messages for diagnostic steps, fixes, and results. Messages are professional,
 * actionable, and explain what the user should do or what went wrong. Technical terms are avoided
 * in favor of plain language explanations.
 */
export declare const TROUBLESHOOT_MESSAGES: {
    readonly steps: {
        readonly wan: {
            readonly name: "WAN Interface";
            readonly description: "Checking if your internet connection is physically connected";
            readonly running: "Checking WAN interface status...";
            readonly passed: "Your WAN port is connected and working";
            readonly failed: {
                readonly WAN_LINK_DOWN: "The cable to your internet provider appears disconnected";
                readonly WAN_DISABLED: "Your internet port has been turned off";
            };
        };
        readonly gateway: {
            readonly name: "Gateway Connection";
            readonly description: "Testing connection to your internet provider's equipment";
            readonly running: "Pinging your gateway...";
            readonly passed: "Successfully connected to your internet provider's gateway";
            readonly failed: {
                readonly GATEWAY_UNREACHABLE: "Cannot reach your internet provider's gateway. Your connection needs to be renewed.";
                readonly GATEWAY_TIMEOUT: "Your gateway is responding slowly. There may be connection issues.";
            };
        };
        readonly internet: {
            readonly name: "Internet Access";
            readonly description: "Testing if you can reach the internet";
            readonly running: "Testing internet connection...";
            readonly passed: "Internet connection is working";
            readonly failed: {
                readonly NO_INTERNET: "Cannot reach the internet. This may be an issue with your internet provider.";
                readonly INTERNET_TIMEOUT: "Internet connection is very slow.";
            };
        };
        readonly dns: {
            readonly name: "DNS Resolution";
            readonly description: "Testing if websites can be found by name";
            readonly running: "Testing DNS resolution...";
            readonly passed: "DNS is working correctly - websites can be found";
            readonly failed: {
                readonly DNS_FAILED: "Cannot look up website addresses. Your DNS server may be down.";
                readonly DNS_TIMEOUT: "DNS responses are slow. Switching to a faster DNS may help.";
            };
        };
        readonly nat: {
            readonly name: "Network Address Translation";
            readonly description: "Checking if your devices can share the internet connection";
            readonly running: "Checking NAT configuration...";
            readonly passed: "NAT is configured correctly";
            readonly failed: {
                readonly NAT_MISSING: "NAT is not configured. This prevents your devices from accessing the internet.";
                readonly NAT_DISABLED: "NAT is configured but disabled.";
            };
        };
    };
    readonly fixes: {
        readonly WAN_DISABLED: {
            readonly title: "Enable Internet Connection";
            readonly description: "Your internet port is turned off. We can turn it back on for you.";
            readonly buttonText: "Enable Connection";
        };
        readonly DNS_FAILED: {
            readonly title: "Switch to Cloudflare DNS";
            readonly description: "Your current DNS server isn't working. Cloudflare DNS (1.1.1.1) is fast, free, and reliable.";
            readonly buttonText: "Switch DNS";
        };
        readonly GATEWAY_UNREACHABLE: {
            readonly title: "Renew Internet Connection";
            readonly description: "Your connection to your internet provider may have expired. We'll request a new one.";
            readonly buttonText: "Renew Connection";
        };
        readonly NAT_MISSING: {
            readonly title: "Configure Network Sharing";
            readonly description: "We need to set up network address translation so your devices can share the internet connection.";
            readonly buttonText: "Configure NAT";
        };
    };
    readonly summary: {
        readonly all_passed: "All tests passed! Your internet connection is working correctly.";
        readonly issues_resolved: "We fixed {count} issue(s). Your internet should be working now.";
        readonly issues_remaining: "Some issues remain that we couldn't automatically fix.";
        readonly contact_isp: "The problem appears to be with your internet provider. Please contact them for assistance.";
    };
    readonly announcements: {
        readonly stepStarted: "Step {current} of {total}: {name}. {description}";
        readonly stepPassed: "Step {current} passed: {message}";
        readonly stepFailed: "Step {current} failed: {message}. Fix suggestion available.";
        readonly fixApplying: "Applying fix: {title}";
        readonly fixApplied: "Fix applied. Verifying...";
        readonly fixVerified: "Fix successful. Issue resolved.";
        readonly fixFailed: "Fix applied but issue persists.";
        readonly wizardComplete: "Troubleshooting complete. {summary}";
    };
};
//# sourceMappingURL=troubleshoot-messages.d.ts.map