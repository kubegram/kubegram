import type { Middleware } from '@reduxjs/toolkit';
import type { CanvasState } from './types';
import { saveCanvasToStorage } from './storage';

/**
 * Persistence middleware for canvas state
 * Automatically saves canvas state to storage when specific actions are dispatched
 */
export const canvasPersistenceMiddleware: Middleware = (store) => (next) => (action) => {
  const result = next(action);

  // Only save to storage for actions that modify persistent data
  const persistentActions = [
    // Config actions
    'canvas/configs/setDimensions',
    // Data actions (nodes and arrows)
    'canvas/data/addNode',
    'canvas/data/updateNode',
    'canvas/data/removeNode',
    'canvas/data/setNodes',
    'canvas/data/addArrow',
    'canvas/data/updateArrow',
    'canvas/data/removeArrow',
    'canvas/data/setArrows',
    // Activity actions that should be persisted
    'canvas/activity/setSelectedItems',
  ];

  if (
    typeof action === 'object' &&
    action !== null &&
    'type' in action &&
    typeof action.type === 'string' &&
    persistentActions.includes(action.type)
  ) {
    const state = store.getState() as { canvas: CanvasState };
    saveCanvasToStorage(state.canvas);
  }

  return result;
};
