import { Hono } from 'hono';
import { db } from '@/db';
import * as v from 'valibot';
import { companyCertificates } from '@/db/schema';
import { generateKeyPairSync, createHash, createCipheriv, randomBytes } from 'node:crypto';
import config from '@/config/env';

const app = new Hono();



// POST /certificates/upload
app.post('/upload', async (c) => {
    try {
        const companyId = c.req.header('x-company-id');
        if (!companyId) {
            return c.json({ error: 'Missing company ID header' }, 401);
        }

        const validCompanyId = v.parse(v.pipe(v.string(), v.uuid()), companyId) as string;

        const body = await c.req.json();
        const publicKey = body.publicKey;

        // Generate fingerprint
        const fingerprint = 'sha256:' + createHash('sha256').update(publicKey).digest('hex');

        // Store as Data URL to simulate external storage URL
        const publicKeyUrl = `data:text/plain;base64,${Buffer.from(publicKey).toString('base64')}`;

        await db.insert(companyCertificates).values({
            companyId: validCompanyId,
            publicKeyUrl,
            fingerprint,
            label: body.label,
        });

        return c.json({ message: 'Certificate uploaded' }, 201);
    } catch (e) {
        console.error(e);
        return c.json({ error: 'Invalid request' }, 400);
    }
});

// POST /certificates/generate
app.post('/generate', async (c) => {
    try {
        const companyId = c.req.header('x-company-id');
        if (!companyId) {
            return c.json({ error: 'Missing company ID header' }, 401);
        }

        const validCompanyId = v.parse(v.pipe(v.string(), v.uuid()), companyId) as string;

        const body = await c.req.json();

        const { publicKey, privateKey } = generateKeyPairSync('rsa', {
            modulusLength: 2048,
            publicKeyEncoding: { type: 'spki', format: 'pem' },
            privateKeyEncoding: { type: 'pkcs8', format: 'pem' }
        });

        const fingerprint = 'sha256:' + createHash('sha256').update(publicKey).digest('hex');
        const publicKeyUrl = `data:text/plain;base64,${Buffer.from(publicKey).toString('base64')}`;

        // Encrypt private key
        const iv = randomBytes(16);
        const salt = randomBytes(16); // Only needed if key derivation were used, but we use raw key here. 
        // Actually, good practice to derive key, but for simplicity/speed with master key:
        // We will assume globalEncryptionKey is 32 bytes or we hash it to 32 bytes.

        // Ensure key is 32 bytes
        const key = createHash('sha256').update(config.globalEncryptionKey).digest();
        const cipher = createCipheriv('aes-256-gcm', key, iv);

        let encryptedPrivateKey = cipher.update(privateKey, 'utf8', 'hex');
        encryptedPrivateKey += cipher.final('hex');
        const authTag = cipher.getAuthTag();

        // Format: iv:authTag:encryptedContent
        const encryptedPrivateKeyString = `${iv.toString('hex')}:${authTag.toString('hex')}:${encryptedPrivateKey}`;

        const [cert] = await db.insert(companyCertificates).values({
            companyId: validCompanyId,
            publicKeyUrl,
            encryptedPrivateKey: encryptedPrivateKeyString,
            fingerprint,
            label: body.label,
        }).returning();

        return c.json({
            id: cert.id,
            publicKey: publicKey,
            // privateKey: privateKey // Do not return private key
        }, 201);
    } catch (e) {
        console.error(e);
        return c.json({ error: 'Generation failed' }, 500);
    }
});

export default app;