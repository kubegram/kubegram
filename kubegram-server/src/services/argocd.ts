import config from '@/config/env';
import logger from '@/utils/logger';

/**
 * Trigger an ArgoCD application sync via the ArgoCD REST API.
 *
 * @param appName - ArgoCD Application name (as shown in `argocd app list`)
 */
export async function sync(appName: string): Promise<void> {
  if (!config.argocdServerUrl) {
    throw new Error('ARGOCD_SERVER_URL is not configured');
  }

  const url = `${config.argocdServerUrl}/api/v1/applications/${encodeURIComponent(appName)}/sync`;

  logger.info('Triggering ArgoCD sync', { appName, url });

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${config.argocdToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ prune: false, dryRun: false }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`ArgoCD sync returned ${res.status}: ${body}`);
  }

  logger.info('ArgoCD sync triggered successfully', { appName });
}
