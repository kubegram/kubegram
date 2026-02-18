import { issuer } from '@openauthjs/openauth';
import type { IncomingMessage } from 'node:http';
import * as v from 'valibot';
import type { 
  ProviderConfig, 
  SuccessCallback, 
  ErrorCallback, 
  SelectCallback,
  Subjects 
} from './types.js';
import { createGithubProvider } from './providers/github.js';
import { createGoogleProvider } from './providers/google.js';
import { createMemoryStorage } from './storage/memory.js';

export interface AuthApp {
  handle(req: IncomingMessage | Request): Promise<Response>;
}

export interface AuthOptions {
  subjects?: Subjects;
  providers: {
    github?: ProviderConfig;
    google?: ProviderConfig;
    gitlab?: ProviderConfig;
    okta?: ProviderConfig;
    oidc?: ProviderConfig;
    [key: string]: ProviderConfig | undefined;
  };
  storage?: {
    get(key: string): Promise<string | null>;
    set(key: string, value: string, ttl?: number): Promise<void>;
    delete(key: string): Promise<void>;
  };
  success?: SuccessCallback;
  error?: ErrorCallback;
  select?: SelectCallback;
}

export function createAuthApp(options: AuthOptions): AuthApp {
  const providers: Record<string, any> = {};

  if (options.providers.github) {
    providers.github = createGithubProvider(options.providers.github);
  }

  if (options.providers.google) {
    providers.google = createGoogleProvider(options.providers.google);
  }

  if (options.providers.gitlab) {
    const { createGitlabProvider } = require('./providers/gitlab.js');
    providers.gitlab = createGitlabProvider(options.providers.gitlab);
  }

  if (options.providers.okta) {
    const { createOktaProvider } = require('./providers/okta.js');
    providers.okta = createOktaProvider(options.providers.okta);
  }

  if (options.providers.oidc) {
    const { createOidcProvider } = require('./providers/okta.js');
    providers.oidc = createOidcProvider(options.providers.oidc);
  }

  const storage = options.storage ?? createMemoryStorage();

  const subjects = options.subjects ?? {
    user: v.object({
      id: v.string(),
      provider: v.string(),
    }),
  };

  const app = issuer({
    subjects,
    providers,
    storage: storage as any,
    success: options.success as any,
    error: options.error as any,
    select: options.select as any,
  });

  return {
    handle: (app as any).handle.bind(app),
  };
}

export { issuer };
