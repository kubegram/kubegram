# OpenAuth Frontend Integration

This document outlines how to integrate a frontend application with the OpenAuth server deployed in this project.

## 1. Installation

Install the OpenAuth client library in your frontend project:

```bash
npm install @openauthjs/openauth
```

## 2. Client Configuration

Initialize the client with your server's issuer URL. Since the OpenAuth server is mounted at `/oauth` in `src/index.ts`, your issuer URL will be your server's base URL + `/oauth`.

```typescript
import { createClient } from "@openauthjs/openauth/client";

const client = createClient({
  clientID: "kubegram-web", // Match this with a client ID in your database if you enforce it, or use a default
  issuer: "http://localhost:8090/oauth", // Adjust port/domain as needed
});
```

## 3. Login Flow

To initiate the login flow, redirect the user to the authorization URL.

```typescript
// Example: Triggering login for GitHub
async function loginWithGithub() {
  const callbackUrl = window.location.origin + "/callback"; // Where the user returns after login
  
  // 'github' must match a provider configured in your 'oauth_providers' database table
  const result = await client.authorize("github", callbackUrl, "code");
  
  if (result.url) {
    window.location.href = result.url;
  }
}
```

## 4. Handling Callback

On your callback page (e.g., `/callback`), exchange the authorization code for tokens.

```typescript
// In your callback route handler
import { useSearchParams } from 'your-router-hook'; // pseudo-code

const code = searchParams.get("code");
const state = searchParams.get("state");

if (code && state) {
  const tokens = await client.exchange("github", window.location.origin + "/callback", code, state);
  
  // tokens.access contains the access token
  // tokens.refresh contains the refresh token (if configured)
  
  console.log("Logged in!", tokens);
  
  // Save tokens to storage/cookie and redirect to dashboard
}
```

## 5. Making Authenticated Requests

Use the access token to authenticate requests to your API.

```typescript
const response = await fetch("http://localhost:8090/api/protected-route", {
  headers: {
    Authorization: `Bearer ${tokens.access}`,
  },
});
```

## Server-Side Reference

- **Mount Point**: `src/index.ts` mounts the auth app at `/oauth`.
- **Configuration**: `src/auth/openauth.ts` defines the issuer and loads providers.
- **Providers**: Providers are **dynamically loaded** from the `oauth_providers` table in the database. Ensure you have seeded this table with your OAuth credentials (GitHub, Google, etc.).
- **Subjects**: The system currently returns a `user` subject. You can customize the `success` handler in `src/auth/openauth.ts` to look up or create real users in your `users` table.
