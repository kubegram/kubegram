import React, { useState } from 'react';
import KonvaPage from './KonvaPage';
import { useAppDispatch } from '@/store/hooks';
import { updateGraph, saveCurrentAsPrevious } from '@/store/slices/project/projectSlice';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Copy, FileText, ListChecks } from 'lucide-react';
import { type CanvasGraph } from '@/types/canvas';
import { GraphQL } from '@/lib/graphql-client';
import type { PlanResult } from '@/store/api/plan';

interface CompareViewPageProps {
    isSidebarCollapsed?: boolean;
    isHeaderCollapsed?: boolean;
}

interface LocationState {
    planResult?: PlanResult;
    sourceGraph?: CanvasGraph;
}

type TabType = 'plan' | 'assumptions';

// Mock remote graph data generator (for demonstration)
// Mock remote graph data generator (for demonstration)
const generateMockRemoteGraph = (): CanvasGraph => ({
    id: 'remote-graph-1',
    name: 'Remote Configuration',
    companyId: 'comp-1',
    userId: 'user-1',
    graphType: GraphQL.GraphType.Infrastructure,
    nodes: [
        {
            id: 'node-1',
            type: 'Service',
            label: 'Remote Service A',
            iconSrc: '/kubernetes/resources/unlabeled/svc.svg',
            x: 100,
            y: 100,
            width: 100,
            height: 100,
            color: '#FF5722',
            companyId: 'comp-1',
            name: 'Remote Service A',
            nodeType: GraphQL.GraphNodeType.Microservice,
            userId: 'user-1'
        },
        {
            id: 'node-2',
            type: 'Pod',
            label: 'Remote Pod',
            iconSrc: '/kubernetes/resources/unlabeled/pod.svg',
            x: 400,
            y: 200,
            width: 100,
            height: 100,
            color: '#4CAF50',
            companyId: 'comp-1',
            name: 'Remote Pod',
            nodeType: GraphQL.GraphNodeType.Microservice,
            userId: 'user-1'
        }
    ],
    arrows: [
        {
            id: 'arrow-1',
            startNodeId: 'node-1',
            endNodeId: 'node-2',
            startX: 150, // Center of node-1 (roughly)
            startY: 150,
            endX: 450, // Center of node-2 (roughly)
            endY: 250,
            node: { id: 'arrow-node-1', type: 'arrow-node', label: '', iconSrc: '', x: 0, y: 0, width: 0, height: 0, companyId: '', name: '', nodeType: GraphQL.GraphNodeType.Microservice, userId: '' }, // Dummy node for type satisfaction
            connectionType: GraphQL.ConnectionType.DependsOn, // Example
        }
    ]
});

// Simulating API call to load graph
const loadGraphFromApi = async (graphId: string): Promise<CanvasGraph> => {
    // In a real app, this would be:
    // const response = await fetch(`/api/graphs/${graphId}`);
    // return response.json();
    console.log('Fetching graph:', graphId);

    // Simulating delay
    await new Promise(resolve => setTimeout(resolve, 500));

    // Return mock data
    return generateMockRemoteGraph();
};

