import React, { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { initializeProject } from '../store/slices/project/projectSlice';
// import { useGraphConversion } from '../hooks/useGraphConversion';

/**
 * Provider component that initializes and manages graph synchronization
 * 
 * @deprecated This component uses the deprecated graphSlice.
 * Graph state is now managed through projectSlice via graphSyncMiddleware.
 */
interface GraphSyncProviderProps {
  children: React.ReactNode;
}

export function GraphSyncProvider({ children }: GraphSyncProviderProps) {
  console.log('🔄 GraphSyncProvider mounted');
  const dispatch = useAppDispatch();
  const projectState = useAppSelector(state => state.project);

  // Initialize project on mount
  useEffect(() => {
    if (!projectState.isInitialized) {
      dispatch(initializeProject());
    }
  }, [dispatch, projectState.isInitialized]);

  // Log project changes for debugging
  useEffect(() => {
    if (projectState.isInitialized && projectState.project) {
      const graph = projectState.project.graph;
      console.log('Graph updated:', {
        nodeCount: graph?.nodes?.length ?? 0,
        projectName: projectState.project.name
      });
    }
  }, [projectState]);

  return <>{children}</>;
}

/**
 * Hook to get graph status and statistics
 */
export function useGraphStatus() {
  const projectState = useAppSelector(state => state.project);
  const graph = projectState.project?.graph;

  return {
    isInitialized: projectState.isInitialized,
    hasGraph: !!graph,
    nodeCount: graph?.nodes?.length ?? 0,
    edgeCount: 0, // Edges are stored on nodes
    lastUpdated: projectState.lastUpdated,
    graph
  };
}
