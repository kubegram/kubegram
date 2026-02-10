import type { Project, Team } from "@/types/canvas";
import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

const TEAMS_KEY = 'x-kubegram-teams';
const CURRENT_TEAM_KEY = 'x-kubegram-current-team';

// Storage utilities
export const saveTeamsToStorage = (teams: Team[]) => {
  localStorage.setItem(TEAMS_KEY, JSON.stringify(teams));
};

export const loadTeamsFromStorage = (): Team[] => {
  const teams = localStorage.getItem(TEAMS_KEY);
  if (!teams) {
    return [];
  }
  return JSON.parse(teams);
};

export const saveCurrentTeamToStorage = (team: Team) => {
  localStorage.setItem(CURRENT_TEAM_KEY, JSON.stringify(team));
};

export const loadCurrentTeamFromStorage = (): Team | null => {
  const team = localStorage.getItem(CURRENT_TEAM_KEY);
  if (!team) {
    return null;
  }
  return JSON.parse(team);
};

export const removeCurrentTeamFromStorage = () => {
  localStorage.removeItem(CURRENT_TEAM_KEY);
};

export const clearTeamStorage = () => {
  localStorage.removeItem(TEAMS_KEY);
  localStorage.removeItem(CURRENT_TEAM_KEY);
};

// State interface
interface TeamState {
  teams: Team[];
  currentTeam: Team | null;
  isInitialized: boolean;
  lastUpdated: number;
}

// Initial state
const initialState: TeamState = {
  teams: [],
  currentTeam: null,
  isInitialized: false,
  lastUpdated: 0,
};

// Slice
const teamSlice = createSlice({
  name: 'team',
  initialState,
  reducers: {
    // Initialize teams from storage
    initializeTeams: (state) => {
      state.teams = loadTeamsFromStorage();
      state.currentTeam = loadCurrentTeamFromStorage();
      state.isInitialized = true;
      state.lastUpdated = Date.now();
    },

    // Set all teams
    setTeams: (state, action: PayloadAction<Team[]>) => {
      state.teams = action.payload;
      state.lastUpdated = Date.now();
      saveTeamsToStorage(state.teams);
    },

    // Create a new team
    createTeam: (state, action: PayloadAction<{ name: string; avatarUrl?: string }>) => {
      const newTeam: Team = {
        id: crypto.randomUUID(),
        name: action.payload.name,
        avatarUrl: action.payload.avatarUrl,
        projects: [],
      };
      state.teams.push(newTeam);
      state.lastUpdated = Date.now();
      saveTeamsToStorage(state.teams);
    },

    // Add an existing team
    addTeam: (state, action: PayloadAction<Team>) => {
      state.teams.push(action.payload);
      state.lastUpdated = Date.now();
      saveTeamsToStorage(state.teams);
    },

    // Update a team
    updateTeam: (state, action: PayloadAction<{ id: string; updates: Partial<Omit<Team, 'id'>> }>) => {
      const index = state.teams.findIndex(team => team.id === action.payload.id);
      if (index !== -1) {
        state.teams[index] = {
          ...state.teams[index],
          ...action.payload.updates,
        };
        // Update current team if it's the same one
        if (state.currentTeam?.id === action.payload.id) {
          state.currentTeam = state.teams[index];
          saveCurrentTeamToStorage(state.currentTeam);
        }
        state.lastUpdated = Date.now();
        saveTeamsToStorage(state.teams);
      }
    },

    // Delete a team
    deleteTeam: (state, action: PayloadAction<string>) => {
      state.teams = state.teams.filter(team => team.id !== action.payload);
      // Clear current team if it was deleted
      if (state.currentTeam?.id === action.payload) {
        state.currentTeam = null;
        removeCurrentTeamFromStorage();
      }
      state.lastUpdated = Date.now();
      saveTeamsToStorage(state.teams);
    },

    // Set current team
    setCurrentTeam: (state, action: PayloadAction<Team | null>) => {
      state.currentTeam = action.payload;
      state.lastUpdated = Date.now();
      if (action.payload) {
        saveCurrentTeamToStorage(action.payload);
      } else {
        removeCurrentTeamFromStorage();
      }
    },

    // Add project to team
    addProjectToTeam: (state, action: PayloadAction<{ teamId: string; project: Project }>) => {
      const index = state.teams.findIndex(team => team.id === action.payload.teamId);
      if (index !== -1) {
        state.teams[index].projects.push(action.payload.project);
        // Update current team if it's the same one
        if (state.currentTeam?.id === action.payload.teamId) {
          state.currentTeam = state.teams[index];
          saveCurrentTeamToStorage(state.currentTeam);
        }
        state.lastUpdated = Date.now();
        saveTeamsToStorage(state.teams);
      }
    },

    // Remove project from team
    removeProjectFromTeam: (state, action: PayloadAction<{ teamId: string; projectId: string }>) => {
      const index = state.teams.findIndex(team => team.id === action.payload.teamId);
      if (index !== -1) {
        state.teams[index].projects = state.teams[index].projects.filter(
          project => project.id !== action.payload.projectId
        );
        // Update current team if it's the same one
        if (state.currentTeam?.id === action.payload.teamId) {
          state.currentTeam = state.teams[index];
          saveCurrentTeamToStorage(state.currentTeam);
        }
        state.lastUpdated = Date.now();
        saveTeamsToStorage(state.teams);
      }
    },

    // Clear all teams
    clearTeams: (state) => {
      state.teams = [];
      state.currentTeam = null;
      state.isInitialized = false;
      state.lastUpdated = 0;
      clearTeamStorage();
    },
  },
});

// Export actions
export const {
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
} = teamSlice.actions;

// Export reducer
export default teamSlice.reducer;
