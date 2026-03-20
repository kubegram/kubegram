import React, { useMemo } from 'react';
import { Outlet } from 'react-router-dom';
import { Menu, X, Search, ChevronLeft, ChevronRight, List, FolderTree } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import DocsNavigationTree from '@/components/DocsNavigationTree';
import rawDocsManifest from '@/config/docs-manifest.json';

const DocsLayout: React.FC = () => {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);
    const [isSidebarOpen, setIsSidebarOpen] = React.useState(() => {
        const saved = localStorage.getItem('docs-sidebar-open');
        return saved !== null ? JSON.parse(saved) : true;
    });
    const [searchQuery, setSearchQuery] = React.useState('');
    const [isFlatView, setIsFlatView] = React.useState(() => {
        const saved = localStorage.getItem('docs-flat-view');
        return saved !== null ? JSON.parse(saved) : true;
    });

    React.useEffect(() => {
        localStorage.setItem('docs-flat-view', JSON.stringify(isFlatView));
    }, [isFlatView]);

    const docsManifest = useMemo(() => {
        const sortItems = (items: any[]): any[] => {
            return [...items].sort((a, b) => {
                const aHasOrder = a.order !== undefined;
                const bHasOrder = b.order !== undefined;
                if (aHasOrder && bHasOrder) return a.order - b.order;
                if (aHasOrder) return -1;
                if (bHasOrder) return 1;
                return a.title.localeCompare(b.title);
            }).map(item => ({
                ...item,
                children: item.children ? sortItems(item.children) : undefined
            }));
        };
        return sortItems(rawDocsManifest);
    }, []);

    React.useEffect(() => {
        localStorage.setItem('docs-sidebar-open', JSON.stringify(isSidebarOpen));
    }, [isSidebarOpen]);

    // FastAPI Purple Theme overrides
    const themeOverrides = {
        '--primary': '266 43% 47%',
    } as React.CSSProperties;

    return (
        <div
            className="min-h-screen bg-background text-foreground flex flex-col md:flex-row"
            style={{
                ...themeOverrides,
                // Override CSS variables for this scope
                // We use standard CSS syntax here effectively
                // @ts-ignore
                '--primary': 'oklch(0.48 0.17 291)', // Approximation of #7a44ac
                '--primary-foreground': 'oklch(1 0 0)',
                '--sidebar-ring': 'oklch(0.48 0.17 291)',
            } as React.CSSProperties}
        >
            {/* Mobile Header */}
            <div className="md:hidden border-b border-border p-4 flex items-center justify-between bg-background/95 backdrop-blur-sm sticky top-0 z-50">
                <div className="flex items-center gap-2 font-bold text-lg">
                    <span className="text-primary">Kubegram</span>
                    <span>Docs</span>
                </div>
                <Button variant="ghost" size="icon" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
                    {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                </Button>
            </div>

            {/* Mobile Sidebar Overlay */}
            {isMobileMenuOpen && (
                <div className="fixed inset-0 z-40 bg-background/95 md:hidden pt-20 px-6 overflow-y-auto">
                    <DocsNavigationTree
                        navItems={docsManifest}
                        onItemSelect={() => setIsMobileMenuOpen(false)}
                        searchQuery={searchQuery}
                        flat={isFlatView}
                    />
                </div>
            )}

            {/* Desktop Sidebar */}
            <aside className={`hidden md:flex flex-col border-r border-border h-screen sticky top-0 bg-background z-30 transition-all duration-300 ${isSidebarOpen ? 'w-72' : 'w-0 overflow-hidden'}`}>
                <div className="p-6 border-b border-border/40">
                    <div className="flex items-center gap-2 font-bold text-xl">
                        <img
                            src="/favicon.svg"
                            alt="Kubegram Logo"
                            className="h-8 w-auto"
                        />
                        <span className="tracking-tight">Kubegram</span>
                    </div>
                    <div className="mt-4 flex items-center gap-2">
                        <div className="relative flex-1">
                            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search docs..."
                                className="pl-8 h-9 bg-muted/50 border-transparent focus:bg-background transition-all"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-9 w-9 shrink-0"
                            onClick={() => setIsFlatView(!isFlatView)}
                            title={isFlatView ? 'Switch to tree view' : 'Switch to list view'}
                        >
                            {isFlatView ? <FolderTree className="h-4 w-4" /> : <List className="h-4 w-4" />}
                        </Button>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto py-4 px-3">
                    <DocsNavigationTree
                        navItems={docsManifest}
                        searchQuery={searchQuery}
                        flat={isFlatView}
                    />
                </div>
                <div className="p-4 border-t border-border/40 text-xs text-muted-foreground">
                    Version v1.0-beta
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 min-w-0 bg-background" style={{ backgroundImage: 'none' }}>
                <div className="container max-w-4xl mx-auto px-6 py-10 md:py-16">
                    <div className="flex items-center justify-end mb-4">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                            className="h-8 w-8"
                        >
                            {isSidebarOpen ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                        </Button>
                    </div>
                    <Outlet />

                    {/* Footer Navigation (Next/Prev) can be added here later */}
                    <div className="mt-20 pt-10 border-t border-border flex justify-between text-sm text-muted-foreground">
                        <p>© 2026 Kubegram. All rights reserved.</p>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default DocsLayout;
