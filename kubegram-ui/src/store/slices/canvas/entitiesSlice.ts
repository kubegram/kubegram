import { createSlice, createAsyncThunk, type PayloadAction } from '@reduxjs/toolkit';
import { GraphQL } from '@/lib/graphql-client';
import type { CanvasNode } from '@/types/canvas';
import { getProviders, type LlmProvider } from '@/store/api/providers';
import type {
  UserInfo,
  OrganizationInfo,
  CompanyInfo,
  ProjectInfo,
  ActiveGraphInfo,
} from './types/entities';

/**
 * Async Thunks
 */
export const fetchLlmConfigs = createAsyncThunk(
  'canvas/entities/fetchLlmConfigs',
  async (_) => {
    // We might need to handle token here if not handled by axios interceptor
    const authData = localStorage.getItem('kubegram_auth');
    const token = authData ? JSON.parse(authData).accessToken : undefined;
    return await getProviders(token);
  }
);

/**
 * Initial entities state
 */
const initialState = {
  user: {
    id: '',
    name: '',
    email: '',
    role: '',
    avatar: '',
  } as UserInfo,

  organization: {
    id: '',
    name: '',
  } as OrganizationInfo,

  company: {
    id: '',
    name: '',
  } as CompanyInfo,

  projects: {} as Record<string, ProjectInfo>,

  activeGraph: {
    id: '',
    name: 'Untitled',
    graphId: '',
    canvasGraph: {
      companyId: '',
      graphType: GraphQL.GraphType.Abstract,
      id: '',
      name: 'Untitled',
      userId: '',
      nodes: [] as CanvasNode[],
    },
  } as ActiveGraphInfo,

  llmConfigs: [] as LlmProvider[],
  selectedLlmProvider: undefined as string | undefined,
  selectedLlmModel: undefined as string | undefined,
};

/**
 * Canvas entities slice
 * Manages user, organization, company, projects, and active graph information
 */
const entitiesSlice = createSlice({
  name: 'canvas/entities',
  initialState,
  reducers: {
    // User
    setUser: (state, action: PayloadAction<UserInfo>) => {
      state.user = action.payload;
    },

    // Organization
    setOrganization: (state, action: PayloadAction<OrganizationInfo>) => {
      state.organization = action.payload;
    },

    // Company
    setCompany: (state, action: PayloadAction<CompanyInfo>) => {
      state.company = action.payload;
    },

    // Projects
    addProject: (state, action: PayloadAction<ProjectInfo>) => {
      state.projects[action.payload.id] = action.payload;
    },
    removeProject: (state, action: PayloadAction<string>) => {
      delete state.projects[action.payload];
    },
    setProjects: (state, action: PayloadAction<Record<string, ProjectInfo>>) => {
      state.projects = action.payload;
    },

    // Active Graph
    setActiveGraph: (state, action: PayloadAction<ActiveGraphInfo>) => {
      state.activeGraph = action.payload;
    },
    updateActiveGraphName: (state, action: PayloadAction<string>) => {
      state.activeGraph.name = action.payload;
    },

    // LLM Configs
    setLlmConfigs: (state, action: PayloadAction<LlmProvider[]>) => {
      state.llmConfigs = action.payload;
    },
    setSelectedLlmProvider: (state, action: PayloadAction<string | undefined>) => {
      state.selectedLlmProvider = action.payload;
    },
    setSelectedLlmModel: (state, action: PayloadAction<string | undefined>) => {
      state.selectedLlmModel = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder.addCase(fetchLlmConfigs.fulfilled, (state, action) => {
      state.llmConfigs = action.payload;
      // Auto-select first provider/model if none selected
      if (!state.selectedLlmProvider && action.payload.length > 0) {
        const firstConfig = action.payload[0] as any;
        state.selectedLlmProvider = firstConfig.provider;
        if (firstConfig.models && firstConfig.models.length > 0) {
          state.selectedLlmModel = firstConfig.models[0];
        }
      }
    });
  },
});

export const {
  setUser,
  setOrganization,
  setCompany,
  addProject,
  removeProject,
  setProjects,
  setActiveGraph,
  updateActiveGraphName,
  setLlmConfigs,
  setSelectedLlmProvider,
  setSelectedLlmModel,
} = entitiesSlice.actions;

export default entitiesSlice.reducer;
