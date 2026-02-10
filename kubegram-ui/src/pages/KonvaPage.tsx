import React, { useRef, useCallback, useState, useEffect } from 'react';
import Konva from 'konva';
import KonvaCanvas from '@/components/KonvaCanvas';
import KonvaToolbar from '@/components/KonvaToolbar';
import HelpModal from '@/components/HelpModal';
import { CodeGenerationModal } from '@/components/CodeGenerationModal';
import { CodeGenerationPanel } from '@/components/CodeGenerationPanel';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { HelpCircle } from 'lucide-react';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { toggleToolbar, setShowHelpModal } from '@/store/slices/uiSlice';
import { GraphQL } from '@/lib/graphql-client';
// import { useGraphConversion } from '@/hooks/useGraphConversion';
import { useCodeGeneration } from '@/hooks/useCodeGeneration';
import { type CanvasGraph, type CanvasNode, type CanvasArrow } from '@/types/canvas';
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
import { useGraphConversion } from '@/hooks/useGraphConversion-v2';

/**
 * KonvaPage Component Props
 */
interface KonvaPageProps {
  isSidebarCollapsed: boolean;
  isHeaderCollapsed?: boolean;
  onNodeSelect?: (nodeId: string | null) => void;
  initialGraphData?: CanvasGraph | null;
  codePanelMode?: 'modal' | 'sidebar' | 'none';
  showToolbar?: boolean;
}

/**
 * KonvaPage Component
 *
 * A page that displays the Konva canvas with its floating toolbars.
 * This page can be accessed via routing and includes both the main toolbar
 * and the node creation toolbar.
 * Supports collapsible toolbars for more screen space.
 */
const KonvaPage: React.FC<KonvaPageProps> = ({ isSidebarCollapsed, isHeaderCollapsed = false, onNodeSelect, initialGraphData, codePanelMode = 'modal', showToolbar = true }) => {
  console.log('🎨 KonvaPage component mounted');
  const dispatch = useAppDispatch();
  const canvasRef = useRef<Konva.Stage>(null);
  const [showCodeGenerationModal, setShowCodeGenerationModal] = useState(false);
  const [showCodeSidebar, setShowCodeSidebar] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [tempProjectName, setTempProjectName] = useState('');


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

  // LLM State
  const selectedLlmProvider = useAppSelector((state) => state.canvas.entities.selectedLlmProvider);
  const selectedLlmModel = useAppSelector((state) => state.canvas.entities.selectedLlmModel);

  // Fetch LLM configs on mount
  useEffect(() => {
    // We can dispatch this even if not authenticated, the thunk handles auth check or api might be public? 
    // Actually, API is secured. Checks auth token.
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
  const [hasHydrated, setHasHydrated] = useState(false);

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
      setHasHydrated(false);
      console.log('🔄 Canvas reset for project switch:', project.id);
    }

    // Hydrate canvas from project graph (on first load or after a switch)
    if ((isFirstLoad || isProjectSwitch) && project.graph && !initialGraphData) {
      const graph = project.graph as Partial<CanvasGraph>;
      const projectNodes = (graph.nodes?.filter((n): n is CanvasNode => !!n) || []);
      const projectArrows = (graph.arrows?.filter((a): a is CanvasArrow => !!a) || []);

      console.log('💧 Hydrating canvas from project:', {
        nodeCount: projectNodes.length,
        arrowCount: projectArrows.length,
        projectId: project.id
      });

      dispatch(setNodes(projectNodes));
      dispatch(setArrows(projectArrows));
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
    console.log('🎨 Canvas state changed:', {
      nodeCount: canvasGraph.nodes.length,
      arrowCount: canvasGraph.arrows.length,
      graphInitialized: isInitialized,
      hasGraph: !!graph
    });
  }, [canvasGraph, isInitialized, graph]);

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
      console.warn('⚠️ Not connected to code generation service - modal will show connection status');
      return;
    }

    if (canvasGraph.nodes.length === 0) {
      console.warn('⚠️ No nodes to generate code from - modal will show empty state');
      return;
    }

    // Prepare the graph data for code generation
    // Prepare the graph data for code generation
    const graphForGen: any = { // Cast to any or construct properly if I had imports. Assuming CanvasGraph shape roughly.
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
      console.log('🧹 Canvas cleared - all nodes and arrows removed');
    }
  }, [dispatch]);

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

      // Help modal (H key)
      if (event.key === 'h' || event.key === 'H') {
        event.preventDefault();
        handleOpenHelp();
        return;
      }
    };

    // Add event listener
    document.addEventListener('keydown', handleKeyDown);

    // Cleanup
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
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
    handleProjectNameUpdate,
    handleProjectNameChange,
    handleProjectNameKeyDown,
    handleStartEditName,
    handleProjectNameBlur,
  ]);

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
              {project?.name || 'Untitled Project'}
            </span>
          </div>
        )}
      </div>

      {/* Konva Canvas and Sidebar Container */}
      <div className="relative w-full h-full flex">
        {/* Canvas Area */}
        <div className="flex-1 relative h-full">
          <KonvaCanvas
            ref={canvasRef}
            isArrowMode={isArrowMode}
            isSquareArrowMode={isSquareArrowMode}
            isCurvedArrowMode={isCurvedArrowMode}
            isSidebarCollapsed={isSidebarCollapsed}
            isHeaderCollapsed={isHeaderCollapsed}
            onNodeSelect={onNodeSelect}
            initialGraphData={initialGraphData}
            onGenerateCode={triggerCodeGeneration}
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
            error={codeError}
            onClearCode={clearGeneratedCode}
            enableSync={hasHydrated}
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

export default KonvaPage;
