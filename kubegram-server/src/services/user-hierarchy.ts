import { getRepositories } from '@/repositories';
import { randomUUID } from 'crypto';
import logger from '@/utils/logger';

export async function ensureUserHasTeam(
  userId: number,
  userName: string,
): Promise<{ teamId: number; organizationId: number; companyId: string }> {
  try {
    const repos = getRepositories();

    const user = await repos.users.findById(userId);
    if (!user) throw new Error('User not found');

    if (user.teamId) {
      const team = await repos.teams.findById(user.teamId);
      if (!team) throw new Error('Team not found for user');
      if (!team.organizationId) throw new Error('Team has no associated organization');

      const organization = await repos.organizations.findById(team.organizationId);
      if (!organization) throw new Error('Organization not found for team');
      if (!organization.companyId) throw new Error('Organization has no associated company');

      const company = await repos.companies.findById(organization.companyId);
      if (!company) throw new Error('Company not found for organization');

      return { teamId: team.id, organizationId: organization.id, companyId: company.id };
    }

    const uuid = randomUUID();
    const sanitizedUserName = userName.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase();

    const newCompany = await repos.companies.create({ name: `company-${sanitizedUserName}-${uuid}` });
    logger.info('Created placeholder company', { companyId: newCompany.id, userId });

    const newOrg = await repos.organizations.create({
      name: `org-${sanitizedUserName}-${uuid}`,
      companyId: newCompany.id,
    });
    logger.info('Created placeholder organization', { organizationId: newOrg.id, companyId: newCompany.id, userId });

    const newTeam = await repos.teams.create({
      name: `team-${sanitizedUserName}-${uuid}`,
      organizationId: newOrg.id,
    });
    logger.info('Created placeholder team', { teamId: newTeam.id, organizationId: newOrg.id, userId });

    await repos.users.update(userId, { teamId: newTeam.id, updatedAt: new Date() });
    logger.info('Updated user with team assignment', { userId, teamId: newTeam.id });

    return { teamId: newTeam.id, organizationId: newOrg.id, companyId: newCompany.id };
  } catch (error) {
    logger.error('Failed to ensure user has team', { userId, userName, error });
    throw new Error(`Failed to ensure user team assignment: ${(error as Error).message}`);
  }
}
