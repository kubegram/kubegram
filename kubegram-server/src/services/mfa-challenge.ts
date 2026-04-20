import { randomUUID } from 'crypto';
import config from '@/config/env';

const CHALLENGE_TTL_SECONDS = 300;
const memStore = new Map<string, { email: string; expiresAt: number }>();

export async function createChallenge(email: string): Promise<string> {
  const id = randomUUID();
  if (config.enableHA) {
    const { redisClient } = await import('@/state/redis');
    await redisClient.getClient().setex(`mfa-challenge:${id}`, CHALLENGE_TTL_SECONDS, email);
  } else {
    memStore.set(id, { email, expiresAt: Date.now() + CHALLENGE_TTL_SECONDS * 1000 });
  }
  return id;
}

export async function resolveChallenge(id: string): Promise<string | null> {
  if (config.enableHA) {
    const { redisClient } = await import('@/state/redis');
    const client = redisClient.getClient();
    const email = await client.get(`mfa-challenge:${id}`);
    if (email) await client.del(`mfa-challenge:${id}`);
    return email;
  }
  const entry = memStore.get(id);
  if (!entry || entry.expiresAt < Date.now()) {
    memStore.delete(id);
    return null;
  }
  memStore.delete(id);
  return entry.email;
}
