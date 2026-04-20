import { createAsyncThunk } from '@reduxjs/toolkit';
import type { Organization } from '@/types/canvas';
import * as organizationApi from '@/store/api/organizationApi';
import {
  setOrganizations,
  addOrganization,
  updateOrganization as updateOrganizationAction,
  deleteOrganization as deleteOrganizationAction,
} from './organizationSlice';
import type { RootState } from '@/store';

/**
 * Organization Async Thunks
 * Provides async actions for organization API operations
 */

/**
 * Fetch all organizations from the API
 */
export const fetchOrganizationsThunk = createAsyncThunk<
  Organization[],
  void,
  { rejectValue: string; state: RootState }
>(
  'organization/fetchOrganizations',
  async (_, { dispatch, rejectWithValue }) => {
    try {
      const organizations = await organizationApi.fetchOrganizations();
      dispatch(setOrganizations(organizations));
      return organizations;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to fetch organizations';
      return rejectWithValue(message);
    }
  }
);

/**
 * Fetch a single organization by ID from the API
 */
export const fetchOrganizationByIdThunk = createAsyncThunk<
  Organization | null,
  string,
  { rejectValue: string; state: RootState }
>(
  'organization/fetchOrganizationById',
  async (organizationId, { rejectWithValue }) => {
    try {
      const organization = await organizationApi.fetchOrganizationById(organizationId);
      return organization;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to fetch organization';
      return rejectWithValue(message);
    }
  }
);

/**
 * Create a new organization via the API
 */
export const createOrganizationThunk = createAsyncThunk<
  Organization,
  organizationApi.CreateOrganizationInput,
  { rejectValue: string; state: RootState }
>(
  'organization/createOrganization',
  async (input, { dispatch, rejectWithValue }) => {
    try {
      const organization = await organizationApi.createOrganization(input);
      dispatch(addOrganization(organization));
      return organization;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create organization';
      return rejectWithValue(message);
    }
  }
);

/**
 * Update an existing organization via the API
 */
export const updateOrganizationThunk = createAsyncThunk<
  Organization,
  organizationApi.UpdateOrganizationInput,
  { rejectValue: string; state: RootState }
>(
  'organization/updateOrganization',
  async (input, { dispatch, rejectWithValue }) => {
    try {
      const organization = await organizationApi.updateOrganization(input);
      dispatch(updateOrganizationAction({ id: input.id, updates: organization }));
      return organization;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update organization';
      return rejectWithValue(message);
    }
  }
);

/**
 * Delete an organization via the API
 */
export const deleteOrganizationThunk = createAsyncThunk<
  string,
  string,
  { rejectValue: string; state: RootState }
>(
  'organization/deleteOrganization',
  async (organizationId, { dispatch, rejectWithValue }) => {
    try {
      await organizationApi.deleteOrganization(organizationId);
      dispatch(deleteOrganizationAction(organizationId));
      return organizationId;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to delete organization';
      return rejectWithValue(message);
    }
  }
);
