# UI OAuth Integration Guide

## 1. Initiating Authentication

### Option A: Provider Selection Page (Multiple Providers)

```
Redirect to: GET /oauth/authorize
```

- Shows the `ProviderSelect` dropdown with GitHub, Google, etc.
- User selects provider → UI redirects to `/oauth/{provider}/authorize`

### Option B: Direct Provider Login (Single Provider or Explicit Choice)

```
Redirect to: GET /oauth/github/authorize
Redirect to: GET /oauth/google/authorize
```

### Authentication Flow

1. User clicks "Sign in with GitHub" button
2. UI redirects browser to `/oauth/github/authorize`
3. Server redirects to GitHub's OAuth page
4. User authorizes on GitHub
5. GitHub redirects to `/{provider}/callback` (e.g., `/github/callback`)
6. Server exchanges code for tokens, creates user/session
7. Server sets `session` HTTP-only cookie
8. Server redirects to `APP_URL` (frontend)

## 2. Checking Authentication Status

```javascript
// Check if user is logged in
const response = await fetch('/api/public/v1/auth/me', {
  credentials: 'include'  // Required for cookies
});

if (response.ok) {
  const { user, sessionId } = await response.json();
  // user = { id, email, name, avatar, role, teamId }
  // Store in app state (not localStorage - use memory/state management)
} else {
  // User not authenticated
}
```

## 3. Handling Post-Login State

After OAuth redirect, the UI should:

1. Call `/api/public/v1/auth/me` to get fresh user data
2. Update app state with user info
3. Redirect to intended destination (dashboard, etc.)

**Important:** The session cookie is `HttpOnly` - JavaScript cannot read it directly. Always use the `/auth/me` endpoint.

## 4. Logout

```javascript
await fetch('/api/public/v1/auth/logout', {
  method: 'POST',
  credentials: 'include'
});
// Clear user state from app memory
```

## 5. Error Handling

OAuth errors are returned as query parameters:

```
/?error=oauth_failed&error_description=...
```

Handle these on app initialization to show error messages.

## 6. Environment Setup

Ensure the server has valid OAuth credentials configured in `.env.development` or environment:

```env
GITHUB_CLIENT_ID=actual_client_id
GITHUB_CLIENT_SECRET=actual_secret
```

Placeholder values like `your_github_client_id` will load the provider but OAuth will fail at the provider (GitHub/Google will reject invalid credentials).

## 7. Key Points

- **Always use `credentials: 'include'`** on API calls to send the session cookie
- **Never store tokens in localStorage** - the server uses HTTP-only cookies
- **ProviderSelect is only shown when multiple providers are configured** - with one provider, `/oauth/authorize` redirects immediately
- **Session cookies expire** - check `/auth/me` on app load and redirect to login if 401
