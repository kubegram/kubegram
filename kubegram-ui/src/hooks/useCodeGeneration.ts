import { useState, useCallback } from 'react';
import { useAppDispatch } from '@/store/hooks';
import { initiateCodeGeneration } from '@/store/api/codegen';
import { createProjectThunk, fetchProjectByIdThunk } from '@/store/slices/project/projectThunks';
import type { CanvasGraph, Project } from '@/types/canvas';

// Redefine request to include project info
export interface CodeGenerationRequest {
  graph: CanvasGraph;
  project: {
    id: string;
    name: string;
  };
  provider?: string;
  model?: string;
  context?: string[]; // Add context field
}

export interface UseCodeGenerationReturn {
  isGenerating: boolean;
  isConnected: boolean;
  generatedCode: string | null;
  error: string | null;
  generateCode: (request: CodeGenerationRequest, token?: string) => Promise<void>;
  clearGeneratedCode: () => void;
}

export const useCodeGeneration = (): UseCodeGenerationReturn => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedCode, setGeneratedCode] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // We are "connected" as long as we can hit the API, effectively always true for REST unless network fail
  // But to keep API compatible for now, we'll say true.
  const isConnected = true;

  const dispatch = useAppDispatch();

  const generateCode = useCallback(async (request: CodeGenerationRequest, token?: string) => {
    setIsGenerating(true);
    setError(null);
    setGeneratedCode(null);

    try {
      console.log('🚀 Initiating code generation...', {
        projectName: request.project.name,
        nodeCount: request.graph.nodes?.length || 0
      });

      // Check if project exists in backend
      let projectExists: Project | null = null;
      let finalProjectId = request.project.id;

      try {
        projectExists = await dispatch(fetchProjectByIdThunk(request.project.id)).unwrap();
      } catch {
        // Project doesn't exist or fetch failed
        console.log(`Project ${request.project.id} not found in backend, creating new project...`);
      }

      if (!projectExists) {
        // Create new project with current graph - this will:
        // 1. Create the graph in backend if graph data exists
        // 2. Create the project linked to the graph
        // 3. Replace the temp project in Redux state via setProject action
        const newProject = await dispatch(createProjectThunk({
          name: request.project.name,
          graph: request.graph // Graph gets created and linked automatically
        })).unwrap();
        
        finalProjectId = newProject.id;
        console.log(`✅ Created new project: ${newProject.id} with graph: ${newProject.graph?.id}`);
      }

      // Update request with verified project ID
      const updatedRequest: CodeGenerationRequest = {
        ...request,
        project: {
          ...request.project,
          id: finalProjectId
        }
      };

      // Convert string[] context to ConversationMessage[] if provided
      const contextMessages = updatedRequest.context?.map((content, index) => ({
        id: `context-${index}`,
        role: 'user' as const,
        content,
        timestamp: new Date()
      }));

      const jobId = await initiateCodeGeneration({
        project: updatedRequest.project,
        graph: updatedRequest.graph,
        llmConfig: {
          provider: updatedRequest.provider || '',
          model: updatedRequest.model || ''
        },
        context: contextMessages
      }, token);

      console.log('✅ Code generation job initiated:', jobId);
      setGeneratedCode(`Job initiated. Job ID: ${jobId}\n\n(Polling for results is not yet implemented)`);
    } catch (err: unknown) {
      console.error('❌ Code generation error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to initiate code generation';
      setError(errorMessage);
    } finally {
      setIsGenerating(false);
    }
  }, [dispatch]);

  const clearGeneratedCode = useCallback(() => {
    setGeneratedCode(null);
    setError(null);
  }, []);

  return {
    isGenerating,
    isConnected,
    generatedCode,
    error,
    generateCode,
    clearGeneratedCode
  };
};
