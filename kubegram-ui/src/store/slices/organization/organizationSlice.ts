import type { Organization, Project } from "@/types/canvas";
import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

const ORGANIZATIONS_KEY = 'x-kubegram-organizations';
const CURRENT_ORGANIZATION_KEY = 'x-kubegram-current-organization';

export const saveOrganizationsToStorage = (organizations: Organization[]) => {
  localStorage.setItem(ORGANIZATIONS_KEY, JSON.stringify(organizations));
};

export const loadOrganizationsFromStorage = (): Organization[] => {
  const organizations = localStorage.getItem(ORGANIZATIONS_KEY);
  if (!organizations) {
    return [];
  }
  return JSON.parse(organizations);
};

export const saveCurrentOrganizationToStorage = (organization: Organization) => {
  localStorage.setItem(CURRENT_ORGANIZATION_KEY, JSON.stringify(organization));
};

export const loadCurrentOrganizationFromStorage = (): Organization | null => {
  const organization = localStorage.getItem(CURRENT_ORGANIZATION_KEY);
  if (!organization) {
    return null;
  }
  return JSON.parse(organization);
};

export const removeCurrentOrganizationFromStorage = () => {
  localStorage.removeItem(CURRENT_ORGANIZATION_KEY);
};

export const clearOrganizationStorage = () => {
  localStorage.removeItem(ORGANIZATIONS_KEY);
  localStorage.removeItem(CURRENT_ORGANIZATION_KEY);
};

// State interface
interface OrganizationState {
  organizations: Organization[];
  currentOrganization: Organization | null;
  isInitialized: boolean;
  lastUpdated: number;
}

// Initial state
const initialState: OrganizationState = {
  organizations: [],
  currentOrganization: null,
  isInitialized: false,
  lastUpdated: 0,
};

// Slice
const organizationSlice = createSlice({
  name: 'organization',
  initialState,
  reducers: {
    // Initialize organizations from storage
    initializeOrganizations: (state) => {
      state.organizations = loadOrganizationsFromStorage();
      state.currentOrganization = loadCurrentOrganizationFromStorage();
      state.isInitialized = true;
      state.lastUpdated = Date.now();
    },

    // Set all organizations
    setOrganizations: (state, action: PayloadAction<Organization[]>) => {
      state.organizations = action.payload;
      state.lastUpdated = Date.now();
      saveOrganizationsToStorage(state.organizations);
    },

    // Create a new organization
    createOrganization: (state, action: PayloadAction<{ name: string; avatarUrl?: string }>) => {
      const newOrganization: Organization = {
        id: crypto.randomUUID(),
        name: action.payload.name,
        avatarUrl: action.payload.avatarUrl,
        projects: [],
      };
      state.organizations.push(newOrganization);
      state.lastUpdated = Date.now();
      saveOrganizationsToStorage(state.organizations);
    },

    // Add an existing organization
    addOrganization: (state, action: PayloadAction<Organization>) => {
      state.organizations.push(action.payload);
      state.lastUpdated = Date.now();
      saveOrganizationsToStorage(state.organizations);
    },

    // Update an organization
    updateOrganization: (state, action: PayloadAction<{ id: string; updates: Partial<Omit<Organization, 'id'>> }>) => {
      const index = state.organizations.findIndex(org => org.id === action.payload.id);
      if (index !== -1) {
        state.organizations[index] = {
          ...state.organizations[index],
          ...action.payload.updates,
        };
        // Update current organization if it's the same one
        if (state.currentOrganization?.id === action.payload.id) {
          state.currentOrganization = state.organizations[index];
          saveCurrentOrganizationToStorage(state.currentOrganization);
        }
        state.lastUpdated = Date.now();
        saveOrganizationsToStorage(state.organizations);
      }
    },

    // Delete an organization
    deleteOrganization: (state, action: PayloadAction<string>) => {
      state.organizations = state.organizations.filter(org => org.id !== action.payload);
      // Clear current organization if it was deleted
      if (state.currentOrganization?.id === action.payload) {
        state.currentOrganization = null;
        removeCurrentOrganizationFromStorage();
      }
      state.lastUpdated = Date.now();
      saveOrganizationsToStorage(state.organizations);
    },

    // Set current organization
    setCurrentOrganization: (state, action: PayloadAction<Organization | null>) => {
      state.currentOrganization = action.payload;
      state.lastUpdated = Date.now();
      if (action.payload) {
        saveCurrentOrganizationToStorage(action.payload);
      } else {
        removeCurrentOrganizationFromStorage();
      }
    },

    // Add project to organization
    addProjectToOrganization: (state, action: PayloadAction<{ organizationId: string; project: Project }>) => {
      const index = state.organizations.findIndex(org => org.id === action.payload.organizationId);
      if (index !== -1) {
        state.organizations[index].projects.push(action.payload.project);
        // Update current organization if it's the same one
        if (state.currentOrganization?.id === action.payload.organizationId) {
          state.currentOrganization = state.organizations[index];
          saveCurrentOrganizationToStorage(state.currentOrganization);
        }
        state.lastUpdated = Date.now();
        saveOrganizationsToStorage(state.organizations);
      }
    },

    // Remove project from organization
    removeProjectFromOrganization: (state, action: PayloadAction<{ organizationId: string; projectId: string }>) => {
      const index = state.organizations.findIndex(org => org.id === action.payload.organizationId);
      if (index !== -1) {
        state.organizations[index].projects = state.organizations[index].projects.filter(
          project => project.id !== action.payload.projectId
        );
        // Update current organization if it's the same one
        if (state.currentOrganization?.id === action.payload.organizationId) {
          state.currentOrganization = state.organizations[index];
          saveCurrentOrganizationToStorage(state.currentOrganization);
        }
        state.lastUpdated = Date.now();
        saveOrganizationsToStorage(state.organizations);
      }
    },

    // Clear all organizations
    clearOrganizations: (state) => {
      state.organizations = [];
      state.currentOrganization = null;
      state.isInitialized = false;
      state.lastUpdated = 0;
      clearOrganizationStorage();
    },
  },
});

// Export actions
export const {
  initializeOrganizations,
  setOrganizations,
  createOrganization,
  addOrganization,
  updateOrganization,
  deleteOrganization,
  setCurrentOrganization,
  addProjectToOrganization,
  removeProjectFromOrganization,
  clearOrganizations,
} = organizationSlice.actions;

// Export reducer
export default organizationSlice.reducer;
