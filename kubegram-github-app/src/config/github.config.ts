import { App } from '@octokit/app';
import config, { validateConfig } from './app.config';

validateConfig();

export const githubApp = new App({
  appId: config.github.appId!,
  privateKey: config.github.privateKey!,
  oauth: {
    clientId: config.github.clientId!,
    clientSecret: config.github.clientSecret!,
  },
  webhooks: {
    secret: config.github.webhookSecret!,
  },
});

export function getInstallationOctokit(installationId: number): Promise<any> {
  return githubApp.getInstallationOctokit(installationId);
}

export function getAppOctokit(): any {
  return githubApp.octokit;
}

export default githubApp;