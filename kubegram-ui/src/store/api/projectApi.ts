
// import { graphqlSdk } from '@/lib/graphql-client';
import type { Project, CanvasGraph } from '@/types/canvas';
import { GraphQL } from '@/lib/graphql-client';
import { apiClient, getApiConfig } from '@/lib/api/axiosClient';

/**
 * Backend Interfaces (matching Swagger)
 */
interface BackendGraph {
    id: string;
    name: string;
    description?: string;
    graphType?: string;
    companyId?: string;
    userId?: string;
    nodes: string; // JSON string
    bridges: string; // JSON string
    createdAt?: string;
    updatedAt?: string;
}

interface BackendProject {
    id: number;
    name: string;
    graphId?: string;
    graphMeta?: string;
    createdAt?: string;
    updatedAt?: string;
    deletedAt?: any;
}

/**
 * Mappers
 */
const mapBackendGraphToFrontend = (bg: BackendGraph): CanvasGraph => {
    let nodes: any[] = [];
    let arrows: any[] = [];
    try {
        nodes = JSON.parse(bg.nodes || '[]');
        arrows = JSON.parse(bg.bridges || '[]');
    } catch (e) {
        console.error('Failed to parse graph data', e);
    }
    return {
        id: bg.id,
        name: bg.name,
        companyId: bg.companyId,
        userId: bg.userId,
        nodes,
        arrows
    } as unknown as CanvasGraph;
};

const mapFrontendGraphToBackend = (fg: CanvasGraph | GraphQL.Graph): Partial<BackendGraph> => {
    const canvasGraph = fg as any; // Cast to access potential extra props if needed
    return {
        name: fg.name || 'Untitled Graph',
        description: (fg as any).description,
        graphType: (fg as any).graphType || 'KUBERNETES',
        nodes: JSON.stringify(canvasGraph.nodes || []),
        bridges: JSON.stringify(canvasGraph.arrows || [])
    };
};

/**
 * Project API Service
 * Provides typed API functions for project operations
 */

export interface CreateProjectInput {
    name: string;
    graph?: CanvasGraph | GraphQL.Graph;
}

export interface UpdateProjectInput {
    id: string;
    name?: string;
    graph?: CanvasGraph | GraphQL.Graph;
}

/**
 * Fetch all projects for the current user
 * Note: Returned projects contain empty/placeholder graphs to avoid N+1 fetches.
 * Use fetchProjectById to get full graph data.
 */
export const fetchProjects = async (token?: string): Promise<Project[]> => {
    const response = await apiClient.get<BackendProject[]>(
        '/api/v1/public/projects',
        token ? getApiConfig(token) : undefined
    );

    return response.data.map((bp: BackendProject) => ({
        id: bp.id.toString(),
        name: bp.name,
        graph: {
            id: bp.graphId || '',
            name: bp.name,
            nodes: [],
            arrows: []
        } as unknown as CanvasGraph
    }));
};

/**
 * Fetch a single project by ID with full graph data
 */
export const fetchProjectById = async (projectId: string, token?: string): Promise<Project | null> => {
    try {
        // 1. Fetch Project
        const projectResponse = await apiClient.get<BackendProject>(
            `/api/v1/public/projects/${projectId}`,
            token ? getApiConfig(token) : undefined
        );
        const bp = projectResponse.data;

        // 2. Fetch Graph if graphId exists
        let graph: CanvasGraph | null = null;
        if (bp.graphId) {
            try {
                const graphResponse = await apiClient.get<{ graph: BackendGraph }>(
                    `/api/v1/public/graph/crud/${bp.graphId}`,
                    token ? getApiConfig(token) : undefined
                );
                graph = mapBackendGraphToFrontend(graphResponse.data.graph);
            } catch (e) {
                console.error(`Failed to fetch graph for project ${projectId}`, e);
            }
        }

        // 3. Return combined object
        return {
            id: bp.id.toString(),
            name: bp.name,
            graph: graph || {
                id: bp.graphId || '',
                name: bp.name,
                nodes: [],
                arrows: []
            } as any
        };

    } catch (error: any) {
        if (error.response?.status === 404) {
            return null;
        }
        throw error;
    }
};

/**
 * Create a new project
 * 1. Create Graph
 * 2. Create Project with graphId
 */
