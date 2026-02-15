import type { CanvasGraph, CanvasNode, CanvasArrow, Project } from "@/types/canvas";
import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import { GraphQL } from "@kubegram/common-ts";

const ACTIVE_PROJECT_KEY = 'x-kubegram-active-project';
const PROJECT_SESSION_IDS = 'x-kubegram-session-ids';
const PROJECT_SYNC_KEY_PREFIX = 'x-kubegram-project-sync';

export const saveActiveProjectToStorage = (project: Project) => {
  console.log('💽 Writing project to localStorage', { id: project.id });
  try {
    localStorage.setItem(ACTIVE_PROJECT_KEY, project.id);

    // Always save/update the project data
    const sessionIds = localStorage.getItem(PROJECT_SESSION_IDS) ? JSON.parse(localStorage.getItem(PROJECT_SESSION_IDS)!) : [];
    if (!sessionIds.includes(project.id)) {
      sessionIds.push(project.id);
      localStorage.setItem(PROJECT_SESSION_IDS, JSON.stringify(sessionIds));
    }

    localStorage.setItem(`${PROJECT_SYNC_KEY_PREFIX}-${project.id}`, JSON.stringify(project));
    console.log('✅ Project saved successfully');
  } catch (e) {
    console.error('❌ Error saving project to storage:', e);
  }
};

export const loadActiveProjectFromStorage = () => {
  const activeProjectId = localStorage.getItem(ACTIVE_PROJECT_KEY);
  if (!activeProjectId) {
    return null;
  }
  const project = localStorage.getItem(`${PROJECT_SYNC_KEY_PREFIX}-${activeProjectId}`);
  if (!project) {
    return null;
  }
  return JSON.parse(project);
};

export const removeProjectFromStorage = (projectId: string) => {
  localStorage.removeItem(`${PROJECT_SYNC_KEY_PREFIX}-${projectId}`);
  
  // Also remove from session IDs list
  try {
    const sessionIds: string[] = localStorage.getItem(PROJECT_SESSION_IDS) ? JSON.parse(localStorage.getItem(PROJECT_SESSION_IDS)!) : [];
    const updated = sessionIds.filter(id => id !== projectId);
    localStorage.setItem(PROJECT_SESSION_IDS, JSON.stringify(updated));
    
    // If the deleted project was the active one, clear the active key
    const activeId = localStorage.getItem(ACTIVE_PROJECT_KEY);
    if (activeId === projectId) {
      localStorage.removeItem(ACTIVE_PROJECT_KEY);
    }
  } catch (e) {
    console.error('❌ Error cleaning up project from storage:', e);
  }
};

export const loadProjectFromStorage = (projectId: string) => {
  const project = localStorage.getItem(`${PROJECT_SYNC_KEY_PREFIX}-${projectId}`);
  if (!project) {
    return null;
  }
  return JSON.parse(project);
};

export const loadAllProjectsFromStorage = (): Project[] => {
  try {
    const sessionIds = localStorage.getItem(PROJECT_SESSION_IDS) ? JSON.parse(localStorage.getItem(PROJECT_SESSION_IDS)!) : [];
    return sessionIds
      .map((id: string) => {
        try {
          const raw = localStorage.getItem(`${PROJECT_SYNC_KEY_PREFIX}-${id}`);
          return raw ? JSON.parse(raw) : null;
        } catch {
          return null;
        }
      })
      .filter((p: Project | null): p is Project => p !== null);
  } catch {
    return [];
  }
};

export const clearStorage = () => {
  localStorage.removeItem(ACTIVE_PROJECT_KEY);
  const sessionIds = localStorage.getItem(PROJECT_SESSION_IDS) ? JSON.parse(localStorage.getItem(PROJECT_SESSION_IDS)!) : [];
  sessionIds.forEach((id: string) => {
    localStorage.removeItem(`${PROJECT_SYNC_KEY_PREFIX}-${id}`);
  });
  localStorage.removeItem(PROJECT_SESSION_IDS);
};

interface ProjectState {
  project: Project | null;
  projects: Project[];
  isInitialized: boolean;
  lastUpdated: number;
  previousGraph: CanvasGraph | null;
}

const initialState: ProjectState = {
  project: null,
  projects: [],
  isInitialized: false,
  lastUpdated: 0,
  previousGraph: null,
};

