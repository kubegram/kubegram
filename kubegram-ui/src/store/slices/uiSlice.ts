import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

/**
 * UI state interface
 */
interface UIState {
  // Sidebar state
  isSidebarCollapsed: boolean;

  // Header state
  isHeaderCollapsed: boolean;

  // Help modal state
  showHelpModal: boolean;

  // Toolbar state
  isToolbarCollapsed: boolean;

  // Canvas toolbar state
  isCanvasToolbarCollapsed: boolean;

  // Zoom level
  zoomLevel: number;

  // Theme (for future use)
  theme: 'light' | 'dark';

  // Loading states
  isExporting: boolean;
  isImporting: boolean;
}

const initialState: UIState = {
  isSidebarCollapsed: true,
  isHeaderCollapsed: false,
  showHelpModal: false,
  isToolbarCollapsed: false,
  isCanvasToolbarCollapsed: false,
  zoomLevel: 1,
  theme: 'light',
  isExporting: false,
  isImporting: false,
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    // Sidebar actions
    toggleSidebar: (state) => {
      state.isSidebarCollapsed = !state.isSidebarCollapsed;
    },
    setSidebarCollapsed: (state, action: PayloadAction<boolean>) => {
      state.isSidebarCollapsed = action.payload;
    },

    // Header actions
    toggleHeader: (state) => {
      state.isHeaderCollapsed = !state.isHeaderCollapsed;
    },
    setHeaderCollapsed: (state, action: PayloadAction<boolean>) => {
      state.isHeaderCollapsed = action.payload;
    },

    // Help modal actions
    toggleHelpModal: (state) => {
      state.showHelpModal = !state.showHelpModal;
    },
    setShowHelpModal: (state, action: PayloadAction<boolean>) => {
      state.showHelpModal = action.payload;
    },

    // Toolbar actions
    toggleToolbar: (state) => {
      state.isToolbarCollapsed = !state.isToolbarCollapsed;
    },
    setToolbarCollapsed: (state, action: PayloadAction<boolean>) => {
      state.isToolbarCollapsed = action.payload;
    },

    // Canvas toolbar actions
    toggleCanvasToolbar: (state) => {
      state.isCanvasToolbarCollapsed = !state.isCanvasToolbarCollapsed;
    },
    setCanvasToolbarCollapsed: (state, action: PayloadAction<boolean>) => {
      state.isCanvasToolbarCollapsed = action.payload;
    },

    // Zoom actions
    setZoomLevel: (state, action: PayloadAction<number>) => {
      state.zoomLevel = Math.max(0.1, Math.min(5, action.payload)); // Clamp between 0.1 and 5
    },
    zoomIn: (state) => {
      state.zoomLevel = Math.min(5, state.zoomLevel * 1.2);
    },
    zoomOut: (state) => {
      state.zoomLevel = Math.max(0.1, state.zoomLevel / 1.2);
    },
    resetZoom: (state) => {
      state.zoomLevel = 1;
    },

    // Theme actions
    setTheme: (state, action: PayloadAction<'light' | 'dark'>) => {
      state.theme = action.payload;
    },
    toggleTheme: (state) => {
      state.theme = state.theme === 'light' ? 'dark' : 'light';
    },

    // Loading states
    setExporting: (state, action: PayloadAction<boolean>) => {
      state.isExporting = action.payload;
    },
    setImporting: (state, action: PayloadAction<boolean>) => {
      state.isImporting = action.payload;
    },

    // Reset UI state
    resetUI: (state) => {
      state.isSidebarCollapsed = false;
      state.isHeaderCollapsed = false;
      state.showHelpModal = false;
      state.isToolbarCollapsed = false;
      state.isCanvasToolbarCollapsed = false;
      state.zoomLevel = 1;
      state.isExporting = false;
      state.isImporting = false;
    },
  },
});

export const {
  toggleSidebar,
  setSidebarCollapsed,
  toggleHeader,
  setHeaderCollapsed,
  toggleHelpModal,
  setShowHelpModal,
  toggleToolbar,
  setToolbarCollapsed,
  toggleCanvasToolbar,
  setCanvasToolbarCollapsed,
  setZoomLevel,
  zoomIn,
  zoomOut,
  resetZoom,
  setTheme,
  toggleTheme,
  setExporting,
  setImporting,
  resetUI,
} = uiSlice.actions;

export default uiSlice.reducer;
