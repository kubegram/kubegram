import React, { useState } from 'react';
import KonvaPage from './KonvaPage';
import CodePanel from '../components/CodePanel';
import { useAppSelector } from '@/store/hooks';

interface CodeViewPageProps {
    isSidebarCollapsed?: boolean;
    isHeaderCollapsed?: boolean;
    showGeneratedCode?: boolean;
}

const CodeViewPage: React.FC<CodeViewPageProps> = ({
    isSidebarCollapsed = false,
    isHeaderCollapsed = false,
    showGeneratedCode = true,
}) => {
    const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

    // Get the selected node from canvas state
    const nodes = useAppSelector((state) => state.canvas.data.canvasElementsLookup.nodes);
    const selectedNode = selectedNodeId ? nodes.find((n) => n.id === selectedNodeId) || null : null;
    
    // Get current project to access graph ID
    const project = useAppSelector((state) => state.project.project);
    const graphId = project?.graph?.id || '';

    return (
        <div className="flex h-full w-full">
            {/* Canvas Area - 70% */}
            <div className="flex-1" style={{ width: '70%' }}>
                <KonvaPage
                    isSidebarCollapsed={isSidebarCollapsed}
                    isHeaderCollapsed={isHeaderCollapsed}
                    onNodeSelect={setSelectedNodeId}
                />
            </div>

            {/* Code Panel - 30% */}
            <div style={{ width: '30%' }}>
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
