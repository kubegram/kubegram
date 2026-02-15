### Summary
Kubegram's UI system transforms static infrastructure diagrams into autonomous, AI-driven Kubernetes deployments through an intuitive canvas-based interface. The system integrates Large Language Models (LLMs), Retrieval-Augmented Generation (RAG), and GitOps orchestration to provide a complete visual-to-code development experience.
Key Capabilities:
- Visual-to-Code Synthesis - Drag-and-drop canvas becomes production Kubernetes manifests
- Multi-Provider AI Integration - Claude, OpenAI, Gemini, DeepSeek, Ollama support
- Real-time Agent Orchestration - Live status tracking and workflow monitoring
- Enterprise Authentication - OAuth/SAML with proper RBAC mapping
- GitOps Integration - Automated version control and deployment pipelines
🏗️ System Architecture
┌─────────────────────────────────────────────────────────────────┐
│                        Kubegram UI System                       │
│                        React 19 + TypeScript                   │
└─────────────────────┬───────────────────────────────────────────┘
                      │
         ┌────────────┴────────────┐
         │                         │
┌────────▼─────────┐    ┌─────────▼──────────┐    ┌──────────────────┐
│   Canvas Layer    │    │   State Layer      │    │  AI Agent Layer  │
│                   │    │                    │    │                  │
│ • Konva.js        │◄──►│ • Redux Toolkit    │◄──►│ • Codegen Agent  │
│ • React-Konva     │    │ • Custom Middleware│    │ • Planning Agent │
│ • Drag & Drop     │    │ • Persistence      │    │ • LLM Workflows  │
│ • Touch Support   │    │ • Real-time Sync   │    │ • Status Tracking│
└───────────────────┘    └────────────────────┘    └──────────────────┘
         │                         │                         │
         └─────────────────────────┼─────────────────────────┘
                                   │
                    ┌──────────────▼──────────────┐
                    │      Backend APIs           │
                    │                             │
                    │ • REST Server (Hono)       │
                    │ • GraphQL KubeRAG          │
                    │ • WebSocket MCP Bridge      │
                    │ • Auth Service             │
                    └─────────────────────────────┘
### Technology Stack
#### Frontend Core
- Runtime: React 19.2 with TypeScript 5.9
- Build Tool: Vite 7.2 with HMR
- Styling: Tailwind CSS 4.1 with Radix UI components
- Icons: Lucide React (400+ icons)
- Router: React Router DOM v7
#### Visual Canvas System
- Engine: Konva.js 2D graphics library
- React Integration: react-konva 19.2.1
- Interactions: Custom hooks for drag-drop, selection, arrow drawing
- Performance: Virtualized rendering for large canvases
#### State Management
- Store: Redux Toolkit 2.11 with RTK Query
- Middleware: Custom canvas persistence, graph sync, auth error handling
- DevTools: Full Redux DevTools integration
- Persistence: LocalStorage with automatic saving
#### AI Integration
- LLM SDK: Vercel AI SDK for multi-provider support
- GraphQL: Apollo Client for KubeRAG communication
- Real-time: WebSocket connections for live agent status
- Polling: Configurable status polling with retry logic
### Canvas System Architecture

The canvas is the core interaction surface for designing infrastructure that AI agents transform into Kubernetes manifests.
Component Hierarchy

JsonCanvasPage (Working Progress migrating from vanila Konva)
├── JsonCanvasEditor
│   ├── KonvaStage (Main canvas)
│   ├── KonvaLayer (Node rendering)
│   └── KonvaLayer (Arrow rendering)
├── KonvaToolbar
│   ├── NodePalette
│   ├── ArrowTools
│   └── ActionButtons
├── CodeGenerationComponent
│   ├── StatusDisplay
│   ├── ProgressBar
│   └── CodePreview
└── HelpModal
    ├── Instructions
    └── Shortcuts

### Core Canvas Hooks

`useJsonCanvasState`
Manages the complete canvas state including nodes, arrows, and metadata.
const `state = useJsonCanvasState();`

