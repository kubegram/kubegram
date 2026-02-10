import React, { memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from './ui/button';
import { Menu, Settings, User, LogOut } from 'lucide-react';
import { useSelector, useDispatch } from 'react-redux';
import { logout } from '../store/slices/oauth/oauthSlice';
import { logoutUser } from '../store/slices/oauth/oauthThunks';
import type { RootState } from '../store';

/**
 * Header Component Props
 */
interface HeaderProps {
  isSidebarCollapsed: boolean;
  onToggleSidebar: () => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}



/**
 * Header Component
 *
 * Provides the top header bar matching the dark theme design from the image.
 * Features a hamburger menu, title, and settings icon.
 * Supports collapsible sidebar functionality.
 */
const Header: React.FC<HeaderProps> = memo(
  ({ isSidebarCollapsed, onToggleSidebar, isCollapsed, onToggleCollapse }) => {
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const { user, isAuthenticated, accessToken } = useSelector((state: RootState) => state.oauth);

    const handleLogin = () => {
      navigate('/login');
    };

    const handleLogout = async () => {
      if (accessToken) {
        await dispatch(logoutUser(accessToken) as any);
      }
      dispatch(logout());
      navigate('/');
    };

    return (
      <div
        className={`fixed top-0 bg-background border-b border-border z-30 transition-all duration-300 ${isSidebarCollapsed ? 'left-16 right-0' : 'left-64 right-0'
          } ${isCollapsed ? 'h-8' : 'h-16'}`}
      >
        <div
          className={`flex items-center justify-between px-6 transition-all duration-300 ${isCollapsed ? 'h-8' : 'h-16'
            }`}
        >
          {/* Left side - Sidebar toggle */}
          <Button
            variant="ghost"
            size="sm"
            className="text-foreground hover:bg-accent"
            onClick={onToggleSidebar}
            title={isSidebarCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
          >
            <Menu className="w-5 h-5" />
          </Button>

          {/* Center - Title and Header Toggle */}
          <div className="flex items-center gap-4">
            {!isCollapsed && <h1 className="text-lg font-semibold text-foreground">Kubegram</h1>}
            <Button
              variant="ghost"
              size="sm"
              onClick={onToggleCollapse}
              className="text-foreground hover:bg-accent"
              title={isCollapsed ? 'Expand Header' : 'Collapse Header'}
            >
              {isCollapsed ? '↓' : '↑'}
            </Button>
          </div>

          {/* Right side - User info and actions - Only show when not collapsed */}
          {!isCollapsed && (
            <div className="flex items-center gap-2">
              {isAuthenticated ? (
                <>
                  {/* User info */}
                  <div className="flex items-center gap-2 px-3 py-1 rounded-md bg-accent/50">
                    {user?.avatarUrl ? (
                      <img src={user.avatarUrl} alt={user.name} className="w-6 h-6 rounded-full" />
                    ) : (
                      <User className="w-4 h-4 text-foreground" />
                    )}
                    <span className="text-sm text-foreground">{user?.name}</span>
                  </div>

                  {/* Logout button */}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleLogout}
                    className="text-foreground hover:bg-accent"
                    title="Logout"
                  >
                    <LogOut className="w-4 h-4" />
                  </Button>
                </>
              ) : (
                /* Login button */
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleLogin}
                  className="text-foreground hover:bg-accent"
                >
                  <User className="w-4 h-4 mr-2" />
                  Login
                </Button>
              )}

              {/* Settings */}
              <Button variant="ghost" size="sm" className="text-foreground hover:bg-accent">
                <Settings className="w-5 h-5" />
              </Button>
            </div>
          )}
        </div>
      </div>
    );
  },
);

Header.displayName = 'Header';

export default Header;
