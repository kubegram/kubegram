import React, { useRef, useCallback, useState, useEffect } from 'react';
import Konva from 'konva';
import JsonCanvasEditor from '@/components/JsonCanvasEditor';
import KonvaToolbar from '@/components/KonvaToolbar';
import HelpModal from '@/components/HelpModal';
import CanvasAIAssistant from '@/components/CanvasAIAssistant';
import { CodeGenerationModal } from '@/components/CodeGenerationModal';
import { CodeGenerationPanel } from '@/components/CodeGenerationPanel';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { HelpCircle, Download, Upload, Activity, Zap, PenTool } from 'lucide-react';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { useCodeGeneration } from '@/hooks/useCodeGeneration';
import { useGraphConversion } from '@/hooks/useGraphConversion-v2';
import { useJsonCanvasState } from '@/hooks/canvas/useJsonCanvasState';
import { toggleToolbar, setShowHelpModal } from '@/store/slices/uiSlice';
import { GraphQL } from '@/lib/graphql-client';
import {
  setArrowMode as setCanvasArrowMode,
  setSquareArrowMode as setCanvasSquareArrowMode,
  setCurvedArrowMode as setCanvasCurvedArrowMode,
  resetCanvas,
  setNodes,
  setArrows,
  fetchLlmConfigs,
} from '@/store/slices/canvas';
import { restorePreviousGraph, updateProjectName } from '@/store/slices/project/projectSlice';
import type { JsonCanvas } from '@/types/jsoncanvas';
import type { CanvasGraph } from '@/types/canvas';
import { exportToCanvasFile, importCanvasFile } from '@/utils/jsoncanvas';
import { convertCanvasGraphToJsonCanvas, convertJsonCanvasToCanvasGraph } from '@/utils/jsoncanvas-conversion';

interface JsonCanvasPageProps {
  isSidebarCollapsed: boolean;
  isHeaderCollapsed?: boolean;
  onNodeSelect?: (nodeId: string | null) => void;
  initialGraphData?: CanvasGraph | null;
  codePanelMode?: 'modal' | 'sidebar' | 'none';
  showToolbar?: boolean;
}

