import { GitHubPullRequestEvent, KubegramGitHubEvent } from '../types/github-events.types';
import { publishGitHubEvent } from '../services/event-publisher.service';
import config from '../config/app.config';
import logger from '../utils/logger';

export async function pullRequestHandler({ payload }: { octokit?: any; payload: GitHubPullRequestEvent }): Promise<void> {
  try {
    logger.info(`Processing pull request event for ${payload.repository.full_name}`, {
      action: payload.action,
      pullRequestNumber: payload.number,
      title: payload.pull_request.title,
      state: payload.pull_request.state,
      merged: payload.pull_request.merged,
    });

    // Create Kubegram event
    const kubegramEvent: KubegramGitHubEvent = {
      type: 'github.pull_request',
      data: payload,
      repository: {
        name: payload.repository.name,
        full_name: payload.repository.full_name,
        owner: payload.repository.owner.login,
        private: payload.repository.private,
      },
      timestamp: new Date(),
      action: payload.action,
      sha: payload.pull_request.head.sha,
      branch: payload.pull_request.head.ref,
    };

    await publishGitHubEvent(kubegramEvent);

    // Special handling for different PR actions
    switch (payload.action) {
      case 'opened':
        logger.info(`Pull request #${payload.number} opened in ${payload.repository.full_name}`);
        break;
      case 'closed':
        if (payload.pull_request.merged) {
          logger.info(`Pull request #${payload.number} merged in ${payload.repository.full_name}`);
          // Trigger deployment logic for merged PRs
          await handleMergedPullRequest(payload);
        } else {
          logger.info(`Pull request #${payload.number} closed without merging in ${payload.repository.full_name}`);
        }
        break;
      case 'reopened':
        logger.info(`Pull request #${payload.number} reopened in ${payload.repository.full_name}`);
        break;
      case 'synchronize':
        logger.info(`Pull request #${payload.number} updated with new commits in ${payload.repository.full_name}`);
        break;
      default:
        logger.info(`Pull request #${payload.number} action '${payload.action}' in ${payload.repository.full_name}`);
    }

    logger.info(`Successfully processed pull request event for ${payload.repository.full_name}`);
  } catch (error) {
    logger.error(`Failed to process pull request event for ${payload.repository.full_name}:`, error);
    throw error;
  }
}

async function handleMergedPullRequest(payload: GitHubPullRequestEvent): Promise<void> {
  const isDefaultBranch = payload.pull_request.base.ref === payload.repository.default_branch;
  const isKubegramBranch = payload.pull_request.head.ref.startsWith('kubegram/deploy-');

  if (!isDefaultBranch || !isKubegramBranch) return;

  logger.info(`Kubegram PR #${payload.number} merged to default branch — notifying kubegram-server`, {
    repository: payload.repository.full_name,
    mergeCommitSha: payload.pull_request.merge_commit_sha,
  });

  try {
    const res = await fetch(`${config.kubegram.serverUrl}/api/internal/github/pr-merged`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Kubegram-Secret': config.kubegram.internalSecret ?? '',
      },
      body: JSON.stringify({
        owner: payload.repository.owner.login,
        repo: payload.repository.name,
        mergeCommitSha: payload.pull_request.merge_commit_sha,
      }),
    });

    if (!res.ok) {
      logger.error('kubegram-server returned non-2xx for pr-merged notification', {
        status: res.status,
        repository: payload.repository.full_name,
      });
    } else {
      logger.info('Successfully notified kubegram-server of merged Kubegram PR', {
        repository: payload.repository.full_name,
      });
    }
  } catch (error) {
    logger.error('Failed to notify kubegram-server of merged PR', {
      repository: payload.repository.full_name,
      error,
    });
  }
}