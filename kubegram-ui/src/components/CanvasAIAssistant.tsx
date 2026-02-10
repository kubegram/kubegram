import React, { useEffect, useRef, useState } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { setSelectedLlmProvider, setSelectedLlmModel, fetchLlmConfigs } from '@/store/slices/canvas/entitiesSlice';
import type { LlmProvider } from '@/store/api/providers';
import type { ConversationMessage } from '@/store/api/codegen';
import type { CanvasGraph } from '@/types/canvas';

type AIMode = 'plan' | 'build';

interface CanvasAIAssistantProps {
    isOpen: boolean;
    onToggle: () => void;
    onGenerateCode?: (context?: ConversationMessage[]) => void;
    onGeneratePlan?: (userRequest?: string) => void;
    currentGraph?: CanvasGraph | null;
    generatedCode?: string | null;
    isGenerating?: boolean;
    isPlanning?: boolean;
    error?: string | null;
}

const CanvasAIAssistant: React.FC<CanvasAIAssistantProps> = ({
    isOpen,
    onToggle,
    onGenerateCode,
    onGeneratePlan,
    currentGraph,
    generatedCode: _generatedCode, // Kept for backward compatibility, now using conversation interface
    isGenerating,
    isPlanning,
    error
}) => {
    const dispatch = useAppDispatch();

    // LLM State from Redux
    const llmConfigs = useAppSelector((state) => state.canvas.entities.llmConfigs);
    const selectedProvider = useAppSelector((state) => state.canvas.entities.selectedLlmProvider);
    const selectedModel = useAppSelector((state) => state.canvas.entities.selectedLlmModel);

    const handleSelectProvider = (provider: string) => {
        dispatch(setSelectedLlmProvider(provider));
        // Reset model when provider changes (optional, but good UX)
        // Ideally should pick default model for provider or none
    };

    const handleSelectModel = (model: string) => {
        dispatch(setSelectedLlmModel(model));
    };

    // Auto-select initial if available and not selected (handled in thunk but good to have fallback/sync)
    useEffect(() => {
        if (!selectedProvider && llmConfigs.length > 0) {
            const first = llmConfigs[0];
            dispatch(setSelectedLlmProvider(first.provider));
            if (first.models.length > 0) {
                dispatch(setSelectedLlmModel(first.models[0]));
            }
        }
    }, [llmConfigs, selectedProvider, dispatch]);

    // Update model when provider changes if current model is invalid for provider
    useEffect(() => {
        if (selectedProvider) {
            const providerConfig = llmConfigs.find(c => c.provider === selectedProvider);
            if (providerConfig && (!selectedModel || !providerConfig.models.includes(selectedModel))) {
                if (providerConfig.models.length > 0) {
                    dispatch(setSelectedLlmModel(providerConfig.models[0]));
                } else {
                    dispatch(setSelectedLlmModel(undefined));
                }
            }
        }
    }, [selectedProvider, llmConfigs, selectedModel, dispatch]);

    // Mode state
    const [mode, setMode] = useState<AIMode>('build');

    // Conversation state
    const [conversationHistory, setConversationHistory] = useState<ConversationMessage[]>([]);
    const [contextInput, setContextInput] = useState('');
    const conversationEndRef = useRef<HTMLDivElement>(null);

    // Auto-scroll to bottom when new messages are added
    useEffect(() => {
        conversationEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [conversationHistory]);

    const handleSendContext = () => {
        if (!contextInput.trim()) return;

        // Add user message
        const userMessage: ConversationMessage = {
            id: Date.now().toString(),
            role: 'user',
            content: contextInput.trim(),
            timestamp: new Date()
        };

        // Mock assistant response
        const assistantMessage: ConversationMessage = {
            id: (Date.now() + 1).toString(),
            role: 'assistant',
            content: `I understand. I'll use this context when generating your Kubernetes code: "${contextInput.trim().slice(0, 50)}${contextInput.trim().length > 50 ? '...' : ''}"`,
            timestamp: new Date()
        };

        setConversationHistory(prev => [...prev, userMessage, assistantMessage]);
        setContextInput('');
    };

    const handleClearConversation = () => {
        setConversationHistory([]);
    };

    return (
        <>
            {/* Toggle Button */}
            <div className="absolute top-4 right-4 z-50">
                <button
                    onClick={onToggle}
                    className={`
            bg-primary text-primary-foreground 
            hover:bg-primary/90 
            h-10 w-10 flex items-center justify-center 
            rounded-full shadow-lg border transition-all duration-200 
            backdrop-blur-sm
            ${isOpen ? 'ring-2 ring-primary ring-offset-2 ring-offset-background' : ''}
          `}
                    title={isOpen ? "Close AI Assistant" : "Generate Code"}
                >
                    {isOpen ? (
                        <svg
                            className="w-5 h-5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                            xmlns="http://www.w3.org/2000/svg"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M6 18L18 6M6 6l12 12"
                            />
                        </svg>
                    ) : (
                        <svg
                            className="w-5 h-5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                            xmlns="http://www.w3.org/2000/svg"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M13 10V3L4 14h7v7l9-11h-7z"
                            />
                        </svg>
                    )}
                </button>
            </div>

            {/* Sliding Panel */}
            <div
                className={`
          fixed top-0 right-0 h-full w-1/3 min-w-[350px]
          bg-background border-l border-border shadow-2xl z-40
          transform transition-transform duration-300 ease-in-out
          flex flex-col
          ${isOpen ? 'translate-x-0' : 'translate-x-full'}
        `}
            >
                {/* Header */}
                <div className="p-4 border-b border-border flex items-center justify-between bg-muted/30">
                    <div className="flex items-center gap-2">
                        <div className="p-1.5 bg-primary/10 rounded-md">
                            <svg
                                className="w-5 h-5 text-primary"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M13 10V3L4 14h7v7l9-11h-7z"
                                />
                            </svg>
                        </div>
                        <h2 className="font-semibold text-lg">AI Assistant</h2>
                    </div>
                    <button
                        onClick={onToggle}
                        className="p-1 hover:bg-muted rounded-md transition-colors"
                    >
                        <svg
                            className="w-5 h-5 text-muted-foreground"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M6 18L18 6M6 6l12 12"
                            />
                        </svg>
                    </button>
                </div>

                {/* Mode and LLM Selection */}
                <div className="p-4 border-b border-border bg-muted/10 space-y-3">
                    {/* Mode Selector */}
                    <div className="space-y-1">
                        <label className="text-xs font-medium text-muted-foreground block">Mode</label>
                        <div className="grid grid-cols-2 gap-2">
                            <button
                                onClick={() => setMode('build')}
                                className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${mode === 'build'
                                    ? 'bg-primary text-primary-foreground shadow-sm'
                                    : 'bg-background border border-input hover:bg-muted'
                                    }`}
                            >
                                🏗️ Build
                            </button>
                            <button
                                onClick={() => setMode('plan')}
                                className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${mode === 'plan'
                                    ? 'bg-primary text-primary-foreground shadow-sm'
                                    : 'bg-background border border-input hover:bg-muted'
                                    }`}
                            >
                                📋 Plan
                            </button>
                        </div>
                    </div>

                    <div className="space-y-1">
                        <label className="text-xs font-medium text-muted-foreground block">Provider</label>
                        <select
                            className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                            value={selectedProvider || ''}
                            onChange={(e) => handleSelectProvider(e.target.value)}
                            onClick={() => {
                                if (llmConfigs.length === 0) {
                                    dispatch(fetchLlmConfigs());
                                }
                            }}
                        >
                            <option value="" disabled>Select Provider</option>
                            {llmConfigs?.map((config: LlmProvider) => (
                                <option key={config.provider} value={config.provider}>
                                    {config.provider}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="space-y-1">
                        <label className="text-xs font-medium text-muted-foreground block">Model</label>
                        <select
                            className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                            value={selectedModel || ''}
                            onChange={(e) => handleSelectModel(e.target.value)}
                            disabled={!selectedProvider}
                        >
                            <option value="" disabled>Select Model</option>
                            {llmConfigs
                                ?.find((c: LlmProvider) => c.provider === selectedProvider)
                                ?.models?.map((model: string) => (
                                    <option key={model} value={model}>
                                        {model}
                                    </option>
                                ))}
                        </select>
                    </div>
                </div>

                {/* Conversation History */}
                <div className="flex-1 overflow-auto p-4 space-y-3">
                    {error && (
                        <div className="mb-4 p-3 bg-red-100 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 rounded-lg text-sm">
                            {error}
                        </div>
                    )}
                    {conversationHistory.length === 0 ? (
                        <div className="flex flex-col gap-4 h-full items-center justify-center text-muted-foreground p-8 text-center">
                            <div className="p-4 bg-muted/50 rounded-full mb-2">
                                <svg className="w-8 h-8 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                </svg>
                            </div>
                            <div>
                                <h3 className="font-medium text-foreground mb-1">Conversation</h3>
                                <p className="text-sm">Start a conversation to provide context for code generation.</p>
                            </div>
                        </div>
                    ) : (
                        <>
                            {conversationHistory.map((message) => (
                                <div
                                    key={message.id}
                                    className={`p-3 rounded-lg border-l-4 ${message.role === 'user'
                                        ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-500'
                                        : 'bg-gray-50 dark:bg-gray-800/30 border-gray-500'
                                        }`}
                                >
                                    <div className="text-xs font-medium mb-1 text-muted-foreground">
                                        {message.role === 'user' ? 'You' : 'Assistant'}
                                    </div>
                                    <div className="text-sm whitespace-pre-wrap">{message.content}</div>
                                </div>
                            ))}
                            <div ref={conversationEndRef} />
                        </>
                    )}
                </div>

                {/* Context Input */}
                <div className="p-4 border-t border-border bg-muted/10 space-y-2">
                    {/* Mode-specific hints */}
                    {mode === 'plan' && (
                        <div className="text-xs bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 rounded p-2 mb-2">
                            <div className="font-medium mb-1">📋 Planning Mode</div>
                            <div>Your current graph will be analyzed and a plan will be generated. Optionally add context below.</div>
                        </div>
                    )}
                    {mode === 'build' && (
                        <div className="text-xs text-muted-foreground space-y-1">
                            <div className="font-medium">Context Types:</div>
                            <div className="grid grid-cols-1 gap-1 text-xs">
                                <div className="flex items-center gap-1">
                                    <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                                    <span><strong>User Requirements:</strong> "Add monitoring for all services"</span>
                                </div>
                                <div className="flex items-center gap-1">
                                    <span className="w-2 h-2 bg-orange-500 rounded-full"></span>
                                    <span><strong>System Messages:</strong> "system: Retry with corrected limits"</span>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="flex gap-2">
                        <textarea
                            value={contextInput}
                            onChange={(e) => setContextInput(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    handleSendContext();
                                }
                            }}
                            placeholder={mode === 'plan' ? 'Optionally add context for planning... (e.g., "Focus on scalability", "Prioritize cost optimization")' : 'Add context for code generation... (e.g., "Add monitoring", "system: Retry with fixes")'}
                            className="flex-1 min-h-[60px] max-h-[120px] rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-none"
                            rows={2}
                        />
                        <button
                            onClick={handleSendContext}
                            disabled={!contextInput.trim()}
                            className="px-3 bg-primary hover:bg-primary/90 text-primary-foreground rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            title="Send message"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                            </svg>
                        </button>
                    </div>
                    <button
                        onClick={handleClearConversation}
                        disabled={conversationHistory.length === 0}
                        className="text-xs text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Clear conversation
                    </button>
                </div>

                {/* Footer Actions */}
                <div className="p-4 border-t border-border bg-muted/10">
                    <button
                        onClick={() => {
                            if (mode === 'plan') {
                                // Gather context from conversation
                                const userRequest = conversationHistory
                                    .filter(m => m.role === 'user')
                                    .map(m => m.content)
                                    .join('\n');
                                onGeneratePlan?.(userRequest || undefined);
                            } else {
                                onGenerateCode?.(conversationHistory);
                            }
                        }}
                        disabled={isGenerating || isPlanning || (mode === 'plan' && !currentGraph)}
                        className="w-full bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2 rounded-lg transition-colors flex items-center justify-center gap-2 font-medium shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {(isGenerating || isPlanning) ? (
                            <>
                                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                {mode === 'plan' ? 'Planning...' : 'Generating...'}
                            </>
                        ) : (
                            <>
                                {mode === 'plan' ? (
                                    <>
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                                        </svg>
                                        Generate Plan
                                    </>
                                ) : (
                                    <>
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                                        </svg>
                                        Generate Code
                                    </>
                                )}
                            </>
                        )}
                    </button>
                    {mode === 'plan' && !currentGraph && (
                        <div className="text-xs text-orange-600 dark:text-orange-400 mt-2 text-center">
                            No graph available. Create nodes on the canvas first.
                        </div>
                    )}
                </div>
            </div>
        </>
    );
};

export default CanvasAIAssistant;
