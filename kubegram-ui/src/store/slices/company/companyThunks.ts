import { createAsyncThunk } from '@reduxjs/toolkit';
import type { Company } from '@/types/canvas';
import * as companyApi from '@/store/api/companyApi';
import {
  setCompanies,
  addCompany,
  updateCompany as updateCompanyAction,
  deleteCompany as deleteCompanyAction,
  setLoading,
  setError,
} from './companySlice';
import type { RootState } from '@/store';

/**
 * Company Async Thunks
 * Provides async actions for company API operations
 */

/**
 * Fetch all companies from the API
 */
export const fetchCompaniesThunk = createAsyncThunk<
  Company[],
  void,
  { rejectValue: string; state: RootState }
>(
  'company/fetchCompanies',
  async (_, { dispatch, getState, rejectWithValue }) => {
    try {
      const state = getState();
      const token = state.oauth.accessToken;

      dispatch(setLoading(true));
      dispatch(setError(null));
      // token is string | null, API expects string | undefined. 
      // If null/undefined, it just won't send auth header which might be fine for some calls or handled by API
      const companies = await companyApi.fetchCompanies(token || undefined);
      dispatch(setCompanies(companies));
      return companies;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to fetch companies';
      dispatch(setError(message));
      return rejectWithValue(message);
    } finally {
      dispatch(setLoading(false));
    }
  }
);

/**
 * Fetch a single company by ID from the API
 */
export const fetchCompanyByIdThunk = createAsyncThunk<
  Company | null,
  string,
  { rejectValue: string; state: RootState }
>(
  'company/fetchCompanyById',
  async (companyId, { dispatch, getState, rejectWithValue }) => {
    try {
      const state = getState();
      const token = state.oauth.accessToken;

      dispatch(setLoading(true));
      dispatch(setError(null));
      const company = await companyApi.fetchCompanyById(companyId, token || undefined);
      return company;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to fetch company';
      dispatch(setError(message));
      return rejectWithValue(message);
    } finally {
      dispatch(setLoading(false));
    }
  }
);

/**
 * Create a new company via the API
 */
export const createCompanyThunk = createAsyncThunk<
  Company,
  companyApi.CreateCompanyInput,
  { rejectValue: string; state: RootState }
>(
  'company/createCompany',
  async (input, { dispatch, getState, rejectWithValue }) => {
    try {
      const state = getState();
      const token = state.oauth.accessToken;

      dispatch(setLoading(true));
      dispatch(setError(null));
      const company = await companyApi.createCompany(input, token || undefined);
      dispatch(addCompany(company));
      return company;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create company';
      dispatch(setError(message));
      return rejectWithValue(message);
    } finally {
      dispatch(setLoading(false));
    }
  }
);

/**
 * Update an existing company via the API
 */
export const updateCompanyThunk = createAsyncThunk<
  Company,
  companyApi.UpdateCompanyInput,
  { rejectValue: string; state: RootState }
>(
  'company/updateCompany',
  async (input, { dispatch, getState, rejectWithValue }) => {
    try {
      const state = getState();
      const token = state.oauth.accessToken;

      dispatch(setLoading(true));
      dispatch(setError(null));
      const company = await companyApi.updateCompany(input, token || undefined);
      dispatch(updateCompanyAction({ id: input.id, updates: company }));
      return company;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update company';
      dispatch(setError(message));
      return rejectWithValue(message);
    } finally {
      dispatch(setLoading(false));
    }
  }
);

/**
 * Delete a company via the API
 */
export const deleteCompanyThunk = createAsyncThunk<
  string,
  string,
  { rejectValue: string; state: RootState }
>(
  'company/deleteCompany',
  async (companyId, { dispatch, getState, rejectWithValue }) => {
    try {
      const state = getState();
      const token = state.oauth.accessToken;

      dispatch(setLoading(true));
      dispatch(setError(null));
      await companyApi.deleteCompany(companyId, token || undefined);
      dispatch(deleteCompanyAction(companyId));
      return companyId;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to delete company';
      dispatch(setError(message));
      return rejectWithValue(message);
    } finally {
      dispatch(setLoading(false));
    }
  }
);
