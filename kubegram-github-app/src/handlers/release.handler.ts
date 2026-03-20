import { GitHubReleaseEvent, KubegramGitHubEvent } from '../types/github-events.types';
import { publishGitHubEvent } from '../services/event-publisher.service';
import logger from '../utils/logger';

export async function releaseHandler({ payload }: { octokit?: any; payload: GitHubReleaseEvent }): Promise<void> {
  try {
    logger.info(`Processing release event for ${payload.repository.full_name}`, {
      action: payload.action,
      tagName: payload.release.tag_name,
      name: payload.release.name,
      draft: payload.release.draft,
      prerelease: payload.release.prerelease,
    });

    // Create Kubegram event
    const kubegramEvent: KubegramGitHubEvent = {
      type: 'github.release',
      data: payload,
      repository: {
        name: payload.repository.name,
        full_name: payload.repository.full_name,
        owner: payload.repository.owner.login,
        private: payload.repository.private,
      },
      timestamp: new Date(),
      action: payload.action,
      sha: payload.release.target_commitish,
      branch: payload.release.target_commitish,
    };

    await publishGitHubEvent(kubegramEvent);

    // Special handling for different release actions
    switch (payload.action) {
      case 'published':
        logger.info(`Release ${payload.release.tag_name} published for ${payload.repository.full_name}`, {
          isPrerelease: payload.release.prerelease,
          assetsCount: payload.release.assets.length,
        });
        
        // Trigger deployment or notification logic for published releases
        if (!payload.release.prerelease) {
          await handlePublishedRelease(payload);
        } else {
          logger.info(`Pre-release ${payload.release.tag_name} published - skipping deployment trigger`);
        }
        break;
        
      case 'created':
        logger.info(`Release ${payload.release.tag_name} created for ${payload.repository.full_name}`, {
          isDraft: payload.release.draft,
        });
        break;
        
      case 'edited':
        logger.info(`Release ${payload.release.tag_name} edited for ${payload.repository.full_name}`);
        break;
        
      case 'deleted':
        logger.info(`Release ${payload.release.tag_name} deleted for ${payload.repository.full_name}`);
        break;
        
      default:
        logger.info(`Release action '${payload.action}' for ${payload.repository.full_name}`);
    }

    logger.info(`Successfully processed release event for ${payload.repository.full_name}`);
  } catch (error) {
    logger.error(`Failed to process release event for ${payload.repository.full_name}:`, error);
    throw error;
  }
}

async function handlePublishedRelease(payload: GitHubReleaseEvent): Promise<void> {
  // This function handles special logic when a release is published
  // For example: trigger deployments, update documentation, notify teams, etc.
  
  logger.info(`Processing published release ${payload.release.tag_name} for deployment consideration`, {
    repository: payload.repository.full_name,
    targetCommitish: payload.release.target_commitish,
    assets: payload.release.assets.map(asset => ({
      name: asset.name,
      size: asset.size,
      contentType: asset.content_type,
    })),
  });
  
  // Here you could:
  // - Trigger deployment workflows
  // - Publish release notifications
  // - Update version tracking systems
  // - Archive release artifacts
}