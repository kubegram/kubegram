import { EventBus } from '@kubegram/events';
import { KubegramGitHubEvent } from '../types/github-events.types';
import logger from '../utils/logger';

let eventBus: EventBus;

export function initializeEventBus(): EventBus {
  eventBus = new EventBus({
    enableCache: true,
    cacheSize: 1000,
    cacheTTL: 300000, // 5 minutes
  });

  logger.info('EventBus initialized');
  return eventBus;
}

export function getEventBus(): EventBus {
  if (!eventBus) {
    throw new Error('EventBus not initialized. Call initializeEventBus() first.');
  }
  return eventBus;
}

export async function publishGitHubEvent(event: KubegramGitHubEvent): Promise<void> {
  try {
    const bus = getEventBus();
    await bus.publish({
      type: event.type,
      data: event.data,
      aggregateId: event.repository.full_name,
      metadata: {
        timestamp: event.timestamp.toISOString(),
        repository: event.repository,
        action: event.action,
        sha: event.sha,
        branch: event.branch,
      },
    } as any);

    logger.info(`Published ${event.type} event for ${event.repository.full_name}`, {
      action: event.action,
      sha: event.sha,
      branch: event.branch,
    });
  } catch (error) {
    logger.error('Failed to publish GitHub event:', error);
    throw error;
  }
}

export async function publishGitHubEventBatch(events: KubegramGitHubEvent[]): Promise<void> {
  try {
    const bus = getEventBus();
    const domainEvents = events.map(event => ({
      type: event.type,
      data: event.data,
      aggregateId: event.repository.full_name,
      metadata: {
        timestamp: event.timestamp.toISOString(),
        repository: event.repository,
        action: event.action,
        sha: event.sha,
        branch: event.branch,
      },
    }));

    await bus.publishBatch(domainEvents as any);
    logger.info(`Published batch of ${events.length} GitHub events`);
  } catch (error) {
    logger.error('Failed to publish GitHub event batch:', error);
    throw error;
  }
}

export async function getEventHistory(eventType?: string, limit?: number): Promise<any[]> {
  try {
    const bus = getEventBus();
    return await bus.getEventHistory(eventType, limit);
  } catch (error) {
    logger.error('Failed to get event history:', error);
    throw error;
  }
}

export function getEventBusStats(): any {
  try {
    const bus = getEventBus();
    return bus.getCacheStats();
  } catch (error) {
    logger.error('Failed to get event bus stats:', error);
    throw error;
  }
}