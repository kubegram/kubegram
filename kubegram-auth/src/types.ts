export interface UserSubject {
  id: string;
  provider: string;
}

export interface AuthenticatedUser {
  id: string;
  email?: string;
  name?: string;
  avatar?: string;
  provider: string;
  providerId?: string;
}

export interface ProviderConfig {
  clientID: string;
  clientSecret: string;
  scopes?: string[];
  redirectURI?: string;
}

export interface GitLabProviderConfig extends ProviderConfig {
  issuer?: string;
}

export interface OktaProviderConfig extends ProviderConfig {
  issuer: string;
}

export interface OidcProviderConfig extends ProviderConfig {
  issuer: string;
}

export interface AuthConfig {
  issuers?: Record<string, string>;
  providers: Record<string, ProviderConfig>;
  storage: AuthStorage;
  subjects: Subjects;
  success?: SuccessCallback;
  error?: ErrorCallback;
  select?: SelectCallback;
}

export interface AuthStorage {
  get: (key: string) => Promise<string | null>;
  set: (key: string, value: string, ttl?: number) => Promise<void>;
  delete: (key: string) => Promise<void>;
}

export type SuccessCallback = (
  ctx: AuthContext,
  value: SuccessValue
) => Promise<Response>;

export type ErrorCallback = (ctx: AuthContext, error: Error) => Promise<Response>;

export type SelectCallback = (
  options: SelectOptions,
  req: Request
) => Promise<Response>;

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

export interface AuthContext {
  subject: (type: string, value: Record<string, unknown>) => Promise<Response>;
  redirect: (url: string) => Response;
}

export interface SelectOptions {
  providers: { id: string; name: string }[];
}

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

export interface Request {
  url: string;
  method: string;
  headers: Headers;
  body?: unknown;
  json(): Promise<unknown>;
  parseBody(): Promise<unknown>;
}

export interface Headers {
  get(name: string): string | null;
  has(name: string): boolean;
}

export interface Subjects {
  [key: string]: any;
}

export interface SessionManagerOptions {
  issuer: string;
  clientID?: string;
  subjects: Subjects;
  storage?: SessionStorage;
  cacheOptions?: {
    max?: number;
    ttl?: number;
  };
}

export interface SessionStorage {
  get(key: string): Promise<string | null>;
  set(key: string, value: string, ttl?: number): Promise<void>;
  delete(key: string): Promise<void>;
}

export interface UserLookup {
  (id: string): Promise<AuthenticatedUser | null>;
  (email: string): Promise<AuthenticatedUser | null>;
}

export interface AuthContextResult {
  user: AuthenticatedUser;
  sessionId: string;
}
