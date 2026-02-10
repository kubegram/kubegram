import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { CanvasNode, CanvasArrow } from '@/types/canvas';
import type { CanvasElementsLookup, GraphsMetadata } from './types/data';

/**
 * Initial data state
 */
const initialState = {
  graphsMetadata: {} as GraphsMetadata,
  canvasElementsLookup: {
    nodes: [] as CanvasNode[],
    arrows: [] as CanvasArrow[],
  } as CanvasElementsLookup,
};

/**
 * Canvas data slice
 * Manages canvas elements (nodes, arrows) and graph metadata
 */
const dataSlice = createSlice({
  name: 'canvas/data',
  initialState,
  reducers: {
    // Node Management
    addNode: (state, action: PayloadAction<CanvasNode>) => {
      state.canvasElementsLookup.nodes.push(action.payload);
    },
    updateNode: (state, action: PayloadAction<{ id: string; updates: Partial<CanvasNode> }>) => {
      const index = state.canvasElementsLookup.nodes.findIndex((node) => node.id === action.payload.id);
      if (index !== -1) {
        state.canvasElementsLookup.nodes[index] = {
          ...state.canvasElementsLookup.nodes[index],
          ...action.payload.updates,
        };
      }
    },
    removeNode: (state, action: PayloadAction<string>) => {
      state.canvasElementsLookup.nodes = state.canvasElementsLookup.nodes.filter(
        (node) => node.id !== action.payload
      );
    },
    setNodes: (state, action: PayloadAction<CanvasNode[]>) => {
      state.canvasElementsLookup.nodes = action.payload;
    },

    // Arrow Management
    addArrow: (state, action: PayloadAction<CanvasArrow>) => {
      state.canvasElementsLookup.arrows.push(action.payload);
    },
    updateArrow: (state, action: PayloadAction<{ id: string; updates: Partial<CanvasArrow> }>) => {
      const index = state.canvasElementsLookup.arrows.findIndex((arrow) => arrow.id === action.payload.id);
      if (index !== -1) {
        state.canvasElementsLookup.arrows[index] = {
          ...state.canvasElementsLookup.arrows[index],
          ...action.payload.updates,
        };
      }
    },
    removeArrow: (state, action: PayloadAction<string>) => {
      state.canvasElementsLookup.arrows = state.canvasElementsLookup.arrows.filter(
        (arrow) => arrow.id !== action.payload
      );
    },
    setArrows: (state, action: PayloadAction<CanvasArrow[]>) => {
      state.canvasElementsLookup.arrows = action.payload;
    },

    // Clear all data
    clearData: (state) => {
      state.canvasElementsLookup.nodes = [];
      state.canvasElementsLookup.arrows = [];
    },
  },
});

export const {
  addNode,
  updateNode,
  removeNode,
  setNodes,
  addArrow,
  updateArrow,
  removeArrow,
  setArrows,
  clearData,
} = dataSlice.actions;

export default dataSlice.reducer;
