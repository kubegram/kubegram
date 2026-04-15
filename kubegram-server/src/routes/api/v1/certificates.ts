import { Hono } from 'hono';
import { getRepositories } from '@/repositories';
import * as v from 'valibot';
import { generateKeyPairSync, createHash, createCipheriv, randomBytes } from 'node:crypto';
import config from '@/config/env';

const app = new Hono();

app.post('/upload', async (c) => {
    try {
        const companyId = c.req.header('x-company-id');
        if (!companyId) {
            return c.json({ error: 'Missing company ID header' }, 401);
        }

        const validCompanyId = v.parse(v.pipe(v.string(), v.uuid()), companyId) as string;
        const repos = getRepositories();

        const body = await c.req.json();
        const publicKey = body.publicKey;

        const fingerprint = 'sha256:' + createHash('sha256').update(publicKey).digest('hex');
        const publicKeyUrl = `data:text/plain;base64,${Buffer.from(publicKey).toString('base64')}`;

        await repos.companyCertificates.create({
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

app.post('/generate', async (c) => {
    try {
        const companyId = c.req.header('x-company-id');
        if (!companyId) {
            return c.json({ error: 'Missing company ID header' }, 401);
        }

        const validCompanyId = v.parse(v.pipe(v.string(), v.uuid()), companyId) as string;
        const repos = getRepositories();

        const body = await c.req.json();

        const { publicKey, privateKey } = generateKeyPairSync('rsa', {
            modulusLength: 2048,
            publicKeyEncoding: { type: 'spki', format: 'pem' },
            privateKeyEncoding: { type: 'pkcs8', format: 'pem' }
        });

        const fingerprint = 'sha256:' + createHash('sha256').update(publicKey).digest('hex');
        const publicKeyUrl = `data:text/plain;base64,${Buffer.from(publicKey).toString('base64')}`;

        const iv = randomBytes(16);
        const key = createHash('sha256').update(config.globalEncryptionKey).digest();
        const cipher = createCipheriv('aes-256-gcm', key, iv);

        let encryptedPrivateKey = cipher.update(privateKey, 'utf8', 'hex');
        encryptedPrivateKey += cipher.final('hex');
        const authTag = cipher.getAuthTag();

        const encryptedPrivateKeyString = `${iv.toString('hex')}:${authTag.toString('hex')}:${encryptedPrivateKey}`;

        const cert = await repos.companyCertificates.create({
            companyId: validCompanyId,
            publicKeyUrl,
            encryptedPrivateKey: encryptedPrivateKeyString,
            fingerprint,
            label: body.label,
        });

        return c.json({
            id: cert.id,
            publicKey: publicKey,
        }, 201);
    } catch (e) {
        console.error(e);
        return c.json({ error: 'Generation failed' }, 500);
    }
});

export default app;