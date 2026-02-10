import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { CanvasConfigs, Dimensions } from './types/configs';

/**
 * Default canvas dimensions
 */
const DEFAULT_VIEWPORT_DIMENSIONS: Dimensions = {
  width: typeof window !== 'undefined' ? window.innerWidth : 1920,
  height: typeof window !== 'undefined' ? window.innerHeight : 1080,
};

const DEFAULT_CANVAS_SIZE: Dimensions = {
  width: 10000,
  height: 10000,
};

/**
 * Initial configs state
 */
const initialState: CanvasConfigs = {
  dimensions: DEFAULT_VIEWPORT_DIMENSIONS,
  canvasSize: DEFAULT_CANVAS_SIZE,
};

/**
 * Canvas configuration slice
 * Manages canvas dimensions and size
 */
const configsSlice = createSlice({
  name: 'canvas/configs',
  initialState,
  reducers: {
    setDimensions: (state, action: PayloadAction<{ width: number; height: number }>) => {
      state.dimensions = action.payload;
    },
  },
});

export const { setDimensions } = configsSlice.actions;
export default configsSlice.reducer;
