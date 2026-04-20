# UI Task: Integrate Email/Password Authentication (Full OpenAuth PKCE Flow)

## Why `GET /oauth/authorize` Returns "Missing redirect_uri"

`/oauth/authorize` is OpenAuth's OAuth 2.0 authorization endpoint. Like any OAuth 2.0 AS it
requires these query parameters before it will do anything:

- `response_type=code`
- `client_id=<app-id>`
- `redirect_uri=<where-to-redirect-after-auth>`
- `code_challenge=<pkce-verifier-hash>`
- `code_challenge_method=S256`

The current `initiateLogin` thunk sends the browser to `/oauth/authorize` (or
`/oauth/${provider}/authorize`) bare — no params — so OpenAuth immediately rejects the
request. This means the existing auth redirect never actually completed the full flow.

The fix is to use the **OpenAuth client SDK** (`@openauthjs/openauth/client`), which is
already in `package.json`, to generate the properly-signed URL and later exchange the
returned code for JWT tokens.

---

## New Flow (PKCE)

```
UI                          kubegram-server (/oauth/*)      Provider (GitHub / password)
─────────────────────────────────────────────────────────────────────────────────────────
client.authorize(callbackUrl) ──────────────────────────────>
  stores verifier in sessionStorage
  redirects browser to /oauth/authorize?client_id=...
                        &redirect_uri=<callbackUrl>
                        &code_challenge=...
                                         shows provider select page (select callback)
                                         user picks "password" or "github"
                                         ────────────────────────────────────────────>
                                         provider auth completes
                                         success() callback runs → ctx.subject()
                                         <────────────────────────────────────────────
                        redirects to <callbackUrl>?code=...
<callback route receives code>
client.exchange(code, callbackUrl, verifier)
  returns { access: JWT, refresh: JWT }
store JWT in memory / sessionStorage
every API request: Authorization: Bearer <JWT>
```

---

## What to Build

### 0. Create `src/lib/auth/client.ts`

```typescript
import { createClient } from '@openauthjs/openauth/client';

export const authClient = createClient({
  clientID: 'kubegram-ui',
  issuer: import.meta.env.VITE_API_URL
    ? `${import.meta.env.VITE_API_URL}/oauth`
    : 'http://localhost:8090/oauth',
});

export const CALLBACK_URL =
  `${window.location.origin}/oauth/callback`;
```

The `issuer` must match the base URL where OpenAuth is mounted — `/oauth/*` on the server
(after the `honoApp.use('/oauth/*', ...)` strip, the issuer sees itself at that root).

---

### 1. Replace `initiateLogin` in `src/store/slices/oauth/oauthThunks.ts`

```typescript
import { authClient, CALLBACK_URL } from '@/lib/auth/client';

export const initiateLogin = createAsyncThunk(
  'oauth/initiateLogin',
  async (provider: OAuthProvider | null, { rejectWithValue }) => {
    try {
      localStorage.setItem('oauth_redirect_path',
        window.location.pathname + window.location.search);

      const { url, verifier } = await authClient.authorize(
        CALLBACK_URL,
        'code',
        {
          pkce: true,
          // hint lets OpenAuth skip the select screen and go straight to a provider
          ...(provider ? { provider } : {}),
        }
      );

      // Persist the PKCE verifier across the redirect
      sessionStorage.setItem('pkce_verifier', verifier ?? '');
      window.location.href = url;
      return { initiated: true };
    } catch (error: unknown) {
      return rejectWithValue((error as Error).message);
    }
  }
);
```

The `provider` hint is an OpenAuth feature that tells the select step to skip straight to
the named provider, so clicking "GitHub" still goes directly to GitHub without showing the
server-side select UI. The password provider redirects to the server-rendered password form.

---

### 2. Add `src/pages/OAuthCallbackPage.tsx`

This route is hit after OpenAuth redirects back with `?code=...`.

```typescript
import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { authClient, CALLBACK_URL } from '@/lib/auth/client';
import { subjects } from '@/lib/auth/subjects';  // see step 3
import { setUser, setTokens } from '@/store/slices/oauth/oauthSlice';

export default function OAuthCallbackPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  useEffect(() => {
    async function exchange() {
      const params = new URLSearchParams(window.location.search);
      const code = params.get('code');
      const verifier = sessionStorage.getItem('pkce_verifier') ?? undefined;

      if (!code) {
        navigate('/');
        return;
      }

      try {
        const tokens = await authClient.exchange(code, CALLBACK_URL, verifier);
        if (tokens.err) throw new Error('Token exchange failed');

        // Verify the JWT and pull out the subject
        const verified = await authClient.verify(subjects, tokens.tokens.access);
        if (verified.err) throw new Error('Token verification failed');

        sessionStorage.removeItem('pkce_verifier');

        // Store tokens — use sessionStorage so they survive refresh but not tab close
        sessionStorage.setItem('access_token', tokens.tokens.access);
        if (tokens.tokens.refresh)
          sessionStorage.setItem('refresh_token', tokens.tokens.refresh);

        dispatch(setTokens({
          accessToken: tokens.tokens.access,
          refreshToken: tokens.tokens.refresh ?? null,
        }));

        // Fetch the user profile using the token
        dispatch(checkAuthStatus() as any);

        const redirectTo = localStorage.getItem('oauth_redirect_path') || '/';
        localStorage.removeItem('oauth_redirect_path');
        navigate(redirectTo);
      } catch (err) {
        console.error('OAuth callback failed', err);
        navigate('/');
      }
    }
    exchange();
  }, []);

  return <div>Completing sign in…</div>;
}
```

