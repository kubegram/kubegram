import type { Company, Project, Organization } from "@/types/canvas";
import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

const COMPANIES_KEY = 'x-kubegram-companies';
const CURRENT_COMPANY_KEY = 'x-kubegram-current-company';

// Storage utilities
export const saveCompaniesToStorage = (companies: Company[]) => {
  localStorage.setItem(COMPANIES_KEY, JSON.stringify(companies));
};

export const loadCompaniesFromStorage = (): Company[] => {
  const companies = localStorage.getItem(COMPANIES_KEY);
  if (!companies) {
    return [];
  }
  return JSON.parse(companies);
};

export const saveCurrentCompanyToStorage = (company: Company) => {
  localStorage.setItem(CURRENT_COMPANY_KEY, JSON.stringify(company));
};

export const loadCurrentCompanyFromStorage = (): Company | null => {
  const company = localStorage.getItem(CURRENT_COMPANY_KEY);
  if (!company) {
    return null;
  }
  return JSON.parse(company);
};

export const removeCurrentCompanyFromStorage = () => {
  localStorage.removeItem(CURRENT_COMPANY_KEY);
};

export const clearCompanyStorage = () => {
  localStorage.removeItem(COMPANIES_KEY);
  localStorage.removeItem(CURRENT_COMPANY_KEY);
};

// State interface
interface CompanyState {
  companies: Company[];
  currentCompany: Company | null;
  isInitialized: boolean;
  isLoading: boolean;
  error: string | null;
  lastUpdated: number;
}

// Initial state
const initialState: CompanyState = {
  companies: [],
  currentCompany: null,
  isInitialized: false,
  isLoading: false,
  error: null,
  lastUpdated: 0,
};

// Slice
const companySlice = createSlice({
  name: 'company',
  initialState,
  reducers: {
    // Initialize companies from storage
    initializeCompanies: (state) => {
      state.companies = loadCompaniesFromStorage();
      state.currentCompany = loadCurrentCompanyFromStorage();
      state.isInitialized = true;
      state.lastUpdated = Date.now();
    },

    // Set all companies
    setCompanies: (state, action: PayloadAction<Company[]>) => {
      state.companies = action.payload;
      state.lastUpdated = Date.now();
      saveCompaniesToStorage(state.companies);
    },

    // Create a new company
    createCompany: (state, action: PayloadAction<{ name: string; avatarUrl?: string }>) => {
      const newCompany: Company = {
        id: crypto.randomUUID(),
        name: action.payload.name,
        avatarUrl: action.payload.avatarUrl,
        projects: [],
        organizations: [],
      };
      state.companies.push(newCompany);
      state.lastUpdated = Date.now();
      saveCompaniesToStorage(state.companies);
    },

    // Add an existing company
    addCompany: (state, action: PayloadAction<Company>) => {
      state.companies.push(action.payload);
      state.lastUpdated = Date.now();
      saveCompaniesToStorage(state.companies);
    },

    // Update a company
    updateCompany: (state, action: PayloadAction<{ id: string; updates: Partial<Omit<Company, 'id'>> }>) => {
      const index = state.companies.findIndex(company => company.id === action.payload.id);
      if (index !== -1) {
        state.companies[index] = {
          ...state.companies[index],
          ...action.payload.updates,
        };
        // Update current company if it's the same one
        if (state.currentCompany?.id === action.payload.id) {
          state.currentCompany = state.companies[index];
          saveCurrentCompanyToStorage(state.currentCompany);
        }
        state.lastUpdated = Date.now();
        saveCompaniesToStorage(state.companies);
      }
    },

    // Delete a company
    deleteCompany: (state, action: PayloadAction<string>) => {
      state.companies = state.companies.filter(company => company.id !== action.payload);
      // Clear current company if it was deleted
      if (state.currentCompany?.id === action.payload) {
        state.currentCompany = null;
        removeCurrentCompanyFromStorage();
      }
      state.lastUpdated = Date.now();
      saveCompaniesToStorage(state.companies);
    },

    // Set current company
    setCurrentCompany: (state, action: PayloadAction<Company | null>) => {
      state.currentCompany = action.payload;
      state.lastUpdated = Date.now();
      if (action.payload) {
        saveCurrentCompanyToStorage(action.payload);
      } else {
        removeCurrentCompanyFromStorage();
      }
    },

    // Add project to company
    addProjectToCompany: (state, action: PayloadAction<{ companyId: string; project: Project }>) => {
      const index = state.companies.findIndex(company => company.id === action.payload.companyId);
      if (index !== -1) {
        state.companies[index].projects.push(action.payload.project);
        // Update current company if it's the same one
        if (state.currentCompany?.id === action.payload.companyId) {
          state.currentCompany = state.companies[index];
          saveCurrentCompanyToStorage(state.currentCompany);
        }
        state.lastUpdated = Date.now();
        saveCompaniesToStorage(state.companies);
      }
    },

    // Remove project from company
    removeProjectFromCompany: (state, action: PayloadAction<{ companyId: string; projectId: string }>) => {
      const index = state.companies.findIndex(company => company.id === action.payload.companyId);
      if (index !== -1) {
        state.companies[index].projects = state.companies[index].projects.filter(
          project => project.id !== action.payload.projectId
        );
        // Update current company if it's the same one
        if (state.currentCompany?.id === action.payload.companyId) {
          state.currentCompany = state.companies[index];
          saveCurrentCompanyToStorage(state.currentCompany);
        }
        state.lastUpdated = Date.now();
        saveCompaniesToStorage(state.companies);
      }
    },

    // Add organization to company
    addOrganizationToCompany: (state, action: PayloadAction<{ companyId: string; organization: Organization }>) => {
      const index = state.companies.findIndex(company => company.id === action.payload.companyId);
      if (index !== -1) {
        state.companies[index].organizations.push(action.payload.organization);
        // Update current company if it's the same one
        if (state.currentCompany?.id === action.payload.companyId) {
          state.currentCompany = state.companies[index];
          saveCurrentCompanyToStorage(state.currentCompany);
        }
        state.lastUpdated = Date.now();
        saveCompaniesToStorage(state.companies);
      }
    },

    // Remove organization from company
    removeOrganizationFromCompany: (state, action: PayloadAction<{ companyId: string; organizationId: string }>) => {
      const index = state.companies.findIndex(company => company.id === action.payload.companyId);
      if (index !== -1) {
        state.companies[index].organizations = state.companies[index].organizations.filter(
          organization => organization.id !== action.payload.organizationId
        );
        // Update current company if it's the same one
        if (state.currentCompany?.id === action.payload.companyId) {
          state.currentCompany = state.companies[index];
          saveCurrentCompanyToStorage(state.currentCompany);
        }
        state.lastUpdated = Date.now();
        saveCompaniesToStorage(state.companies);
      }
    },

    // Loading state management
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },

    // Error state management
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },

    // Clear all companies
    clearCompanies: (state) => {
      state.companies = [];
      state.currentCompany = null;
      state.isInitialized = false;
      state.isLoading = false;
      state.error = null;
      state.lastUpdated = 0;
      clearCompanyStorage();
    },
  },
});

// Export actions
export const {
  initializeCompanies,
  setCompanies,
  createCompany,
  addCompany,
  updateCompany,
  deleteCompany,
  setCurrentCompany,
  addProjectToCompany,
  removeProjectFromCompany,
  addOrganizationToCompany,
  removeOrganizationFromCompany,
  setLoading,
  setError,
  clearCompanies,
} = companySlice.actions;

// Export reducer
export default companySlice.reducer;