const JsonCanvasPage: React.FC<JsonCanvasPageProps> = ({ 
  isSidebarCollapsed, 
  isHeaderCollapsed = false, 
  initialGraphData, 
  codePanelMode = 'modal', 
  showToolbar = true 
}) => {
  const dispatch = useAppDispatch();
  const canvasRef = useRef<Konva.Stage>(null);
  const [showCodeGenerationModal, setShowCodeGenerationModal] = useState(false);
  const [showCodeSidebar, setShowCodeSidebar] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [tempProjectName, setTempProjectName] = useState('');
  const [showAIPanel, setShowAIPanel] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [localJsonCanvas, setLocalJsonCanvas] = useState<JsonCanvas>({ nodes: [], edges: [] });
  const [hasHydrated, setHasHydrated] = useState(false);

  // Use JSON Canvas state hook
  const jsonCanvasState = useJsonCanvasState(localJsonCanvas);

  // Get state from Redux store
  const isArrowMode = useAppSelector((state) => state.canvas.activity.isArrowMode);
  const isSquareArrowMode = useAppSelector((state) => state.canvas.activity.isSquareArrowMode);
  const isCurvedArrowMode = useAppSelector((state) => state.canvas.activity.isCurvedArrowMode);
  const showHelpModal = useAppSelector((state) => state.ui.showHelpModal);
  const isToolbarCollapsed = useAppSelector((state) => state.ui.isToolbarCollapsed);
  const previousGraph = useAppSelector((state) => state.project.previousGraph);
  const isAuthenticated = useAppSelector((state) => state.oauth.isAuthenticated);
  const user = useAppSelector((state) => state.oauth.user);
  const project = useAppSelector((state) => state.project.project);
  const projects = useAppSelector((state) => state.project.projects);

  // LLM State
  const selectedLlmProvider = useAppSelector((state) => state.canvas.entities.selectedLlmProvider);
  const selectedLlmModel = useAppSelector((state) => state.canvas.entities.selectedLlmModel);

  // Fetch LLM configs on mount
  useEffect(() => {
    if (isAuthenticated) {
      dispatch(fetchLlmConfigs());
    }
  }, [dispatch, isAuthenticated]);

  const getAuthToken = () => {
    const authData = localStorage.getItem('kubegram_auth');
    if (!authData) return null;
    try {
      const parsed = JSON.parse(authData);
      return parsed.accessToken || null;
    } catch {
      return null;
    }
  };

  // Track previous project ID to detect actual project switches
  const previousProjectIdRef = useRef<string | null>(null);

  // Handle project switch: reset canvas then hydrate from new project
  useEffect(() => {
    if (!project?.id) return;

    const isProjectSwitch = previousProjectIdRef.current !== null
      && previousProjectIdRef.current !== project.id;
    const isFirstLoad = previousProjectIdRef.current === null;

    // Update ref to current project ID
    previousProjectIdRef.current = project.id;

    if (isProjectSwitch) {
      // Clear canvas for the new project
      dispatch(resetCanvas());
      console.log('Canvas reset for project switch:', project.id);
    }

    // Hydrate canvas from project graph (on first load or after a switch)
    if ((isFirstLoad || isProjectSwitch) && project.graph && !initialGraphData) {
      const graph = project.graph as any;
      const projectNodes = (graph.nodes || []);
      const projectArrows = (graph.arrows || []);
      
      // Convert to JSON Canvas format for JsonCanvasEditor
      const jsonCanvasData = convertCanvasGraphToJsonCanvas({
        nodes: projectNodes || [],
        arrows: projectArrows || []
      });

      // Load into JSON Canvas state
      jsonCanvasState.loadJsonCanvas(jsonCanvasData);

      const convertedData = convertJsonCanvasToCanvasGraph(jsonCanvasData);
      dispatch(setNodes(convertedData.nodes));
      dispatch(setArrows(convertedData.arrows));
      setHasHydrated(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [project?.id]);

  // Initialize graph conversion - this will trigger conversion when canvas changes
  const { graph, isInitialized, canvasGraph } = useGraphConversion();

  // Initialize code generation
  const {
    isGenerating,
    isConnected,
    generatedCode,
    error: codeError,
    generateCode,
    clearGeneratedCode
  } = useCodeGeneration();

  // Debug logging for canvas state changes
  useEffect(() => {
    console.log('Canvas state changed:', {
      nodeCount: canvasGraph.nodes.length,
      arrowCount: canvasGraph.arrows.length,
      graphInitialized: isInitialized,
      hasGraph: !!graph
    });
  }, [canvasGraph, isInitialized, graph]);

  // Sync JsonCanvas changes to Redux store
  useEffect(() => {
    if (!hasHydrated) return;
    
    const convertedData = convertJsonCanvasToCanvasGraph(jsonCanvasState.jsonCanvas);
    dispatch(setNodes(convertedData.nodes));
    dispatch(setArrows(convertedData.arrows));
  }, [jsonCanvasState.jsonCanvas, hasHydrated, dispatch]);

  const handleToggleArrowMode = () => {
    dispatch(setCanvasArrowMode(!isArrowMode));
  };

  const handleToggleSquareArrowMode = () => {
    dispatch(setCanvasSquareArrowMode(!isSquareArrowMode));
  };

  const handleToggleCurvedArrowMode = () => {
    dispatch(setCanvasCurvedArrowMode(!isCurvedArrowMode));
  };

  const handleOpenHelp = () => {
    dispatch(setShowHelpModal(true));
  };

  const handleCloseHelp = () => {
    dispatch(setShowHelpModal(false));
  };

  const handleToggleToolbar = () => {
    dispatch(toggleToolbar());
  };

  const triggerCodeGeneration = () => {
    // Check authentication first
    if (!isAuthenticated) {
      window.dispatchEvent(new CustomEvent('triggerLoginModal'));
      return;
    }

    if (!isConnected) {
      console.warn('Not connected to code generation service - modal will show connection status');
      return;
    }

    if (canvasGraph.nodes.length === 0) {
      console.warn('No nodes to generate code from - modal will show empty state');
      return;
    }

    // Prepare the graph data for code generation
    const graphForGen: any = {
      ...canvasGraph,
      id: project?.graph?.id ?? 'temp-id',
      name: project?.graph?.name ?? 'Temp Graph',
      companyId: project?.graph?.companyId ?? user?.id ?? '1',
      userId: project?.graph?.userId ?? user?.id ?? '1',
      graphType: project?.graph?.graphType ?? GraphQL.GraphType.Kubernetes
    };

    const codeGenerationRequest = {
      graph: graphForGen,
      project: {
        id: project?.id ?? 'unknown',
        name: project?.name ?? 'Untitled Project',
      },
      options: {
        outputFormat: 'yaml' as const,
        includeComments: true,
        includeLabels: true,
      },
      provider: selectedLlmProvider,
      model: selectedLlmModel,
    };

    const token = getAuthToken();
    generateCode(codeGenerationRequest, token || undefined);
  };

  const handleGenerateCode = () => {
    // Determine action based on mode
    if (codePanelMode === 'sidebar') {
      setShowCodeSidebar(!showCodeSidebar);
    } else {
      setShowCodeGenerationModal(true);
    }
  };

  const handleCloseCodeGeneration = () => {
    setShowCodeGenerationModal(false);
  };

  const handleRestoreGraph = useCallback(() => {
    dispatch(restorePreviousGraph());
  }, [dispatch]);

  // Handler for name update
  const handleProjectNameUpdate = useCallback((newName: string) => {
    if (project && newName.trim() !== project.name) {
      dispatch(updateProjectName(newName.trim()));
    }
    setIsEditingName(false);
  }, [dispatch, project]);

  // Handler for input changes
  const handleProjectNameChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setTempProjectName(e.target.value);
  }, []);

  // Handler for key events (Enter to save, Escape to cancel)
  const handleProjectNameKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleProjectNameUpdate(tempProjectName);
    } else if (e.key === 'Escape') {
      setIsEditingName(false);
      setTempProjectName(project?.name || '');
    }
  }, [handleProjectNameUpdate, tempProjectName, project?.name]);

  // Handler for starting edit
  const handleStartEditName = useCallback(() => {
    setIsEditingName(true);
    setTempProjectName(project?.name || '');
  }, [project?.name]);

  // Handler for losing focus (blur)
  const handleProjectNameBlur = useCallback(() => {
    handleProjectNameUpdate(tempProjectName);
  }, [handleProjectNameUpdate, tempProjectName]);

  // Navigation handlers for toolbar buttons
  const handlePanLeft = useCallback(() => {
    if (canvasRef.current) {
      const stage = canvasRef.current;
      const currentPos = stage.position();
      const newPos = { x: currentPos.x + 100, y: currentPos.y };
      stage.position(newPos);
      stage.batchDraw();
    }
  }, []);

  const handlePanRight = useCallback(() => {
    if (canvasRef.current) {
      const stage = canvasRef.current;
      const currentPos = stage.position();
      const newPos = { x: currentPos.x - 100, y: currentPos.y };
      stage.position(newPos);
      stage.batchDraw();
    }
  }, []);

  const handlePanUp = useCallback(() => {
    if (canvasRef.current) {
      const stage = canvasRef.current;
      const currentPos = stage.position();
      const newPos = { x: currentPos.x, y: currentPos.y + 100 };
      stage.position(newPos);
      stage.batchDraw();
    }
  }, []);

  const handlePanDown = useCallback(() => {
    if (canvasRef.current) {
      const stage = canvasRef.current;
      const currentPos = stage.position();
      const newPos = { x: currentPos.x, y: currentPos.y - 100 };
      stage.position(newPos);
      stage.batchDraw();
    }
  }, []);

  const handleResetView = useCallback(() => {
    if (canvasRef.current) {
      const stage = canvasRef.current;
      const tween = new Konva.Tween({
        node: stage,
        duration: 0.5,
        x: 0,
        y: 0,
        scaleX: 1,
        scaleY: 1,
        easing: Konva.Easings.EaseInOut,
      });
      tween.play();
    }
  }, []);

  const handleClearAll = useCallback(() => {
    // Show confirmation dialog
    const confirmed = window.confirm(
      'Are you sure you want to clear everything on the canvas? This action cannot be undone.',
    );

    if (confirmed) {
      dispatch(resetCanvas());
      jsonCanvasState.clearAll();
      console.log('Canvas cleared - all nodes and arrows removed');
    }
  }, [dispatch, jsonCanvasState]);

  // Export with project metadata
  const handleExport = useCallback(() => {
    const projectName = project?.name || 'Untitled Project';
    const filename = `${projectName.replace(/\s+/g, '-').toLowerCase()}.canvas`;
    
    // Convert current canvas state to JsonCanvas format for export
    const exportData = {
      ...jsonCanvasState.jsonCanvas,
      metadata: {
        projectName,
        exportedAt: new Date().toISOString(),
        version: '1.0'
      }
    };
    exportToCanvasFile(exportData, filename);
  }, [jsonCanvasState.jsonCanvas, project?.name]);

  // Import with project context
  const handleImportClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const data = await importCanvasFile(file);
      
      // Load the data into JSON Canvas state
      jsonCanvasState.loadJsonCanvas({
        nodes: data.nodes || [],
        edges: data.edges || []
      });
      
      console.log('Canvas data imported:', data);
    } catch (err) {
      console.error('Failed to import .canvas file:', err);
      alert('Failed to import file: ' + (err as Error).message);
    }

    // Reset input so the same file can be re-imported
    e.target.value = '';
  }, [jsonCanvasState]);

  // Animation toggles
  const handleToggleFlow = useCallback(() => {
    jsonCanvasState.setIsFlowAnimated(!jsonCanvasState.isFlowAnimated);
  }, [jsonCanvasState]);

  const handleTogglePulse = useCallback(() => {
    jsonCanvasState.setIsPulsing(!jsonCanvasState.isPulsing);
  }, [jsonCanvasState]);

  const handleToggleDrawIn = useCallback(() => {
    jsonCanvasState.setAnimateNewArrows(!jsonCanvasState.animateNewArrows);
  }, [jsonCanvasState]);

  // Project switching
  const handleSwitchProject = useCallback((projectId: string) => {
    const project = projects.find(p => p.id === projectId);
    if (project) {
      const graph = project.graph as any;
      setLocalJsonCanvas({
        nodes: graph.nodes || [],
        edges: graph.edges || []
      });
    }
  }, [projects]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Prevent shortcuts when typing in input fields
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
        return;
      }

      // Arrow mode toggle (A key)
      if (event.key === 'a' || event.key === 'A') {
        event.preventDefault();
        handleToggleArrowMode();
        return;
      }

      // Square arrow mode toggle (S key)
      if (event.key === 's' || event.key === 'S') {
        event.preventDefault();
        handleToggleSquareArrowMode();
        return;
      }

      // Curved arrow mode toggle (C key)
      if (event.key === 'c' || event.key === 'C') {
        event.preventDefault();
        handleToggleCurvedArrowMode();
        return;
      }

      // Toolbar toggle (T key)
      if (event.key === 't' || event.key === 'T') {
        event.preventDefault();
        handleToggleToolbar();
        return;
      }

      // Navigation shortcuts
      if (event.key === 'ArrowLeft') {
        event.preventDefault();
        handlePanLeft();
        return;
      }

      if (event.key === 'ArrowRight') {
        event.preventDefault();
        handlePanRight();
        return;
      }

      if (event.key === 'ArrowUp') {
        event.preventDefault();
        handlePanUp();
        return;
      }

      if (event.key === 'ArrowDown') {
        event.preventDefault();
        handlePanDown();
        return;
      }

      // Reset view (Home key)
      if (event.key === 'Home') {
        event.preventDefault();
        handleResetView();
        return;
      }

      // Clear all (Ctrl+Delete or Ctrl+Backspace)
      if ((event.key === 'Delete' || event.key === 'Backspace') && event.ctrlKey) {
        event.preventDefault();
        handleClearAll();
        return;
      }

      // Generate code (G key)
      if (event.key === 'g' || event.key === 'G') {
        event.preventDefault();
        handleGenerateCode();
        return;
      }

      // AI Assistant (D key)
      if (event.key === 'd' || event.key === 'D') {
        event.preventDefault();
        setShowAIPanel(!showAIPanel);
        return;
      }

      // Import/Export shortcuts (I key)
      if (event.key === 'i' || event.key === 'I') {
        event.preventDefault();
        if (project) {
          handleExport();
        }
        return;
      }

      // Animation shortcuts
      if (event.key === 'f' || event.key === 'F') {
        event.preventDefault();
        handleToggleFlow();
        return;
      }

      if (event.key === 'p' || event.key === 'P') {
        event.preventDefault();
        handleTogglePulse();
        return;
      }

      // Help modal (H key)
      if (event.key === 'h' || event.key === 'H') {
        event.preventDefault();
        handleOpenHelp();
        return;
      }

      // Project switching shortcuts
      if (event.key === '1' && project) {
        event.preventDefault();
        const firstProjectId = projects[0]?.id;
        if (firstProjectId) {
          handleSwitchProject(firstProjectId);
        }
        return;
      }
      if (event.key === '2' && projects[1]) {
        event.preventDefault();
        handleSwitchProject(projects[1].id);
        return;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [
    handleToggleArrowMode,
    handleToggleSquareArrowMode,
    handleToggleCurvedArrowMode,
    handleToggleToolbar,
    handlePanLeft,
    handlePanRight,
    handlePanUp,
    handlePanDown,
    handleResetView,
    handleClearAll,
    handleGenerateCode,
    handleOpenHelp,
    handleExport,
    handleToggleFlow,
    handleTogglePulse,
    setShowAIPanel,
    handleSwitchProject,
    showAIPanel,
    projects,
    project
  ]);

  // Project name for display
  const projectName = project?.name || 'Untitled Project';

  return (
    <div className="w-full h-full">
      {/* Project Name Header */}
      <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-30">
        {isEditingName ? (
          <Input
            value={tempProjectName}
            onChange={handleProjectNameChange}
            onKeyDown={handleProjectNameKeyDown}
            onBlur={handleProjectNameBlur}
            className="w-64 h-10 bg-card/95 backdrop-blur-sm border shadow-lg text-center font-medium"
            placeholder="Enter project name..."
            autoFocus
          />
        ) : (
          <div
            onClick={handleStartEditName}
            className="w-64 h-10 bg-card/95 backdrop-blur-sm border shadow-lg rounded-md flex items-center justify-center cursor-pointer hover:bg-accent/80 transition-colors px-3"
            title="Click to edit project name"
          >
            <span className="font-medium text-foreground truncate">
              {projectName}
            </span>
          </div>
        )}
        
        <div className="flex items-center gap-2 mt-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleImportClick}
            className="h-10 bg-card/95 backdrop-blur-sm border shadow-lg"
            title="Import .canvas file"
          >
            <Upload className="w-4 h-4 mr-1" />
            Import
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleExport}
            className="h-10 bg-card/95 backdrop-blur-sm border shadow-lg"
            title="Export as .canvas file"
          >
            <Download className="w-4 h-4 mr-1" />
            Export
          </Button>
        </div>
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".canvas,.json"
        className="hidden"
        onChange={handleFileChange}
      />

      {/* Canvas and Sidebar Container */}
      <div className="relative w-full h-full flex">
        {/* Canvas Area */}
        <div className="flex-1 relative h-full">
          <JsonCanvasEditor
            isSidebarCollapsed={isSidebarCollapsed}
            isHeaderCollapsed={isHeaderCollapsed}
            state={{
              ...jsonCanvasState,
              isArrowMode,
              isSquareArrowMode,
              isCurvedArrowMode,
              setIsArrowMode: () => dispatch(setCanvasArrowMode(!isArrowMode)),
              setIsSquareArrowMode: () => dispatch(setCanvasSquareArrowMode(!isSquareArrowMode)),
              setIsCurvedArrowMode: () => dispatch(setCanvasCurvedArrowMode(!isCurvedArrowMode)),
            }}
          />
        </div>

        {/* Code Sidebar Panel */}
        {codePanelMode === 'sidebar' && showCodeSidebar && (
          <div className="w-[400px] border-l border-border bg-background/95 backdrop-blur-sm p-4 overflow-y-auto z-20 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">Code Generation</h3>
              <Button variant="ghost" size="sm" onClick={() => setShowCodeSidebar(false)}>
                <span className="sr-only">Close</span>
                ✕
              </Button>
            </div>
            <CodeGenerationPanel
              generatedCode={generatedCode}
              isGenerating={isGenerating}
              isConnected={isConnected}
              error={codeError}
              onClearCode={clearGeneratedCode}
              onGenerate={triggerCodeGeneration}
            />
          </div>
        )}
      </div>

      {/* Main Floating Toolbar (top) */}
      {showToolbar && (
        <KonvaToolbar
          isArrowMode={isArrowMode}
          onToggleArrowMode={handleToggleArrowMode}
          isCollapsed={isToolbarCollapsed}
          onToggleCollapse={handleToggleToolbar}
          onRestore={handleRestoreGraph}
          canRestore={!!previousGraph}
        />
      )}

      {/* Help Button */}
      <div className="absolute bottom-4 left-4 z-40">
        <Button
          variant="outline"
          size="sm"
          onClick={handleOpenHelp}
          className="h-10 w-10 p-0 bg-card/95 backdrop-blur-sm border shadow-lg hover:bg-accent"
          title="Help & Keyboard Shortcuts"
        >
          <HelpCircle className="w-5 h-5" />
        </Button>
      </div>

      {/* Animation Controls */}
      <div className="absolute bottom-4 right-4 z-40 flex gap-1">
        <Button
          variant="outline"
          size="sm"
          onClick={handleToggleFlow}
          className="h-10 w-10 p-0 bg-card/95 backdrop-blur-sm border shadow-lg hover:bg-accent"
          title="Flow Animation (F)"
        >
          <Activity className="w-5 h-5" />
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={handleTogglePulse}
          className="h-10 w-10 p-0 bg-card/95 backdrop-blur-sm border shadow-lg hover:bg-accent"
          title="Pulse / Glow (P)"
        >
          <Zap className="w-5 h-5" />
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={handleToggleDrawIn}
          className="h-10 w-10 p-0 bg-card/95 backdrop-blur-sm border shadow-lg hover:bg-accent"
          title="Draw-in Animation"
        >
          <PenTool className="w-5 h-5" />
        </Button>
      </div>

      {/* AI Assistant Integration */}
      <CanvasAIAssistant
        isOpen={showAIPanel}
        onToggle={() => setShowAIPanel(!showAIPanel)}
        onGeneratePlan={async (userRequest?: string) => {
          console.log('AI generation requested:', userRequest);
          alert('AI integration would connect to external AI service here');
        }}
        currentGraph={{
          ...canvasGraph,
          id: project?.graph?.id ?? 'temp-graph',
          name: project?.graph?.name ?? 'Temp Graph',
          companyId: project?.graph?.companyId ?? user?.id ?? '1',
          userId: project?.graph?.userId ?? user?.id ?? '1',
          graphType: project?.graph?.graphType ?? GraphQL.GraphType.Kubernetes,
        }}
        generatedCode={generatedCode}
        isGenerating={isGenerating}
        isPlanning={false}
        error={codeError}
      />

      {/* Help Modal */}
      <HelpModal isOpen={showHelpModal} onClose={handleCloseHelp} />

      {/* Code Generation Modal - Only if mode is 'modal' */}
      {codePanelMode === 'modal' && (
        <CodeGenerationModal
          isOpen={showCodeGenerationModal}
          onClose={handleCloseCodeGeneration}
          generatedCode={generatedCode}
          isGenerating={isGenerating}
          isConnected={isConnected}
          error={codeError}
          onClearCode={clearGeneratedCode}
          onGenerate={triggerCodeGeneration}
        />
      )}
    </div>
  );
};

export default JsonCanvasPage;