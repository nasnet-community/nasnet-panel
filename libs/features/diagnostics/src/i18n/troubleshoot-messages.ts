// libs/features/diagnostics/src/i18n/troubleshoot-messages.ts

/**
 * Localization messages for the troubleshooting wizard
 * @description All user-facing messages for diagnostic steps, fixes, and results. Messages are professional,
 * actionable, and explain what the user should do or what went wrong. Technical terms are avoided
 * in favor of plain language explanations.
 */
export const TROUBLESHOOT_MESSAGES = {
  steps: {
    wan: {
      name: 'WAN Interface',
      description: 'Checking if your internet connection is physically connected',
      running: 'Checking WAN interface status...',
      passed: 'Your WAN port is connected and working',
      failed: {
        WAN_LINK_DOWN: 'The cable to your internet provider appears disconnected',
        WAN_DISABLED: 'Your internet port has been turned off',
      },
    },
    gateway: {
      name: 'Gateway Connection',
      description: "Testing connection to your internet provider's equipment",
      running: 'Pinging your gateway...',
      passed: "Successfully connected to your internet provider's gateway",
      failed: {
        GATEWAY_UNREACHABLE:
          "Cannot reach your internet provider's gateway. Your connection needs to be renewed.",
        GATEWAY_TIMEOUT: 'Your gateway is responding slowly. There may be connection issues.',
      },
    },
    internet: {
      name: 'Internet Access',
      description: 'Testing if you can reach the internet',
      running: 'Testing internet connection...',
      passed: 'Internet connection is working',
      failed: {
        NO_INTERNET: 'Cannot reach the internet. This may be an issue with your internet provider.',
        INTERNET_TIMEOUT: 'Internet connection is very slow.',
      },
    },
    dns: {
      name: 'DNS Resolution',
      description: 'Testing if websites can be found by name',
      running: 'Testing DNS resolution...',
      passed: 'DNS is working correctly - websites can be found',
      failed: {
        DNS_FAILED: 'Cannot look up website addresses. Your DNS server may be down.',
        DNS_TIMEOUT: 'DNS responses are slow. Switching to a faster DNS may help.',
      },
    },
    nat: {
      name: 'Network Address Translation',
      description: 'Checking if your devices can share the internet connection',
      running: 'Checking NAT configuration...',
      passed: 'NAT is configured correctly',
      failed: {
        NAT_MISSING:
          'NAT is not configured. This prevents your devices from accessing the internet.',
        NAT_DISABLED: 'NAT is configured but disabled.',
      },
    },
  },

  fixes: {
    WAN_DISABLED: {
      title: 'Enable Internet Connection',
      description: 'Your internet port is turned off. We can turn it back on for you.',
      buttonText: 'Enable Connection',
    },
    DNS_FAILED: {
      title: 'Switch to Cloudflare DNS',
      description:
        "Your current DNS server isn't working. Cloudflare DNS (1.1.1.1) is fast, free, and reliable.",
      buttonText: 'Switch DNS',
    },
    GATEWAY_UNREACHABLE: {
      title: 'Renew Internet Connection',
      description:
        "Your connection to your internet provider may have expired. We'll request a new one.",
      buttonText: 'Renew Connection',
    },
    NAT_MISSING: {
      title: 'Configure Network Sharing',
      description:
        'We need to set up network address translation so your devices can share the internet connection.',
      buttonText: 'Configure NAT',
    },
  },

  summary: {
    all_passed: 'All tests passed! Your internet connection is working correctly.',
    issues_resolved: 'We fixed {count} issue(s). Your internet should be working now.',
    issues_remaining: "Some issues remain that we couldn't automatically fix.",
    contact_isp:
      'The problem appears to be with your internet provider. Please contact them for assistance.',
  },

  // Accessibility announcements
  announcements: {
    stepStarted: 'Step {current} of {total}: {name}. {description}',
    stepPassed: 'Step {current} passed: {message}',
    stepFailed: 'Step {current} failed: {message}. Fix suggestion available.',
    fixApplying: 'Applying fix: {title}',
    fixApplied: 'Fix applied. Verifying...',
    fixVerified: 'Fix successful. Issue resolved.',
    fixFailed: 'Fix applied but issue persists.',
    wizardComplete: 'Troubleshooting complete. {summary}',
  },
} as const;
