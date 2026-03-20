import { getInstallationOctokit } from '../config/github.config';
import logger from '../utils/logger';

export interface DeployFile {
  path: string;   // e.g. "k8s/deployment.yaml"
  content: string; // raw YAML content
}

export interface DeployPayload {
  installationId: number;
  owner: string;
  repo: string;
  baseBranch: string;
  prTitle: string;
  prBody: string;
  files: DeployFile[];
}

/**
 * Opens a pull request in the target repository containing the generated manifests.
 * Uses the GitHub Git Data API to create blobs, a tree, a commit, and a branch
 * before opening the PR — no local git clone required.
 *
 * @returns The HTML URL of the newly-created pull request
 */
export async function createManifestPR(payload: DeployPayload): Promise<string> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const octokit = await getInstallationOctokit(payload.installationId) as any;
  const { owner, repo, baseBranch } = payload;

  logger.info('Creating manifest PR', { owner, repo, baseBranch, fileCount: payload.files.length });

  // 1. Get HEAD SHA of the base branch
  const { data: ref } = await octokit.rest.git.getRef({
    owner,
    repo,
    ref: `heads/${baseBranch}`,
  });
  const baseSha = ref.object.sha;

  // 2. Create a blob for each file
  const blobs = await Promise.all(
    payload.files.map((f) =>
      octokit.rest.git.createBlob({
        owner,
        repo,
        content: Buffer.from(f.content).toString('base64'),
        encoding: 'base64',
      }),
    ),
  );

  // 3. Create a tree that adds/updates the files
  const { data: tree } = await octokit.rest.git.createTree({
    owner,
    repo,
    base_tree: baseSha,
    tree: payload.files.map((f, i) => ({
      path: f.path,
      mode: '100644' as const,
      type: 'blob' as const,
      sha: blobs[i].data.sha,
    })),
  });

  // 4. Create a commit on top of the base branch
  const { data: commit } = await octokit.rest.git.createCommit({
    owner,
    repo,
    message: payload.prTitle,
    tree: tree.sha,
    parents: [baseSha],
  });

  // 5. Create a feature branch pointing at the new commit
  const branchName = `kubegram/deploy-${Date.now()}`;
  await octokit.rest.git.createRef({
    owner,
    repo,
    ref: `refs/heads/${branchName}`,
    sha: commit.sha,
  });

  // 6. Open the pull request
  const { data: pr } = await octokit.rest.pulls.create({
    owner,
    repo,
    title: payload.prTitle,
    body: payload.prBody,
    head: branchName,
    base: baseBranch,
  });

  logger.info('Manifest PR created', { owner, repo, prNumber: pr.number, prUrl: pr.html_url });

  return pr.html_url;
}