const projectSlice = createSlice({
  name: 'project',
  initialState,
  reducers: {
    initializeProject: (state) => {
      state.isInitialized = true;
      state.lastUpdated = Date.now();
      const project = loadActiveProjectFromStorage();
      if (project) {
        state.project = project;
      } else {
        state.project = {
          id: crypto.randomUUID(),
          name: 'Untitled Project',
          graph: {
            companyId: '',
            graphType: GraphQL.GraphType.Abstract,
            id: crypto.randomUUID(),
            name: '',
            userId: '',
            nodes: [] as CanvasNode[],
          }
        }
      }
      saveActiveProjectToStorage(state.project!);
    },
    createNewProject: (state) => {
      // Save the current project into the projects list before replacing it
      if (state.project && !state.projects.find(p => p.id === state.project!.id)) {
        state.projects.push(state.project);
      }
      
      state.project = {
        id: crypto.randomUUID(),
        name: 'Untitled Project',
        graph: {
          companyId: '',
          graphType: GraphQL.GraphType.Abstract,
          id: crypto.randomUUID(),
          name: '',
          userId: '',
          nodes: [] as CanvasNode[],
        }
      }
      
      // Add the new project to the list as well
      state.projects.push(state.project);
      
      saveActiveProjectToStorage(state.project!);
    },
    setActiveProject: (state, action: PayloadAction<string>) => {
      const project = state.projects.find(p => p.id === action.payload);
      if (project) {
        state.project = project;
        saveActiveProjectToStorage(project);
      }
    },
    updateProject: (state, action: PayloadAction<{ id: string; updates: Partial<Project> }>) => {
      const { id, updates } = action.payload;
      if (state.project?.id === id) {
        state.project = { ...state.project, ...updates };
        saveActiveProjectToStorage(state.project);
      }
      
      const idx = state.projects.findIndex(p => p.id === id);
      if (idx >= 0) {
        state.projects[idx] = { ...state.projects[idx], ...updates };
      }
    },
    setProject: (state, action: PayloadAction<Project>) => {
      state.project = action.payload;
      state.isInitialized = true;
      state.lastUpdated = Date.now();
      
      // Keep projects list in sync
      const idx = state.projects.findIndex(p => p.id === action.payload.id);
      if (idx >= 0) {
        state.projects[idx] = action.payload;
      } else {
        state.projects.push(action.payload);
      }
    },
    updateProjectName: (state, action: PayloadAction<string>) => {
      if (state.project) {
        state.project.name = action.payload;
        state.lastUpdated = Date.now();
        saveActiveProjectToStorage(state.project);
      }
    },
    clearProject: (state) => {
      state.project = null;
      state.isInitialized = false;
      state.lastUpdated = 0;
    },
    addNodeToGraph: (state, action: PayloadAction<{ nodeId: string; canvasNode: CanvasNode }>) => {
      if (!state.project) {
        return;
      }
      if (!state.project.graph) {
        state.project.graph = {
          companyId: '',
          graphType: GraphQL.GraphType.Abstract,
          id: '',
          name: '',
          userId: '',
          nodes: [] as CanvasNode[],
        };
      }
      if (!state.project.graph.nodes) {
        state.project.graph.nodes = [] as CanvasNode[];
      }
      state.project.graph.nodes.push(action.payload.canvasNode);
      saveActiveProjectToStorage(state.project);
    },
    removeNodeFromGraph: (state, action: PayloadAction<{ nodeId: string }>) => {
      if (!state.project) {
        return;
      }
      if (!state.project.graph.nodes) {
        state.project.graph.nodes = [] as CanvasNode[];
      }
      state.project.graph.nodes = state.project.graph.nodes.filter(node => node && node.id !== action.payload.nodeId);
      saveActiveProjectToStorage(state.project);
    },
    updateNodeInGraph: (state, action: PayloadAction<{ nodeId: string; canvasNode: CanvasNode }>) => {
      if (!state.project) {
        return;
      }
      if (!state.project.graph.nodes) {
        state.project.graph.nodes = [] as CanvasNode[];
      }
      state.project.graph.nodes = state.project.graph.nodes.map(node => node && node.id === action.payload.nodeId ? action.payload.canvasNode : node);
      saveActiveProjectToStorage(state.project);
    },
    addEdgeToGraph: (state, action: PayloadAction<{ startNode: CanvasNode; canvasEdge: CanvasArrow }>) => {
      if (!state.project || !state.project.graph || !state.project.graph.nodes) {
        return;
      }
      const targetNode = state.project.graph.nodes.find(node => node && node.id === action.payload.startNode.id);
      if (!targetNode) {
        return;
      }
      if (!targetNode.edges) {
        targetNode.edges = [];
      }
      targetNode.edges.push(action.payload.canvasEdge);
      saveActiveProjectToStorage(state.project);
    },
    updateEdgeInGraph: (state, action: PayloadAction<{ nodeId: string; canvasEdge: CanvasArrow }>) => {
      if (!state.project || !state.project.graph || !state.project.graph.nodes) {
        return;
      }
      const targetNode = state.project.graph.nodes.find(node => node && node.id === action.payload.nodeId);
      if (!targetNode) {
        return;
      }
      if (!targetNode.edges) {
        targetNode.edges = [];
      }
      targetNode.edges = targetNode.edges.map(edge => edge?.node.id === action.payload.canvasEdge.node.id && edge.connectionType === action.payload.canvasEdge.connectionType ? action.payload.canvasEdge : edge);
      saveActiveProjectToStorage(state.project);
    },
    removeEdgeFromGraph: (state, action: PayloadAction<{ nodeId: string; canvasEdge: CanvasArrow }>) => {
      if (!state.project || !state.project.graph || !state.project.graph.nodes) {
        return;
      }
      const targetNode = state.project.graph.nodes.find(node => node && node.id === action.payload.nodeId);
      if (!targetNode) {
        return;
      }
      if (!targetNode.edges) {
        targetNode.edges = [];
      }
      targetNode.edges = targetNode.edges.filter(edge => edge?.node.id === action.payload.canvasEdge.node.id && edge.connectionType === action.payload.canvasEdge.connectionType);
      saveActiveProjectToStorage(state.project);
    },
    updateGraph: (state, action: PayloadAction<{ graph: CanvasGraph }>) => {
      if (!state.project) {
        console.warn('⚠️ updateGraph called but no active project');
        return;
      }
      console.log('💾 updateGraph called, saving to storage', {
        nodeCount: action.payload.graph.nodes?.length
      });
      state.project.graph = action.payload.graph;
      saveActiveProjectToStorage(state.project);
    },
    clearGraph: (state) => {
      if (!state.project) {
        return;
      }
      state.project.graph = {
        companyId: state.project.graph?.companyId,
        graphType: state.project.graph?.graphType,
        id: state.project.graph?.id,
        name: state.project.graph?.name,
        userId: state.project.graph?.userId,
        nodes: [] as CanvasNode[],
      };
      saveActiveProjectToStorage(state.project);
    },
    loadAllProjects: (state) => {
      state.projects = loadAllProjectsFromStorage();
    },
    removeProject: (state, action: PayloadAction<string>) => {
      const projectId = action.payload;
      state.projects = state.projects.filter(p => p.id !== projectId);
      
      if (state.project?.id === projectId) {
        state.project = null;
      }
      
      removeProjectFromStorage(projectId);
    },
    saveCurrentAsPrevious: (state) => {
      if (state.project && state.project.graph) {
        state.previousGraph = JSON.parse(JSON.stringify(state.project.graph));
      }
    },
    restorePreviousGraph: (state) => {
      if (state.project && state.previousGraph) {
        const temp = JSON.parse(JSON.stringify(state.project.graph));
        state.project.graph = JSON.parse(JSON.stringify(state.previousGraph));
        state.previousGraph = temp; // Swap so you can undo the undo
        saveActiveProjectToStorage(state.project);
      }
    }
  }
});

// Export actions
export const {
  initializeProject,
  createNewProject,
  setActiveProject,
  updateProject,
  setProject,
  clearProject,
  addNodeToGraph,
  removeNodeFromGraph,
  updateNodeInGraph,
  addEdgeToGraph,
  updateEdgeInGraph,
  removeEdgeFromGraph,
  updateGraph,
  clearGraph,
  loadAllProjects,
  removeProject,
  saveCurrentAsPrevious,
  restorePreviousGraph,
  updateProjectName,
} = projectSlice.actions;

// Export reducer
export default projectSlice.reducer;