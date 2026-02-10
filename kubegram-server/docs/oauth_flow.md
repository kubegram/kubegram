# OAuth Authentication Flow

This document details the OAuth 2.0 authentication flow implementation for Kubegram Server V2.

## Code Architecture

The authentication logic is split between the route handler and the OAuth service layer.

### Key Files & Functions

- **Route Handler**: [`src/routes/api/v1/auth.ts`](../src/routes/api/v1/auth.ts)
  - `handleAuthRoutes(request, url)`: The main entry point that dispatches requests based on the action (`login`, `callback`).

- **OAuth Service**: [`src/services/oauth.ts`](../src/services/oauth.ts)
  - `getAuthorizationUrl(provider)`: Constructs the correct OAuth consent URL for the given provider.
  - `exchangeCodeForToken(provider, code)`: Exchanges the temporary authorization code for an access token.
  - `getUserProfile(provider, accessToken)`: Fetches the user's profile information (email, name, id) using the access token.

## Supported Providers

- **github**
- **google**
- **gitlab**
- **okta**
- **sso** (Generic/Custom)

## Endpoints

Base URL: `/api/public/v1/auth`

### 1. Initiate Login

**GET** `/{provider}/login`

Redirects the user to the 3rd party identity provider's consent page.

- **Request**: `GET /api/public/v1/auth/github/login`
- **Flow**:
  1. `handleAuthRoutes` receives the request.
  2. Calls `getAuthorizationUrl('github')`.
  3. Returns `302 Redirect` to the provider's auth URL.

### 2. Callback Handling

**GET** `/{provider}/callback`

The provider redirects the user back to this endpoint with a temporary `code`.

- **Parameters**: `code` (query parameter)
- **Flow**:
  1. `handleAuthRoutes` extracts `code` from query params.
  2. Calls `exchangeCodeForToken` to get the `access_token`.
  3. Calls `getUserProfile` to get user details.
  4. **User Resolution**:
     - Queries `users` table (via `src/db/schema.ts`) to match email.
     - Creates new user if not found.
  5. Returns JSON response with user session info.

**Response Example (Success):**

```json
{
  "user": {
    "id": "...",
    "name": "Jane Doe",
    "email": "jane@example.com",
    "role": "team_member",
    "provider": "github",
    "providerId": "123456"
  },
  "provider_token": "gho_..."
}
```

## Configuration

The service relies on environment variables for provider credentials:

- `GITHUB_CLIENT_ID` / `GITHUB_CLIENT_SECRET`
- `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET`
- `GITLAB_CLIENT_ID` / `GITLAB_CLIENT_SECRET`
- `OKTA_CLIENT_ID` / `OKTA_CLIENT_SECRET` / `OKTA_DOMAIN`
- `SSO_CLIENT_ID` / `SSO_CLIENT_SECRET` / `SSO_AUTH_URL`...

## Database Schema

Users are stored in the `users` table (defined in `src/db/schema.ts`):

- `email` (Unique)
- `provider`: The auth provider used for creation.
- `providerId`: The unique ID from the provider.