const CompareViewPage: React.FC<CompareViewPageProps> = ({
    isSidebarCollapsed = false,
    isHeaderCollapsed = false,
}) => {
    const dispatch = useAppDispatch();
    const navigate = useNavigate();
    const location = useLocation();
    const locationState = location.state as LocationState | null;

    const [remoteGraph, setRemoteGraph] = React.useState<CanvasGraph | null>(null);
    const [activeTab, setActiveTab] = useState<TabType>('plan');
    const [showSidePanel, setShowSidePanel] = useState(true);

    // Check if we have plan results from route state
    const isPlanMode = !!locationState?.planResult;
    const planResult = locationState?.planResult;

    // Remote graph state (could be fetched from API in real implementation)
    React.useEffect(() => {
        if (isPlanMode && planResult?.graph) {
            // Use plan result graph
            setRemoteGraph(planResult.graph);
        } else {
            // Load mock remote graph for regular compare mode
            loadGraphFromApi('remote-graph-1')
                .then(graph => setRemoteGraph(graph))
                .catch(console.error);
        }
    }, [isPlanMode, planResult]);

    const handleUseRemoteGraph = () => {
        if (!remoteGraph) return;

        // 1. Save current graph as previous (for undo)
        dispatch(saveCurrentAsPrevious());

        // 2. Update current graph with remote data
        dispatch(updateGraph({ graph: remoteGraph }));

        // 3. Navigate to main canvas
        navigate('/app');
    };

    const handleUseLocalGraph = () => {
        // Just navigate back, as we are already on local
        navigate('/app');
    };

    return (
        <div className="flex h-full w-full relative">
            {/* Left Canvas - 50% */}
            {/* Left Canvas - 50% */}
            <div style={{ width: 'calc(50% - 2px)' }}>
                <div className="h-full relative">
                    <div className="absolute top-2 left-2 z-10 flex gap-2 items-center">
                        <div className="bg-background/80 backdrop-blur-sm px-3 py-1 rounded-md border border-border shadow-sm">
                            <span className="text-sm font-medium flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-green-500"></span>
                                Local Graph
                            </span>
                        </div>
                        <Button
                            size="sm"
                            variant="secondary"
                            className="bg-background/80 backdrop-blur-sm shadow-sm h-8"
                            onClick={handleUseLocalGraph}
                        >
                            <ArrowLeft className="w-3 h-3 mr-1" />
                            Back to Edit
                        </Button>
                    </div>
                    {/* Default KonvaPage tracks Redux state (Local) */}
                    <KonvaPage
                        isSidebarCollapsed={isSidebarCollapsed}
                        isHeaderCollapsed={isHeaderCollapsed}
                        codePanelMode="sidebar"
                    />
                </div>
            </div>

            {/* Vertical Divider - Centered */}
            <div className="w-1 bg-border shadow-lg relative flex-shrink-0">
                <div className="absolute inset-0 bg-gradient-to-r from-border/50 via-border to-border/50"></div>
                {/* Center indicator */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-8 bg-primary/30 rounded-full"></div>
            </div>

            {/* Right Canvas - Variable width based on side panel */}
            <div style={{ width: isPlanMode && showSidePanel ? 'calc(35% - 2px)' : 'calc(50% - 2px)' }}>
                <div className="h-full relative">
                    <div className="absolute top-2 left-2 z-10 flex gap-2 items-center">
                        <div className="bg-background/80 backdrop-blur-sm px-3 py-1 rounded-md border border-border shadow-sm">
                            <span className="text-sm font-medium flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-purple-500"></span>
                                {isPlanMode ? 'Planned Graph' : 'Remote Graph'}
                            </span>
                        </div>
                        <Button
                            size="sm"
                            className="bg-primary shadow-sm h-8"
                            onClick={handleUseRemoteGraph}
                        >
                            <Copy className="w-3 h-3 mr-1" />
                            {isPlanMode ? 'Apply Plan' : 'Use This Graph'}
                        </Button>
                    </div>
                    {/* Pass initialGraphData to show Remote content */}
                    <KonvaPage
                        isSidebarCollapsed={isSidebarCollapsed}
                        isHeaderCollapsed={isHeaderCollapsed}
                        initialGraphData={remoteGraph}
                        codePanelMode="none"
                        showToolbar={false}
                    />
                </div>
            </div>

            {/* Side Panel for Plan Details (only in plan mode) */}
            {isPlanMode && showSidePanel && (
                <div className="w-[30%] border-l border-border bg-background flex flex-col">
                    {/* Header */}
                    <div className="p-4 border-b border-border flex items-center justify-between">
                        <h2 className="font-semibold text-lg">Planning Details</h2>
                        <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setShowSidePanel(false)}
                            className="h-8 w-8 p-0"
                        >
                            ✕
                        </Button>
                    </div>

                    {/* Tabs */}
                    <div className="flex border-b border-border">
                        <button
                            onClick={() => setActiveTab('plan')}
                            className={`flex-1 px-4 py-2.5 text-sm font-medium transition-colors flex items-center justify-center gap-2 ${activeTab === 'plan'
                                ? 'border-b-2 border-primary text-primary bg-primary/5'
                                : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                                }`}
                        >
                            <FileText className="w-4 h-4" />
                            Plan Details
                        </button>
                        <button
                            onClick={() => setActiveTab('assumptions')}
                            className={`flex-1 px-4 py-2.5 text-sm font-medium transition-colors flex items-center justify-center gap-2 ${activeTab === 'assumptions'
                                ? 'border-b-2 border-primary text-primary bg-primary/5'
                                : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                                }`}
                        >
                            <ListChecks className="w-4 h-4" />
                            Assumptions
                        </button>
                    </div>

                    {/* Tab Content */}
                    <div className="flex-1 overflow-y-auto p-4">
                        {activeTab === 'plan' && (
                            <div className="space-y-3">
                                <div className="text-sm text-muted-foreground mb-4">
                                    AI-generated plan based on your graph:
                                </div>
                                {planResult?.context && planResult.context.length > 0 ? (
                                    <div className="space-y-2">
                                        {planResult.context.map((item, idx) => (
                                            <div
                                                key={idx}
                                                className="p-3 rounded-lg bg-muted/50 border border-border"
                                            >
                                                <p className="text-sm leading-relaxed">{item}</p>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-sm text-muted-foreground italic">
                                        No plan details available.
                                    </div>
                                )}
                            </div>
                        )}

                        {activeTab === 'assumptions' && (
                            <div className="space-y-3">
                                <div className="text-sm text-muted-foreground mb-4">
                                    Assumptions made during planning:
                                </div>
                                {planResult?.context && planResult.context.length > 0 ? (
                                    <ul className="space-y-2">
                                        {planResult.context
                                            .filter(item => item.toLowerCase().includes('assum'))
                                            .map((item, idx) => (
                                                <li
                                                    key={idx}
                                                    className="flex items-start gap-2 text-sm"
                                                >
                                                    <span className="text-primary mt-1">•</span>
                                                    <span className="flex-1">{item}</span>
                                                </li>
                                            ))}
                                        {planResult.context.filter(item => item.toLowerCase().includes('assum')).length === 0 && (
                                            <div className="text-sm text-muted-foreground italic">
                                                No specific assumptions documented.
                                            </div>
                                        )}
                                    </ul>
                                ) : (
                                    <div className="text-sm text-muted-foreground italic">
                                        No assumptions available.
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Footer Actions */}
                    <div className="p-4 border-t border-border">
                        <Button
                            className="w-full"
                            onClick={handleUseRemoteGraph}
                        >
                            <Copy className="w-4 h-4 mr-2" />
                            Apply This Plan
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CompareViewPage;
