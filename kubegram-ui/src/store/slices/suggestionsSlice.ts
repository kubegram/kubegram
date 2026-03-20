import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

export interface Suggestion {
    id: string;
    type: 'ADD_NODE' | 'ADD_CONNECTION';
    nodeType?: string;
    fromNodeId?: string;
    toNodeId?: string;
    reason: string;
}

interface SuggestionsState {
    suggestions: Suggestion[];
    isLoading: boolean;
    isEnabled: boolean;
    error: string | null;
}

const initialState: SuggestionsState = {
    suggestions: [],
    isLoading: false,
    isEnabled: true,
    error: null,
};

const suggestionsSlice = createSlice({
    name: 'suggestions',
    initialState,
    reducers: {
        setSuggestions(state, action: PayloadAction<Omit<Suggestion, 'id'>[]>) {
            state.suggestions = action.payload.map((s) => ({
                ...s,
                id: crypto.randomUUID(),
            }));
            state.error = null;
        },
        setLoading(state, action: PayloadAction<boolean>) {
            state.isLoading = action.payload;
        },
        setEnabled(state, action: PayloadAction<boolean>) {
            state.isEnabled = action.payload;
            if (!action.payload) {
                state.suggestions = [];
            }
        },
        dismissSuggestion(state, action: PayloadAction<string>) {
            state.suggestions = state.suggestions.filter((s) => s.id !== action.payload);
        },
        clearSuggestions(state) {
            state.suggestions = [];
            state.error = null;
        },
        setError(state, action: PayloadAction<string | null>) {
            state.error = action.payload;
        },
    },
});

export const {
    setSuggestions,
    setLoading,
    setEnabled,
    dismissSuggestion,
    clearSuggestions,
    setError,
} = suggestionsSlice.actions;

export default suggestionsSlice.reducer;