export const createProject = async (input: CreateProjectInput, token?: string): Promise<Project> => {
    // 1. Create Graph
    let graphId = '';
    let createdGraph: CanvasGraph | null = null;

    if (input.graph) {
        const backendGraphPayload = mapFrontendGraphToBackend(input.graph);
        // Ensure required fields for creation
        const graphInput = {
            ...backendGraphPayload,
            name: input.name + ' Graph',
            companyId: '1', // Default or from context? TODO
            userId: '1' // Default or from context? TODO
        };

        console.log('Creating graph for new project...', JSON.stringify({ 
                    ...graphInput,
                    name: graphInput.name ?? input.name + ' Infra',
                    description: graphInput.description ?? `Graph for project ${input.name}`,
                }));
        try {
            const graphRes = await apiClient.post<{ graph: BackendGraph }>(
                '/api/v1/public/graph/crud',
                { 
                    ...graphInput,
                    name: graphInput.name || input.name + ' Infra',
                    description: graphInput.description || `Graph for project ${input.name}`,
                },
                token ? getApiConfig(token) : undefined
            );
            createdGraph = mapBackendGraphToFrontend(graphRes.data.graph);
            graphId = createdGraph.id;
        } catch (e) {
            console.error('Failed to create graph for new project', e);
            // Fallback? Or fail? failing might be better
            throw e;
        }
    }

    // 2. Create Project
    const projectRes = await apiClient.post<BackendProject>(
        '/api/v1/public/projects',
        {
            name: input.name,
            graphId: graphId,
            graphMeta: '{}'
        },
        token ? getApiConfig(token) : undefined
    );
    const bp = projectRes.data;

    return {
        id: bp.id.toString(),
        name: bp.name,
        graph: createdGraph || { id: graphId, name: input.name, nodes: [], arrows: [] } as any
    };
};

/**
 * Update an existing project
 */
export const updateProject = async (input: UpdateProjectInput, token?: string): Promise<Project> => {
    // 1. Update Project details
    const projectRes = await apiClient.put<BackendProject>(
        `/api/v1/public/projects/${input.id.toString()}`,
        { name: input.name },
        token ? getApiConfig(token) : undefined
    );
    const bp = projectRes.data;

    // 2. Update Graph if provided
    let updatedGraph: CanvasGraph | null = null;
    if (input.graph) {
        // If graph is provided, we save it. 
        // We need to know the graphId. 
        // Strategy: Use saveProjectGraph logic, but distinct here since we might have graph ID in input.graph

        // Optimistically use input.graph.id if available, otherwise use bp.graphId
        const graphId = (input.graph as any).id || bp.graphId;

        if (graphId) {
            const payload = mapFrontendGraphToBackend(input.graph);
            try {
                const graphRes = await apiClient.put<{ graph: BackendGraph }>(
                    `/api/v1/public/graph/crud/${graphId}`,
                    { graph: payload },
                    token ? getApiConfig(token) : undefined
                );
                updatedGraph = mapBackendGraphToFrontend(graphRes.data.graph);
            } catch (e) {
                console.error('Failed to update graph for project', e);
            }
        }
    } else {
        // Fetch existing graph to return complete project object? 
        // Or if not provided, maybe we just return what we have (Project) and let caller re-fetch if needed.
        // For consistency with fetchProjectById, ideally we return the graph.
        // But to save bandwidth, if caller didn't update graph, maybe they don't need it back immediately?
        // Let's stick to returning what we can.
    }

    // Reconstruct Project
    // If we didn't update graph, we should ideally fetch it or return a placeholder if acceptable.
    // For now, returning placeholder if not updated/fetched to avoid extra call unless necessary.

    return {
        id: bp.id.toString(),
        name: bp.name,
        graph: updatedGraph || { id: bp.graphId || '', name: bp.name, nodes: [], arrows: [] } as any
    };
};

/**
 * Delete a project by ID
 */
export const deleteProject = async (projectId: string, token?: string): Promise<boolean> => {
    await apiClient.delete(
        `/api/v1/public/projects/${projectId}`,
        token ? getApiConfig(token) : undefined
    );
    return true;
};

/**
 * Save project graph
 */
export const saveProjectGraph = async (projectId: string, graph: CanvasGraph | GraphQL.Graph, token?: string): Promise<Project> => {
    // 1. Determine Graph ID
    let graphId = (graph as any).id;
    let backendProject: BackendProject | null = null;

    if (!graphId) {
        // Fetch project to get graphId
        const projectRes = await apiClient.get<BackendProject>(
            `/api/v1/public/projects/${projectId}`,
            token ? getApiConfig(token) : undefined
        );
        backendProject = projectRes.data;
        graphId = backendProject.graphId;
    }

    if (!graphId) {
        throw new Error(`No graph ID found for project ${projectId}`);
    }

    // 2. Save Graph
    const payload = mapFrontendGraphToBackend(graph);
    const graphRes = await apiClient.put<{ graph: BackendGraph }>(
        `/api/v1/public/graph/crud/${graphId}`,
        { graph: payload },
        token ? getApiConfig(token) : undefined
    );
    const updatedGraph = mapBackendGraphToFrontend(graphRes.data.graph);

    // 3. Return Project
    // If we fetched backendProject earlier, use it. Otherwise, might need to fetch it to return full Project.
    // To save a call, we can construct minimal Project if acceptable, but let's try to be correct.
    if (!backendProject) {
        const projectRes = await apiClient.get<BackendProject>(
            `/api/v1/public/projects/${projectId}`,
            token ? getApiConfig(token) : undefined
        );
        backendProject = projectRes.data;
    }

    return {
        id: backendProject.id.toString(),
        name: backendProject.name,
        graph: updatedGraph
    };
};

