import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import KonvaPage from './KonvaPage';
import CodePanel from '../components/CodePanel';
import JobHistorySidebar from '../components/JobHistorySidebar';
import { useAppSelector } from '@/store/hooks';
import { fetchCodegenResults, saveGeneratedCodeToStorage } from '@/store/api/codegen';

interface CodeViewPageProps {
    isSidebarCollapsed?: boolean;
    isHeaderCollapsed?: boolean;
    showGeneratedCode?: boolean;
    jobId?: string;
}

const CodeViewPage: React.FC<CodeViewPageProps> = ({
    isSidebarCollapsed = false,
    isHeaderCollapsed = false,
    showGeneratedCode = true,
    jobId: initialJobId,
}) => {
    const navigate = useNavigate();
    const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
    const [selectedJobId, setSelectedJobId] = useState<string | undefined>(initialJobId);

    // Get the selected node from canvas state
    const nodes = useAppSelector((state) => state.canvas.data.canvasElementsLookup.nodes);
    const selectedNode = selectedNodeId ? nodes.find((n) => n.id === selectedNodeId) || null : null;
    
    // Get current project to access graph ID
    const project = useAppSelector((state) => state.project.project);
    const projectId = project?.id?.toString() || '';
    const graphId = project?.graph?.id || '';

    // Fetch job results when a job is selected
    useEffect(() => {
        const loadJobResults = async () => {
            if (!selectedJobId) return;

            try {
                const results = await fetchCodegenResults(selectedJobId);
                // Store results in localStorage for persistence
                saveGeneratedCodeToStorage(results);
            } catch (error) {
                console.error('Failed to load job results:', error);
            }
        };

        loadJobResults();
    }, [selectedJobId]);

    const handleJobSelect = (newJobId: string) => {
        setSelectedJobId(newJobId);
        navigate(`/code-view/${newJobId}`);
    };

    return (
        <div className="flex h-full w-full">
            {/* Job History Sidebar */}
            {projectId && (
                <JobHistorySidebar
                    projectId={projectId}
                    selectedJobId={selectedJobId}
                    onSelectJob={handleJobSelect}
                />
            )}

            {/* Canvas Area - flexible width */}
            <div className="flex-1 min-w-0">
                <KonvaPage
                    isSidebarCollapsed={isSidebarCollapsed}
                    isHeaderCollapsed={isHeaderCollapsed}
                    onNodeSelect={setSelectedNodeId}
                />
            </div>

            {/* Code Panel - 30% */}
            <div className="w-[30%] min-w-[300px]">
                <CodePanel 
                    selectedNode={selectedNode} 
                    graphId={graphId}
                    showGeneratedCode={showGeneratedCode}
                />
            </div>
        </div>
    );
};

export default CodeViewPage;
