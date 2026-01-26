# 17. Localization Patterns

## RTL-First Architecture

Building bidirectional support from day one, not retrofitting.

```css
/* Use CSS Logical Properties everywhere */
.card {
  /* Instead of: padding-left: 1rem; padding-right: 2rem; */
  padding-inline-start: 1rem;
  padding-inline-end: 2rem;

  /* Instead of: margin-left: auto; */
  margin-inline-start: auto;

  /* Instead of: border-right: 1px solid; */
  border-inline-end: 1px solid;
}
```

## Technical Terms Policy

ALL technical networking terms remain in English regardless of locale:

- Protocol names: DHCP, DNS, NAT, PPPoE, L2TP, WireGuard, OpenVPN
- Network concepts: WAN, LAN, VLAN, Subnet, Gateway, Firewall, Bridge
- Hardware: Router, Switch, AP, Interface, Port, Ethernet
- Identifiers: IP Address, MAC Address, UUID, SSID
- Units: Mbps, KB, MB, ms, dBm

**Benefits:**
1. Zero mistranslation risk for safety-critical terms
2. Global searchability (users find help with English terms)
3. ~40% reduction in translation scope

## Tiered Translation Quality

```yaml
translation_tiers:
  tier1_critical:  # Human-first
    - security warnings
    - data loss confirmations
    - legal/compliance text
    review: mandatory_human

  tier2_technical:  # MT + mandatory review
    - feature descriptions
    - help text
    - error messages
    review: human_within_48h

  tier3_common:  # MT + auto-approve
    - button labels
    - menu items
    - common UI strings
    review: auto_approve_after_48h
```

## Local-First Font Loading

```css
@font-face {
  font-family: 'Inter';
  src: local('Inter'),
       url('/fonts/inter-var.woff2') format('woff2'),
       url('https://fonts.gstatic.com/...') format('woff2');
  font-display: swap;
}

/* Priority cascade:
   1. Local fonts (bundled with app) - instant
   2. CDN fonts (Google Fonts) - if local missing
   3. System fonts (OS defaults) - fallback
*/
```

## CI/CD Validation Matrix

| Check | Tool | Status |
|-------|------|--------|
| Missing Keys | i18next-parser | Blocking |
| ICU Syntax | @formatjs/cli | Blocking |
| Placeholder Match | Custom script | Blocking |
| Hardcoded Strings | eslint-plugin-i18next | Blocking |
| JSON Valid | Built-in | Blocking |
| Unused Keys | i18next-parser | Warning |
| Max Length | Custom script | Warning |
| Glossary Compliance | Weblate API | Warning |
| RTL Visual Regression | Chromatic | Warning |

---
