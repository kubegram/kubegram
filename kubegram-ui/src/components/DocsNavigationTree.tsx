import React, { useState, useMemo } from 'react';
import { ChevronDown, ChevronRight, FileText, Folder } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';

interface NavItem {
  title: string;
  path: string;
  children?: NavItem[];
  isDirectory?: boolean;
  isActive?: boolean;
  depth?: number;
  order?: number;
}

interface DocsNavigationTreeProps {
  navItems: NavItem[];
  onItemSelect?: (path: string) => void;
  searchQuery?: string;
  flat?: boolean;
}

const flattenItems = (items: NavItem[]): NavItem[] =>
  items.flatMap(item =>
    item.isDirectory ? flattenItems(item.children ?? []) : [item]
  );

const DocsNavigationTree: React.FC<DocsNavigationTreeProps> = ({
  navItems,
  onItemSelect,
  searchQuery = '',
  flat = false,
}) => {
  const location = useLocation();
  const [expandedItems, setExpandedItems] = useState<string[]>([]);

  const isItemActive = (path: string): boolean => {
    if (path === '/docs' && location.pathname === '/docs') return true;
    return location.pathname.startsWith(path);
  };

  // --- Flat mode ---
  const flatItems = useMemo(() => {
    if (!flat) return [];
    const all = flattenItems(navItems).sort((a, b) => {
      const aHas = a.order !== undefined;
      const bHas = b.order !== undefined;
      if (aHas && bHas) return a.order! - b.order!;
      if (aHas) return -1;
      if (bHas) return 1;
      return a.title.localeCompare(b.title);
    });
    if (!searchQuery) return all;
    return all.filter(item =>
      item.title.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [flat, navItems, searchQuery]);

  if (flat) {
    return (
      <div className="space-y-1">
        {flatItems.map(item => {
          const isActive = isItemActive(item.path);
          return (
            <Link key={item.path} to={item.path} onClick={() => onItemSelect?.(item.path)}>
              <Button
                variant="ghost"
                className={`w-full text-left ${isActive ? 'bg-primary/5 text-primary' : ''} hover:bg-primary/5 hover:text-primary transition-all`}
                title={item.title}
              >
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 shrink-0" />
                  <span className="truncate">{item.title}</span>
                </div>
              </Button>
            </Link>
          );
        })}
      </div>
    );
  }

  // --- Tree mode ---
  const filteredNavItems = useMemo(() => {
    if (!searchQuery) return navItems;

    const matchesSearch = (item: NavItem): boolean => {
      if (item.title.toLowerCase().includes(searchQuery.toLowerCase())) return true;
      if (item.children) return item.children.some(matchesSearch);
      return false;
    };

    return navItems.filter(matchesSearch);
  }, [navItems, searchQuery]);

  const toggleExpanded = (path: string) => {
    setExpandedItems(prev => {
      if (prev.includes(path)) return prev.filter(p => p !== path);
      return [...prev, path];
    });
  };

  const renderNavItem = (item: NavItem, depth = 0) => {
    const isActive = isItemActive(item.path);
    const isExpanded = expandedItems.includes(item.path);
    const hasChildren = item.children && item.children.length > 0;
    const shouldShow = !searchQuery || item.title.toLowerCase().includes(searchQuery.toLowerCase());

    if (!shouldShow) return null;

    return (
      <div key={item.path} className="space-y-1">
        {hasChildren ? (
          <div className="group">
            <Button
              variant="ghost"
              className={`w-full text-left ${depth > 0 ? 'pl-4' : ''} ${isExpanded ? 'bg-primary/5' : ''} ${isActive ? 'bg-primary/5 text-primary' : ''} hover:bg-primary/5 hover:text-primary transition-all`}
              onClick={() => toggleExpanded(item.path)}
              title={isExpanded ? 'Collapse' : 'Expand'}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {item.isDirectory ? (
                    <Folder className={`w-4 h-4 ${isExpanded ? 'rotate-90' : ''} transition-transform`} />
                  ) : (
                    <FileText className="w-4 h-4" />
                  )}
                  <span className="truncate">{item.title}</span>
                </div>
                {hasChildren && (
                  <div className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-90' : ''}`}>
                    {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                  </div>
                )}
              </div>
            </Button>

            {isExpanded && item.children && (
              <div className={`pl-4 space-y-1 ${depth > 0 ? 'pl-4' : ''}`}>
                {item.children.map(child => renderNavItem(child, depth + 1))}
              </div>
            )}
          </div>
        ) : (
          <Link to={item.path} onClick={() => onItemSelect?.(item.path)}>
            <Button
              variant="ghost"
              className={`w-full text-left ${depth > 0 ? 'pl-4' : ''} ${isActive ? 'bg-primary/5 text-primary' : ''} hover:bg-primary/5 hover:text-primary transition-all`}
              title={item.title}
            >
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4" />
                <span className="truncate">{item.title}</span>
              </div>
            </Button>
          </Link>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-2">
      {filteredNavItems.map(item => renderNavItem(item, 0))}
    </div>
  );
};

export default DocsNavigationTree;
