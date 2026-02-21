import { SlackProvider } from '@openauthjs/openauth/provider/slack';
import type { GitLabProviderConfig } from '../types';

export function createGitlabProvider(options: GitLabProviderConfig) {
  return SlackProvider({
    clientID: options.clientID,
    clientSecret: options.clientSecret,
    team: options.issuer ?? '',
    scopes: options.scopes as any ?? ['read_user', 'email'],
  });
}

export { SlackProvider as GitLabProvider };
