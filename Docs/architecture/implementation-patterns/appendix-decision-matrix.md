# Appendix: Decision Matrix

## Technology Choices

| Category | Choice | Rationale |
|----------|--------|-----------|
| Schema | Zod | Type inference, runtime validation, Go generation |
| State | TanStack Query | Server state caching, optimistic updates |
| GraphQL | Code-first with directives | Platform mapping, capability gating |
| Protocol | Multi-protocol with fallback | Universal compatibility |
| Testing | Vitest + Playwright | Fast unit tests, reliable E2E |
| Styling | Tailwind CSS | Utility-first, consistent design |

## Platform Feature Matrix

| Feature | MikroTik | OpenWRT | VyOS |
|---------|----------|---------|------|
| REST API | 7.1+ | LuCI2 | - |
| API-SSL | 6.0+ | - | - |
| SSH | All | All | All |
| VLAN | 6.0+ | 19.07+ | 1.3+ |
| WireGuard | 7.0+ | Package | 1.3+ |
| BGP | Package | Package | 1.3+ |
| Container | 7.4+ | - | - |

---
