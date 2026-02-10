import { createAsyncThunk } from '@reduxjs/toolkit';
import type { Team } from '@/types/canvas';
import * as teamApi from '@/store/api/teamApi';
import {
    setTeams,
    addTeam,
    updateTeam as updateTeamAction,
    deleteTeam as deleteTeamAction,
} from './teamSlice';
import type { RootState } from '@/store';

/**
 * Team Async Thunks
 * Provides async actions for team API operations
 */

/**
 * Fetch all teams from the API
 */
export const fetchTeamsThunk = createAsyncThunk<
    Team[],
    void,
    { rejectValue: string; state: RootState }
>(
    'team/fetchTeams',
    async (_, { dispatch, getState, rejectWithValue }) => {
        try {
            const state = getState();
            const token = state.oauth.accessToken;

            const teams = await teamApi.fetchTeams(token || undefined);
            dispatch(setTeams(teams));
            return teams;
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Failed to fetch teams';
            return rejectWithValue(message);
        }
    }
);

/**
 * Fetch a single team by ID from the API
 */
export const fetchTeamByIdThunk = createAsyncThunk<
    Team | null,
    string,
    { rejectValue: string; state: RootState }
>(
    'team/fetchTeamById',
    async (teamId, { getState, rejectWithValue }) => {
        try {
            const state = getState();
            const token = state.oauth.accessToken;

            const team = await teamApi.fetchTeamById(teamId, token || undefined);
            return team;
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Failed to fetch team';
            return rejectWithValue(message);
        }
    }
);

/**
 * Create a new team via the API
 */
export const createTeamThunk = createAsyncThunk<
    Team,
    teamApi.CreateTeamInput,
    { rejectValue: string; state: RootState }
>(
    'team/createTeam',
    async (input, { dispatch, getState, rejectWithValue }) => {
        try {
            const state = getState();
            const token = state.oauth.accessToken;

            const team = await teamApi.createTeam(input, token || undefined);
            dispatch(addTeam(team));
            return team;
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Failed to create team';
            return rejectWithValue(message);
        }
    }
);

/**
 * Update an existing team via the API
 */
export const updateTeamThunk = createAsyncThunk<
    Team,
    teamApi.UpdateTeamInput,
    { rejectValue: string; state: RootState }
>(
    'team/updateTeam',
    async (input, { dispatch, getState, rejectWithValue }) => {
        try {
            const state = getState();
            const token = state.oauth.accessToken;

            const team = await teamApi.updateTeam(input, token || undefined);
            dispatch(updateTeamAction({ id: input.id, updates: team }));
            return team;
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Failed to update team';
            return rejectWithValue(message);
        }
    }
);

/**
 * Delete a team via the API
 */
export const deleteTeamThunk = createAsyncThunk<
    string,
    string,
    { rejectValue: string; state: RootState }
>(
    'team/deleteTeam',
    async (teamId, { dispatch, getState, rejectWithValue }) => {
        try {
            const state = getState();
            const token = state.oauth.accessToken;

            await teamApi.deleteTeam(teamId, token || undefined);
            dispatch(deleteTeamAction(teamId));
            return teamId;
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Failed to delete team';
            return rejectWithValue(message);
        }
    }
);
