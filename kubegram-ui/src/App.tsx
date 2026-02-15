import React, { useCallback, useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import { StoreProvider } from './store/StoreProvider';
import { useAppSelector, useAppDispatch } from './store/hooks';
import { toggleSidebar } from './store/slices/uiSlice';
import Sidebar from './components/Sidebar';
import KonvaPage from './pages/KonvaPage';
import CodeViewPage from './pages/CodeViewPage';
import CompareViewPage from './pages/CompareViewPage';
import LandingPage from './pages/LandingPage';
import { GraphSyncProvider } from './components/GraphSyncProvider';
import DocsLayout from './layouts/DocsLayout';
import DocsPage from './pages/DocsPage';
import BlogLayout from './layouts/BlogLayout';
import BlogListPage from './pages/BlogListPage';
import BlogPage from './pages/BlogPage';
import AboutPage from './pages/AboutPage';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import OAuthCallback from './components/OAuthCallback';
import LoginModal from './components/LoginModal';
import { logout, clearError } from './store/slices/oauth/oauthSlice';
import ProtectedRoute from './components/ProtectedRoute';
import OAuthProviderInfo from './pages/OAuthProviderInfo';
import ReportsPage from './pages/ReportsPage';
import { CodegenTestPage, PlanTestPage } from './pages/test';
import JsonCanvasPage from './pages/JsonCanvasPage';

/**
 * LoginModalWrapper Component
 * 
 * Global modal wrapper that manages login modal state across the application.
 * Handles contextual redirects based on current route when modal is dismissed.
 */
const LoginModalWrapper: React.FC = () => {
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [shouldShowModal, setShouldShowModal] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { isLoading, error } = useAppSelector((state) => state.oauth);

  // Handle modal trigger events from ProtectedRoute and other components
  useEffect(() => {
    const handleTriggerLoginModal = () => {
      setLoginError(null);
      setIsLoginModalOpen(true);
    };

    window.addEventListener('triggerLoginModal', handleTriggerLoginModal as EventListener);

    return () => {
      window.removeEventListener('triggerLoginModal', handleTriggerLoginModal as EventListener);
    };
  }, []);

  // Add 150ms delay for better UX
  useEffect(() => {
    if (isLoginModalOpen) {
      const timer = setTimeout(() => setShouldShowModal(true), 150);
      return () => clearTimeout(timer);
    } else {
      setShouldShowModal(false);
    }
  }, [isLoginModalOpen]);

  // Handle modal close with contextual redirect logic
  const handleModalClose = useCallback(() => {
    setIsLoginModalOpen(false);
    setShouldShowModal(false);

    // Contextual redirect logic
    const publicRoutes = ['/', '/docs', '/blog', '/about'];
    const isPublicRoute = publicRoutes.some(route => location.pathname.startsWith(route));

    if (isPublicRoute) {
      // Stay on current page for public routes
      return;
    } else {
      // Redirect to app for protected pages
      navigate('/app');
    }
  }, [location.pathname, navigate]);

  // Handle OAuth errors
  useEffect(() => {
    if (error) {
      setLoginError(error);

      // Clear auth tokens
      localStorage.removeItem('kubegram_auth');

      // Clear all cookies
      document.cookie.split(";").forEach((c) => {
        document.cookie = c
          .replace(/^ +/, "")
          .replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
      });

      dispatch(clearError());
    }
  }, [error, dispatch]);

  // Add VITE_FORCE_REAUTH token clearing
  useEffect(() => {
    if (import.meta.env.VITE_FORCE_REAUTH === 'true') {
      // Clear all auth tokens to force re-authentication
      localStorage.removeItem('kubegram_auth');
      dispatch(logout());
    }
  }, [dispatch]);

  return (
    <>
      {shouldShowModal && (
        <LoginModal
          isOpen={shouldShowModal}
          onClose={handleModalClose}
          isLoading={isLoading}
        />
      )}

      {loginError && (
        <div className="fixed top-4 right-4 bg-red-600 text-white p-4 rounded-lg shadow-lg max-w-md z-50">
          <div className="flex items-center justify-between">
            <div>
              <strong>Authentication Error</strong>
              <p className="text-sm mt-1">
                An error occurred while logging you in. If error persists, please submit a report at{' '}
                <a href="/reports" className="underline hover:no-underline">
                  /reports
                </a>
              </p>
            </div>
            <button
              onClick={() => setLoginError(null)}
              className="ml-4 text-white hover:text-gray-200"
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </>
  );
};

/**
 * App component with state management and routing between different canvas implementations.
 */
const App: React.FC = () => {
  console.log('🚀 App component mounted');
  // Temporary alert to test if the app is running
  if (typeof window !== 'undefined') {
    console.log('🌐 Window object available');
  }
  return (
    <StoreProvider>
      <GraphSyncProvider>
        <Router>
          <AppContent />
        </Router>
      </GraphSyncProvider>
    </StoreProvider>
  );
};

/**
 * App Content Component
 * Contains the main UI layout and uses Redux store
 */
const AppContent: React.FC = () => {
  const dispatch = useAppDispatch();
  const location = useLocation();
  const isSidebarCollapsed = useAppSelector((state) => state.ui.isSidebarCollapsed);
  const isHeaderCollapsed = useAppSelector((state) => state.ui.isHeaderCollapsed);

  /* 
   * Determine if we should show the full-screen layout logic (Landing, Docs, Blog, About).
   * Basically anything that isn't the main "App" area.
   */
  const isStandalonePage = ['/', '/docs', '/blog', '/about'].some(path =>
    location.pathname === path || location.pathname.startsWith(path + '/')
  );

  // Memoize toggle functions to prevent unnecessary re-renders
  const handleToggleSidebar = useCallback(() => {
    dispatch(toggleSidebar());
  }, [dispatch]);
  return (
    <div className="h-screen w-screen bg-background text-foreground">
      {/* Sidebar Navigation - Only show for App pages */}
      {!isStandalonePage && (
        <Sidebar isCollapsed={isSidebarCollapsed} onToggleCollapse={handleToggleSidebar} />
      )}

      {/* Main Content Area */}
      <main
        className={`relative z-20 transition-all duration-300 ${!isStandalonePage
          ? (isSidebarCollapsed ? 'ml-16 w-[calc(100vw-4rem)]' : 'ml-64 w-[calc(100vw-16rem)]')
          : 'w-full'
          }`}
        style={{
          height: '100vh',
        }}
      >
        <Routes>
          {/* Authentication Routes */}
          <Route
            path="/login"
            element={
              <ProtectedRoute requireAuth={false}>
                <LoginPage />
              </ProtectedRoute>
            }
          />
          <Route path="/auth/callback" element={<OAuthCallback />} />

          {/* Default route to Landing Page */}
          <Route path="/" element={<LandingPage />} />

          <Route path="/home" element={<HomePage />} />

          {/* Main App Routes - KonvaPage now handles auth internally */}
          <Route
            path="/app"
            element={
              <KonvaPage
                isSidebarCollapsed={isSidebarCollapsed}
                isHeaderCollapsed={isHeaderCollapsed}
              />
            }
          />
          <Route
            path="/konva"
            element={
              <KonvaPage
                isSidebarCollapsed={isSidebarCollapsed}
                isHeaderCollapsed={isHeaderCollapsed}
              />
            }
          />
          <Route
            path="/code-view"
            element={
              <ProtectedRoute>
                <CodeViewPage
                  isSidebarCollapsed={isSidebarCollapsed}
                  isHeaderCollapsed={isHeaderCollapsed}
                />
              </ProtectedRoute>
            }
          />
          <Route
            path="/compare-view"
            element={
              <ProtectedRoute>
                <CompareViewPage
                  isSidebarCollapsed={isSidebarCollapsed}
                  isHeaderCollapsed={isHeaderCollapsed}
                />
              </ProtectedRoute>
            }
          />

          {/* Documentation Routes - Public */}
          <Route path="/docs" element={<DocsLayout />}>
            <Route index element={<DocsPage />} />
            <Route path="*" element={<DocsPage />} />
          </Route>

          {/* Blog Routes - Public */}
          <Route path="/blog" element={<BlogLayout />}>
            <Route index element={<BlogListPage />} />
            <Route path=":slug" element={<BlogPage />} />
          </Route>

          {/* About Page - Public */}
          <Route path="/about" element={<BlogLayout />}>
            <Route index element={<AboutPage />} />
          </Route>

          {/* OAuth Provider Info - Public */}
          <Route path="/oauth-providers" element={<OAuthProviderInfo />} />

          {/* Reports Page - Public */}
          <Route path="/reports" element={<ReportsPage />} />

          {/* JSON Canvas Experiment */}
          <Route
            path="/json-canvas"
            element={
              <JsonCanvasPage
                isSidebarCollapsed={isSidebarCollapsed}
                isHeaderCollapsed={isHeaderCollapsed}
              />
            }
          />

          {/* Test Pages - Development */}
          <Route path="/test/codegen" element={<CodegenTestPage />} />
          <Route path="/test/plan" element={<PlanTestPage />} />
        </Routes>
      </main>

      {/* Login Modal */}
      <LoginModalWrapper />

    </div>
  );
};

export default App;
