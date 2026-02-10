import type { CanvasState } from './types';
import type { CanvasNode, CanvasArrow } from '@/types/canvas';
import { CANVAS_STORAGE_KEY, COOKIE_EXPIRATION_MS } from './constants';

/**
 * Type for data saved to/loaded from storage
 * This has a flatter structure than CanvasState for backwards compatibility
 */
export interface SavedCanvasData {
  nodes?: CanvasNode[];
  arrows?: CanvasArrow[];
  dimensions?: { width: number; height: number };
  activity?: {
    selectedItems?: {
      nodes: string[];
      arrows: string[];
    };
  };
  // Legacy fields for migration from old storage format
  canvasElementsLookup?: {
    nodes?: CanvasNode[];
    arrows?: CanvasArrow[];
  };
  canvasGraph?: any; // Legacy field for the graph object
}

/**
 * Save canvas state to both localStorage and cookies
 */
export const saveCanvasToStorage = (state: CanvasState): void => {
  try {
    const canvasData = {
      nodes: state.canvasElementsLookup?.nodes || [],
      arrows: state.canvasElementsLookup?.arrows || [],
      dimensions: state.configs.dimensions,
      activity: {
        selectedItems: state.activity.selectedItems,
      },
    };

    // Save to both cookies and localStorage
    const canvasString = JSON.stringify(canvasData);

    // Save to localStorage
    localStorage.setItem(CANVAS_STORAGE_KEY, canvasString);

    // Save to cookies (with 30-day expiration)
    const expires = new Date();
    expires.setTime(expires.getTime() + COOKIE_EXPIRATION_MS);
    document.cookie = `${CANVAS_STORAGE_KEY}=${canvasString};expires=${expires.toUTCString()};path=/;SameSite=Lax`;
  } catch (error) {
    console.error('Error saving canvas to storage:', error);
  }
};

/**
 * Load canvas state from cookies (preferred) or localStorage (fallback)
 */
export const loadCanvasFromStorage = (): SavedCanvasData | null => {
  try {
    // Try cookies first
    const nameEQ = CANVAS_STORAGE_KEY + '=';
    const ca = document.cookie.split(';');
    for (let i = 0; i < ca.length; i++) {
      let c = ca[i];
      while (c.charAt(0) === ' ') c = c.substring(1, c.length);
      if (c.indexOf(nameEQ) === 0) {
        const cookieData = c.substring(nameEQ.length, c.length);
        return JSON.parse(cookieData);
      }
    }

    // Fallback to localStorage
    const savedData = localStorage.getItem(CANVAS_STORAGE_KEY);
    if (savedData) {
      const data = JSON.parse(savedData);
      // Migrate to cookies
      const canvasString = JSON.stringify(data);
      const expires = new Date();
      expires.setTime(expires.getTime() + COOKIE_EXPIRATION_MS);
      document.cookie = `${CANVAS_STORAGE_KEY}=${canvasString};expires=${expires.toUTCString()};path=/;SameSite=Lax`;
      return data;
    }

    return null;
  } catch (error) {
    console.error('Error loading canvas from storage:', error);
    return null;
  }
};
