import { useSelector } from 'react-redux';
import { Navigate, useLocation } from 'react-router-dom';
import type { RootState } from '../store';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAuth?: boolean;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  requireAuth = true 
}) => {
  const { isAuthenticated, isLoading } = useSelector((state: RootState) => state.oauth);
  const location = useLocation();

  // If authentication is required and user is not authenticated
  if (requireAuth && !isAuthenticated && !isLoading) {
    // Trigger login modal instead of redirecting
    window.dispatchEvent(new CustomEvent('triggerLoginModal'));
    // Render nothing while modal shows
    return null;
  }

  // If user is authenticated but trying to access auth-only pages (like login)
  if (!requireAuth && isAuthenticated && !isLoading) {
    // Redirect to home or dashboard
    const from = location.state?.from?.pathname || '/';
    return <Navigate to={from} replace />;
  }

  // Show loading spinner if checking auth status
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // If all checks pass, render children
  return <>{children}</>;
};

export default ProtectedRoute;