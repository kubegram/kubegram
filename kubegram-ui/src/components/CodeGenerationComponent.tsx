import React, { useState, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, CheckCircle, XCircle, Clock, X, Code, Database } from 'lucide-react';
import type { InitiateCodegenInput, CodegenResults } from '@/store/api/codegen';
import { PollingPresets } from '@/store/api/codegenUtils';
import { useSelector } from 'react-redux';
import { 
  selectGeneratedCodeForGraph,
  selectCodegenStats 
} from '@/store/slices/codegen/codegenSlice';

/**
 * CodeGenerationComponent Props
 */
interface CodeGenerationComponentProps {
  input: InitiateCodegenInput;
  token?: string;
  onComplete?: (result: CodegenResults) => void;
  onError?: (error: string) => void;
  preset?: keyof typeof PollingPresets;
  customConfig?: Partial<any>;
  useRedux?: boolean;
  showStoredCode?: boolean;
}

/**
 * React component for code generation with polling UI
 */
export const CodeGenerationComponent: React.FC<CodeGenerationComponentProps> = ({
  input,
  token,
  onComplete,
  onError,
  preset = 'standard',
  customConfig,
  useRedux = true,
  showStoredCode = true
}) => {
// Redux state
  const codegenStats = useSelector(selectCodegenStats);
  const graphStoredCode = useSelector((state: any) => 
    selectGeneratedCodeForGraph(state, input.graph.id)
  );
  
  // Local state management
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState('');
  const [status, setStatus] = useState('');
  const [result, setResult] = useState<CodegenResults | null>(null);
  const [error, setError] = useState('');
  const [attempt, setAttempt] = useState(0);
  const [totalDuration, setTotalDuration] = useState(0);
  const [abortController, setAbortController] = useState<AbortController | null>(null);
  const [resultsFetched, setResultsFetched] = useState(false);
  const [codeStored, setCodeStored] = useState<{graphId: string; nodeId: string; codes: string[]}[]>([]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortController) {
        abortController.abort();
      }
    };
  }, [abortController]);

  // Start code generation
  const startGeneration = useCallback(async () => {
    try {
      // Reset state
      setIsLoading(true);
      setProgress('Initializing...');
      setStatus('Starting');
      setResult(null);
      setError('');
      setAttempt(0);
      setTotalDuration(0);
      setResultsFetched(false);
      setCodeStored([]);

      // Create abort controller
      const controller = new AbortController();
      setAbortController(controller);

      // Import dynamically to avoid circular dependencies
      const { CodeGenerationManager } = await import('@/store/api/codegenUtils');

      const manager = new CodeGenerationManager();

      // Get configuration
      const config = customConfig || PollingPresets[preset];

// Start polling with UI callbacks
      const pollingResult = await manager.startCodeGeneration(
          input,
          {
            setProgress: (msg) => setProgress(msg),
            setStatus: (msg) => setStatus(msg),
            setLoading: (loading) => setIsLoading(loading),
            setResult: (res) => {
              setResult(res);
              onComplete?.(res);
            },
            setError: (msg) => {
              setError(msg);
              onError?.(msg);
            }
          },
          config,
          token
      );

      // Update final state
      setAttempt(pollingResult.totalAttempts);
      setTotalDuration(pollingResult.totalDuration);

    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred');
      setIsLoading(false);
      onError?.(err.message || 'An unexpected error occurred');
    } finally {
      setAbortController(null);
    }
  }, [input, token, preset, customConfig, onComplete, onError, useRedux]);

  // Cancel generation
  const cancelGeneration = useCallback(() => {
    if (abortController) {
      abortController.abort();
      setAbortController(null);
      setIsLoading(false);
      setProgress('Code generation cancelled');
      setStatus('cancelled');
    }
  }, [abortController]);

  // Format duration
  const formatDuration = (ms: number): string => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  // Get status color
  const getStatusColor = (status: string): string => {
    switch (status.toLowerCase()) {
      case 'completed': return 'bg-green-500';
      case 'error': return 'bg-red-500';
      case 'cancelled': return 'bg-gray-500';
      default: return 'bg-blue-500';
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Code Generation</span>
          {isLoading && (
            <Badge variant="secondary" className="animate-pulse">
              In Progress
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Progress Display */}
        {progress && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Progress</span>
              {isLoading && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={cancelGeneration}
                  className="h-6 w-6 p-0"
                >
                  <X className="h-3 w-3" />
                </Button>
              )}
            </div>
            <div className="flex items-center space-x-2">
              {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
              <span className="text-sm">{progress}</span>
            </div>
            {isLoading && <Progress value={undefined} className="h-2" />}
          </div>
        )}

        {/* Status Display */}
        {status && (
          <div className="flex items-center space-x-2">
            <div className={`w-2 h-2 rounded-full ${getStatusColor(status)}`} />
            <span className="text-sm font-medium">Status: {status}</span>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <Alert variant="destructive">
            <XCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Success Display */}
        {result && !isLoading && (
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              Code generation completed successfully!
            </AlertDescription>
          </Alert>
        )}

        {/* Metrics Display */}
        {(attempt > 0 || totalDuration > 0) && (
          <div className="flex items-center justify-between text-sm text-muted-foreground border-t pt-4">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-1">
                <Clock className="h-3 w-3" />
                <span>{formatDuration(totalDuration)}</span>
              </div>
              <div>Attempts: {attempt}</div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex space-x-2">
          {!isLoading && (
            <Button onClick={startGeneration} className="flex-1">
              Start Code Generation
            </Button>
          )}
          
          {isLoading && (
            <Button 
              variant="outline" 
              onClick={cancelGeneration}
              className="flex-1"
            >
              Cancel
            </Button>
          )}
        </div>

        {/* Configuration Info */}
        <div className="text-xs text-muted-foreground border-t pt-2">
          <div>Configuration: {preset}</div>
          {customConfig && <div>Custom configuration applied</div>}
          {useRedux && <div>Redux integration enabled</div>}
        </div>
      </CardContent>
      
      {/* Stored Code Display Section */}
      {showStoredCode && Object.keys(graphStoredCode).length > 0 && (
        <>
          <CardHeader className="border-t">
            <CardTitle className="flex items-center space-x-2">
              <Database className="h-4 w-4" />
              <span>Generated Code ({Object.keys(graphStoredCode).length} nodes)</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {Object.entries(graphStoredCode).map(([nodeId, codes]) => (
              <div key={nodeId} className="border rounded-lg p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Code className="h-3 w-3" />
                    <span className="text-sm font-medium">Node: {nodeId}</span>
                  </div>
                  <Badge variant="secondary" className="text-xs">
                    {codes.length} code(s)
                  </Badge>
                </div>
                
                {codes.map((code, index) => (
                  <div key={index} className="bg-muted rounded p-2">
                    <pre className="text-xs overflow-x-auto whitespace-pre-wrap">
                      {code.substring(0, 200)}
                      {code.length > 200 && '...'}
                    </pre>
                    {code.length > 200 && (
                      <Button variant="ghost" size="sm" className="mt-2 text-xs">
                        View Full Code
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            ))}
          </CardContent>
        </>
      )}
      
      {/* Codegen Statistics */}
      {useRedux && (codegenStats.totalJobsCompleted > 0 || codegenStats.totalCodeGenerated > 0) && (
        <>
          <CardHeader className="border-t">
            <CardTitle className="text-sm">Statistics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="text-center">
                <div className="font-bold text-lg">{codegenStats.totalJobsCompleted}</div>
                <div className="text-muted-foreground">Jobs Completed</div>
              </div>
              <div className="text-center">
                <div className="font-bold text-lg">{codegenStats.totalCodeGenerated}</div>
                <div className="text-muted-foreground">Code Files Generated</div>
              </div>
            </div>
          </CardContent>
        </>
      )}
      
      {/* Results Fetched Indicator */}
      {resultsFetched && (
        <CardContent className="border-t">
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              Results successfully fetched and stored for {result?.generatedCodes.length || 0} nodes.
            </AlertDescription>
          </Alert>
        </CardContent>
      )}
      
      {/* Code Stored Indicator */}
      {codeStored.length > 0 && (
        <CardContent className="border-t">
          <div className="space-y-2">
            <div className="text-sm font-medium">Code Storage Progress:</div>
            {codeStored.map((stored, index) => (
              <div key={index} className="text-xs text-muted-foreground flex items-center space-x-2">
                <CheckCircle className="h-3 w-3 text-green-500" />
                <span>Node {stored.nodeId} stored</span>
              </div>
            ))}
          </div>
        </CardContent>
      )}
    </Card>
  );
};

/**
 * Example usage component
 */
export const CodeGenerationExample: React.FC = () => {
  // Example input - replace with your actual data
  const exampleInput: InitiateCodegenInput = {
    project: {
      id: 'example-project-123',
      name: 'Example Kubernetes Project'
    },
    graph: {
      id: 'example-graph-456',
      name: 'Example Graph',
      graphType: 'KUBERNETES' as any,
      companyId: 'example-company-789',
      userId: 'example-user-101',
      nodes: [],
      arrows: []
    },
    llmConfig: {
      provider: 'DEEPSEEK',
      model: 'DEEPSEEK_CHAT'
    }
  };

  const handleComplete = (result: any) => {
    console.log('Code generation completed:', result);
  };

  const handleError = (error: string) => {
    console.error('Code generation failed:', error);
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">Code Generation Example</h1>
      
      <CodeGenerationComponent
        input={exampleInput}
        onComplete={handleComplete}
        onError={handleError}
        preset="standard"
      />
    </div>
  );
};
