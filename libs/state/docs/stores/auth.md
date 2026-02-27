# Authentication Store (useAuthStore)

Deep-dive into JWT token management, user session state, and authentication lifecycle.

**Source:** `libs/state/stores/src/auth/auth.store.ts`

## State Shape

```typescript
interface AuthState {
  // Token State
  token: string | null;              // JWT access token
  tokenExpiry: Date | null;           // Expiration timestamp
  refreshToken: string | null;        // Refresh token for new access tokens

  // User State
  user: User | null;                  // Current user profile
  isAuthenticated: boolean;           // Whether user is logged in

  // Session State
  isRefreshing: boolean;              // Token refresh in progress
  refreshAttempts: number;            // Number of refresh attempts (max 3)
  lastActivity: Date | null;          // Last user activity timestamp
}
```

### User Profile

```typescript
interface User {
  id: string;                         // Unique identifier
  username: string;                   // Display name
  email: string | null;               // Email address (optional)
  permissions: string[];              // Permission array
}
```

## Actions API

### Authentication Actions

**`setAuth(token, user, expiresAt, refreshToken?)`** - Set authentication state after login
```typescript
const { setAuth } = useAuthStore();

setAuth(
  'eyJhbGc...',                       // JWT token
  {
    id: 'user-123',
    username: 'admin',
    email: 'admin@router.local',
    permissions: ['admin', 'read', 'write']
  },
  new Date(Date.now() + 3600000),    // Expires in 1 hour
  'refresh-token-xyz'                 // Optional refresh token
);
```

**`clearAuth()`** - Clear all authentication state (logout)
```typescript
const { clearAuth } = useAuthStore();
clearAuth();
```

### Token Refresh State

**`setRefreshing(isRefreshing)`** - Set refreshing state during token renewal
```typescript
const { setRefreshing } = useAuthStore();
setRefreshing(true);  // Start refresh
setRefreshing(false); // Refresh complete
```

**`incrementRefreshAttempts()`** - Increment refresh attempt counter
```typescript
const { incrementRefreshAttempts } = useAuthStore();
incrementRefreshAttempts(); // Calls on each failed refresh
```

**`resetRefreshAttempts()`** - Reset attempt counter on successful refresh
```typescript
const { resetRefreshAttempts } = useAuthStore();
resetRefreshAttempts(); // Call on refresh success
```

### Activity Tracking

**`updateLastActivity()`** - Update last activity timestamp
```typescript
const { updateLastActivity } = useAuthStore();
updateLastActivity(); // Called on user interaction
```

### Token State Queries

**`isTokenExpiringSoon(): boolean`** - Check if token expires within 5 minutes
```typescript
const { isTokenExpiringSoon } = useAuthStore();

if (isTokenExpiringSoon()) {
  // Refresh token proactively
}
```

**`getTimeUntilExpiry(): number | null`** - Get milliseconds until token expiry
```typescript
const { getTimeUntilExpiry } = useAuthStore();

const msUntilExpiry = getTimeUntilExpiry();
if (msUntilExpiry && msUntilExpiry < 300000) {
  // Less than 5 minutes remaining
}
```

**`shouldAttemptRefresh(): boolean`** - Check if refresh should be attempted
```typescript
const { shouldAttemptRefresh } = useAuthStore();

// Considers:
// - Has valid refresh token
// - Not already refreshing
// - Haven't exceeded max attempts (3)
if (shouldAttemptRefresh()) {
  const newToken = await refreshTokenAPI();
  setAuth(newToken.token, user, newToken.expiresAt);
}
```

## Selectors

Optimized selectors for minimal re-renders:

| Selector | Returns | Usage |
|----------|---------|-------|
| `selectIsAuthenticated` | `boolean` | Check if user is logged in |
| `selectUser` | `User \| null` | Get current user profile |
| `selectToken` | `string \| null` | Get access token |
| `selectIsRefreshing` | `boolean` | Check if refresh in progress |
| `selectRefreshAttempts` | `number` | Get current refresh attempt count |
| `selectMaxRefreshExceeded` | `boolean` | Check if max attempts (3) exceeded |
| `selectPermissions` | `string[]` | Get user permissions array |
| `selectHasPermission(perm)` | `boolean` | Check if user has permission |

**Example:**

```typescript
import { shallow } from 'zustand/shallow';

// ✅ Good: Only re-renders on user change
const user = useAuthStore(state => state.user);

// ✅ Good: Multiple fields with shallow comparison
const { user, token } = useAuthStore(
  state => ({ user: state.user, token: state.token }),
  shallow
);

// ❌ Bad: Re-renders on any auth store change
const { user, token, isRefreshing } = useAuthStore();
```

## Helper Functions

### Out-of-React Usage

For access outside React components:

**`getAuthState(): AuthState & AuthActions`** - Get current store state
```typescript
const { token, isAuthenticated } = getAuthState();
```

**`subscribeAuthState(listener)`** - Subscribe to store changes
```typescript
const unsubscribe = subscribeAuthState((state) => {
  console.log('Auth changed:', state.isAuthenticated);
});
// Later: unsubscribe();
```

**`isAuthenticated(): boolean`** - Check if currently authenticated (faster)
```typescript
// Used in route guards and Apollo auth links
if (isAuthenticated()) {
  // Allow request
}
```

**`getAuthToken(): string | null`** - Get current valid token
```typescript
// Used in Apollo auth link to get token for requests
const token = getAuthToken();
if (token) {
  headers.authorization = `Bearer ${token}`;
}
```