```ts
// Accessors
state.jsonCanvas          // Complete canvas data
state.selectedNodes       // Selected node IDs
state.selectedArrows      // Selected arrow IDs
state.arrowMode           // Current arrow drawing mode
// Actions
state.addNode(node)       // Add new node
state.removeNode(id)      // Remove node by ID
state.updateNode(id, data) // Update node properties
state.addArrow(arrow)     // Add connection arrow
state.removeArrow(id)     // Remove arrow
state.selectNodes(ids)    // Set selection
state.setArrowMode(mode)  // Change drawing mode
useKonvaCanvasEvents
Handles all user interactions on the canvas with comprehensive error handling.
const canvasEvents = useKonvaCanvasEvents(
  // Element drop callbacks
  (newNode) => console.log('Node added:', newNode),
  (error) => console.error('Drop failed:', error),
  
  // Element deletion callbacks  
  (deletedNodes, deletedArrows) => {
    // Update state after deletion
  },
  (error) => console.error('Deletion failed:', error),
  
  // Arrow attachment callbacks
  (event) => console.log('Arrow attached:', event),
  (arrowId, nodeId, type) => console.log('Arrow detached'),
  (newArrow) => console.log('Arrow created:', newArrow),
  (error) => console.error('Attachment failed:', error)
);
// Usage in component
<div 
  onDragOver={canvasEvents.handleDragOver}
  onDrop={canvasEvents.handleDrop}
>
  <KonvaStage>
    {/* Canvas content */}
  </KonvaStage>
</div>
useCodeGeneration
Integrates AI agent workflows for converting canvas designs to Kubernetes code.
const {
  generateCode,
  isGenerating,
  progress,
  result,
  error
} = useCodeGeneration();
// Trigger code generation
await generateCode({
  graph: canvasGraph,
  llmProvider: 'claude',
  model: 'claude-3-5-sonnet-20241022',
  options: {
    costEstimation: true,
    validateConfigurations: true
  }
});
```

### State Management Architecture
#### Store Structure

```ts
interface RootState {
  // Canvas and visual state
  canvas: {
    configs: CanvasConfigs;           // Canvas configuration
    activity: CanvasActivity;        // User interactions
    graphsMetadata: GraphsMetadata;  // Graph metadata
    canvasElementsLookup: CanvasElementsLookup;
    user: UserInfo;
    organization: OrganizationInfo;
    company: CompanyInfo;
    projects: Record<string, ProjectInfo>;
    llmConfigs: LlmProvider[];
    selectedLlmProvider?: string;
    selectedLlmModel?: string;
    activeGraph: ActiveGraphInfo;
  };
  // UI state
  ui: {
    theme: 'light' | 'dark';
    sidebarCollapsed: boolean;
    headerCollapsed: boolean;
    notifications: Notification[];
  };
  // Code generation state
  codegen: {
    jobs: Record<string, CodegenJob>;
    results: Record<string, CodegenResults>;
    stats: CodegenStats;
    currentJob?: string;
  };
  // Entity management
  company: CompanyState;
  organization: OrganizationState;
  team: TeamState;
  project: ProjectState;
  
  // Authentication
  oauth: OAuthState;
}
```

### Custom Middleware

#### Canvas Persistence Middleware

Automatically saves canvas state to localStorage with debouncing:
```ts
const canvasPersistenceMiddleware: Middleware = (store) => (next) => (action) => {
  const result = next(action);
  
  // Save canvas state after relevant actions
  if (action.type.startsWith('canvas/')) {
    const state = store.getState();
    localStorage.setItem('kubegram-canvas', JSON.stringify(state.canvas));
  }
  
  return result;
};
Graph Sync Middleware
Synchronizes canvas changes with backend GraphQL API:
const graphSyncMiddleware: Middleware = (store) => (next) => (action) => {
  const result = next(action);
  
  // Sync graph changes to backend
  if (action.type === 'canvas/updateGraph') {
    syncGraphToBackend(action.payload);
  }
  
  return result;
};
```

