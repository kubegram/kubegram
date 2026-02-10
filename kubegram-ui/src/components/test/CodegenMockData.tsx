import type { InitiateCodegenInput, CodegenResults, GeneratedCode } from '@/store/api/codegen';
import { DEFAULT_PROVIDER } from '@/lib/providerUtils';

/**
 * Mock data generator for CodeGenerationComponent testing
 */
export class CodegenMockData {
  
  /**
   * Generate a mock CanvasNode (simplified for testing)
   */
  static generateNode(id: string, type: string = 'service'): any {
    return {
      id,
      type,
      label: `${type.charAt(0).toUpperCase() + type.slice(1)} ${id}`,
      iconSrc: `/icons/${type}.svg`,
      x: Math.random() * 800,
      y: Math.random() * 600,
      width: 120,
      height: 80,
      color: '#3b82f6',
      __typename: 'GraphNode',
      companyId: 'test-company',
      name: `${type} ${id}`,
      nodeType: type.toUpperCase(),
      userId: 'test-user',
      edges: null
    };
  }

  /**
   * Generate mock CanvasArrow (simplified for testing)
   */
  static generateArrow(id: string, startNodeId: string, endNodeId: string): any {
    return {
      id,
      startNodeId,
      endNodeId,
      startX: 0,
      startY: 0,
      endX: 0,
      endY: 0,
      node: this.generateNode('temp'),
      __typename: 'Edge',
      connectionType: 'ConnectsTo'
    };
  }

  /**
   * Generate a mock CanvasGraph
   */
  static generateGraph(options: {
    nodeCount?: number;
    graphType?: string;
    companyId?: string;
    userId?: string;
  } = {}): any {
    const {
      nodeCount = 5,
      graphType = 'KUBERNETES',
      companyId = 'test-company-123',
      userId = 'test-user-456'
    } = options;

    const nodes = Array.from({ length: nodeCount }, (_, i) => 
      this.generateNode(`node-${i + 1}`, this.getRandomNodeType())
    );

    const arrows = Array.from({ length: Math.min(nodeCount - 1, 3) }, (_, i) =>
      this.generateArrow(`arrow-${i + 1}`, nodes[i].id, nodes[i + 1].id)
    );

    return {
      id: `graph-${Date.now()}`,
      name: `Test Graph (${nodeCount} nodes)`,
      graphType: graphType as any,
      companyId,
      userId,
      nodes,
      arrows,
      __typename: 'Graph'
    };
  }

  /**
   * Get random node type for variety
   */
  private static getRandomNodeType(): string {
    const types = ['service', 'deployment', 'configmap', 'secret', 'ingress', 'pod'];
    return types[Math.floor(Math.random() * types.length)];
  }

  /**
   * Generate mock InitiateCodegenInput
   */
  static generateCodegenInput(options: {
    projectName?: string;
    graphType?: string;
    llmProvider?: string;
    llmModel?: string;
    nodeCount?: number;
  } = {}): InitiateCodegenInput {
    const {
      projectName = 'Test Kubernetes Project',
      graphType = 'KUBERNETES',
      llmProvider = DEFAULT_PROVIDER,
      llmModel = 'DEEPSEEK_CHAT',
      nodeCount = 5
    } = options;

    return {
      project: {
        id: `project-${Date.now()}`,
        name: projectName
      },
      graph: this.generateGraph({ nodeCount, graphType }),
      llmConfig: {
        provider: llmProvider,
        model: llmModel
      }
    };
  }

  /**
   * Generate mock CodegenResults
   */
  static generateCodegenResults(graphId: string, options: {
    successRate?: number;
    codeLength?: number;
  } = {}): CodegenResults {
    const { successRate = 0.9, codeLength = 500 } = options;
    
    const generatedCodes: GeneratedCode[] = [];
    const nodeCount = Math.floor(Math.random() * 5) + 3; // 3-7 nodes
    
    for (let i = 0; i < nodeCount; i++) {
      const isSuccessful = Math.random() < successRate;
      
      if (isSuccessful) {
        generatedCodes.push({
          nodeId: `node-${i + 1}`,
          code: this.generateMockCode(codeLength),
          language: 'yaml',
          framework: 'kubernetes',
          metadata: {
            generatedAt: new Date().toISOString(),
            lines: Math.floor(codeLength / 10)
          }
        });
      }
    }

    return {
      graphId,
      generatedCodes,
      jobId: `job-${Date.now()}`,
      timestamp: new Date().toISOString(),
      summary: {
        totalNodes: nodeCount,
        successfulGenerations: generatedCodes.length,
        failedGenerations: nodeCount - generatedCodes.length
      }
    };
  }

  /**
   * Generate mock code content
   */
  private static generateMockCode(length: number): string {
    const yamlTemplates = [
      `apiVersion: apps/v1
kind: Deployment
metadata:
  name: my-app
  labels:
    app: my-app
spec:
  replicas: 3
  selector:
    matchLabels:
      app: my-app
  template:
    metadata:
      labels:
        app: my-app
    spec:
      containers:
      - name: app
        image: nginx:latest
        ports:
        - containerPort: 80`,

      `apiVersion: v1
kind: Service
metadata:
  name: my-service
spec:
  selector:
    app: my-app
  ports:
    - protocol: TCP
      port: 80
      targetPort: 8090
  type: ClusterIP`,

      `apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: my-ingress
spec:
  rules:
  - host: example.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: my-service
            port:
              number: 80`
    ];

    let code = '';
    while (code.length < length) {
      const template = yamlTemplates[Math.floor(Math.random() * yamlTemplates.length)];
      code += template + '\n---\n';
    }
    
    return code.substring(0, length);
  }

  /**
   * Predefined test scenarios
   */
  static getScenarios() {
    return {
      minimal: this.generateCodegenInput({
        projectName: 'Minimal Test',
        nodeCount: 1
      }),
      
      standard: this.generateCodegenInput({
        projectName: 'Standard Kubernetes App',
        nodeCount: 5
      }),
      
      complex: this.generateCodegenInput({
        projectName: 'Complex Microservices',
        nodeCount: 10,
        llmModel: 'DEEPSEEK_CHAT'
      }),
      
      failure: this.generateCodegenInput({
        projectName: 'Test Failure Case',
        nodeCount: 3,
        llmProvider: 'invalid-provider' // Will be caught by validation
      }),
      
      empty: {
        ...this.generateCodegenInput({
          projectName: 'Empty Graph Test',
          nodeCount: 0
        }),
        graph: {
          ...this.generateGraph({ nodeCount: 0 }),
          nodes: [],
          arrows: []
        }
      }
    };
  }

  /**
   * Mock API responses
   */
  static getMockResponses() {
    return {
      success: {
        status: 200,
        data: { jobId: `job-${Date.now()}` }
      },
      
      error: {
        status: 400,
        data: { error: 'Invalid input provided' }
      },
      
      timeout: {
        status: 408,
        data: { error: 'Request timeout' }
      },
      
      unauthorized: {
        status: 401,
        data: { error: 'Unauthorized access' }
      }
    };
  }
}