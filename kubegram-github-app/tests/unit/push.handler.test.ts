import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GitHubPushEvent } from '../types/github-events.types';
import { pushHandler } from '../handlers/push.handler';
import { publishGitHubEvent } from '../services/event-publisher.service';

vi.mock('../services/event-publisher.service');
vi.mock('../utils/logger', () => ({
  default: {
    info: vi.fn(),
    error: vi.fn(),
  },
}));

describe('pushHandler', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should handle push event and publish to event bus', async () => {
    const mockPayload: GitHubPushEvent = {
      ref: 'refs/heads/main',
      before: 'abc123',
      after: 'def456',
      repository: {
        id: 12345,
        name: 'test-repo',
        full_name: 'test-owner/test-repo',
        private: false,
        owner: {
          login: 'test-owner',
          id: 67890,
        },
        default_branch: 'main',
      },
      pusher: {
        name: 'test-user',
        email: 'test@example.com',
      },
      commits: [],
    };

    const mockOctokit = {};

    await pushHandler({ octokit: mockOctokit, payload: mockPayload });

    expect(publishGitHubEvent).toHaveBeenCalledWith({
      type: 'github.push',
      data: mockPayload,
      repository: {
        name: 'test-repo',
        full_name: 'test-owner/test-repo',
        owner: 'test-owner',
        private: false,
      },
      timestamp: expect.any(Date),
      action: 'push',
      sha: 'def456',
      branch: 'main',
    });
  });

  it('should handle default branch push specially', async () => {
    const mockPayload: GitHubPushEvent = {
      ref: 'refs/heads/main',
      before: 'abc123',
      after: 'def456',
      repository: {
        id: 12345,
        name: 'test-repo',
        full_name: 'test-owner/test-repo',
        private: false,
        owner: {
          login: 'test-owner',
          id: 67890,
        },
        default_branch: 'main',
      },
      pusher: {
        name: 'test-user',
        email: 'test@example.com',
      },
      commits: [],
    };

    const mockOctokit = {};

    await pushHandler({ octokit: mockOctokit, payload: mockPayload });

    expect(publishGitHubEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        branch: 'main',
        sha: 'def456',
      })
    );
  });

  it('should handle errors gracefully', async () => {
    const mockPayload: GitHubPushEvent = {
      ref: 'refs/heads/main',
      before: 'abc123',
      after: 'def456',
      repository: {
        id: 12345,
        name: 'test-repo',
        full_name: 'test-owner/test-repo',
        private: false,
        owner: {
          login: 'test-owner',
          id: 67890,
        },
        default_branch: 'main',
      },
      pusher: {
        name: 'test-user',
        email: 'test@example.com',
      },
      commits: [],
    };

    const mockOctokit = {};

    const mockError = new Error('Test error');
    vi.mocked(publishGitHubEvent).mockRejectedValue(mockError);

    await expect(pushHandler({ octokit: mockOctokit, payload: mockPayload })).rejects.toThrow('Test error');
  });
});