import React, { memo, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Link, useLocation } from 'react-router-dom';
import { Layers, ChevronLeft, ChevronRight, LogOut, User } from 'lucide-react';
import Logo from './Logo';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { logout } from '@/store/slices/oauth/oauthSlice';
// import { useAppDispatch, useAppSelector } from '@/store/hooks';

// Custom SVG Icon Component
const CustomIcon: React.FC<{ src: string; alt: string; className?: string }> = ({
  src,
  alt,
  className = 'w-5 h-5',
}) => <img src={src} alt={alt} className={className} />;

/**
 * Sidebar Component Props
 */
interface SidebarProps {
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

/**
 * Sidebar Component
 *
 * Provides navigation sidebar matching the dark theme design from the image.
 * Features a clean, modern sidebar with navigation items and a logo at the bottom.
 * Supports collapsible functionality for more screen space.
 */
const Sidebar: React.FC<SidebarProps> = memo(({ isCollapsed, onToggleCollapse }) => {
  const location = useLocation();
  const user = useAppSelector((state) => state.oauth.user);
  const dispatch = useAppDispatch();
  const isAuthenticated = useAppSelector((state) => state.oauth.isAuthenticated);

  const handleLogout = () => {
    dispatch(logout());
  };

  interface NavigationItem {
    icon?: React.ElementType;
    iconSrc?: string;
    label: string;
    href: string;
    iconClassName?: string;
  }

  // Memoize navigation items to prevent re-creation on every render
  const navigationItems = useMemo<NavigationItem[]>(
    () => [
      { iconSrc: '/home.svg', label: 'Home', href: '/home' },
      { icon: Layers, label: 'Canvas', href: '/app' },
      { iconSrc: '/services.svg', label: 'Code View', href: '/code-view' },
      { icon: Layers, label: 'Compare View', href: '/compare-view', iconClassName: 'rotate-90' },
    ],
    [],
  );

  return (
    <div
      className={`fixed left-0 top-0 h-full bg-sidebar border-r border-sidebar-border z-30 transition-all duration-300 ${isCollapsed ? 'w-16' : 'w-64'
        }`}
    >
      <div className="flex flex-col h-full">
        {/* Collapse Toggle Button */}
        <div className="flex justify-end p-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggleCollapse}
            className="h-8 w-8 p-0 text-sidebar-foreground hover:bg-sidebar-accent"
          >
            {isCollapsed ? (
              <ChevronRight className="w-4 h-4" />
            ) : (
              <ChevronLeft className="w-4 h-4" />
            )}
          </Button>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 px-2 py-4">
          <ul className="space-y-2">
            {navigationItems.map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <li key={item.label}>
                  <Link to={item.href}>
                    <Button
                      variant="ghost"
                      className={`w-full text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground ${isActive ? 'bg-[#7a44acff] text-white hover:bg-[#7a44acff] hover:text-white' : ''
                        } ${isCollapsed ? 'justify-center px-2' : 'justify-start px-3'}`}
                      title={isCollapsed ? item.label : undefined}
                    >
                      {item.iconSrc ? (
                        <CustomIcon src={item.iconSrc} alt={item.label} className="w-5 h-5" />
                      ) : (
                        item.icon ? <item.icon className={`w-5 h-5 ${item.iconClassName || ''}`} /> : <Layers className="w-5 h-5" />
                      )}
                      {!isCollapsed && <span className="ml-3">{item.label}</span>}
                    </Button>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* User Section */}
        {isAuthenticated && user && (
          <div className="px-2 py-3 border-t border-sidebar-border">
            <div className="flex items-center gap-3 px-2">
              {/* User Avatar */}
              <div className="flex-shrink-0">
                {user.avatarUrl ? (
                  <img
                    src={user.avatarUrl}
                    alt={user.name}
                    className="w-8 h-8 rounded-full"
                    onError={(e) => {
                      // Fallback to icon if image fails to load
                      e.currentTarget.style.display = 'none';
                      e.currentTarget.nextElementSibling?.classList.remove('hidden');
                    }}
                  />
                ) : null}
                <div className={`w-8 h-8 rounded-full bg-sidebar-accent flex items-center justify-center ${user.avatarUrl ? 'hidden' : ''}`}>
                  <User className="w-4 h-4 text-sidebar-foreground" />
                </div>
              </div>

              {/* User Info & Logout */}
              {!isCollapsed && (
                <div className="flex-1 min-w-0 flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-sidebar-foreground truncate">
                      {user.name}
                    </p>
                    {user.email && (
                      <p className="text-xs text-sidebar-foreground/60 truncate">
                        {user.email}
                      </p>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleLogout}
                    className="h-8 w-8 p-0 text-sidebar-foreground hover:bg-sidebar-accent hover:text-red-500"
                    title="Logout"
                  >
                    <LogOut className="w-4 h-4" />
                  </Button>
                </div>
              )}

              {/* Collapsed Logout Button */}
              {isCollapsed && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleLogout}
                  className="absolute bottom-16 left-1/2 transform -translate-x-1/2 h-8 w-8 p-0 text-sidebar-foreground hover:bg-sidebar-accent hover:text-red-500"
                  title="Logout"
                >
                  <LogOut className="w-4 h-4" />
                </Button>
              )}
            </div>
          </div>
        )}

        {/* Logo Section */}
        <div className="px-2 py-4 border-t border-sidebar-border">
          <Logo size="md" className={isCollapsed ? 'justify-center' : ''} />
        </div>
      </div>
    </div>
  );
});

Sidebar.displayName = 'Sidebar';

export default Sidebar;
