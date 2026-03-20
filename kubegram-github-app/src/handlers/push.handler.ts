import { GitHubPushEvent, KubegramGitHubEvent } from '../types/github-events.types';
import { publishGitHubEvent } from '../services/event-publisher.service';
import logger from '../utils/logger';

export async function pushHandler({ payload }: { octokit?: any; payload: GitHubPushEvent }): Promise<void> {
  try {
    logger.info(`Processing push event for ${payload.repository.full_name}`, {
      ref: payload.ref,
      before: payload.before,
      after: payload.after,
      commitsCount: payload.commits.length,
    });

    // Extract branch name from ref
    const branch = payload.ref.replace('refs/heads/', '');
    const isDefaultBranch = branch === payload.repository.default_branch;

    // Create Kubegram event
    const kubegramEvent: KubegramGitHubEvent = {
      type: 'github.push',
      data: payload,
      repository: {
        name: payload.repository.name,
        full_name: payload.repository.full_name,
        owner: payload.repository.owner.login,
        private: payload.repository.private,
      },
      timestamp: new Date(),
      action: 'push',
      sha: payload.after,
      branch: branch,
    };

    await publishGitHubEvent(kubegramEvent);

    // If this is the default branch, we might want to trigger additional processing
    if (isDefaultBranch) {
      logger.info(`Push to default branch '${branch}' detected for ${payload.repository.full_name}`);
      
      // Here you could add additional logic for default branch pushes
      // For example: trigger deployments, update documentation, etc.
    }

    logger.info(`Successfully processed push event for ${payload.repository.full_name}`);
  } catch (error) {
    logger.error(`Failed to process push event for ${payload.repository.full_name}:`, error);
    throw error;
  }
}