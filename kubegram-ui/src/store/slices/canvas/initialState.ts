import type { CanvasNode, CanvasArrow } from '@/types/canvas';
import { GraphQL } from '@/lib/graphql-client';
import type { CanvasState } from './types';
import { loadCanvasFromStorage } from './storage';
import { DEFAULT_CANVAS_SIZE, DEFAULT_VIEWPORT_DIMENSIONS } from './constants';

// Load initial state from storage
const savedState = loadCanvasFromStorage();

/**
 * Initial canvas state
 * Matches the nested structure defined in types.ts
 */
export const initialState: CanvasState = {
  // Canvas configuration
  configs: {
    dimensions: savedState?.dimensions || DEFAULT_VIEWPORT_DIMENSIONS,
    canvasSize: DEFAULT_CANVAS_SIZE,
  },

  // User activity and interactions
  activity: {
    // Drawing modes
    isArrowMode: false,
    isSquareArrowMode: false,
    isCurvedArrowMode: false,

    // Arrow drawing state
    arrowStart: null,
    isDrawingArrow: false,
    tempArrowEnd: null,
    arrowSnapTarget: null,

    // Selection and interaction
    selectedItems: savedState?.activity?.selectedItems || { nodes: [], arrows: [] },
    contextMenu: { x: 0, y: 0, type: null, id: null },
    dragItem: null,

    // Selection rectangle
    isSelecting: false,
    selectionRect: null,

    // Group operations
    isGroupMoving: false,
    groupMoveStart: null,
    groupMoveOffset: null,

    // Renaming
    renamingNodeId: null,

    // Panning and navigation
    isPanning: false,
    panStart: { x: 0, y: 0 },
    showBackToContent: false,
  },

  // Data storage
  graphsMetadata: {},

  canvasElementsLookup: {
    nodes:
      (savedState?.canvasElementsLookup?.nodes as CanvasNode[] | undefined) ||
      (savedState?.nodes as CanvasNode[] | undefined) ||
      [],
    arrows:
      (savedState?.canvasElementsLookup?.arrows as CanvasArrow[] | undefined) ||
      (savedState?.arrows as CanvasArrow[] | undefined) ||
      [],
  },

  // Entity information
  user: {
    id: '',
    name: '',
    email: '',
    role: '',
    avatar: '',
  },

  organization: {
    id: '',
    name: '',
  },

  company: {
    id: '',
    name: '',
  },

  projects: {},

  activeGraph: {
    id: '',
    name: 'Untitled',
    graphId: '',
    canvasGraph: (savedState?.canvasGraph as any) || {
      companyId: '',
      graphType: GraphQL.GraphType.Abstract,
      id: '',
      name: 'Untitled',
      userId: '',
      nodes: [],
    },
  },

  llmConfigs: [],
  selectedLlmProvider: undefined,
  selectedLlmModel: undefined,
};