### Auth Error Middleware
Handles authentication errors globally:
```ts
const authErrorMiddleware: Middleware = (store) => (next) => (action) => {
  const result = next(action);
  
  // Handle 401 errors
  if (action.error?.status === 401) {
    store.dispatch(logout());
    window.location.href = '/login';
  }
  
  return result;
};
```

### AI Agent Integration
#### Code Generation Workflow

The UI orchestrates a complete AI workflow from canvas design to Kubernetes manifests:

User Canvas Design
        │
        ▼
Graph Analysis & Validation
        │
        ▼
RAG Context Retrieval (Dgraph)
        │
        ▼
LLM Provider Call (Multi-provider)
        │
        ▼
Kubernetes Graph Construction
        │
        ▼
Manifest Generation & Validation
        │
        ▼
Cost Estimation & Resource Planning
        │
        ▼
GitOps Commit (Optional)
        │
        ▼
Real-time Status Updates
### Multi-Provider LLM Support
```ts
interface LlmProvider {
  id: string;
  name: string;
  models: LlmModel[];
  capabilities: string[];
  pricing?: PricingInfo;
}
// Supported providers
const providers = [
  { id: 'anthropic', name: 'Claude', models: ['claude-3-5-sonnet-20241022'] },
  { id: 'openai', name: 'OpenAI', models: ['gpt-4', 'gpt-4-turbo'] },
  { id: 'google', name: 'Gemini', models: ['gemini-pro'] },
  { id: 'deepseek', name: 'DeepSeek', models: ['deepseek-coder'] },
  { id: 'ollama', name: 'Ollama', models: ['llama2', 'codellama'] }
];
```

### Status Tracking & Polling
```ts
interface CodegenJob {
  id: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  progress: number;
  currentStep: string;
  steps: WorkflowStep[];
  startTime: Date;
  estimatedCompletion?: Date;
  result?: CodegenResults;
  error?: string;
}
```
### Modal System

```ts
const useModal = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [content, setContent] = useState<React.ReactNode>(null);
  const openModal = (modalContent: React.ReactNode) => {
    setContent(modalContent);
    setIsOpen(true);
  };
  const closeModal = () => {
    setIsOpen(false);
    setContent(null);
  };
  return { isOpen, content, openModal, closeModal };
};
```

Reusable Components
Code Panel Component
interface CodePanelProps {
  code: string;
  language: string;
  title?: string;
  filename?: string;
  onCopy?: () => void;
  onDownload?: () => void;
  readOnly?: boolean;
}
export const CodePanel: React.FC<CodePanelProps> = ({
  code,
  language,
  title,
  filename,
  onCopy,
  onDownload,
  readOnly = true
}) => {
  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-sm font-mono">{title || filename}</CardTitle>
        <div className="flex gap-2">
          {onCopy && <Button size="sm" onClick={onCopy}>Copy</Button>}
          {onDownload && <Button size="sm" onClick={onDownload}>Download</Button>}
        </div>
      </CardHeader>
      <CardContent>
        <div className="relative">
          <pre className="overflow-auto max-h-96 text-sm">
            <code className={`language-${language}`}>{code}</code>
          </pre>
        </div>
      </CardContent>
    </Card>
  );
};
Draggable Node Component
interface DraggableNodeProps {
  node: CanvasNode;
  isSelected: boolean;
  onSelect: (nodeId: string) => void;
  onUpdate: (nodeId: string, updates: Partial<CanvasNode>) => void;
  onDelete: (nodeId: string) => void;
}
export const DraggableNode: React.FC<DraggableNodeProps> = ({
  node,
  isSelected,
  onSelect,
  onUpdate,
  onDelete
}) => {
  const [isDragging, setIsDragging] = useState(false);
  return (
    <Group
      x={node.position.x}
      y={node.position.y}
      draggable
      onDragStart={() => setIsDragging(true)}
      onDragEnd={(e) => {
        setIsDragging(false);
        onUpdate(node.id, {
          position: { x: e.target.x(), y: e.target.y() }
        });
      }}
      onClick={() => onSelect(node.id)}
    >
      <Rect
        width={node.width}
        height={node.height}
        fill={isSelected ? '#3b82f6' : '#e5e7eb'}
        stroke={isSelected ? '#1d4ed8' : '#9ca3af'}
        strokeWidth={2}
        cornerRadius={8}
      />
      <Text
        text={node.label}
        x={node.width / 2}
        y={node.height / 2}
        fontSize={14}
        fill={isSelected ? 'white' : 'black'}
        align="center"
        verticalAlign="middle"
      />
    </Group>
  );
};
Custom Hooks Patterns
usePlanning Hook
export const usePlanning = () => {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const createPlan = useCallback(async (input: PlanInput) => {
    setIsCreating(true);
    try {
      const plan = await planningAPI.create(input);
      setPlans(prev => [...prev, plan]);
      return plan;
    } finally {
      setIsCreating(false);
    }
  }, []);
  const updatePlan = useCallback(async (id: string, updates: Partial<Plan>) => {
    const updatedPlan = await planningAPI.update(id, updates);
    setPlans(prev => prev.map(p => p.id === id ? updatedPlan : p));
    return updatedPlan;
  }, []);
  return {
    plans,
    isCreating,
    createPlan,
    updatePlan
  };
};
🔌 API Integration Patterns
REST API Client
// lib/api/axiosClient.ts
import axios from 'axios';
const apiClient = axios.create({
  baseURL: process.env.VITE_API_BASE_URL || 'http://localhost:8090',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});
