import { OidcProvider } from '@openauthjs/openauth/provider/oidc';
import type { OktaProviderConfig, OidcProviderConfig } from '../types';

export function createOktaProvider(options: OktaProviderConfig) {
  return OidcProvider({
    clientID: options.clientID,
    issuer: options.issuer,
    scopes: options.scopes ?? ['openid', 'profile', 'email'],
  });
}

export function createOidcProvider(options: OidcProviderConfig) {
  return OidcProvider({
    clientID: options.clientID,
    issuer: options.issuer,
    scopes: options.scopes ?? ['openid', 'profile', 'email'],
  });
}

export { OidcProvider };
