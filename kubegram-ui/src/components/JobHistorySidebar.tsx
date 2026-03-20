import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Loader2, History, Clock, CheckCircle, XCircle, AlertCircle, Ban } from 'lucide-react';
import { listCodegenJobs, type CodegenJobListItem } from '@/store/api/codegen';

interface JobHistorySidebarProps {
  projectId: string;
  selectedJobId?: string;
  onSelectJob?: (jobId: string) => void;
}

const formatRelativeTime = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
};

const getStatusIcon = (status: string) => {
  switch (status.toLowerCase()) {
    case 'completed':
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    case 'failed':
      return <XCircle className="h-4 w-4 text-red-500" />;
    case 'running':
      return <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />;
    case 'pending':
      return <Clock className="h-4 w-4 text-yellow-500" />;
    case 'cancelled':
      return <Ban className="h-4 w-4 text-gray-500" />;
    default:
      return <AlertCircle className="h-4 w-4 text-gray-500" />;
  }
};

const getStatusBadgeVariant = (status: string): 'default' | 'secondary' | 'destructive' | 'outline' => {
  switch (status.toLowerCase()) {
    case 'completed':
      return 'default';
    case 'failed':
      return 'destructive';
    case 'running':
      return 'secondary';
    case 'cancelled':
      return 'outline';
    default:
      return 'outline';
  }
};

export const JobHistorySidebar: React.FC<JobHistorySidebarProps> = ({
  projectId,
  selectedJobId,
  onSelectJob,
}) => {
  const navigate = useNavigate();
  const [jobs, setJobs] = useState<CodegenJobListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchJobs = async () => {
      if (!projectId) {
        setJobs([]);
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);
        const response = await listCodegenJobs(projectId, 50);
        setJobs(response.jobs);
      } catch (err) {
        console.error('Failed to fetch job history:', err);
        setError('Failed to load job history');
      } finally {
        setIsLoading(false);
      }
    };

    fetchJobs();
  }, [projectId]);

  const handleJobClick = (job: CodegenJobListItem) => {
    if (onSelectJob) {
      onSelectJob(job.uuid);
    } else {
      navigate(`/code-view/${job.uuid}`);
    }
  };

  return (
    <div className="h-full w-64 bg-card border-r border-border flex flex-col">
      {/* Header */}
      <div className="px-4 py-3 border-b border-border">
        <div className="flex items-center space-x-2">
          <History className="h-4 w-4 text-muted-foreground" />
          <h3 className="font-semibold text-sm">Generation History</h3>
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          {jobs.length} job{jobs.length !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Job List */}
      <ScrollArea className="flex-1">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : error ? (
          <div className="px-4 py-4 text-center">
            <AlertCircle className="h-6 w-6 text-red-500 mx-auto mb-2" />
            <p className="text-sm text-red-500">{error}</p>
          </div>
        ) : jobs.length === 0 ? (
          <div className="px-4 py-8 text-center">
            <Clock className="h-8 w-8 text-muted-foreground mx-auto mb-2 opacity-50" />
            <p className="text-sm text-muted-foreground">No generation jobs yet</p>
            <p className="text-xs text-muted-foreground mt-1">
              Run code generation to see history
            </p>
          </div>
        ) : (
          <div className="p-2 space-y-1">
            {jobs.map((job) => (
              <button
                key={job.uuid}
                onClick={() => handleJobClick(job)}
                className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                  selectedJobId === job.uuid
                    ? 'bg-primary/10 border border-primary/30'
                    : 'hover:bg-muted/50 border border-transparent'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-mono text-muted-foreground">
                    {job.uuid.substring(0, 8)}...
                  </span>
                  {getStatusIcon(job.status)}
                </div>
                <div className="flex items-center justify-between">
                  <Badge variant={getStatusBadgeVariant(job.status)} className="text-xs">
                    {job.status}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {formatRelativeTime(job.createdAt)}
                  </span>
                </div>
                {job.progress > 0 && job.progress < 100 && (
                  <div className="mt-2">
                    <div className="h-1 w-full bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-500 transition-all duration-300"
                        style={{ width: `${job.progress}%` }}
                      />
                    </div>
                  </div>
                )}
              </button>
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );
};

export default JobHistorySidebar;
