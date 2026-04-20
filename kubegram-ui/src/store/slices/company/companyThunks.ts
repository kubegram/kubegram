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
  async (_, { dispatch, rejectWithValue }) => {
    try {
      dispatch(setLoading(true));
      dispatch(setError(null));
      const companies = await companyApi.fetchCompanies();
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
  async (companyId, { dispatch, rejectWithValue }) => {
    try {
      dispatch(setLoading(true));
      dispatch(setError(null));
      const company = await companyApi.fetchCompanyById(companyId);
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
  async (input, { dispatch, rejectWithValue }) => {
    try {
      dispatch(setLoading(true));
      dispatch(setError(null));
      const company = await companyApi.createCompany(input);
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
  async (input, { dispatch, rejectWithValue }) => {
    try {
      dispatch(setLoading(true));
      dispatch(setError(null));
      const company = await companyApi.updateCompany(input);
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
  async (companyId, { dispatch, rejectWithValue }) => {
    try {
      dispatch(setLoading(true));
      dispatch(setError(null));
      await companyApi.deleteCompany(companyId);
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