// ============================================================================
// Graph Node Operations
// ============================================================================

export interface AddNodeInput {
    projectId: string;
    node: import('@/types/canvas').CanvasNode;
}

export interface UpdateNodeInput {
    projectId: string;
    nodeId: string;
    node: import('@/types/canvas').CanvasNode;
}

export interface RemoveNodeInput {
    projectId: string;
    nodeId: string;
}

/**
 * Add a node to the project graph
 */
export const addNodeToGraph = async (input: AddNodeInput, token?: string): Promise<Project> => {
    // 1. Fetch current project
    const project = await fetchProjectById(input.projectId, token);
    if (!project) throw new Error(`Project ${input.projectId} not found`);

    const graph = project.graph as any; // Cast for manipulation

    // 2. Add node
    if (!graph.nodes) graph.nodes = [];
    graph.nodes.push(input.node);

    // 3. Save graph
    return saveProjectGraph(input.projectId, graph, token);
};

/**
 * Update a node in the project graph
 */
export const updateNodeInGraph = async (input: UpdateNodeInput, token?: string): Promise<Project> => {
    // 1. Fetch current project
    const project = await fetchProjectById(input.projectId, token);
    if (!project) throw new Error(`Project ${input.projectId} not found`);

    const graph = project.graph as any;

    // 2. Update node
    if (graph.nodes) {
        const index = graph.nodes.findIndex((n: any) => n.id === input.nodeId);
        if (index !== -1) {
            // Merge or replace? Usually replace for update
            graph.nodes[index] = input.node;
        }
    }

    // 3. Save graph
    return saveProjectGraph(input.projectId, graph, token);
};

/**
 * Remove a node from the project graph
 */
export const removeNodeFromGraph = async (input: RemoveNodeInput, token?: string): Promise<Project> => {
    // 1. Fetch current project
    const project = await fetchProjectById(input.projectId, token);
    if (!project) throw new Error(`Project ${input.projectId} not found`);

    const graph = project.graph as any;

    // 2. Remove node
    if (graph.nodes) {
        graph.nodes = graph.nodes.filter((n: any) => n.id !== input.nodeId);
    }
    // Also remove connected edges? 
    // Ideally frontend handles cascading deletes or backend. 
    // For manual helper here, let's just remove node.

    // 3. Save graph
    return saveProjectGraph(input.projectId, graph, token);
};

// ============================================================================
// Graph Edge Operations
// ============================================================================

export interface AddEdgeInput {
    projectId: string;
    sourceNodeId: string;
    edge: import('@/types/canvas').CanvasArrow;
}

export interface UpdateEdgeInput {
    projectId: string;
    nodeId: string;
    edge: import('@/types/canvas').CanvasArrow;
}

export interface RemoveEdgeInput {
    projectId: string;
    nodeId: string;
    edgeId: string;
}

/**
 * Add an edge to the project graph
 */
export const addEdgeToGraph = async (input: AddEdgeInput, token?: string): Promise<Project> => {
    // 1. Fetch current project
    const project = await fetchProjectById(input.projectId, token);
    if (!project) throw new Error(`Project ${input.projectId} not found`);

    const graph = project.graph as any;

    // 2. Add edge
    if (!graph.arrows) graph.arrows = [];
    graph.arrows.push(input.edge);

    // 3. Save graph
    return saveProjectGraph(input.projectId, graph, token);
};

/**
 * Update an edge in the project graph
 */
export const updateEdgeInGraph = async (input: UpdateEdgeInput, token?: string): Promise<Project> => {
    // 1. Fetch current project
    const project = await fetchProjectById(input.projectId, token);
    if (!project) throw new Error(`Project ${input.projectId} not found`);

    const graph = project.graph as any;

    // 2. Update edge
    if (graph.arrows) {
        const index = graph.arrows.findIndex((e: any) => e.id === input.edge.id); // input.edge usually contains ID
        // Wait, input has nodeId? 
        // UpdateEdgeInput: { projectId, nodeId, edge } - looks like nodeId might be irrelevant or used for context?
        // Assuming edge.id matches.
        if (index !== -1) {
            graph.arrows[index] = input.edge;
        }
    }

    // 3. Save graph
    return saveProjectGraph(input.projectId, graph, token);
};

/**
 * Remove an edge from the project graph
 */
export const removeEdgeFromGraph = async (input: RemoveEdgeInput, token?: string): Promise<Project> => {
    // 1. Fetch current project
    const project = await fetchProjectById(input.projectId, token);
    if (!project) throw new Error(`Project ${input.projectId} not found`);

    const graph = project.graph as any;

    // 2. Remove edge
    if (graph.arrows) {
        graph.arrows = graph.arrows.filter((e: any) => e.id !== input.edgeId);
    }

    // 3. Save graph
    return saveProjectGraph(input.projectId, graph, token);
};
