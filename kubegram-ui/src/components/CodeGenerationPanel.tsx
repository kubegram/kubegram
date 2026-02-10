import { AlertCircle, CheckCircle, Code, Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Button } from './ui/button';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { setSelectedLlmProvider, setSelectedLlmModel } from '@/store/slices/canvas';

interface CodeGenerationPanelProps {
    generatedCode?: string | null;
    isGenerating?: boolean;
    isConnected?: boolean;
    error?: string | null;
    onClearCode?: () => void;
    onGenerate?: () => void;
    className?: string;
}

interface LogEntry {
    id: string;
    message: string;
    type: 'info' | 'success' | 'warning' | 'error';
    timestamp: Date;
}

export function CodeGenerationPanel({
    generatedCode: propGeneratedCode,
    isGenerating: propIsGenerating,
    isConnected,
    error: propError,
    onClearCode,
    onGenerate,
    className,
}: CodeGenerationPanelProps) {
    const dispatch = useAppDispatch();

    // LLM State from Redux
    const llmConfigs = useAppSelector((state) => state.canvas.entities.llmConfigs);
    const selectedProvider = useAppSelector((state) => state.canvas.entities.selectedLlmProvider);
    const selectedModel = useAppSelector((state) => state.canvas.entities.selectedLlmModel);

    const handleSelectProvider = (provider: string) => {
        dispatch(setSelectedLlmProvider(provider));
    };

    const handleSelectModel = (model: string) => {
        dispatch(setSelectedLlmModel(model));
    };

    const [isGenerating, setIsGenerating] = useState(propIsGenerating || false);
    const [progress, _setProgress] = useState(0);
    const [logs, setLogs] = useState<LogEntry[]>([]);
    const [generatedCode, setGeneratedCode] = useState<string>(propGeneratedCode ?? '');
    const [error, setError] = useState<string | null>(propError || null);

    // Sync props with local state
    useEffect(() => {
        if (propIsGenerating !== undefined) {
            setIsGenerating(propIsGenerating);
        }
    }, [propIsGenerating]);

    useEffect(() => {
        if (propGeneratedCode !== undefined) {
            setGeneratedCode(propGeneratedCode ?? '');
        }
    }, [propGeneratedCode]);

    useEffect(() => {
        if (propError !== undefined) {
            setError(propError);
        }
    }, [propError]);

    const addLog = (message: string, type: LogEntry['type'] = 'info') => {
        const logEntry: LogEntry = {
            id: Math.random().toString(36).substr(2, 9),
            message,
            type,
            timestamp: new Date(),
        };
        setLogs(prev => [...prev, logEntry]);
    };

    const handleDownload = () => {
        const blob = new Blob([generatedCode], { type: 'text/yaml' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `kubegram-generated-${Date.now()}.yaml`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const handleCopy = () => {
        navigator.clipboard.writeText(generatedCode);
        addLog('Code copied to clipboard!', 'success');
    };

    return (
        <div className={`space-y-6 ${className || ''}`}>
            {/* Progress Section */}
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">Generation Progress</h3>
                    <span className="text-sm text-muted-foreground">
                        {Math.round(progress)}%
                    </span>
                </div>

                {/* Progress Bar */}
                <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                        className="bg-primary h-2 rounded-full transition-all duration-300"
                        style={{ width: `${progress}%` }}
                    />
                </div>

                {/* LLM Selection */}
                <div className="space-y-4 p-4 bg-muted/50 rounded-lg border border-border">
                    <h4 className="font-semibold text-sm">Model Configuration</h4>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-xs font-medium text-muted-foreground">Provider</label>
                            <select
                                className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                                value={selectedProvider || ''}
                                onChange={(e) => handleSelectProvider(e.target.value)}
                            >
                                <option value="" disabled>Select Provider</option>
                                {llmConfigs?.map((config: any) => (
                                    <option key={config.provider} value={config.provider}>
                                        {config.provider}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-medium text-muted-foreground">Model</label>
                            <select
                                className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                                value={selectedModel || ''}
                                onChange={(e) => handleSelectModel(e.target.value)}
                                disabled={!selectedProvider}
                            >
                                <option value="" disabled>Select Model</option>
                                {llmConfigs
                                    ?.find((c: any) => c.provider === selectedProvider)
                                    ?.models?.map((model: string) => (
                                        <option key={model} value={model}>
                                            {model}
                                        </option>
                                    ))}
                            </select>
                        </div>
                    </div>
                </div>

                {/* Generate Button */}
                {!isGenerating && !generatedCode && onGenerate && (
                    <Button onClick={onGenerate} className="w-full">
                        <Code className="w-4 h-4 mr-2" />
                        Generate Code
                    </Button>
                )}

                {/* Loading State */}
                {isGenerating && (
                    <div className="flex items-center justify-center py-4">
                        <Loader2 className="w-6 h-6 animate-spin mr-2" />
                        <span>Generating code...</span>
                    </div>
                )}
            </div>

            {/* Connection Status */}
            {isConnected !== undefined && (
                <div className="flex items-center space-x-2 text-sm">
                    <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
                    <span className={isConnected ? 'text-green-600' : 'text-red-600'}>
                        {isConnected ? 'Connected to code generation service' : 'Disconnected from code generation service'}
                    </span>
                </div>
            )}

            {/* Error Display */}
            {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <div className="flex items-center space-x-2">
                        <AlertCircle className="w-5 h-5 text-red-500" />
                        <span className="text-red-700 font-medium">Error</span>
                    </div>
                    <p className="text-red-600 mt-2">{error}</p>
                </div>
            )}

            {/* Logs Section */}
            {logs.length > 0 && (
                <div className="space-y-2">
                    <h4 className="font-semibold">Generation Logs</h4>
                    <div className="bg-gray-50 rounded-lg p-4 max-h-48 overflow-y-auto">
                        {logs.map((log) => (
                            <div
                                key={log.id}
                                className="flex items-start space-x-2 text-sm py-1"
                            >
                                <div className="flex-shrink-0 mt-0.5">
                                    {log.type === 'success' && (
                                        <CheckCircle className="w-4 h-4 text-green-500" />
                                    )}
                                    {log.type === 'error' && (
                                        <AlertCircle className="w-4 h-4 text-red-500" />
                                    )}
                                    {log.type === 'warning' && (
                                        <AlertCircle className="w-4 h-4 text-yellow-500" />
                                    )}
                                    {log.type === 'info' && (
                                        <div className="w-4 h-4 rounded-full bg-blue-500" />
                                    )}
                                </div>
                                <div className="flex-1">
                                    <span className="text-gray-600">
                                        {log.timestamp.toLocaleTimeString()}
                                    </span>
                                    <span className="ml-2">{log.message}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Generated Code Section */}
            {generatedCode && (
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h4 className="font-semibold">Generated Code</h4>
                        <div className="space-x-2">
                            <Button variant="outline" size="sm" onClick={handleCopy}>
                                Copy
                            </Button>
                            <Button variant="outline" size="sm" onClick={handleDownload}>
                                Download
                            </Button>
                            {onClearCode && (
                                <Button variant="outline" size="sm" onClick={onClearCode}>
                                    Clear
                                </Button>
                            )}
                        </div>
                    </div>
                    <pre className="bg-gray-900 text-green-400 p-4 rounded-lg overflow-x-auto text-sm max-h-64 overflow-y-auto">
                        {generatedCode}
                    </pre>
                </div>
            )}
        </div>
    );
}
