---
sidebar_position: 14
title: Security Patterns
---

# Security Patterns in NasNetConnect

**Reference:** `libs/core/forms/src/` | `libs/api-client/` | Layered Security Architecture

NasNetConnect deliberately implements minimal security code in `libs/core` because security is
handled at specialized layers. This guide documents the security architecture, trust boundaries, and
safe patterns for core library usage.

## Table of Contents

- [Security Architecture Overview](#security-architecture-overview)
- [Input Validation as Trust Boundary](#input-validation-as-trust-boundary)
- [Error Message Safety](#error-message-safety)
- [Why No XSS Vulnerabilities](#why-no-xss-vulnerabilities)
- [Auth Token Handling](#auth-token-handling)
- [Security Review Checklist](#security-review-checklist)
- [Common Vulnerabilities](#common-vulnerabilities)

---

## Security Architecture Overview

NasNetConnect separates security concerns across three layers:

### Layer 1: Frontend Input Validation (libs/core)

**Responsibility:** Validate user input at system edge

```typescript
// @nasnet/core/forms - Zod schemas validate at input boundary
const ipConfigSchema = z.object({
  address: z.string().ip(),
  gateway: z.string().ip(),
  dnsServers: z.array(z.string().ip()),
});
```

**What it does:**

- Type validation (is it the right shape?)
- Format validation (valid IP address?)
- Range validation (within allowed values?)

**What it does NOT do:**

- Authorization (is this user allowed to change this?)
- Resource uniqueness (is this IP already in use?)
- Platform compatibility (does this router support this?)

### Layer 2: Backend Authorization (GraphQL directives)

**Responsibility:** Enforce who can do what

```graphql
directive @auth(roles: [String!]!) on FIELD_DEFINITION

type Mutation {
  createVPN(input: VPNInput!): VPN! @auth(roles: ["admin", "vpn-manager"])
}
```

Backend checks:

- Is user authenticated?
- Does user have required role?
- Can user access this resource (tenant isolation)?

### Layer 3: XSS Prevention (React DOM)

**Responsibility:** Prevent script injection in output

React DOM automatically escapes all string content by default:

```typescript
// This is SAFE - React escapes the value
const userInput = "<script>alert('xss')</script>";
return <div>{userInput}</div>;  // Displayed as text, not executed
```

---

## Input Validation as Trust Boundary

Input validation is the **only** layer that `libs/core` directly handles. It validates at the system
boundary where user data enters the application.

### Zod Schema Validation

All user-facing forms use Zod schemas:

```typescript
import { z } from 'zod';

// Define validation at form definition time
const routerConfigSchema = z.object({
  routerName: z
    .string()
    .min(1, 'Name is required')
    .max(63, 'Name too long')
    .regex(/^[a-zA-Z0-9-]+$/, 'Only alphanumeric and hyphens'),

  wanPort: z.enum(['ether1', 'ether2', 'sfp1']).describe('Which port handles WAN traffic'),

  upstreamDNS: z
    .array(z.string().ip())
    .min(1, 'At least one DNS server required')
    .max(3, 'Maximum 3 DNS servers'),
});

type RouterConfig = z.infer<typeof routerConfigSchema>;
```

### Network-Specific Validators

NasNetConnect provides domain-specific validators for common network fields:

```typescript
import { isValidIPAddress, isValidCIDR, isValidMAC } from '@nasnet/core/forms';

const schema = z.object({
  ipAddress: z.string().refine(isValidIPAddress, 'Invalid IP'),
  subnet: z.string().refine(isValidCIDR, 'Invalid CIDR notation'),
  macAddress: z.string().refine(isValidMAC, 'Invalid MAC address'),
});
```

**Built-in validators** (from `libs/core/forms/src/network-validators.ts`):

- IP address (IPv4/IPv6)
- CIDR notation (10.0.0.0/8)
- MAC address (00:11:22:33:44:55)
- Port number (1-65535)
- Domain name
- Hostname

### Never Trust Client-Side Validation Alone

```typescript
// Client validation prevents user errors
const schema = z.object({
  port: z.number().min(1).max(65535),
});

// BUT backend MUST also validate!
// Malicious user can send port=999999 by modifying request

// Backend (Go):
if port < 1 || port > 65535 {
  return errors.New("port out of range")
}
```

**Pattern:**

```
User Input
    ↓
Client Validation (libs/core) - Quick feedback
    ↓
Backend Validation (Go) - Final verification
```

---

## Error Message Safety

Errors must never reveal sensitive information. NasNetConnect uses several patterns to ensure error
safety:

### ValidationError Never Contains PII

```typescript
// Good - generic error message
{
  code: 'IP_CONFLICT',
  message: 'This IP address is already in use',
  fieldPath: 'address'
}

// Bad - reveals which router has the conflict
{
  code: 'IP_CONFLICT',
  message: '192.168.1.1 is already assigned to router-123 on WAN interface',
  // Reveals router ID and interface details!
}

// Bad - reveals username/ID of other user
{
  code: 'NAME_DUPLICATE',
  message: 'Service name "proxy" already used by admin@company.com',
  // Reveals other user's identity!
}
```

### mapBackendErrors Filters Sensitive Fields

```typescript
import { mapBackendErrors } from '@nasnet/core/forms';

// Backend might return detailed error with sensitive info
const backendError = {
  code: 'ROUTER_OFFLINE',
  message: 'Router at 192.168.100.50 is offline', // Reveals IP!
  details: {
    routerId: 'abc-123-xyz',
    lastSeen: '2024-02-26T14:30:00Z',
    adminEmail: 'admin@company.com', // Reveals admin email!
  },
};

// mapBackendErrors sanitizes before display
const safeError = mapBackendErrors(backendError);
// Result: Only generic message shown to user
```

### Error Messages Use i18n Keys

Errors should never be raw backend messages:

```typescript
// Good - i18n key, backend provides error code
{
  code: 'VLAN_CONFLICT',
  i18nKey: 'errors.vlan_conflict',  // Maps to i18n string
  // Message shown: "VLAN is already in use"
}

// Bad - raw backend message shown to user
{
  message: 'VLAN 100-110 range overlaps with existing allocation 105-115'
  // Might reveal internal resource details
}
```

### suggestedFix Provides Safe Remediation

```typescript
const error: ValidationError = {
  code: 'PORT_IN_USE',
  message: 'Port 22 is already in use',
  fieldPath: 'port',
  suggestedFix: 'Use port 2222 or higher for SSH access', // Safe suggestion
};
```

Good suggested fixes:

- ✓ "Try port 2222 instead"
- ✓ "Enable DHCP to auto-assign IP"
- ✓ "Remove the duplicate resource first"

Bad suggested fixes:

- ✗ "SSH service running on router-prod-001 is using port 22"
- ✗ "IP already assigned to admin account"
- ✗ "Contact user john@company.com to resolve this"

---

## Why No XSS Vulnerabilities

`libs/core` doesn't need XSS protection code because React DOM provides it by default.

### React DOM Auto-Escaping

React automatically escapes all text content:

```typescript
// User input (potentially malicious)
const userInput = "<img src=x onerror='alert(1)'>";

// This is SAFE - React escapes the input
<div>{userInput}</div>;
// Rendered as: &lt;img src=x onerror='alert(1)'&gt;
// No script execution

// Only dangerouslySetInnerHTML bypasses escaping
// libs/core NEVER uses dangerouslySetInnerHTML
```

### Template Literals with Parameterized Substitution

When building error messages with dynamic content:

```typescript
// Good - parameter substitution
const message = `Port ${port} is already in use`;
// Result: "Port 8080 is already in use"

// Bad - template literal without escaping
const message = `Port ${userInput} is already in use`;
// If userInput = "<script>", could be dangerous
// BUT React will escape it when rendered
```

### No eval() or Function() Constructor

`libs/core` never evaluates string code:

```typescript
// Never done in libs/core
eval(userInput); // ❌ Never
new Function(userInput); // ❌ Never
JSON.parse(userInput); // Safe for JSON
new Function(userInput)(); // ❌ Never
```

---

## Auth Token Handling

Authentication is completely handled in `libs/api-client`, NOT in `libs/core`. Core has no access to
auth state.

### JWT Token Management (libs/api-client)

Tokens are managed via Apollo Link in the auth layer:

```typescript
// @nasnet/api-client/core/auth-link.ts
import { setContext } from '@apollo/client/link/context';

const authLink = setContext((_, { headers }) => {
  // Get token from secure storage (NOT localStorage)
  const token = getAuthToken();

  return {
    headers: {
      ...headers,
      authorization: token ? `Bearer ${token}` : '',
    },
  };
});
```

**Why NOT in libs/core:**

- Core has no React dependency (auth link requires Apollo)
- Core has no knowledge of HTTP headers
- Core is just validation logic

### Token Refresh (libs/api-client)

When token expires, the auth link handles refresh:

```typescript
const onError = (error: GraphQLError) => {
  if (error.extensions?.code === 'UNAUTHENTICATED') {
    // Attempt refresh
    const newToken = await refreshToken(refreshToken);
    // Retry request with new token
  }
};
```

### Token Storage

Tokens should NEVER be stored in localStorage:

```typescript
// Bad - XSS can steal from localStorage
localStorage.setItem('auth_token', token);

// Good - Secure, HTTPOnly cookie set by backend
// Cookie is sent automatically by browser
// JavaScript cannot access it
Set-Cookie: auth_token=xyz; HttpOnly; Secure; SameSite=Strict
```

---

## Security Review Checklist

When adding new functionality to `libs/core`, verify:

### Input Validation

- [ ] All user inputs validated with Zod schema
- [ ] Schema defines allowed values (enum, range, length)
- [ ] Error messages don't reveal system details
- [ ] Backend also validates (defense in depth)

### Error Handling

- [ ] Error messages are generic and user-friendly
- [ ] No PII in error messages (names, IDs, IPs, emails)
- [ ] No technical details leaked (stack traces, file paths)
- [ ] suggestedFix provides safe remediation hints

### XSS Prevention

- [ ] No dangerouslySetInnerHTML usage
- [ ] No eval() or Function() constructor calls
- [ ] No direct DOM manipulation (innerHTML, insertAdjacentHTML)
- [ ] User input rendered as text, not HTML

### Dependencies

- [ ] No unsafe dependencies (evaluate dependencies for exploits)
- [ ] Pin dependency versions in package-lock.json
- [ ] Regular `npm audit` checks
- [ ] Remove unused dependencies

### Code Review

- [ ] Security-focused peer review
- [ ] Check for common OWASP vulnerabilities
- [ ] Verify error handling is safe
- [ ] Ensure no hardcoded secrets or credentials

---

## Common Vulnerabilities

### Injection Attacks

```typescript
// Bad - building validation dynamically
const regex = new RegExp(userInput); // Could be infinite regex
schema = z.string().regex(regex);

// Good - whitelist allowed patterns
const allowedPatterns = {
  ipv4: /^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/,
  hostname: /^[a-zA-Z0-9-]+$/,
};
const pattern = allowedPatterns[patternName];
schema = z.string().regex(pattern);
```

### Path Traversal

```typescript
// Backend concern, NOT libs/core
// But validate filename format client-side
const schema = z.object({
  filename: z
    .string()
    .regex(/^[a-zA-Z0-9._-]+$/)
    .refine((f) => !f.includes('..'), 'Invalid filename'),
});
```

### ReDoS (Regular Expression Denial of Service)

```typescript
// Bad - regex can cause exponential backtracking
const regex = /^(a+)+$/;

// Good - use simple, tested regex
const regex = /^[a-zA-Z0-9]+$/;
// Or use specific validators from @nasnet/core/forms
```

### CSRF (Cross-Site Request Forgery)

**Handled at backend layer:**

- CORS headers configured correctly
- SameSite cookie attribute set
- CSRF tokens validated (if needed)

Not a concern in `libs/core`.

---

## Code Examples

### Secure Form with Error Handling

```typescript
import { z } from 'zod';
import { useZodForm } from '@nasnet/core/forms';
import { mapBackendErrors } from '@nasnet/core/forms';

const secureSchema = z.object({
  serviceName: z.string()
    .min(1, 'Name is required')
    .max(63)
    .regex(/^[a-zA-Z0-9-]+$/, 'Only alphanumeric and hyphens allowed'),

  port: z.number()
    .min(1024, 'Ports below 1024 are reserved')
    .max(65535, 'Port must be 65535 or less'),

  apiKey: z.string()
    .min(32, 'API key too short'),  // Don't show full validation
});

export function ServiceForm() {
  const form = useZodForm({ schema: secureSchema });
  const [backendError, setBackendError] = useState<ValidationError | null>(null);

  const onSubmit = async (data: typeof secureSchema._output) => {
    try {
      // Frontend validation passed, now send to backend
      const result = await createService(data);
      // Success handling...
    } catch (error) {
      // Map backend error to safe format
      const safeError = mapBackendErrors(error);
      setBackendError(safeError);

      // Show user-friendly message
      form.setError('root', {
        message: safeError.message,  // Generic message
        type: 'manual',
      });
    }
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)}>
      {/* Form fields with validation */}
      {form.formState.errors.root && (
        <div role="alert" className="bg-red-50 text-red-700 p-4">
          {form.formState.errors.root.message}
        </div>
      )}
    </form>
  );
}
```

### Safe Error Display Component

```typescript
import { ValidationError } from '@nasnet/core/forms';

interface SafeErrorDisplayProps {
  error: ValidationError;
}

export function SafeErrorDisplay({ error }: SafeErrorDisplayProps) {
  // Never display the full error object
  // Only use safe fields: message, code, suggestedFix

  return (
    <div className="space-y-2">
      <p className="font-semibold text-red-700">
        {/* Error code provides context without revealing details */}
        Error: {error.code}
      </p>

      <p className="text-gray-700">
        {/* User-friendly message only */}
        {error.message}
      </p>

      {error.suggestedFix && (
        <p className="text-sm text-blue-600">
          {/* Safe suggestion */}
          Hint: {error.suggestedFix}
        </p>
      )}

      {/* Never display: */}
      {/* - error.fieldPath if it reveals structure */}
      {/* - error.resourceId if it reveals other users' resources */}
      {/* - error.details or error.metadata (might be debug info) */}
    </div>
  );
}
```

---

## Related Guides

- **Input Validation:** See `libs/core/docs/guides/validation-pipeline.md`
- **Error Handling:** See `libs/core/docs/guides/error-handling-patterns.md`
- **Backend Security:** See `Docs/architecture/security-architecture.md`
- **Authentication:** See `Docs/architecture/api-contracts.md`
