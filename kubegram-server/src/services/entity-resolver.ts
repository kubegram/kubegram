import { getRepositories } from '@/repositories';

/**
 * Centralised FK-chain traversal helpers used across multiple routes/services.
 * These replace the copy-pasted 3-query chains in crud.ts, providers.ts, etc.
 */

export async function getUserCompanyId(userId: number): Promise<string> {
  const repos = getRepositories();
  const user = await repos.users.findById(userId);
  if (!user || !user.teamId) {
    throw new Error(`User ${userId} has no team assigned`);
  }
  return getCompanyIdFromTeam(user.teamId);
}

export async function getCompanyIdFromTeam(teamId: number): Promise<string> {
  const repos = getRepositories();
  const team = await repos.teams.findById(teamId);
  if (!team || !team.organizationId) {
    throw new Error(`Team ${teamId} has no organization assigned`);
  }
  const org = await repos.organizations.findById(team.organizationId);
  if (!org || !org.companyId) {
    throw new Error(`Organization ${team.organizationId} has no company assigned`);
  }
  return org.companyId;
}

export async function getTeamOrganizationId(teamId: number): Promise<number> {
  const repos = getRepositories();
  const team = await repos.teams.findById(teamId);
  if (!team || !team.organizationId) {
    throw new Error(`Team ${teamId} has no organization assigned`);
  }
  return team.organizationId;
}