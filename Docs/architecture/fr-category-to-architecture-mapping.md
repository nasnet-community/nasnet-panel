# FR Category to Architecture Mapping

| FR Category | Frontend Library | Backend Package | Config Gen |
|-------------|------------------|-----------------|------------|
| **Router Discovery (FR0-1 to FR0-7)** | `@nasnet/features/setup-wizard` | `internal/api/router` | - |
| **Dashboard (FR0-8 to FR0-13, FR21-26)** | `@nasnet/features/dashboard` | `internal/api/router` | - |
| **WiFi (FR0-14 to FR0-18)** | `@nasnet/features/wireless` | `pkg/mikrotik/http` | `@nasnet/config-gen/mikrotik/wireless` |
| **VPN Client (FR0-19 to FR0-22, FR1-11)** | `@nasnet/features/vpn-client` | `internal/api/vpn` | `@nasnet/config-gen/mikrotik/vpn-client` |
| **DHCP (FR0-23 to FR0-25)** | `@nasnet/features/lan-config` | `pkg/mikrotik/http` | `@nasnet/config-gen/mikrotik/lan` |
| **Firewall (FR0-26 to FR0-29)** | `@nasnet/features/firewall` | `pkg/mikrotik/http` | `@nasnet/config-gen/mikrotik/firewall` |
| **Network Monitoring (FR0-30 to FR0-33)** | `@nasnet/features/dashboard` | `internal/api/router` | - |
| **System Logs (FR0-34 to FR0-37)** | `@nasnet/features/dashboard` | `pkg/mikrotik/http` | - |
| **Safety Pipeline (FR12-20)** | `@nasnet/features/safety-pipeline` | `internal/service/safety` | - |
| **Auth (FR27-32)** | `@nasnet/api-client/core` | `internal/app/middleware` | - |
| **Configuration (FR43-47)** | `@nasnet/config-gen/*` | `internal/service/config` | All modules |

---
