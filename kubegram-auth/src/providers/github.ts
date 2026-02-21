import { GithubProvider } from '@openauthjs/openauth/provider/github';
import type { ProviderConfig } from '../types';

export interface GithubProviderOptions extends ProviderConfig {
  scopes?: string[];
}

export function createGithubProvider(options: GithubProviderOptions) {
  return GithubProvider({
    clientID: options.clientID,
    clientSecret: options.clientSecret,
    scopes: options.scopes ?? ['user:email', 'read:user'],
  });
}

export { GithubProvider };
