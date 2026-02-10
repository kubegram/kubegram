import React, { memo, useState } from 'react';
import { type CanvasNode } from '@/types/canvas';
import { useAppSelector } from '@/store/hooks';
import { 
  selectGeneratedCodeForNode,
  selectCodegenState,
  selectCodegenStats
} from '@/store/slices/codegen/codegenSlice';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Code, 
  Settings, 
  Loader2, 
  AlertCircle,
  CheckCircle,
  Zap
} from 'lucide-react';
import type { InitiateCodegenInput } from '@/store/api/codegen';
import { pollCodeGenerationWithRedux } from '@/store/api/codegen';
import { PollingPresets } from '@/store/api/codegenUtils';
import GeneratedCodeDisplay from './GeneratedCodeDisplay';
import CodeGenerationStatus from './CodeGenerationStatus';

interface CodePanelProps {
    selectedNode: CanvasNode | null;
    graphId: string;
    showGeneratedCode?: boolean;
}

type ViewMode = 'config' | 'generated';

const CodePanel: React.FC<CodePanelProps> = memo(({ 
    selectedNode, 
    graphId,
    showGeneratedCode = true 
}) => {
    // State management
    const [viewMode, setViewMode] = useState<ViewMode>('generated');
    const [isGenerating, setIsGenerating] = useState(false);
    const [generationProgress, setGenerationProgress] = useState('');
    
    // Redux state
    const generatedCode = useAppSelector((state) => 
        selectGeneratedCodeForNode(state, graphId, selectedNode?.id || '')
    );
    const codegenState = useAppSelector(selectCodegenState);
    const codegenStats = useAppSelector(selectCodegenStats);
    const project = useAppSelector((state) => state.project.project);
    const selectedLlmProvider = useAppSelector((state) => state.canvas.entities.selectedLlmProvider);
    const selectedLlmModel = useAppSelector((state) => state.canvas.entities.selectedLlmModel);
    
    // Check if code generation is available for this graph
    const hasGeneratedCode = generatedCode.length > 0;
    const isCodegenLoading = codegenState?.isLoading || false;
    const codegenError = codegenState?.error || null;
    
    // Copy code to clipboard
    const copyCode = async (code: string) => {
        try {
            await navigator.clipboard.writeText(code);
            // Could add toast notification here
        } catch (error) {
            console.error('Failed to copy code:', error);
        }
    };
    
    // Download code as file
    const downloadCode = (code: string, filename: string) => {
        const blob = new Blob([code], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };
    
    // Generate code for the entire graph
    const generateCodeForGraph = async () => {
        if (!graphId || !project?.graph) return;
        
        setIsGenerating(true);
        setGenerationProgress('Initiating code generation...');
        
        try {
const input: InitiateCodegenInput = {
                project: {
                    id: project?.id || '',
                    name: project?.name || 'Untitled Project'
                },
                graph: project?.graph as any,
                llmConfig: {
                    provider: selectedLlmProvider || 'openai',
                    model: selectedLlmModel || 'gpt-4'
                }
            };
            
const callbacks = {
                onProgress: (attempt: number, status: string, delay: number) => {
                    setGenerationProgress(`Attempt ${attempt}: ${status} (next check in ${Math.round(delay / 1000)}s)`);
                },
                onStatusChange: (status: string) => {
                    setGenerationProgress(`Status: ${status}`);
                },
                onResultsFetched: (results: any) => {
                    setGenerationProgress(`Results fetched for ${results.generatedCodes.length} nodes`);
                },
                onCodeStored: (_graphId: string, nodeId: string, _codes: string[]) => {
                    setGenerationProgress(`Code stored for node ${nodeId}`);
                },
                onError: (error: string) => {
                    setGenerationProgress(`Error: ${error}`);
                },
                onComplete: (_results: any) => {
                    setGenerationProgress('Code generation completed successfully!');
                    setTimeout(() => setIsGenerating(false), 2000);
                }
            };
            
            // Import dispatch dynamically to avoid circular dependencies
            const { useAppDispatch } = await import('@/store/hooks');
            const dispatch = useAppDispatch();
            
            await pollCodeGenerationWithRedux(
                input,
                PollingPresets.standard,
                callbacks,
                undefined, // token will be handled by axios client
                undefined, // abortSignal
                dispatch
            );
            
        } catch (error: any) {
            console.error('Code generation failed:', error);
            setGenerationProgress(`Failed: ${error.message}`);
        } finally {
            setIsGenerating(false);
        }
    };
    
    
    return (
        <div className="h-full w-full bg-card border-l border-border flex flex-col">
            {/* Header */}
            <div className="px-4 py-3 border-b border-border bg-muted/30">
                <div className="flex items-center justify-between">
                    <h2 className="font-semibold text-lg">
                        {viewMode === 'generated' ? 'Generated Code' : 'Node Configuration'}
                    </h2>
                    {showGeneratedCode && (
                        <div className="flex items-center space-x-2">
                            <Badge variant="secondary" className="text-xs">
                                {codegenStats.totalCodeGenerated} files
                            </Badge>
                            {isCodegenLoading && (
                                <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* View Mode Toggle */}
            {showGeneratedCode && (
                <div className="px-4 py-2 border-b border-border">
                    <div className="flex items-center space-x-1 bg-muted rounded-lg p-1">
                        <button
                            onClick={() => setViewMode('config')}
                            className={`flex-1 flex items-center justify-center space-x-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                                viewMode === 'config'
                                    ? 'bg-background text-foreground shadow-sm'
                                    : 'text-muted-foreground hover:text-foreground'
                            }`}
                        >
                            <Settings className="h-4 w-4" />
                            <span>Config</span>
                        </button>
                        <button
                            onClick={() => setViewMode('generated')}
                            className={`flex-1 flex items-center justify-center space-x-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                                viewMode === 'generated'
                                    ? 'bg-background text-foreground shadow-sm'
                                    : 'text-muted-foreground hover:text-foreground'
                            }`}
                        >
                            <Code className="h-4 w-4" />
                            <span>Code</span>
                        </button>
                    </div>
                </div>
            )}

            {/* Code Generation Controls */}
            {showGeneratedCode && viewMode === 'generated' && (
                <div className="px-4 py-3 border-b border-border space-y-3">
                    <CodeGenerationStatus graphId={graphId} />
                    
                    <Button
                        onClick={generateCodeForGraph}
                        disabled={isGenerating || !graphId || isCodegenLoading}
                        className="w-full"
                        size="sm"
                    >
                        {isGenerating || isCodegenLoading ? (
                            <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                {isGenerating ? 'Generating...' : 'Loading...'}
                            </>
                        ) : (
                            <>
                                <Zap className="h-4 w-4 mr-2" />
                                Generate Code for Graph
                            </>
                        )}
                    </Button>
                    
                    {/* Generation Progress */}
                    {(isGenerating || generationProgress) && (
                        <div className="text-xs text-muted-foreground bg-blue-50 border border-blue-200 rounded p-2">
                            {generationProgress}
                        </div>
                    )}
                </div>
            )}

            {/* Content */}
            <div className="flex-1 overflow-auto">
                {selectedNode ? (
                    <div className="h-full">
                        {viewMode === 'config' ? (
                            // Configuration View
                            <div className="p-4 space-y-4">
                                <div className="bg-background/50 rounded-lg p-4 border border-border">
                                    <pre className="text-sm text-foreground font-mono whitespace-pre-wrap break-words">
                                        {JSON.stringify(
                                            {
                                                id: selectedNode.id,
                                                type: selectedNode.type,
                                                label: selectedNode.label,
                                                position: {
                                                    x: Math.round(selectedNode.x),
                                                    y: Math.round(selectedNode.y),
                                                },
                                                dimensions: {
                                                    width: selectedNode.width,
                                                    height: selectedNode.height,
                                                },
                                                metadata: {
                                                    companyId: selectedNode.companyId || 'N/A',
                                                    userId: selectedNode.userId || 'N/A',
                                                    nodeType: selectedNode.nodeType,
                                                },
                                            },
                                            null,
                                            2
                                        )}
                                    </pre>
                                </div>

                                {/* Copy Button */}
                                <button
                                    onClick={() => {
                                        navigator.clipboard.writeText(JSON.stringify(selectedNode, null, 2));
                                    }}
                                    className="w-full bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2 rounded-lg transition-colors font-medium"
                                >
                                    Copy JSON
                                </button>
                            </div>
                        ) : (
                            // Generated Code View
                            <div className="h-full flex flex-col">
                                {hasGeneratedCode ? (
                                    <div className="flex-1 p-4">
                                        <GeneratedCodeDisplay
                                            codes={generatedCode}
                                            nodeLabel={selectedNode?.label || 'Unknown'}
                                            onCopy={copyCode}
                                            onDownload={downloadCode}
                                        />
                                    </div>
                                ) : (
                                    // No Generated Code State
                                    <div className="flex-1 flex items-center justify-center p-8">
                                        <div className="text-center space-y-4">
                                            <div className="p-4 bg-muted/50 rounded-full mx-auto w-fit">
                                                <Code className="h-12 w-12 text-muted-foreground" />
                                            </div>
                                            <div>
                                                <h3 className="font-medium text-foreground mb-1">
                                                    No Generated Code
                                                </h3>
                                                <p className="text-sm text-muted-foreground mb-4">
                                                    Generate code for this graph to see the results here
                                                </p>
                                                {!isGenerating && !isCodegenLoading && (
                                                    <Button
                                                        onClick={generateCodeForGraph}
                                                        disabled={!graphId}
                                                        size="sm"
                                                    >
                                                        <Zap className="h-4 w-4 mr-2" />
                                                        Generate Code
                                                    </Button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                ) : (
                    // No Node Selected State
                    <div className="flex flex-col items-center justify-center h-full text-muted-foreground p-8">
                        <div className="p-4 bg-muted/50 rounded-full mb-4">
                            {viewMode === 'generated' ? (
                                <Code className="w-12 h-12 opacity-50" />
                            ) : (
                                <svg
                                    className="w-12 h-12 opacity-50"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={1.5}
                                        d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"
                                    />
                                </svg>
                            )}
                        </div>
                        <h3 className="font-medium text-foreground mb-1">
                            {viewMode === 'generated' ? 'Select a Node' : 'Select a Node'}
                        </h3>
                        <p className="text-sm text-center">
                            {viewMode === 'generated'
                                ? 'Click on any node in the canvas to view its generated code'
                                : 'Click on any node in the canvas to view its configuration'
                            }
                        </p>
                    </div>
                )}

                {/* Error Display */}
                {codegenError && (
                    <div className="absolute bottom-4 left-4 right-4">
                        <Alert variant="destructive">
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription>{codegenError}</AlertDescription>
                        </Alert>
                    </div>
                )}
            </div>

            {/* Footer */}
            {showGeneratedCode && viewMode === 'generated' && (
                <div className="px-4 py-2 border-t border-border bg-muted/30">
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <div className="flex items-center space-x-4">
                            <span>Graph: {graphId ? graphId.substring(0, 8) + '...' : 'N/A'}</span>
                            <span>Jobs: {codegenStats.totalJobsCompleted}</span>
                        </div>
                        {hasGeneratedCode && (
                            <div className="flex items-center space-x-1 text-green-600">
                                <CheckCircle className="h-3 w-3" />
                                <span>Code Available</span>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
});

CodePanel.displayName = 'CodePanel';

export default CodePanel;
