/**
 * Graph Permissions Service
 * 
 * Handles permission validation for project-based access control.
 * Enforces team membership requirements for graph/codegen operations.
 */

import { getRepositories } from '@/repositories';

export enum GraphPermission {
  READ = 'read',
  WRITE = 'write',
  ADMIN = 'admin'
}

export class GraphPermissions {
  static async canAccessProject(
    userId: number,
    projectId: number,
    requiredPermission: GraphPermission = GraphPermission.READ
  ): Promise<boolean> {
    try {
      const repos = getRepositories();
      const project = await repos.projects.findById(projectId);

      if (!project || project.deletedAt) return false;

      const user = await repos.users.findById(userId);
      if (!user) return false;

      if (project.teamId !== user.teamId) return false;

      return true;
    } catch (error) {
      console.error('Error checking project access:', error);
      return false;
    }
  }

  static async canAccessJob(userId: number, jobId: string): Promise<boolean> {
    try {
      const repos = getRepositories();
      const job = await repos.generationJobs.findByUuid(jobId);

      if (!job) return false;

      const project = await repos.projects.findById(job.projectId);
      if (!project) return false;

      const user = await repos.users.findById(userId);
      if (!user) return false;

      return user.teamId === project.teamId;
    } catch (error) {
      console.error('Error checking job access:', error);
      return false;
    }
  }

  static async getUserAccessibleProjects(userId: number) {
    try {
      const repos = getRepositories();
      const user = await repos.users.findById(userId);

      if (!user || !user.teamId) return [];

      const all = await repos.projects.findAll();
      return all
        .filter(p => p.teamId === user.teamId && !p.deletedAt)
        .sort((a, b) => (new Date(b.createdAt ?? 0).getTime() - new Date(a.createdAt ?? 0).getTime()));
    } catch (error) {
      console.error('Error getting user projects:', error);
      return [];
    }
  }

  static async canCreateProjects(userId: number, teamId: number): Promise<boolean> {
    try {
      const repos = getRepositories();
      const user = await repos.users.findById(userId);

      if (!user) return false;

      return user.teamId === teamId;
    } catch (error) {
      console.error('Error checking project creation permissions:', error);
      return false;
    }
  }

  static async getUserTeamContext(userId: number) {
    try {
      const repos = getRepositories();
      return await repos.users.findById(userId);
    } catch (error) {
      console.error('Error getting user team context:', error);
      return null;
    }
  }

  static async isTeamAdmin(userId: number, teamId: number): Promise<boolean> {
    try {
      const repos = getRepositories();
      const user = await repos.users.findById(userId);

      if (!user || user.teamId !== teamId) return false;

      return user.role === 'admin' || user.role === 'manager';
    } catch (error) {
      console.error('Error checking team admin status:', error);
      return false;
    }
  }

  private static getPermissionLevel(permission: string): number {
    switch (permission) {
      case GraphPermission.READ: return 1;
      case GraphPermission.WRITE: return 2;
      case GraphPermission.ADMIN: return 3;
      default: return 0;
    }
  }

  static hasSufficientPermission(
    userPermission: string, 
    requiredPermission: string
  ): boolean {
    const userLevel = this.getPermissionLevel(userPermission);
    const requiredLevel = this.getPermissionLevel(requiredPermission);
    
    return userLevel >= requiredLevel;
  }
}