import { GoogleProvider } from '@openauthjs/openauth/provider/google';
import type { ProviderConfig } from '../types';

export interface GoogleProviderOptions extends ProviderConfig {
  scopes?: string[];
}

export function createGoogleProvider(options: GoogleProviderOptions) {
  return GoogleProvider({
    clientID: options.clientID,
    clientSecret: options.clientSecret,
    scopes: options.scopes ?? ['email', 'profile'],
  });
}

export { GoogleProvider };
