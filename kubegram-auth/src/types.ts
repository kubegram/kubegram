/**
 * Basic user subject structure from OAuth token.
 * Contains minimal user identification from the token.
 */
export interface UserSubject {
  id: string;
  provider: string;
}

/**
 * Extended authenticated user with profile information.
 * Can be enriched via callbacks to include database fields.
 */
export interface AuthenticatedUser {
  id: string;
  email?: string;
  name?: string;
  avatar?: string;
  provider: string;
  providerId?: string;
  role?: string;
  teamId?: string;
}

/**
 * Base configuration for OAuth providers.
 */
export interface ProviderConfig {
  clientID: string;
  clientSecret: string;
  scopes?: string[];
  redirectURI?: string;
}

/**
 * GitLab provider configuration.
 * Extends base provider with optional self-hosted issuer.
 */
export interface GitLabProviderConfig extends ProviderConfig {
  issuer?: string;
}

/**
 * Okta provider configuration.
 * Requires issuer URL for Okta authorization server.
 */
export interface OktaProviderConfig extends ProviderConfig {
  issuer: string;
}

/**
 * Generic OIDC provider configuration.
 * Requires issuer URL for OIDC authorization server.
 */
export interface OidcProviderConfig extends ProviderConfig {
  issuer: string;
}

/**
 * Full authentication configuration for createAuthApp.
 * @deprecated Use CreateAuthOptions instead
 */
export interface AuthConfig {
  issuers?: Record<string, string>;
  providers: Record<string, ProviderConfig>;
  storage: AuthStorage;
  subjects: Subjects;
  success?: SuccessCallback;
  error?: ErrorCallback;
  select?: SelectCallback;
}

/**
 * Storage adapter interface for OAuth state/code exchange.
 * Used by OpenAuth.js for temporary storage during auth flow.
 */
export interface AuthStorage {
  get: (key: string) => Promise<string | null>;
  set: (key: string, value: string, ttl?: number) => Promise<void>;
  delete: (key: string) => Promise<void>;
}

/**
 * Callback invoked after successful OAuth authentication.
 * Use this to create/update users in your database.
 * 
 * @param ctx - Auth context with subject() and redirect() methods
 * @param value - OAuth response with provider, tokenset, and profile
 * @returns Response (usually redirect to protected page)
 */
export type SuccessCallback = (
  ctx: AuthContext,
  value: SuccessValue
) => Promise<Response>;

/**
 * Callback invoked on OAuth errors.
 * 
 * @param ctx - Auth context
 * @param error - Error that occurred
 * @returns Response (usually redirect to error page)
 */
export type ErrorCallback = (ctx: AuthContext, error: Error) => Promise<Response>;

/**
 * Callback for custom provider selection UI.
 * 
 * @param options - Available providers
 * @param req - Original request
 * @returns HTML response with provider selection
 */
export type SelectCallback = (
  options: SelectOptions,
  req: Request
) => Promise<Response>;

/**
 * OAuth success response containing provider info and tokens.
 */
export interface SuccessValue {
  provider: string;
  tokenset: {
    access: string;
    refresh?: string;
    id?: string;
  };
  profile?: {
    email?: string;
    name?: string;
    picture?: string;
  };
}

/**
 * Auth context passed to success/error callbacks.
 * Provides methods to create JWT subject and redirect.
 */
export interface AuthContext {
  subject: (type: string, value: Record<string, unknown>) => Promise<Response>;
  redirect: (url: string) => Response;
}

/**
 * Options for custom provider selection callback.
 */
export interface SelectOptions {
  providers: { id: string; name: string }[];
}

/**
 * Options for creating an auth app with createAuthApp.
 */
export interface CreateAuthOptions {
  subjects?: Subjects;
  providers: {
    github?: ProviderConfig;
    google?: ProviderConfig;
    gitlab?: GitLabProviderConfig;
    okta?: OktaProviderConfig;
    oidc?: OidcProviderConfig;
    [key: string]: ProviderConfig | undefined;
  };
  storage?: AuthStorage;
  success?: SuccessCallback;
  error?: ErrorCallback;
  select?: SelectCallback;
}

/**
 * Minimal Request interface for callbacks.
 */
export interface Request {
  url: string;
  method: string;
  headers: Headers;
  body?: unknown;
  json(): Promise<unknown>;
  parseBody(): Promise<unknown>;
}

/**
 * Minimal Headers interface for callbacks.
 */
export interface Headers {
  get(name: string): string | null;
  has(name: string): boolean;
}

/**
 * Subject type definitions (Valibot schemas).
 */
export interface Subjects {
  [key: string]: any;
}

/**
 * Configuration options for SessionManager.
 * 
 * @see session.ts for full documentation
 */
export interface SessionManagerOptions {
  issuer: string;
  clientID?: string;
  subjects: Subjects;
  storage?: SessionStorage;
  redis?: any;
  cacheOptions?: {
    max?: number;
    ttl?: number;
  };
  callbacks?: SessionManagerCallbacks;
}

/**
 * Callback hooks for SessionManager.
 * Use these to integrate with your database and add custom behavior.
 * 
 * @example
 * ```typescript
 * const sm = createSessionManager({
 *   issuer: 'https://auth.example.com',
 *   subjects: { user: v.object({ id: v.string(), provider: v.string() }) },
 *   callbacks: {
 *     onVerifyToken: async (user) => {
 *       // Enrich from database
 *       const dbUser = await db.findUser(user.id);
 *       return { ...user, email: dbUser.email, role: dbUser.role };
 *     }
 *   }
 * });
 * ```
 */
export interface SessionManagerCallbacks {
  /**
   * Called after successful JWT token verification.
   * Use to enrich basic user info with database fields.
   * Return null to reject the token (e.g., user disabled).
   */
  onVerifyToken?: (user: AuthenticatedUser) => Promise<AuthenticatedUser | null>;
  
  /**
   * Called after successful session validation.
   * Use to enrich session user with database fields.
   * Return null to reject the session (e.g., user deleted).
   */
  onValidateSession?: (user: AuthenticatedUser) => Promise<AuthenticatedUser | null>;
  
  /**
   * Called when a new session is created via storeSession().
   * Use for audit logging or external session tracking.
   */
  onSessionCreate?: (sessionId: string, subject: string, provider: string) => Promise<void>;
  
  /**
   * Called when a session is deleted via deleteSession().
   * Use for audit logging or external session cleanup.
   */
  onSessionDelete?: (sessionId: string) => Promise<void>;
}

/**
 * Storage adapter for SessionManager (L2 cache).
 * @deprecated Use SessionCacheStorage instead
 */
export interface SessionStorage {
  get(key: string): Promise<string | null>;
  set(key: string, value: string, ttl?: number): Promise<void>;
  delete(key: string): Promise<void>;
}

/**
 * Function to look up users by ID or email.
 * Used for user enrichment.
 * @deprecated Use callbacks instead
 */
export interface UserLookup {
  (id: string): Promise<AuthenticatedUser | null>;
  (email: string): Promise<AuthenticatedUser | null>;
}

/**
 * Result of successful authentication.
 */
export interface AuthContextResult {
  user: AuthenticatedUser;
  sessionId: string;
}