## Token Refresh Flow

The complete refresh flow with `useTokenRefresh` hook:

```
1. Hook checks token expiry every 60 seconds
         ↓
2. If expiring within 5 minutes AND shouldAttemptRefresh() → start refresh
         ↓
3. Set isRefreshing(true), increment refreshAttempts
         ↓
4. Call refreshTokenFn() (GraphQL mutation)
         ↓
5a. SUCCESS:                           5b. FAILURE:
    ├─ setAuth() with new token       ├─ incrementRefreshAttempts()
    ├─ resetRefreshAttempts()         ├─ Check if attempts >= 3
    ├─ setRefreshing(false)           ├─ If yes: show notification
    └─ Token valid for next hour      └─ If yes: call onReauthRequired()
```

### Integration with Apollo Client

The auth store integrates with Apollo Client via auth link:

```typescript
// In Apollo setup
const authLink = setContext((_, { headers }) => {
  // Apollo reads token from store
  const token = getAuthToken();

  return {
    headers: {
      ...headers,
      authorization: token ? `Bearer ${token}` : '',
    },
  };
});
```

## Custom Persistence Storage

The store uses a custom storage handler to properly serialize/deserialize Date objects:

```typescript
const authStorage: StateStorage = {
  getItem: (name: string): string | null => {
    const str = localStorage.getItem(name);
    if (!str) return null;

    const parsed = JSON.parse(str);

    // Rehydrate Date objects from ISO strings
    if (parsed.state?.tokenExpiry) {
      parsed.state.tokenExpiry = new Date(parsed.state.tokenExpiry);
    }
    if (parsed.state?.lastActivity) {
      parsed.state.lastActivity = new Date(parsed.state.lastActivity);
    }

    return JSON.stringify(parsed);
  },

  setItem: (name: string, value: string): void => {
    localStorage.setItem(name, value);
  },

  removeItem: (name: string): void => {
    localStorage.removeItem(name);
  },
};
```

**Why custom handler?** Default JSON serialization converts Date to ISO strings, which breaks expiry comparison logic. Custom handler rehydrates Date objects on load.

### Partialize Configuration

Only essential auth state persists across sessions:

```typescript
partialize: (state) => ({
  token: state.token,
  tokenExpiry: state.tokenExpiry,
  refreshToken: state.refreshToken,
  user: state.user,
  isAuthenticated: state.isAuthenticated,
}),
```

**NOT persisted (reset on reload):**
- `isRefreshing` - Session state
- `refreshAttempts` - Session state
- `lastActivity` - Ephemeral

## Login/Logout Flow

### Login Flow

```typescript
async function login(username: string, password: string) {
  try {
    const response = await api.post('/auth/login', {
      username,
      password,
    });

    const { setAuth } = useAuthStore.getState();
    setAuth(
      response.data.token,
      response.data.user,
      new Date(response.data.expiresAt),
      response.data.refreshToken
    );

    // Token refresh hook starts monitoring automatically
    navigate('/dashboard');
  } catch (error) {
    showError('Login failed', error.message);
  }
}
```

### Logout Flow

```typescript
function logout() {
  const { clearAuth } = useAuthStore.getState();
  clearAuth();

  // Clear Apollo cache
  apolloClient.clearStore();

  // Redirect to login
  navigate('/login');
}
```

## Security Considerations

### Token Expiry

- **Access token**: Typically 1 hour (customizable)
- **Refresh threshold**: 5 minutes before expiry
- **Max refresh attempts**: 3 (protects against refresh token issues)
- **After max attempts**: User must re-authenticate

### Token Storage

- **Storage method**: localStorage (via custom handler)
- **Serialization**: Proper Date object handling
- **Sensitive fields**: Token NOT included in Redux DevTools

### Refresh Token Security

- **Refresh token**: Stored in auth state, persisted
- **Single use**: Typically consumed after use
- **Rotation**: New refresh token returned on refresh
- **Validation**: Backend validates refresh token for each request

### Activity Tracking

- **lastActivity**: Tracked but not currently used for session timeout
- **Future enhancement**: Can implement idle timeout policy

## Token Constants

```typescript
// Token expiry warning threshold (5 minutes)
const TOKEN_EXPIRY_THRESHOLD_MS = 5 * 60 * 1000;

// Maximum refresh attempts before re-auth required
const MAX_REFRESH_ATTEMPTS = 3;
```

## DevTools Integration

In development mode, Redux DevTools shows all auth actions:

```
Actions:
- setAuth
- clearAuth
- setRefreshing
- incrementRefreshAttempts
- resetRefreshAttempts
- updateLastActivity

Time-travel debugging: Step through auth state changes
```

## Performance Tips

1. **Always use selectors**, never subscribe to whole store:
   ```typescript
   // ✅ Good
   const isAuth = useAuthStore(s => s.isAuthenticated);

   // ❌ Bad
   const { isAuthenticated } = useAuthStore();
   ```

2. **Use out-of-React access** in non-component code:
   ```typescript
   // In route guards, Apollo links, utilities
   if (isAuthenticated()) {
     // ...
   }
   ```

3. **Batch token updates** during refresh:
   ```typescript
   // Call setAuth once (not multiple separate actions)
   setAuth(token, user, expiresAt, refreshToken);
   // NOT: setToken(), setUser(), setExpiry() separately
   ```

See `libs/state/stores/src/hooks/useTokenRefresh.ts` for the auto-refresh implementation.
