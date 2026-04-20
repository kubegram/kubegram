import { TOTP, Secret } from 'otpauth';

const ISSUER = 'Kubegram';

export function generateTotpSecret(email: string): { secret: string; otpauthUrl: string } {
  const secret = new Secret();
  const totp = new TOTP({ issuer: ISSUER, label: email, secret });
  return { secret: secret.base32, otpauthUrl: totp.toString() };
}

export function verifyTotpCode(secretBase32: string, token: string): boolean {
  const totp = new TOTP({ issuer: ISSUER, secret: Secret.fromBase32(secretBase32) });
  return totp.validate({ token, window: 1 }) !== null;
}
