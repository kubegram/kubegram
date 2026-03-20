import { useEffect, useRef, useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import {
    setSuggestions,
    setLoading,
    setEnabled,
    clearSuggestions,
    type Suggestion,
} from '../store/slices/suggestionsSlice';
import { apiClient } from '@/lib/api/axiosClient';

interface SuggestResponse {
    suggestions: Omit<Suggestion, 'id'>[];
}

export interface UseAISuggestionsReturn {
    isLoading: boolean;
    suggestions: Suggestion[];
    isEnabled: boolean;
    toggleEnabled: () => void;
    clearSuggestions: () => void;
}

const DEBOUNCE_MS = 1500;
const MIN_NODES = 1;

export function useAISuggestions(): UseAISuggestionsReturn {
    const dispatch = useAppDispatch();

    const nodes = useAppSelector((state) => state.canvas.data.canvasElementsLookup.nodes);
    const arrows = useAppSelector((state) => state.canvas.data.canvasElementsLookup.arrows);
    const isEnabled = useAppSelector((state) => state.suggestions.isEnabled);
    const isLoading = useAppSelector((state) => state.suggestions.isLoading);
    const suggestions = useAppSelector((state) => state.suggestions.suggestions);

    const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    // Track last node fingerprint to avoid redundant calls
    const lastFingerprintRef = useRef<string>('');

    const fetchSuggestions = useCallback(async () => {
        if (!isEnabled || nodes.length < MIN_NODES) return;

        try {
            dispatch(setLoading(true));

            // Build a minimal graph payload
            const graph = {
                nodes: nodes.map((n) => ({
                    id: n.id,
                    type: n.type ?? (n as any).data?.type,
                    label: n.label ?? (n as any).data?.label ?? n.id,
                })),
                edges: arrows.map((a) => ({
                    source: a.startNodeId ?? a.id,
                    target: a.endNodeId ?? a.id,
                })),
            };

            const response = await apiClient.post<SuggestResponse>('/api/v1/graph/suggest', { graph });
            dispatch(setSuggestions(response.data.suggestions ?? []));
        } catch (error) {
            // Silently ignore suggestion errors — don't disrupt the user's workflow
            console.warn('useAISuggestions: fetch failed', error);
            dispatch(setSuggestions([]));
        } finally {
            dispatch(setLoading(false));
        }
    }, [dispatch, nodes, arrows, isEnabled]);

    useEffect(() => {
        if (!isEnabled) return;

        // Build a lightweight fingerprint: node count + sorted IDs
        const fingerprint = nodes
            .map((n) => n.id)
            .sort()
            .join(',');

        if (fingerprint === lastFingerprintRef.current) return;
        lastFingerprintRef.current = fingerprint;

        if (nodes.length < MIN_NODES) {
            dispatch(clearSuggestions());
            return;
        }

        // Debounce — restart timer on each node change
        if (debounceTimer.current) {
            clearTimeout(debounceTimer.current);
        }
        debounceTimer.current = setTimeout(() => {
            fetchSuggestions();
        }, DEBOUNCE_MS);

        return () => {
            if (debounceTimer.current) {
                clearTimeout(debounceTimer.current);
            }
        };
    }, [nodes, isEnabled, fetchSuggestions, dispatch]);

    const handleToggleEnabled = useCallback(() => {
        dispatch(setEnabled(!isEnabled));
    }, [dispatch, isEnabled]);

    const handleClearSuggestions = useCallback(() => {
        dispatch(clearSuggestions());
    }, [dispatch]);

    return {
        isLoading,
        suggestions,
        isEnabled,
        toggleEnabled: handleToggleEnabled,
        clearSuggestions: handleClearSuggestions,
    };
}
