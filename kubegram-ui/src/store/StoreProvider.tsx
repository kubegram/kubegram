import React, { useEffect } from 'react';
import { Provider } from 'react-redux';
import { store } from './index';
import { initializeCompanies } from './slices/company/companySlice';
import { initializeOrganizations } from './slices/organization/organizationSlice';
import { initializeTeams } from './slices/team/teamSlice';
import { initializeProject } from './slices/project/projectSlice';

interface StoreProviderProps {
  children: React.ReactNode;
}

/**
 * Redux Store Provider Component
 *
 * This component wraps the application with the Redux store provider
 * and handles initial state loading from storage on mount.
 */
export const StoreProvider: React.FC<StoreProviderProps> = ({ children }) => {
  useEffect(() => {
    // Initialize state from localStorage on app start
    store.dispatch(initializeCompanies());
    store.dispatch(initializeOrganizations());
    store.dispatch(initializeTeams());
    store.dispatch(initializeProject());
  }, []);

  return <Provider store={store}>{children}</Provider>;
};
