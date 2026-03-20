export interface GitHubPushEvent {
  ref: string;
  before: string;
  after: string;
  repository: {
    id: number;
    name: string;
    full_name: string;
    private: boolean;
    owner: {
      login: string;
      id: number;
    };
    default_branch: string;
  };
  pusher: {
    name: string;
    email: string;
  };
  commits: Array<{
    id: string;
    message: string;
    timestamp: string;
    url: string;
    added: string[];
    removed: string[];
    modified: string[];
  }>;
  head_commit?: {
    id: string;
    message: string;
    timestamp: string;
    url: string;
    added: string[];
    removed: string[];
    modified: string[];
  };
}

export interface GitHubPullRequestEvent {
  action: 'opened' | 'closed' | 'reopened' | 'edited' | 'synchronize';
  number: number;
  repository: {
    id: number;
    name: string;
    full_name: string;
    private: boolean;
    owner: {
      login: string;
      id: number;
    };
    default_branch: string;
  };
  pull_request: {
    id: number;
    number: number;
    state: 'open' | 'closed';
    title: string;
    body: string | null;
    user: {
      login: string;
      id: number;
    };
    base: {
      ref: string;
      sha: string;
    };
    head: {
      ref: string;
      sha: string;
    };
    merged: boolean;
    merge_commit_sha: string | null;
  };
  sender: {
    login: string;
    id: number;
  };
}

export interface GitHubReleaseEvent {
  action: 'published' | 'unpublished' | 'created' | 'edited' | 'deleted' | 'prereleased';
  repository: {
    id: number;
    name: string;
    full_name: string;
    private: boolean;
    owner: {
      login: string;
      id: number;
    };
  };
  release: {
    id: number;
    tag_name: string;
    target_commitish: string;
    name: string | null;
    body: string | null;
    draft: boolean;
    prerelease: boolean;
    created_at: string;
    published_at: string | null;
    author: {
      login: string;
      id: number;
    };
    assets: Array<{
      id: number;
      name: string;
      content_type: string;
      size: number;
      browser_download_url: string;
    }>;
  };
  sender: {
    login: string;
    id: number;
  };
}

export interface GitHubCheckRunEvent {
  action: 'created' | 'rerequested' | 'completed' | 'requested_action';
  repository: {
    id: number;
    name: string;
    full_name: string;
    private: boolean;
    owner: {
      login: string;
      id: number;
    };
  };
  check_run: {
    id: number;
    head_sha: string;
    external_id: string;
    url: string;
    html_url: string;
    status: 'queued' | 'in_progress' | 'completed';
    conclusion: 'success' | 'failure' | 'neutral' | 'cancelled' | 'timed_out' | 'action_required' | null;
    started_at: string;
    completed_at: string | null;
    name: string;
    app: {
      id: number;
      name: string;
    };
    pull_requests: Array<{
      id: number;
      number: number;
      url: string;
      head: {
        ref: string;
        sha: string;
      };
      base: {
        ref: string;
        sha: string;
      };
    }>;
  };
  sender: {
    login: string;
    id: number;
  };
}

export interface GitHubWebhookEvent {
  'X-GitHub-Event': string;
  'X-GitHub-Delivery': string;
  'X-Hub-Signature-256': string;
  payload: GitHubPushEvent | GitHubPullRequestEvent | GitHubReleaseEvent | GitHubCheckRunEvent;
}

export interface KubegramGitHubEvent {
  type: 'github.push' | 'github.pull_request' | 'github.release' | 'github.check_run';
  data: GitHubPushEvent | GitHubPullRequestEvent | GitHubReleaseEvent | GitHubCheckRunEvent;
  repository: {
    name: string;
    full_name: string;
    owner: string;
    private: boolean;
  };
  timestamp: Date;
  action?: string;
  sha?: string;
  branch?: string;
}