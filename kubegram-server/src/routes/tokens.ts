import { Hono } from 'hono';
import { getRepositories } from '@/repositories';
import { publicEncrypt, constants } from 'node:crypto';

const app = new Hono();

app.post('/companies/tokens', async (c) => {
    try {
        const repos = getRepositories();
        const body = await c.req.json();
        const { companyId, provider, token, providerAPIUrl } = body;

        if (!companyId || !provider || !token) {
            return c.json({ error: 'Missing required fields: companyId, provider, token' }, 400);
        }

        const company = await repos.companies.findById(companyId);
        if (!company) {
            return c.json({ error: 'Company not found' }, 404);
        }

        const certificates = await repos.companyCertificates.findByCompanyId(companyId);
        if (certificates.length === 0) {
            return c.json({ error: 'No certificates setup for this company' }, 400);
        }

        const certificate = certificates[0];
        let publicKey = certificate.publicKeyUrl;

        if (publicKey.startsWith('http')) {
            try {
                const res = await fetch(publicKey);
                if (!res.ok) {
                    throw new Error(`Failed to fetch public key: ${res.statusText}`);
                }
                publicKey = await res.text();
            } catch (e) {
                console.error('Error fetching public key:', e);
                return c.json({ error: 'Failed to retrieve company certificate' }, 500);
            }
        }

        let encryptedTokenBase64: string;
        try {
            const encryptedBuffer = publicEncrypt(
                {
                    key: publicKey,
                    padding: constants.RSA_PKCS1_OAEP_PADDING,
                    oaepHash: 'sha256',
                },
                Buffer.from(token)
            );
            encryptedTokenBase64 = encryptedBuffer.toString('base64');
        } catch (e) {
            console.error('Encryption failed:', e);
            return c.json({ error: 'Failed to encrypt token with company certificate' }, 500);
        }

        const encryptedTokenUrl = `data:application/octet-stream;base64,${encryptedTokenBase64}`;

        const newToken = await repos.companyLlmTokens.create({
            companyId,
            provider,
            providerAPIUrl,
            encryptedTokenUrl,
            encryptionKeyId: certificate.id,
        });

        return c.json({
            message: 'Token saved successfully',
            id: newToken.id
        }, 201);

    } catch (e) {
        console.error('Error saving LLM token:', e);
        return c.json({ error: 'Internal Server Error' }, 500);
    }
});

export default app;