Register the route in `App.tsx`:

```tsx
<Route path="/oauth/callback" element={<OAuthCallbackPage />} />
```

---

### 3. Create `src/lib/auth/subjects.ts`

The client's `verify()` call needs the same subject schema the server uses:

```typescript
import { object, string } from 'valibot';
import { createSubjects } from '@openauthjs/openauth/subject';

export const subjects = createSubjects({
  user: object({
    id: string(),
    provider: string(),
  }),
});
```

---

### 4. Update `src/lib/api/axiosClient.ts`

Switch from cookie auth to Bearer token:

```typescript
// In the request interceptor, add:
const accessToken = sessionStorage.getItem('access_token');
if (accessToken) {
  config.headers['Authorization'] = `Bearer ${accessToken}`;
}
```

Keep `withCredentials: true` as a fallback for any cookie-based paths, but the primary
mechanism is now the Bearer token header.

**Token refresh**: when a 401 is received, attempt to refresh before triggering the login
modal:

```typescript
// In the 401 response interceptor:
const refreshToken = sessionStorage.getItem('refresh_token');
if (refreshToken && !originalRequest._retry) {
  originalRequest._retry = true;
  try {
    const newTokens = await authClient.refresh(refreshToken, { access: true });
    if (!newTokens.err) {
      sessionStorage.setItem('access_token', newTokens.tokens.access);
      originalRequest.headers['Authorization'] = `Bearer ${newTokens.tokens.access}`;
      return apiClient(originalRequest);
    }
  } catch { /* fall through to login modal */ }
}
window.dispatchEvent(new CustomEvent('triggerLoginModal', { detail: { reason: 'session_expired' } }));
```

---

### 5. Update `oauthSlice.ts`

Add token fields and the `setTokens` action:

```typescript
interface OAuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  // ...existing fields
}

// In reducers:
setTokens(state, action: PayloadAction<{ accessToken: string; refreshToken: string | null }>) {
  state.accessToken = action.payload.accessToken;
  state.refreshToken = action.payload.refreshToken;
},

logout(state) {
  state.user = null;
  state.accessToken = null;
  state.refreshToken = null;
  state.isAuthenticated = false;
  sessionStorage.removeItem('access_token');
  sessionStorage.removeItem('refresh_token');
},
```

---

### 6. Update `checkAuthStatus` thunk

Instead of calling `/auth/me` to check for a session cookie, verify the stored token:

```typescript
export const checkAuthStatus = createAsyncThunk(
  'oauth/checkAuthStatus',
  async (_, { rejectWithValue }) => {
    const accessToken = sessionStorage.getItem('access_token');
    if (!accessToken) return { isAuthenticated: false, user: null };

    try {
      const verified = await authClient.verify(subjects, accessToken);
      if (verified.err) return { isAuthenticated: false, user: null };

      // Token is valid — fetch full user profile from our API
      const response = await fetch(`${API_URL}/api/public/v1/auth/me`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (!response.ok) return { isAuthenticated: false, user: null };
      const data = await response.json();
      return { isAuthenticated: true, user: data as User };
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  }
);
```

---

### 7. LoginModal — show password option

Fetch providers dynamically (already dispatched via `fetchAvailableProviders` in App.tsx):

```typescript
const availableProviders = useSelector(selectAvailableProviders);
const hasPasswordProvider = availableProviders.some(p => p.id === 'password');

// Password section:
{hasPasswordProvider && (
  <>
    <div className="divider">or</div>
    <button onClick={() => dispatch(initiateLogin('password') as any)}>
      Continue with Email & Password
    </button>
    <button onClick={() => {
      const p = availableProviders.find(p => p.id === 'password');
      if (p?.registerUrl) window.location.href = p.registerUrl;
    }}>
      Create an account
    </button>
  </>
)}
```

The `initiateLogin('password')` call now goes through the full PKCE flow and hints
OpenAuth to select the password provider directly.

---

## Types to Add (`src/store/slices/oauth/types.ts`)

```typescript
export type OAuthProvider =
  | 'github' | 'google' | 'gmail' | 'slack'
  | 'gitlab' | 'okta' | 'oidc' | 'sso' | 'password';

export interface AuthProvider {
  id: OAuthProvider;
  name: string;
  authUrl: string;
  registerUrl?: string;
}
```

---

## What Does NOT Change

- Server-side `requireAuth` middleware — already validates Bearer tokens via
  `sessionManager.verifyToken()`, so no server changes needed
- `ProtectedRoute` component — works the same
- Logout — still calls `POST /api/public/v1/auth/logout`, just also clears sessionStorage tokens
- `fetchAvailableProviders` thunk — already correct

---

## Verification

1. `bun run dev` in `kubegram-server` (IS_SELF_SERVE=true is already set in .env.development)
2. Click login in the UI → browser redirects to `/oauth/authorize?...` (with all params this time)
3. OpenAuth shows provider select or password form
4. After auth → redirected to `/oauth/callback?code=...`
5. Callback page exchanges code → gets JWT → stores in sessionStorage
6. `checkAuthStatus` verifies JWT → user is authenticated
7. Every API request includes `Authorization: Bearer <JWT>`
8. Refresh the page → token read from sessionStorage, auth persists
9. With IS_SELF_SERVE=false → password option absent from modal
