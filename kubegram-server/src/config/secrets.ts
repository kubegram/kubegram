import fs from 'node:fs';
import path from 'node:path';

export class SecretsManager {
    static getGlobalEncryptionKey(): string {
        // 1. Check Environment Variable
        if (process.env.GLOBAL_ENCRYPTION_KEY) {
            return process.env.GLOBAL_ENCRYPTION_KEY;
        }

        // 2. Check Kubernetes Secret Mount (standard path or custom)
        const secretPath = process.env.ENCRYPTION_KEY_FILE_PATH || '/etc/secrets/global-encryption-key';
        if (fs.existsSync(secretPath)) {
            try {
                return fs.readFileSync(secretPath, 'utf8').trim();
            } catch (err) {
                console.error(`Failed to read secret file at ${secretPath}`, err);
            }
        }

        // 3. AWS Secrets Manager (Placeholder)
        // In a real implementation, this would use @aws-sdk/client-secrets-manager
        // and likely be an async method. For now, we assume synchronously available keys 
        // (env var or file mount) are sufficient for startup configuration.

        // Fallback for development ONLY
        if (process.env.NODE_ENV !== 'production') {
            console.warn('WARNING: Using default development encryption key. Do not use in production!');
            return 'dev-secret-key-change-me-immediately-12345';
        }

        throw new Error('Global Encryption Key not found. Please set GLOBAL_ENCRYPTION_KEY env var or mount secret file.');
    }
}