// Request interceptor for auth
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth-token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Handle auth error globally
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);
export default apiClient;
GraphQL Client for KubeRAG
// lib/graphql-client.ts
import { GraphQLClient } from 'graphql-request';
const graphqlClient = new GraphQLClient(
  process.env.VITE_KUBERAG_URL || 'http://localhost:8665/graphql',
  {
    headers: {
      Authorization: `Bearer ${localStorage.getItem('auth-token')}`,
    },
  }
);
export const kuberagAPI = {
  // Code generation queries
  generateCode: (variables) => graphqlClient.request(GENERATE_CODE_MUTATION, variables),
  getCodegenStatus: (variables) => graphqlClient.request(CODEGEN_STATUS_QUERY, variables),
  
  // Graph queries
  getGraph: (variables) => graphqlClient.request(GET_GRAPH_QUERY, variables),
  updateGraph: (variables) => graphqlClient.request(UPDATE_GRAPH_MUTATION, variables),
  
  // Entity queries
  getEntities: (variables) => graphqlClient.request(GET_ENTITIES_QUERY, variables),
  createEntity: (variables) => graphqlClient.request(CREATE_ENTITY_MUTATION, variables),
};
export default kuberagAPI;
📁 File Organization
kubegram-ui/src/
├── components/           # Reusable UI components
│   ├── ui/              # Base UI components (shadcn/ui)
│   ├── CodePanel.tsx    # Code display component
│   ├── CodeGenerationComponent.tsx
│   ├── DraggableNode.tsx
│   ├── Header.tsx
│   ├── HelpModal.tsx
│   ├── KonvaToolbar.tsx
│   ├── Sidebar.tsx
│   └── index.ts         # Component exports
├── pages/               # Route-level components
│   ├── HomePage.tsx
│   ├── JsonCanvasPage.tsx
│   ├── KonvaPage.tsx
│   ├── CompareViewPage.tsx
│   └── CodeViewPage.tsx
├── hooks/               # Custom React hooks
│   ├── canvas/          # Canvas-specific hooks
│   │   ├── useJsonCanvasState.ts
│   │   ├── useJsonCanvasEvents.ts
│   │   ├── useKonvaCanvasEvents.ts
│   │   └── index.ts
│   ├── useCodeGeneration.ts
│   ├── usePlanning.ts
│   ├── useGraphConversion-v2.ts
│   └── index.ts
├── store/               # Redux setup
│   ├── slices/          # Redux slices
│   │   ├── canvas/      # Canvas state management
│   │   │   ├── types/
│   │   │   ├── entitiesSlice.ts
│   │   │   ├── configsSlice.ts
│   │   │   ├── activitySlice.ts
│   │   │   └── index.ts
│   │   ├── uiSlice.ts
│   │   ├── codegen/codegenSlice.ts
│   │   └── oauth/oauthSlice.ts
│   ├── middleware/      # Custom middleware
│   │   ├── graphSyncMiddleware.ts
│   │   ├── authErrorMiddleware.ts
│   │   └── index.ts
│   ├── api/             # RTK Query APIs
│   │   ├── codegen.ts
│   │   ├── plan.ts
│   │   └── index.ts
│   ├── hooks.ts         # Redux hooks
│   ├── index.ts         # Store configuration
│   └── types.ts         # Store types
├── lib/                 # Utilities and clients
│   ├── api/             # API clients
│   ├── utils.ts
│   ├── graphql-client.ts
│   └── providerUtils.ts
├── types/               # TypeScript definitions
│   ├── jsoncanvas.ts
│   ├── canvas.ts
│   └── api.ts
└── styles/              # Global styles
    └── globals.css
    
