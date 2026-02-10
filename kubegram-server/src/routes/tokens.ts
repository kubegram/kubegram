import { Hono } from 'hono';
import { db } from '@/db';
import { companies, companyCertificates, companyLlmTokens } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';
import { publicEncrypt, constants } from 'node:crypto';

const app = new Hono();

// POST /companies/tokens
app.post('/companies/tokens', async (c) => {
    try {
        const body = await c.req.json();
        const {
            companyId,
            provider,
            token,
            providerAPIUrl
        } = body;

        // Validate inputs
        if (!companyId || !provider || !token) {
            return c.json({ error: 'Missing required fields: companyId, provider, token' }, 400);
        }

        // 1. Verify company exists
        const company = await db.select().from(companies).where(eq(companies.id, companyId)).limit(1);
        if (company.length === 0) {
            return c.json({ error: 'Company not found' }, 404);
        }

        // 2. Get latest valid certificate for company
        const certificates = await db.select()
            .from(companyCertificates)
            .where(eq(companyCertificates.companyId, companyId))
            .orderBy(desc(companyCertificates.createdAt))
            .limit(1);

        if (certificates.length === 0) {
            return c.json({ error: 'No certificates setup for this company' }, 400);
        }

        const certificate = certificates[0];
        let publicKey = certificate.publicKeyUrl;

        // Fetch public key if it's a remote URL
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

        // 3. Encrypt the token
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

        // 4. Save to database
        // Note: Storing as data URI to fit 'encryptedTokenUrl' semantic, 
        // though in production this might be an uploaded file URL.
        const encryptedTokenUrl = `data:application/octet-stream;base64,${encryptedTokenBase64}`;

        const [newToken] = await db.insert(companyLlmTokens).values({
            companyId,
            provider,
            providerAPIUrl,
            encryptedTokenUrl, // Storing the encrypted data directly as a data URI
            encryptionKeyId: certificate.id,
        }).returning();

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
