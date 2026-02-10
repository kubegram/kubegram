import type { CanvasGraph } from '@/types/canvas';

/**
 * Entity types for canvas state
 */

/**
 * User information
 */
export interface UserInfo {
    id: string;
    name: string;
    email: string;
    role: string;
    avatar: string;
}

/**
 * Organization information
 */
export interface OrganizationInfo {
    id: string;
    name: string;
    avatar?: string;
}

/**
 * Company information
 */
export interface CompanyInfo {
    id: string;
    name: string;
    avatar?: string;
}

/**
 * Project information with canvas graph
 */
export interface ProjectInfo {
    id: string;
    name: string;
    avatar?: string;
    graphId: string;
    canvasGraph: CanvasGraph;
}

/**
 * Active graph information
 */
export interface ActiveGraphInfo {
    id: string;
    name: string;
    avatar?: string;
    graphId: string;
    canvasGraph: CanvasGraph;
}
