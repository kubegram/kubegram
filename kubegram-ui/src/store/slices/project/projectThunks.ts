import { createAsyncThunk } from '@reduxjs/toolkit';
import type { Project } from '@/types/canvas';
import * as projectApi from '@/store/api/projectApi';
import {
  setProject,
  clearProject,
} from './projectSlice';
import type { RootState } from '@/store';

/**
 * Project Async Thunks
 * Provides async actions for project API operations
 */

/**
 * Fetch all projects from the API
 */
export const fetchProjectsThunk = createAsyncThunk<
  Project[],
  void,
  { rejectValue: string; state: RootState }
>(
  'project/fetchProjects',
  async (_, { getState, rejectWithValue }) => {
    try {
      const state = getState();
      const token = state.oauth.accessToken;

      const projects = await projectApi.fetchProjects(token || undefined);
      return projects;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to fetch projects';
      return rejectWithValue(message);
    }
  }
);

/**
 * Fetch a single project by ID from the API
 */
export const fetchProjectByIdThunk = createAsyncThunk<
  Project | null,
  string,
  { rejectValue: string; state: RootState }
>(
  'project/fetchProjectById',
  async (projectId, { dispatch, getState, rejectWithValue }) => {
    try {
      const state = getState();
      const token = state.oauth.accessToken;

      const project = await projectApi.fetchProjectById(projectId, token || undefined);
      if (project) {
        dispatch(setProject(project));
      }
      return project;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to fetch project';
      return rejectWithValue(message);
    }
  }
);

/**
 * Create a new project via the API
 */
export const createProjectThunk = createAsyncThunk<
  Project,
  projectApi.CreateProjectInput,
  { rejectValue: string; state: RootState }
>(
  'project/createProject',
  async (input, { dispatch, getState, rejectWithValue }) => {
    try {
      const state = getState();
      const token = state.oauth.accessToken;

      const project = await projectApi.createProject(input, token || undefined);
      dispatch(setProject(project));
      return project;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create project';
      return rejectWithValue(message);
    }
  }
);

/**
 * Update an existing project via the API
 */
export const updateProjectThunk = createAsyncThunk<
  Project,
  projectApi.UpdateProjectInput,
  { rejectValue: string; state: RootState }
>(
  'project/updateProject',
  async (input, { dispatch, getState, rejectWithValue }) => {
    try {
      const state = getState();
      const token = state.oauth.accessToken;

      const project = await projectApi.updateProject(input, token || undefined);
      dispatch(setProject(project));
      return project;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update project';
      return rejectWithValue(message);
    }
  }
);

/**
 * Delete a project via the API
 */
export const deleteProjectThunk = createAsyncThunk<
  string,
  string,
  { rejectValue: string; state: RootState }
>(
  'project/deleteProject',
  async (projectId, { dispatch, getState, rejectWithValue }) => {
    try {
      const state = getState();
      const token = state.oauth.accessToken;

      await projectApi.deleteProject(projectId, token || undefined);
      dispatch(clearProject());
      return projectId;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to delete project';
      return rejectWithValue(message);
    }
  }
);

/**
 * Save project graph via the API
 */
export const saveProjectGraphThunk = createAsyncThunk<
  Project,
  { projectId: string; graph: Parameters<typeof projectApi.saveProjectGraph>[1] },
  { rejectValue: string; state: RootState }
>(
  'project/saveProjectGraph',
  async ({ projectId, graph }, { dispatch, getState, rejectWithValue }) => {
    try {
      const state = getState();
      const token = state.oauth.accessToken;

      const project = await projectApi.saveProjectGraph(projectId, graph, token || undefined);
      dispatch(setProject(project));
      return project;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to save project graph';
      return rejectWithValue(message);
    }
  }
);

// ============================================================================
// Graph Node Thunks
// ============================================================================

/**
 * Add a node to the project graph via the API
 */
export const addNodeToGraphThunk = createAsyncThunk<
  Project,
  projectApi.AddNodeInput,
  { rejectValue: string; state: RootState }
>(
  'project/addNodeToGraph',
  async (input, { dispatch, getState, rejectWithValue }) => {
    try {
      const state = getState();
      const token = state.oauth.accessToken;

      const project = await projectApi.addNodeToGraph(input, token || undefined);
      dispatch(setProject(project));
      return project;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to add node to graph';
      return rejectWithValue(message);
    }
  }
);

/**
 * Update a node in the project graph via the API
 */
export const updateNodeInGraphThunk = createAsyncThunk<
  Project,
  projectApi.UpdateNodeInput,
  { rejectValue: string; state: RootState }
>(
  'project/updateNodeInGraph',
  async (input, { dispatch, getState, rejectWithValue }) => {
    try {
      const state = getState();
      const token = state.oauth.accessToken;

      const project = await projectApi.updateNodeInGraph(input, token || undefined);
      dispatch(setProject(project));
      return project;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update node in graph';
      return rejectWithValue(message);
    }
  }
);

/**
 * Remove a node from the project graph via the API
 */
export const removeNodeFromGraphThunk = createAsyncThunk<
  Project,
  projectApi.RemoveNodeInput,
  { rejectValue: string; state: RootState }
>(
  'project/removeNodeFromGraph',
  async (input, { dispatch, getState, rejectWithValue }) => {
    try {
      const state = getState();
      const token = state.oauth.accessToken;

      const project = await projectApi.removeNodeFromGraph(input, token || undefined);
      dispatch(setProject(project));
      return project;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to remove node from graph';
      return rejectWithValue(message);
    }
  }
);

// ============================================================================
// Graph Edge Thunks
// ============================================================================

/**
 * Add an edge to the project graph via the API
 */
export const addEdgeToGraphThunk = createAsyncThunk<
  Project,
  projectApi.AddEdgeInput,
  { rejectValue: string; state: RootState }
>(
  'project/addEdgeToGraph',
  async (input, { dispatch, getState, rejectWithValue }) => {
    try {
      const state = getState();
      const token = state.oauth.accessToken;

      const project = await projectApi.addEdgeToGraph(input, token || undefined);
      dispatch(setProject(project));
      return project;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to add edge to graph';
      return rejectWithValue(message);
    }
  }
);

/**
 * Update an edge in the project graph via the API
 */
export const updateEdgeInGraphThunk = createAsyncThunk<
  Project,
  projectApi.UpdateEdgeInput,
  { rejectValue: string; state: RootState }
>(
  'project/updateEdgeInGraph',
  async (input, { dispatch, getState, rejectWithValue }) => {
    try {
      const state = getState();
      const token = state.oauth.accessToken;

      const project = await projectApi.updateEdgeInGraph(input, token || undefined);
      dispatch(setProject(project));
      return project;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update edge in graph';
      return rejectWithValue(message);
    }
  }
);

/**
 * Remove an edge from the project graph via the API
 */
export const removeEdgeFromGraphThunk = createAsyncThunk<
  Project,
  projectApi.RemoveEdgeInput,
  { rejectValue: string; state: RootState }
>(
  'project/removeEdgeFromGraph',
  async (input, { dispatch, getState, rejectWithValue }) => {
    try {
      const state = getState();
      const token = state.oauth.accessToken;

      const project = await projectApi.removeEdgeFromGraph(input, token || undefined);
      dispatch(setProject(project));
      return project;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to remove edge from graph';
      return rejectWithValue(message);
    }
  }
);
