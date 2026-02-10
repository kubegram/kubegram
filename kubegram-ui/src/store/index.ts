import { configureStore } from '@reduxjs/toolkit';
import canvasReducer, { canvasPersistenceMiddleware } from './slices/canvas';
import uiReducer from './slices/uiSlice';
import companyReducer from './slices/company/companySlice';
import organizationReducer from './slices/organization/organizationSlice';
import teamReducer from './slices/team/teamSlice';
import projectReducer from './slices/project/projectSlice';
import oauthReducer from './slices/oauth/oauthSlice';
import codegenReducer from './slices/codegen/codegenSlice';
import { graphSyncMiddleware } from './middleware/graphSyncMiddleware';
import { authErrorMiddleware } from './middleware/authErrorMiddleware';

// Define RootState type based on the store configuration
export type RootState = {
  canvas: ReturnType<typeof canvasReducer>;
  ui: ReturnType<typeof uiReducer>;
  company: ReturnType<typeof companyReducer>;
  organization: ReturnType<typeof organizationReducer>;
  team: ReturnType<typeof teamReducer>;
  project: ReturnType<typeof projectReducer>;
  oauth: ReturnType<typeof oauthReducer>;
  codegen: ReturnType<typeof codegenReducer>;
};

export const store = configureStore({
  reducer: {
    canvas: canvasReducer,
    ui: uiReducer,
    company: companyReducer,
    organization: organizationReducer,
    team: teamReducer,
    project: projectReducer,
    oauth: oauthReducer,
    codegen: codegenReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST'],
      },
    }).concat(canvasPersistenceMiddleware, graphSyncMiddleware, authErrorMiddleware),
});

export type AppStore = typeof store;
export type AppDispatch = AppStore['dispatch'];
