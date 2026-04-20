// Use relative URL in development to leverage Vite proxy (avoids CORS)
// Use full URL in production
const API_BASE_URL = import.meta.env.DEV ? '' : (import.meta.env.VITE_API_URL || 'http://localhost:8090');

export interface EncryptionConfig {
  encryptionEnabled: boolean;
  publicKeyPem: string | null;
}

export async function fetchEncryptionConfig(): Promise<EncryptionConfig> {
  const res = await fetch(`${API_BASE_URL}/api/public/v1/auth/encryption-config`);
  if (!res.ok) return { encryptionEnabled: false, publicKeyPem: null };
  return res.json();
}

function pemToArrayBuffer(pem: string): ArrayBuffer {
  const b64 = pem
    .replace(/-----BEGIN PUBLIC KEY-----/, '')
    .replace(/-----END PUBLIC KEY-----/, '')
    .replace(/\s/g, '');
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes.buffer;
}

export async function encryptPassword(password: string, publicKeyPem: string): Promise<string> {
  const keyData = pemToArrayBuffer(publicKeyPem);
  const key = await crypto.subtle.importKey(
    'spki',
    keyData,
    { name: 'RSA-OAEP', hash: 'SHA-256' },
    false,
    ['encrypt']
  );
  const encrypted = await crypto.subtle.encrypt(
    { name: 'RSA-OAEP' },
    key,
    new TextEncoder().encode(password)
  );
  return btoa(String.fromCharCode(...new Uint8Array(encrypted)));
}
