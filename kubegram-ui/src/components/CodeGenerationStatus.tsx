import React, { memo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Loader2, 
  CheckCircle, 
  AlertCircle, 
  Clock, 
  Zap,
  Database,
  Activity
} from 'lucide-react';
import { useAppSelector } from '@/store/hooks';
import { selectCodegenState, selectCodegenStats } from '@/store/slices/codegen/codegenSlice';

interface CodeGenerationStatusProps {
  graphId: string;
  className?: string;
}

const CodeGenerationStatus: React.FC<CodeGenerationStatusProps> = memo(({
  graphId,
  className = ''
}) => {
  const codegenState = useAppSelector(selectCodegenState);
  const codegenStats = useAppSelector(selectCodegenStats);
  
  const { isLoading, isFetchingResults, error, resultsError } = codegenState;
  const { totalJobsCompleted, totalCodeGenerated, activeJobsCount } = codegenStats;
  
  // Get active jobs for this graph
  const activeJobs = Object.values(codegenState.activeJobs).filter(job => job.graphId === graphId);
  const hasActiveJob = activeJobs.length > 0;
  
  // Get stored code for this graph
  const storedCode = codegenState.storedCode[graphId] || {};
  const nodeCount = Object.keys(storedCode).length;
  const hasGeneratedCode = nodeCount > 0;
  
  // Determine status
  const getStatus = () => {
    if (error || resultsError) return 'error';
    if (isLoading || isFetchingResults || hasActiveJob) return 'loading';
    if (hasGeneratedCode) return 'completed';
    return 'idle';
  };
  
  const status = getStatus();
  
  // Status-specific content
  const renderStatusContent = () => {
    switch (status) {
      case 'loading':
        return (
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
              <span className="text-sm font-medium">
                {isFetchingResults ? 'Fetching results...' : 'Generating code...'}
              </span>
            </div>
            
            {hasActiveJob && (
              <div className="space-y-2">
                {activeJobs.map((job) => (
                  <div key={job.jobId} className="text-xs text-muted-foreground">
                    Job {job.jobId.substring(0, 8)}... - {job.status}
                  </div>
                ))}
              </div>
            )}
            
            <Progress value={undefined} className="h-2" />
          </div>
        );
        
      case 'completed':
        return (
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span className="text-sm font-medium">Code generation completed</span>
            </div>
            
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div className="text-center">
                <div className="font-bold text-lg text-green-600">{nodeCount}</div>
                <div className="text-muted-foreground">Nodes</div>
              </div>
              <div className="text-center">
                <div className="font-bold text-lg text-blue-600">{totalCodeGenerated}</div>
                <div className="text-muted-foreground">Total Files</div>
              </div>
            </div>
            
            <div className="flex items-center justify-between text-xs text-muted-foreground border-t pt-2">
              <span>Last completed: {new Date().toLocaleTimeString()}</span>
              <Badge variant="secondary" className="text-xs">
                Ready
              </Badge>
            </div>
          </div>
        );
        
      case 'error':
        return (
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <AlertCircle className="h-4 w-4 text-red-500" />
              <span className="text-sm font-medium">Generation failed</span>
            </div>
            
            <div className="text-xs text-red-600 bg-red-50 border border-red-200 rounded p-2">
              {error || resultsError || 'Unknown error occurred'}
            </div>
            
            <div className="text-xs text-muted-foreground">
              Please try again or check your connection
            </div>
          </div>
        );
        
      case 'idle':
      default:
        return (
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">No code generated yet</span>
            </div>
            
            <div className="text-xs text-muted-foreground text-center">
              Click "Generate Code" to start the process
            </div>
            
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div className="text-center">
                <div className="font-bold text-lg">{totalJobsCompleted}</div>
                <div className="text-muted-foreground">Jobs Done</div>
              </div>
              <div className="text-center">
                <div className="font-bold text-lg">{totalCodeGenerated}</div>
                <div className="text-muted-foreground">Total Files</div>
              </div>
            </div>
          </div>
        );
    }
  };
  
  return (
    <Card className={`border-l-2 ${
      status === 'loading' ? 'border-l-blue-500' :
      status === 'completed' ? 'border-l-green-500' :
      status === 'error' ? 'border-l-red-500' :
      'border-l-gray-300'
    } ${className}`}>
      <CardContent className="p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <Zap className="h-4 w-4 text-blue-500" />
            <span className="text-sm font-semibold">Code Generation</span>
          </div>
          
          <Badge 
            variant={status === 'loading' ? 'default' : 'secondary'}
            className={`text-xs ${
              status === 'loading' ? 'bg-blue-100 text-blue-800' :
              status === 'completed' ? 'bg-green-100 text-green-800' :
              status === 'error' ? 'bg-red-100 text-red-800' :
              ''
            }`}
          >
            {status === 'loading' ? 'In Progress' :
             status === 'completed' ? 'Completed' :
             status === 'error' ? 'Failed' :
             'Idle'}
          </Badge>
        </div>
        
        {/* Status Content */}
        {renderStatusContent()}
        
        {/* Graph Info */}
        <div className="mt-3 pt-3 border-t border-border">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <div className="flex items-center space-x-1">
              <Database className="h-3 w-3" />
              <span>Graph: {graphId ? graphId.substring(0, 8) + '...' : 'N/A'}</span>
            </div>
            {activeJobsCount > 0 && (
              <div className="flex items-center space-x-1">
                <Activity className="h-3 w-3" />
                <span>{activeJobsCount} active</span>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
});

CodeGenerationStatus.displayName = 'CodeGenerationStatus';

export default CodeGenerationStatus;