/**
 * Centralized Actions Export
 * 
 * This module re-exports all slice actions and async thunks for convenient importing.
 * 
 * Usage:
 * ```typescript
 * import { createCompany, fetchCompaniesThunk } from '@/store/actions';
 * ```
 */

// ============================================================================
// Company Actions & Thunks
// ============================================================================
export {
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
  setLoading as setCompanyLoading,
  setError as setCompanyError,
  clearCompanies,
} from '@/store/slices/company/companySlice';

export {
  fetchCompaniesThunk,
  fetchCompanyByIdThunk,
  createCompanyThunk,
  updateCompanyThunk,
  deleteCompanyThunk,
} from '@/store/slices/company/companyThunks';

// ============================================================================
// Organization Actions & Thunks
// ============================================================================
export {
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
} from '@/store/slices/organization/organizationSlice';

export {
  fetchOrganizationsThunk,
  fetchOrganizationByIdThunk,
  createOrganizationThunk,
  updateOrganizationThunk,
  deleteOrganizationThunk,
} from '@/store/slices/organization/organizationThunks';

// ============================================================================
// Team Actions & Thunks
// ============================================================================
export {
  initializeTeams,
  setTeams,
  createTeam,
  addTeam,
  updateTeam,
  deleteTeam,
  setCurrentTeam,
  addProjectToTeam,
  removeProjectFromTeam,
  clearTeams,
} from '@/store/slices/team/teamSlice';

export {
  fetchTeamsThunk,
  fetchTeamByIdThunk,
  createTeamThunk,
  updateTeamThunk,
  deleteTeamThunk,
} from '@/store/slices/team/teamThunks';

// ============================================================================
// Project Actions & Thunks
// ============================================================================
export {
  initializeProject,
  createNewProject,
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
} from '@/store/slices/project/projectSlice';

export {
  fetchProjectsThunk,
  fetchProjectByIdThunk,
  createProjectThunk,
  updateProjectThunk,
  deleteProjectThunk,
  saveProjectGraphThunk,
  // Graph node thunks
  addNodeToGraphThunk,
  updateNodeInGraphThunk,
  removeNodeFromGraphThunk,
  // Graph edge thunks
  addEdgeToGraphThunk,
  updateEdgeInGraphThunk,
  removeEdgeFromGraphThunk,
} from '@/store/slices/project/projectThunks';


// ============================================================================
// UI Actions
// ============================================================================
export {
  toggleSidebar,
  setSidebarCollapsed,
  toggleHeader,
  setHeaderCollapsed,
  toggleHelpModal,
  setShowHelpModal,
  toggleToolbar,
  setToolbarCollapsed,
  toggleCanvasToolbar,
  setCanvasToolbarCollapsed,
  setZoomLevel,
  zoomIn,
  zoomOut,
  resetZoom,
  setTheme,
  toggleTheme,
  setExporting,
  setImporting,
  resetUI,
} from '@/store/slices/uiSlice';

// ============================================================================
// Canvas Actions
// ============================================================================
export * from '@/store/slices/canvas';
