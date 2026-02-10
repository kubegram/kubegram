/**
 * Graph Permissions Service
 * 
 * Handles permission validation for project-based access control.
 * Enforces team membership requirements for graph/codegen operations.
 */

import { db } from '@/db';
import { projects, users, generationJobs } from '@/db/schema';
import { eq, and, isNull, desc } from 'drizzle-orm';

export enum GraphPermission {
  READ = 'read',
  WRITE = 'write',
  ADMIN = 'admin'
}

export class GraphPermissions {
  /**
   * Check if user can access a project (team member check)
   * 
   * @param userId - User ID to check
   * @param projectId - Project ID to access
   * @param requiredPermission - Minimum permission required (default: READ)
   * @returns Promise<boolean> - True if user has access
   */
  static async canAccessProject(
    userId: number,
    projectId: number,
    requiredPermission: GraphPermission = GraphPermission.READ
  ): Promise<boolean> {
    try {
      const [project] = await db.select()
        .from(projects)
        .where(eq(projects.id, projectId))
        .limit(1);

      if (!project || project.deletedAt) return false;

      const [user] = await db.select()
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);

      if (!user) return false;

      // Check if user is in the same team
      if (project.teamId !== user.teamId) return false;

      // All team members have full access to team projects
      return true;
    } catch (error) {
      console.error('Error checking project access:', error);
      return false;
    }
  }

  /**
   * Check if user can access a generation job
   * 
   * @param userId - User ID to check
   * @param jobId - Job UUID to access
   * @returns Promise<boolean> - True if user has access
   */
  static async canAccessJob(userId: number, jobId: string): Promise<boolean> {
    try {
      const [job] = await db.select()
        .from(generationJobs)
        .where(eq(generationJobs.uuid, jobId))
        .limit(1);

      if (!job) return false;

      const [project] = await db.select()
        .from(projects)
        .where(eq(projects.id, job.projectId))
        .limit(1);

      if (!project) return false;

      const [user] = await db.select()
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);

      if (!user) return false;

      // User must be in the same team as the project
      return user.teamId === project.teamId;
    } catch (error) {
      console.error('Error checking job access:', error);
      return false;
    }
  }

  /**
   * Get all projects accessible to a user (team projects)
   * 
   * @param userId - User ID
   * @returns Promise<Project[]> - Array of accessible projects
   */
  static async getUserAccessibleProjects(userId: number) {
    try {
      const [user] = await db.select()
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);

      if (!user || !user.teamId) return [];

      return await db.select()
        .from(projects)
        .where(and(
          eq(projects.teamId, user.teamId),
          isNull(projects.deletedAt)
        ))
        .orderBy(desc(projects.createdAt));
    } catch (error) {
      console.error('Error getting user projects:', error);
      return [];
    }
  }

  /**
   * Check if user can create projects in a team
   * 
   * @param userId - User ID
   * @param teamId - Team ID
   * @returns Promise<boolean> - True if user can create projects
   */
  static async canCreateProjects(userId: number, teamId: number): Promise<boolean> {
    try {
      const [user] = await db.select()
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);

      if (!user) return false;

      // User must be a member of the team
      return user.teamId === teamId;
    } catch (error) {
      console.error('Error checking project creation permissions:', error);
      return false;
    }
  }

  /**
   * Validate team membership and get user context
   * 
   * @param userId - User ID
   * @returns Promise<User | null> - User with team context
   */
  static async getUserTeamContext(userId: number) {
    try {
      const [user] = await db.select()
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);

      return user || null;
    } catch (error) {
      console.error('Error getting user team context:', error);
      return null;
    }
  }

  /**
   * Check if user is admin of team (for elevated operations)
   * 
   * @param userId - User ID
   * @param teamId - Team ID
   * @returns Promise<boolean> - True if user is team admin
   */
  static async isTeamAdmin(userId: number, teamId: number): Promise<boolean> {
    try {
      const [user] = await db.select()
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);

      if (!user || user.teamId !== teamId) return false;

      // Admin role - can be extended with role-based permissions
      return user.role === 'admin' || user.role === 'manager';
    } catch (error) {
      console.error('Error checking team admin status:', error);
      return false;
    }
  }

  /**
   * Get permission level as number for comparison
   * 
   * @param permission - Permission string
   * @returns number - Permission level (1=read, 2=write, 3=admin)
   */
  private static getPermissionLevel(permission: string): number {
    switch (permission) {
      case GraphPermission.READ: return 1;
      case GraphPermission.WRITE: return 2;
      case GraphPermission.ADMIN: return 3;
      default: return 0;
    }
  }

  /**
   * Check if user permission meets or exceeds required level
   * 
   * @param userPermission - User's current permission
   * @param requiredPermission - Minimum required permission
   * @returns boolean - True if user has sufficient permissions
   */
  static hasSufficientPermission(
    userPermission: string, 
    requiredPermission: string
  ): boolean {
    const userLevel = this.getPermissionLevel(userPermission);
    const requiredLevel = this.getPermissionLevel(requiredPermission);
    
    return userLevel >= requiredLevel;
  }
}