### TypeScript Conventions
Strict Typing for State
```ts
// Canvas node types
export interface CanvasNode {
  id: string;
  type: 'service' | 'deployment' | 'configmap' | 'secret';
  label: string;
  position: { x: number; y: number };
  width: number;
  height: number;
  config: Record<string, any>;
  metadata: {
    createdAt: Date;
    updatedAt: Date;
    createdBy: string;
  };
}
// Arrow/connection types
export interface CanvasArrow {
  id: string;
  type: 'dependency' | 'dataflow' | 'network';
  source: {
    nodeId?: string;
    point?: { x: number; y: number };
    edge?: 'top' | 'right' | 'bottom' | 'left';
  };
  target: {
    nodeId?: string;
    point?: { x: number; y: number };
    edge?: 'top' | 'right' | 'bottom' | 'left';
  };
  config: {
    color: string;
    width: number;
    style: 'solid' | 'dashed' | 'dotted';
  };
}
Generic Components with Proper Typing
interface GenericListProps<T> {
  items: T[];
  renderItem: (item: T, index: number) => React.ReactNode;
  keyExtractor: (item: T) => string;
  onItemSelect?: (item: T) => void;
  selectedItems?: T[];
  loading?: boolean;
  error?: string;
}
export function GenericList<T extends { id: string }>({
  items,
  renderItem,
  keyExtractor,
  onItemSelect,
  selectedItems = [],
  loading = false,
  error
}: GenericListProps<T>) {
  // Implementation with full type safety
}
⚡ Performance & Optimization
Canvas Performance Optimizations
// Virtualized rendering for large canvases
const useVirtualizedCanvas = (nodes: CanvasNode[], viewport: BoundingBox) => {
  const visibleNodes = useMemo(() => {
    return nodes.filter(node => 
      isNodeInViewport(node, viewport)
    );
  }, [nodes, viewport]);
  return { visibleNodes };
};
// Efficient re-render prevention
const MemoizedNode = memo(DraggableNode, (prev, next) => {
  return (
    prev.node.id === next.node.id &&
    prev.isSelected === next.isSelected &&
    prev.node.position.x === next.node.position.x &&
    prev.node.position.y === next.node.position.y
  );
});
State Optimization
// Selector-based memoization
const selectVisibleNodes = createSelector(
  [(state: RootState) => state.canvas.nodes, 
   (state: RootState) => state.canvas.viewport],
  (nodes, viewport) => nodes.filter(node => isNodeInViewport(node, viewport))
);
// Efficient Redux selectors
const useCanvasState = () => {
  const canvasState = useSelector((state: RootState) => state.canvas);
  const visibleNodes = useSelector(selectVisibleNodes);
  
  return { ...canvasState, visibleNodes };
};
```
Bundle Optimization
// Code splitting for large dependencies
const CodeEditor = lazy(() => import('./components/CodeEditor'));
const AdvancedSettings = lazy(() => import('./components/AdvancedSettings'));
// Dynamic imports for AI provider configs
const loadProviderConfig = async (provider: string) => {
  const config = await import(`./providers/${provider}.ts`);
  return config.default;
};
🧪 Testing Strategy
Component Testing
// __tests__/components/CodePanel.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { CodePanel } from '../CodePanel';
describe('CodePanel', () => {
  const mockCode = 'console.log("Hello World");';
  const mockProps = {
    code: mockCode,
    language: 'javascript',
    title: 'Test Code'
  };
  it('renders code correctly', () => {
    render(<CodePanel {...mockProps} />);
    expect(screen.getByText(mockCode)).toBeInTheDocument();
  });
  it('handles copy action', () => {
    const mockOnCopy = jest.fn();
    render(<CodePanel {...mockProps} onCopy={mockOnCopy} />);
    
    fireEvent.click(screen.getByText('Copy'));
    expect(mockOnCopy).toHaveBeenCalled();
  });
});
Hook Testing
// __tests__/hooks/useJsonCanvasState.test.ts
import { renderHook, act } from '@testing-library/react';
import { useJsonCanvasState } from '../useJsonCanvasState';
describe('useJsonCanvasState', () => {
  it('adds node correctly', () => {
    const { result } = renderHook(() => useJsonCanvasState());
    
    const newNode = {
      id: 'test-node',
      type: 'service',
      label: 'Test Service',
      position: { x: 100, y: 100 },
      width: 120,
      height: 60
    };
    act(() => {
      result.current.addNode(newNode);
    });
    expect(result.current.jsonCanvas.nodes).toContain(newNode);
  });
});
Integration Testing
// __tests__/integration/canvas-workflow.test.ts
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { JsonCanvasPage } from '../../pages/JsonCanvasPage';
import { Provider } from 'react-redux';
import { store } from '../../store';
describe('Canvas Workflow Integration', () => {
  it('complete canvas to code generation workflow', async () => {
    render(
      <Provider store={store}>
        <JsonCanvasPage isSidebarCollapsed={false} />
      </Provider>
    );
    // 1. Add a service node
    const serviceNode = screen.getByText('Service');
    fireEvent.dragStart(serviceNode);
    fireEvent.drop(screen.getByTestId('canvas'));
    // 2. Connect to deployment
    const deploymentNode = screen.getByText('Deployment');
    fireEvent.dragStart(deploymentNode);
    fireEvent.drop(screen.getByTestId('canvas'), { clientX: 200, clientY: 200 });
    // 3. Generate code
    const generateButton = screen.getByText('Generate Code');
    fireEvent.click(generateButton);
    // 4. Verify generation started
    await waitFor(() => {
      expect(screen.getByText('Generating...')).toBeInTheDocument();
    });
  });
});
### Debugging & Development
Development Setup
# Start development server with hot reload
npm run dev
# Type checking in watch mode
npm run typecheck -- --watch
# Linting with auto-fix
npm run lint -- --fix
# Build for production
npm run build
# Preview production build
npm run preview
Canvas Debugging Tools
// Debug mode for canvas interactions
const useCanvasDebug = () => {
  const [debugMode, setDebugMode] = useState(false);
  
  useEffect(() => {
    if (debugMode) {
      // Add debug overlays
      document.body.classList.add('canvas-debug');
      
      // Log all canvas events
      window.addEventListener('canvas-event', console.log);
    }
    
    return () => {
      document.body.classList.remove('canvas-debug');
      window.removeEventListener('canvas-event', console.log);
    };
  }, [debugMode]);
  return { debugMode, setDebugMode };
};
Redux DevTools Integration
// Enhanced store configuration for debugging
export const store = configureStore({
  reducer: rootReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST'],
        ignoredPaths: ['canvas.nodes'], // Ignore for debugging
      },
    }).concat(middleware),
  devTools: process.env.NODE_ENV !== 'production' && {
    name: 'Kubegram UI',
    trace: true, // Enable stack traces
    traceLimit: 25,
  },
});
🔧 Environment Configuration
Environment Variables
# API Configuration
VITE_API_BASE_URL=http://localhost:8090
VITE_KUBERAG_URL=http://localhost:8665/graphql
# Authentication
VITE_AUTH_ENABLED=true
VITE_OAUTH_GITHUB_CLIENT_ID=your_github_client_id
VITE_OAUTH_GOOGLE_CLIENT_ID=your_google_client_id
# Feature Flags
VITE_ENABLE_DEBUG_MODE=false
VITE_ENABLE_CANVAS_DEBUG=false
VITE_ENABLE_PERFORMANCE_MONITORING=true
# LLM Configuration
VITE_DEFAULT_LLM_PROVIDER=anthropic
VITE_DEFAULT_LLM_MODEL=claude-3-5-sonnet-20241022
# WebSocket Configuration
VITE_WS_URL=ws://localhost:8090/ws
VITE_WS_RECONNECT_INTERVAL=5000
Development VSCode Configuration
// .vscode/settings.json
{
  typescript.preferences.importModuleSpecifier: relative,
  editor.formatOnSave: true,
  editor.codeActionsOnSave: {
    source.fixAll.eslint: true
  },
  files.exclude: {
    **/node_modules: true,
    **/dist: true
  }
}
🚀 Deployment Considerations
Production Build Optimization
// vite.config.ts
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          ui: ['@radix-ui/react-slot', '@radix-ui/react-dropdown-menu'],
          canvas: ['konva', 'react-konva'],
          state: ['@reduxjs/toolkit', 'react-redux'],
        },
      },
    },
    chunkSizeWarningLimit: 1000,
  },
  optimizeDeps: {
    include: ['konva', 'react-konva'],
  },
});
Performance Monitoring
// Performance monitoring setup
const usePerformanceMonitoring = () => {
  useEffect(() => {
    if (process.env.NODE_ENV === 'production') {
      // Monitor canvas rendering performance
      const observer = new PerformanceObserver((list) => {
        list.getEntries().forEach((entry) => {
          if (entry.duration > 100) {
            console.warn('Slow operation detected:', entry);
          }
        });
      });
      
      observer.observe({ entryTypes: ['measure', 'paint'] });
      
      return () => observer.disconnect();
    }
  }, []);
};
### Common Patterns & Recipes
Error Boundary for Canvas
class CanvasErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error?: Error }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }
  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Canvas error:', error, errorInfo);
    // Report to error tracking service
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <h2 className="text-xl font-semibold mb-2">Canvas Error</h2>
            <p className="text-muted-foreground">
              Something went wrong with the canvas. Try refreshing the page.
            </p>
            <Button onClick={() => window.location.reload()} className="mt-4">
              Refresh Page
            </Button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
