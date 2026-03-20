import { Request, Response } from 'express';
import config from '../config/app.config';
import { createManifestPR, DeployPayload } from '../services/pr-creation.service';
import logger from '../utils/logger';

/**
 * POST /api/kubegram/deploy
 *
 * Called by kubegram-server after a codegen job completes to open a pull request
 * in the user's repository with the generated Kubernetes manifests.
 *
 * Protected by the KUBEGRAM_INTERNAL_SECRET shared secret.
 */
export async function deployHandler(req: Request, res: Response): Promise<void> {
  // Verify shared secret
  const secret = req.headers['x-kubegram-secret'];
  if (!config.kubegram.internalSecret || secret !== config.kubegram.internalSecret) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  const body = req.body as Partial<DeployPayload>;

  // Basic validation
  if (
    typeof body.installationId !== 'number' ||
    !body.owner ||
    !body.repo ||
    !body.baseBranch ||
    !body.prTitle ||
    !body.files?.length
  ) {
    res.status(400).json({
      error: 'Invalid payload',
      required: ['installationId', 'owner', 'repo', 'baseBranch', 'prTitle', 'files'],
    });
    return;
  }

  try {
    const prUrl = await createManifestPR(body as DeployPayload);
    res.status(201).json({ prUrl });
  } catch (error) {
    logger.error('Failed to create manifest PR', {
      owner: body.owner,
      repo: body.repo,
      error,
    });
    res.status(500).json({ error: 'Failed to create pull request' });
  }
}
