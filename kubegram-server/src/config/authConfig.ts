import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { generateKeyPairSync } from 'crypto';
import logger from '../utils/logger';

interface PasswordAuthConfig {
  encryptionEnabled: boolean;
  publicKeyFile: string | null;
  privateKeyFile: string | null;
  keyAlgorithm: string;
  keySize: number;
}

interface AuthConfigFile {
  passwordAuth: PasswordAuthConfig;
}

interface AuthConfig {
  encryptionEnabled: boolean;
  publicKeyPem: string | null;
  privateKeyPem: string | null;
}

function loadConfig(): AuthConfigFile {
  const configPath = join(process.cwd(), 'auth.config.json');
  if (!existsSync(configPath)) {
    logger.warn('auth.config.json not found, using defaults (encryption disabled)');
    return { passwordAuth: { encryptionEnabled: false, publicKeyFile: null, privateKeyFile: null, keyAlgorithm: 'RSA-OAEP', keySize: 2048 } };
  }
  return JSON.parse(readFileSync(configPath, 'utf8')) as AuthConfigFile;
}

function initAuthConfig(): AuthConfig {
  const file = loadConfig();
  const pa = file.passwordAuth;

  if (!pa.encryptionEnabled) {
    logger.info('Password auth encryption disabled (auth.config.json)');
    return { encryptionEnabled: false, publicKeyPem: null, privateKeyPem: null };
  }

  // Load from key files if specified
  if (pa.publicKeyFile && pa.privateKeyFile) {
    if (!existsSync(pa.publicKeyFile) || !existsSync(pa.privateKeyFile)) {
      throw new Error(`Key files specified in auth.config.json not found: ${pa.publicKeyFile}, ${pa.privateKeyFile}`);
    }
    logger.info('Password auth: loaded RSA key pair from files');
    return {
      encryptionEnabled: true,
      publicKeyPem: readFileSync(pa.publicKeyFile, 'utf8'),
      privateKeyPem: readFileSync(pa.privateKeyFile, 'utf8'),
    };
  }

  // Generate ephemeral key pair
  logger.info(`Password auth: generating ephemeral RSA-${pa.keySize} key pair`);
  const { publicKey, privateKey } = generateKeyPairSync('rsa', {
    modulusLength: pa.keySize,
    publicKeyEncoding: { type: 'spki', format: 'pem' },
    privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
  });

  return { encryptionEnabled: true, publicKeyPem: publicKey, privateKeyPem: privateKey };
}

export const authConfig: AuthConfig = initAuthConfig();