#### Responsive Canvas Scaling
```ts
const useResponsiveCanvas = () => {
  const [scale, setScale] = useState(1);
  const containerRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const updateScale = () => {
      if (containerRef.current) {
        const containerWidth = containerRef.current.clientWidth;
        const idealWidth = 1200; // Ideal canvas width
        const newScale = Math.min(1, containerWidth / idealWidth);
        setScale(newScale);
      }
    };
    updateScale();
    window.addEventListener('resize', updateScale);
    return () => window.removeEventListener('resize', updateScale);
  }, []);
  return { scale, containerRef };
};
```
🎯 Best Practices
Performance
- Use React.memo for canvas components to prevent unnecessary re-renders
- Implement virtualization for large numbers of canvas elements
- Debounce canvas state persistence operations
- Use web workers for intensive computations
Accessibility
- Ensure all canvas interactions are keyboard navigable
- Provide proper ARIA labels for custom components
- Include screen reader support for canvas content
- Implement proper focus management
Security
- Sanitize all user inputs before processing
- Validate canvas state before API calls
- Implement proper CSRF protection
- Use Content Security Policy headers
Code Organization
- Keep components focused and single-purpose
- Extract reusable logic into custom hooks
- Use TypeScript interfaces for all data structures
- Implement proper error boundaries