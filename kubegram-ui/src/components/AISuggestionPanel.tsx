import { useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { dismissSuggestion, clearSuggestions, type Suggestion } from '../store/slices/suggestionsSlice';
import { addNode, addArrow } from '../store/slices/canvas/dataSlice';
import type { CanvasNode, CanvasArrow } from '../types/canvas';
import { GraphQL, type ConnectionType, type GraphNodeType } from '../lib/graphql-client';

interface AISuggestionPanelProps {
    isEnabled: boolean;
}

const NODE_SIZE = { width: 120, height: 80 };
const CANVAS_CENTER = { x: 600, y: 400 };
const APPLY_OFFSET_X = 220;

function SuggestionIcon({ type }: { type: Suggestion['type'] }) {
    if (type === 'ADD_NODE') {
        return (
            <svg className="w-4 h-4 text-blue-400 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
            </svg>
        );
    }
    return (
        <svg className="w-4 h-4 text-purple-400 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M12.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
        </svg>
    );
}

function SparkleIcon() {
    return (
        <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
    );
}

export function AISuggestionPanel({ isEnabled }: AISuggestionPanelProps) {
    const dispatch = useAppDispatch();
    const suggestions = useAppSelector((state) => state.suggestions.suggestions);
    const isLoading = useAppSelector((state) => state.suggestions.isLoading);
    const nodes = useAppSelector((state) => state.canvas.data.canvasElementsLookup.nodes);
    const companyId = useAppSelector((state) => state.company.currentCompany?.id ?? '');
    const userId = useAppSelector((state) => state.oauth.user?.id ?? '');

    const handleDismiss = useCallback(
        (id: string) => dispatch(dismissSuggestion(id)),
        [dispatch]
    );

    const handleDismissAll = useCallback(
        () => dispatch(clearSuggestions()),
        [dispatch]
    );

    const handleApply = useCallback(
        (suggestion: Suggestion) => {
            if (suggestion.type === 'ADD_NODE' && suggestion.nodeType) {
                // Position the new node relative to the source node (if any), or canvas center
                const sourceNode = nodes.find((n) => n.id === suggestion.fromNodeId);
                const x = sourceNode ? sourceNode.x + APPLY_OFFSET_X : CANVAS_CENTER.x;
                const y = sourceNode ? sourceNode.y : CANVAS_CENTER.y;

                const newNode: CanvasNode = {
                    id: crypto.randomUUID(),
                    type: suggestion.nodeType,
                    label: suggestion.nodeType,
                    name: suggestion.nodeType,
                    nodeType: suggestion.nodeType as GraphNodeType,
                    companyId,
                    userId,
                    iconSrc: '',
                    x,
                    y,
                    ...NODE_SIZE,
                };
                dispatch(addNode(newNode));
            } else if (suggestion.type === 'ADD_CONNECTION' && suggestion.fromNodeId && suggestion.toNodeId) {
                const fromNode = nodes.find((n) => n.id === suggestion.fromNodeId);
                const toNode = nodes.find((n) => n.id === suggestion.toNodeId);

                if (fromNode && toNode) {
                    const newArrow: CanvasArrow = {
                        id: crypto.randomUUID(),
                        startNodeId: fromNode.id,
                        endNodeId: toNode.id,
                        startX: fromNode.x + (fromNode.width ?? NODE_SIZE.width),
                        startY: fromNode.y + (fromNode.height ?? NODE_SIZE.height) / 2,
                        endX: toNode.x,
                        endY: toNode.y + (toNode.height ?? NODE_SIZE.height) / 2,
                        node: fromNode,
                        connectionType: GraphQL.ConnectionType.ConnectsTo as ConnectionType,
                    };
                    dispatch(addArrow(newArrow));
                }
            }

            dispatch(dismissSuggestion(suggestion.id));
        },
        [dispatch, nodes]
    );

    if (!isEnabled) return null;
    if (!isLoading && suggestions.length === 0) return null;

    return (
        <div className="fixed right-4 top-1/3 z-50 w-72 flex flex-col gap-2 pointer-events-none">
            {/* Header */}
            <div className="flex items-center justify-between bg-gray-900/95 backdrop-blur border border-gray-700 rounded-lg px-3 py-2 pointer-events-auto">
                <div className="flex items-center gap-2 text-yellow-400 text-sm font-medium">
                    <SparkleIcon />
                    AI Suggestions
                    {isLoading && (
                        <svg className="animate-spin w-3 h-3 text-gray-400" viewBox="0 0 24 24" fill="none">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                        </svg>
                    )}
                </div>
                {suggestions.length > 0 && (
                    <button
                        onClick={handleDismissAll}
                        className="text-xs text-gray-400 hover:text-gray-200 transition-colors"
                        title="Dismiss all"
                    >
                        Dismiss all
                    </button>
                )}
            </div>

            {/* Loading state */}
            {isLoading && suggestions.length === 0 && (
                <div className="bg-gray-900/95 backdrop-blur border border-gray-700 rounded-lg px-3 py-3 text-sm text-gray-400 pointer-events-auto">
                    Analyzing graph…
                </div>
            )}

            {/* Suggestion cards */}
            {suggestions.map((suggestion) => (
                <div
                    key={suggestion.id}
                    className="bg-gray-900/95 backdrop-blur border border-gray-700 rounded-lg px-3 py-3 flex flex-col gap-2 pointer-events-auto"
                >
                    <div className="flex items-start gap-2">
                        <SuggestionIcon type={suggestion.type} />
                        <p className="text-xs text-gray-200 leading-relaxed flex-1">{suggestion.reason}</p>
                        <button
                            onClick={() => handleDismiss(suggestion.id)}
                            className="text-gray-500 hover:text-gray-300 transition-colors flex-shrink-0 mt-0.5"
                            aria-label="Dismiss"
                        >
                            <svg className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                            </svg>
                        </button>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className={`text-xs px-1.5 py-0.5 rounded font-mono ${suggestion.type === 'ADD_NODE' ? 'bg-blue-900/60 text-blue-300' : 'bg-purple-900/60 text-purple-300'}`}>
                            {suggestion.type === 'ADD_NODE' ? suggestion.nodeType : 'Connection'}
                        </span>
                        <button
                            onClick={() => handleApply(suggestion)}
                            className="ml-auto text-xs bg-indigo-600 hover:bg-indigo-500 text-white px-2.5 py-1 rounded transition-colors"
                        >
                            Apply
                        </button>
                    </div>
                </div>
            ))}
        </div>
    );
}
