import { combineReducers, createAsyncThunk } from '@reduxjs/toolkit';

// Import individual slice reducers
import configsReducer from './configsSlice';
import activityReducer from './activitySlice';
import dataReducer from './dataSlice';
import entitiesReducer from './entitiesSlice';

// Import specific actions for resetCanvas
import { clearData } from './dataSlice';
import { resetActivity } from './activitySlice';

// Export all actions from individual slices
export * from './configsSlice';
export * from './activitySlice';
export * from './dataSlice';
export * from './entitiesSlice';

// Export types
export type { CanvasState, Selection, ContextMenu, Point, Rectangle } from './types';

// Export persistence middleware
export { canvasPersistenceMiddleware } from './middleware';

/**
 * Reset canvas thunk - clears all canvas data and activity state
 * This thunk dispatches multiple slice actions to completely reset the canvas
 */
export const resetCanvas = createAsyncThunk(
  'canvas/reset',
  async (_, { dispatch }) => {
    // Clear all canvas data (nodes and arrows)
    dispatch(clearData());
    
    // Reset all activity state (selection, drawing, dragging, etc.)
    dispatch(resetActivity());
    
    // Note: Entities and Configs slices don't have reset actions
    // They will return to initial state on next page load if needed
  }
);

// Combine all canvas reducers
export const canvasReducer = combineReducers({
  configs: configsReducer,
  activity: activityReducer,
  data: dataReducer,
  entities: entitiesReducer,
});

// Export default combined reducer
export default canvasReducer;
