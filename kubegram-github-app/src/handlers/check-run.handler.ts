import { GitHubCheckRunEvent, KubegramGitHubEvent } from '../types/github-events.types';
import { publishGitHubEvent } from '../services/event-publisher.service';
import logger from '../utils/logger';

export async function checkRunHandler({ payload }: { octokit?: any; payload: GitHubCheckRunEvent }): Promise<void> {
  try {
    logger.info(`Processing check run event for ${payload.repository.full_name}`, {
      action: payload.action,
      checkRunName: payload.check_run.name,
      status: payload.check_run.status,
      conclusion: payload.check_run.conclusion,
      headSha: payload.check_run.head_sha,
    });

    // Create Kubegram event
    const kubegramEvent: KubegramGitHubEvent = {
      type: 'github.check_run',
      data: payload,
      repository: {
        name: payload.repository.name,
        full_name: payload.repository.full_name,
        owner: payload.repository.owner.login,
        private: payload.repository.private,
      },
      timestamp: new Date(),
      action: payload.action,
      sha: payload.check_run.head_sha,
    };

    await publishGitHubEvent(kubegramEvent);

    // Special handling for different check run actions
    switch (payload.action) {
      case 'created':
        logger.info(`Check run '${payload.check_run.name}' created for ${payload.repository.full_name}`, {
          headSha: payload.check_run.head_sha,
          status: payload.check_run.status,
        });
        break;
        
      case 'completed':
        logger.info(`Check run '${payload.check_run.name}' completed for ${payload.repository.full_name}`, {
          headSha: payload.check_run.head_sha,
          conclusion: payload.check_run.conclusion,
          duration: payload.check_run.started_at && payload.check_run.completed_at 
            ? new Date(payload.check_run.completed_at).getTime() - new Date(payload.check_run.started_at).getTime()
            : undefined,
        });
        
        // Handle completed check runs (e.g., CI/CD results)
        await handleCompletedCheckRun(payload);
        break;
        
      case 'rerequested':
        logger.info(`Check run '${payload.check_run.name}' rerequested for ${payload.repository.full_name}`);
        break;
        
      case 'requested_action':
        logger.info(`Action requested for check run '${payload.check_run.name}' in ${payload.repository.full_name}`);
        break;
        
      default:
        logger.info(`Check run action '${payload.action}' for ${payload.repository.full_name}`);
    }

    logger.info(`Successfully processed check run event for ${payload.repository.full_name}`);
  } catch (error) {
    logger.error(`Failed to process check run event for ${payload.repository.full_name}:`, error);
    throw error;
  }
}

async function handleCompletedCheckRun(payload: GitHubCheckRunEvent): Promise<void> {
  // This function handles special logic when a check run is completed
  // For example: process CI/CD results, trigger deployments on success, etc.
  
  const conclusion = payload.check_run.conclusion;
  const checkRunName = payload.check_run.name;
  
  logger.info(`Processing completed check run '${checkRunName}' with conclusion: ${conclusion}`, {
    repository: payload.repository.full_name,
    headSha: payload.check_run.head_sha,
    pullRequests: payload.check_run.pull_requests.map(pr => ({
      number: pr.number,
      headRef: pr.head.ref,
      baseRef: pr.base.ref,
    })),
  });
  
  // Special handling for different conclusions
  switch (conclusion) {
    case 'success':
      logger.info(`Check run '${checkRunName}' succeeded - potential deployment trigger`);
      
      // If this is a successful CI run on the default branch, trigger deployment
      // You could add logic here to check if this is on the default branch
      // and trigger appropriate deployment workflows
      break;
      
    case 'failure':
      logger.warn(`Check run '${checkRunName}' failed`);
      
      // Handle failed check runs
      // For example: notify teams, create issues, block deployments
      break;
      
    case 'cancelled':
      logger.info(`Check run '${checkRunName}' was cancelled`);
      break;
      
    case 'timed_out':
      logger.warn(`Check run '${checkRunName}' timed out`);
      break;
      
    case 'action_required':
      logger.info(`Check run '${checkRunName}' requires action`);
      break;
      
    case 'neutral':
      logger.info(`Check run '${checkRunName}' completed with neutral conclusion`);
      break;
      
    default:
      logger.info(`Check run '${checkRunName}' completed with conclusion: ${conclusion}`);
  }
  
  // If check runs are associated with pull requests, you might want to
  // update the PR status or take other actions
  if (payload.check_run.pull_requests.length > 0) {
    logger.info(`Check run '${checkRunName}' affects ${payload.check_run.pull_requests.length} pull request(s)`);
  }
}