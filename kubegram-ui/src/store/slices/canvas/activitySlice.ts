import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type {
  CanvasActivity,
  Point,
  Rectangle,
  Selection,
  ContextMenu,
} from './types/activity';
import type { CanvasNode } from '@/types/canvas';

/**
 * Initial activity state
 */
const initialState: CanvasActivity = {
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
  selectedItems: { nodes: [], arrows: [] },
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
};

/**
 * Canvas activity slice
 * Manages user interactions, drawing modes, selection, and navigation
 */
const activitySlice = createSlice({
  name: 'canvas/activity',
  initialState,
  reducers: {
    // Drawing Modes
    setArrowMode: (state, action: PayloadAction<boolean>) => {
      state.isArrowMode = action.payload;
    },
    setSquareArrowMode: (state, action: PayloadAction<boolean>) => {
      state.isSquareArrowMode = action.payload;
    },
    setCurvedArrowMode: (state, action: PayloadAction<boolean>) => {
      state.isCurvedArrowMode = action.payload;
    },

    // Arrow Drawing State
    setArrowStart: (
      state,
      action: PayloadAction<{ nodeId: string; x: number; y: number } | null>
    ) => {
      state.arrowStart = action.payload;
    },
    setDrawingArrow: (state, action: PayloadAction<boolean>) => {
      state.isDrawingArrow = action.payload;
    },
    setTempArrowEnd: (state, action: PayloadAction<Point | null>) => {
      state.tempArrowEnd = action.payload;
    },
    setArrowSnapTarget: (state, action: PayloadAction<string | null>) => {
      state.arrowSnapTarget = action.payload;
    },

    // Selection Management
    setSelectedItems: (state, action: PayloadAction<Selection>) => {
      state.selectedItems = action.payload;
    },
    addToSelection: (
      state,
      action: PayloadAction<{ type: 'nodes' | 'arrows'; id: string }>
    ) => {
      state.selectedItems[action.payload.type].push(action.payload.id);
    },
    removeFromSelection: (
      state,
      action: PayloadAction<{ type: 'nodes' | 'arrows'; id: string }>
    ) => {
      state.selectedItems[action.payload.type] = state.selectedItems[
        action.payload.type
      ].filter((id) => id !== action.payload.id);
    },
    clearSelection: (state) => {
      state.selectedItems = { nodes: [], arrows: [] };
    },

    // Context Menu
    setContextMenu: (state, action: PayloadAction<ContextMenu>) => {
      state.contextMenu = action.payload;
    },

    // Drag and Drop
    setDragItem: (state, action: PayloadAction<CanvasNode | null>) => {
      state.dragItem = action.payload;
    },

    // Renaming
    setRenamingNodeId: (state, action: PayloadAction<string | null>) => {
      state.renamingNodeId = action.payload;
    },

    // Selection Rectangle
    setSelecting: (state, action: PayloadAction<boolean>) => {
      state.isSelecting = action.payload;
    },
    setSelectionRect: (state, action: PayloadAction<Rectangle | null>) => {
      state.selectionRect = action.payload;
    },

    // Group Operations
    setGroupMoving: (state, action: PayloadAction<boolean>) => {
      state.isGroupMoving = action.payload;
    },
    setGroupMoveStart: (state, action: PayloadAction<Point | null>) => {
      state.groupMoveStart = action.payload;
    },
    setGroupMoveOffset: (state, action: PayloadAction<Point | null>) => {
      state.groupMoveOffset = action.payload;
    },

    // Panning and Navigation
    setPanning: (state, action: PayloadAction<boolean>) => {
      state.isPanning = action.payload;
    },
    setPanStart: (state, action: PayloadAction<Point>) => {
      state.panStart = action.payload;
    },
    setShowBackToContent: (state, action: PayloadAction<boolean>) => {
      state.showBackToContent = action.payload;
    },

    // Reset activity state
    resetActivity: (state) => {
      state.selectedItems = { nodes: [], arrows: [] };
      state.arrowStart = null;
      state.isDrawingArrow = false;
      state.tempArrowEnd = null;
      state.arrowSnapTarget = null;
      state.contextMenu = { x: 0, y: 0, type: null, id: null };
      state.dragItem = null;
      state.renamingNodeId = null;
      state.isSelecting = false;
      state.selectionRect = null;
      state.isGroupMoving = false;
      state.groupMoveStart = null;
      state.groupMoveOffset = null;
      state.isPanning = false;
      state.panStart = { x: 0, y: 0 };
      state.showBackToContent = false;
    },
  },
});

export const {
  setArrowMode,
  setSquareArrowMode,
  setCurvedArrowMode,
  setArrowStart,
  setDrawingArrow,
  setTempArrowEnd,
  setArrowSnapTarget,
  setSelectedItems,
  addToSelection,
  removeFromSelection,
  clearSelection,
  setContextMenu,
  setDragItem,
  setRenamingNodeId,
  setSelecting,
  setSelectionRect,
  setGroupMoving,
  setGroupMoveStart,
  setGroupMoveOffset,
  setPanning,
  setPanStart,
  setShowBackToContent,
  resetActivity,
} = activitySlice.actions;

export default activitySlice.reducer;
