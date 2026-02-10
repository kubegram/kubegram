import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Monitor, Play, Activity } from 'lucide-react';
import { graphqlConfig } from '@/lib/graphql-client';

interface PlanJobStatus {
    jobId: string;
    status: string;
    step: string;
    error?: string;
}

interface PlanResult {
    graph: any;
    context: string[];
}

const INITIALIZE_PLAN_MUTATION = `
  mutation InitializePlan($userRequest: String!, $modelProvider: String, $modelName: String) {
    initializePlan(userRequest: $userRequest, modelProvider: $modelProvider, modelName: $modelName) {
      jobId
      status
      step
      error
    }
  }
`;

const GET_PLAN_QUERY = `
  query GetPlan($jobId: String!) {
    getPlan(jobId: $jobId) {
      graph {
        id
        name
        nodes {
          id
          name
          nodeType
        }
      }
      context
    }
    jobStatus(input: { jobId: $jobId }) {
      status
      step
      error
    }
  }
`;

const PlanTestPage: React.FC = () => {
    const [userRequest, setUserRequest] = useState('');
    const [modelProvider, setModelProvider] = useState('deepseek');
    const [modelName, setModelName] = useState('DEEPSEEK_CHAT');
    const [jobStatus, setJobStatus] = useState<PlanJobStatus | null>(null);
    const [planResult, setPlanResult] = useState<PlanResult | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [logs, setLogs] = useState<string[]>([]);

    const addLog = (msg: string) => setLogs(prev => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev]);

    const executeGraphQL = async (query: string, variables: any) => {
        try {
            const response = await fetch(graphqlConfig.httpEndpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    // Add authorization header if needed, assuming local dev might not need it or we use a hardcoded one for test
                    // 'Authorization': `Bearer ${token}` 
                },
                body: JSON.stringify({ query, variables }),
            });

            const result = await response.json();
            if (result.errors) {
                throw new Error(result.errors.map((e: any) => e.message).join(', '));
            }
            return result.data;
        } catch (err: any) {
            throw err;
        }
    };

    const handleInitialize = async () => {
        setLoading(true);
        setError(null);
        setJobStatus(null);
        setPlanResult(null);
        setLogs([]);

        try {
            addLog('Initializing plan...');
            const data = await executeGraphQL(INITIALIZE_PLAN_MUTATION, {
                userRequest,
                modelProvider,
                modelName,
            });

            const status = data.initializePlan;
            setJobStatus(status);
            addLog(`Job started: ${status.jobId}`);

            // Start polling
            pollStatus(status.jobId);

        } catch (err: any) {
            setError(err.message);
            addLog(`Error: ${err.message}`);
            setLoading(false);
        }
    };

    const pollStatus = async (id: string) => {
        const pollInterval = setInterval(async () => {
            try {
                const data = await executeGraphQL(GET_PLAN_QUERY, { jobId: id });

                // Check job status (using the separate jobStatus query I added to the composite query)
                // Wait, I need to make sure getPlan returns null if not ready or if I should check status separately.
                // The composite query gets both.

                const status = data.jobStatus;
                if (status) {
                    setJobStatus(status);
                    addLog(`Status: ${status.status} (${status.step})`);

                    if (status.status === 'completed') {
                        clearInterval(pollInterval);
                        setLoading(false);
                        setPlanResult(data.getPlan);
                        addLog('Plan completed!');
                    } else if (status.status === 'failed') {
                        clearInterval(pollInterval);
                        setLoading(false);
                        setError(status.error || 'Job failed');
                        addLog('Job failed');
                    }
                }

            } catch (err: any) {
                addLog(`Polling error: ${err.message}`);
                // Don't clear interval immediately on transient error?
            }
        }, 2000);
    };

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="max-w-7xl mx-auto mb-8">
                <h1 className="text-3xl font-bold text-gray-900 flex items-center">
                    <Monitor className="h-8 w-8 mr-3 text-blue-600" />
                    Plan Workflow Test Page
                </h1>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-7xl mx-auto">
                {/* Controls */}
                <Card>
                    <CardHeader>
                        <CardTitle>Plan Configuration</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">User Request</label>
                            <textarea
                                className="w-full p-2 border rounded-md h-32"
                                value={userRequest}
                                onChange={e => setUserRequest(e.target.value)}
                                placeholder="Describe your infrastructure..."
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Provider</label>
                                <select
                                    className="w-full p-2 border rounded-md"
                                    value={modelProvider}
                                    onChange={e => setModelProvider(e.target.value)}
                                >
                                    <option value="deepseek">DeepSeek</option>
                                    <option value="anthropic">Anthropic</option>
                                    <option value="openai">OpenAI</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Model</label>
                                <input
                                    className="w-full p-2 border rounded-md"
                                    value={modelName}
                                    onChange={e => setModelName(e.target.value)}
                                />
                            </div>
                        </div>
                        <Button
                            onClick={handleInitialize}
                            disabled={loading || !userRequest}
                            className="w-full"
                        >
                            {loading ? <Activity className="animate-spin mr-2 h-4 w-4" /> : <Play className="mr-2 h-4 w-4" />}
                            Generate Plan
                        </Button>

                        {error && (
                            <Alert variant="destructive">
                                <AlertDescription>{error}</AlertDescription>
                            </Alert>
                        )}
                    </CardContent>
                </Card>

                {/* Results */}
                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Job Status</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {jobStatus ? (
                                <div className="space-y-2">
                                    <div className="flex justify-between">
                                        <span className="font-medium">Job ID:</span>
                                        <span className="font-mono text-sm">{jobStatus.jobId}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="font-medium">Status:</span>
                                        <Badge variant={jobStatus.status === 'completed' ? 'default' : 'secondary'}>
                                            {jobStatus.status}
                                        </Badge>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="font-medium">Step:</span>
                                        <span>{jobStatus.step}</span>
                                    </div>
                                </div>
                            ) : (
                                <p className="text-gray-500">No active job</p>
                            )}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Logs</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="bg-gray-900 text-green-400 p-4 rounded-md font-mono text-xs h-48 overflow-y-auto">
                                {logs.map((log, i) => <div key={i}>{log}</div>)}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Plan Output */}
                {planResult && (
                    <div className="lg:col-span-2">
                        <Card>
                            <CardHeader>
                                <CardTitle>Plan Result</CardTitle>
                            </CardHeader>
                            <CardContent className="grid grid-cols-2 gap-6">
                                <div>
                                    <h3 className="font-medium mb-2">Graph</h3>
                                    <pre className="bg-gray-100 p-4 rounded-md overflow-auto h-96 text-xs">
                                        {JSON.stringify(planResult.graph, null, 2)}
                                    </pre>
                                </div>
                                <div>
                                    <h3 className="font-medium mb-2">Context</h3>
                                    <pre className="bg-gray-100 p-4 rounded-md overflow-auto h-96 text-xs">
                                        {JSON.stringify(planResult.context, null, 2)}
                                    </pre>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                )}
            </div>
        </div>
    );
};

export default PlanTestPage;
