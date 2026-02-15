import React from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Menu, X, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const categories = [
    { id: 'getting-started', title: 'Getting Started', defaultPath: '/docs', paths: ['/docs', '/docs/getting-started', '/docs/key-concepts'] },
    { id: 'architecture', title: 'Architecture', defaultPath: '/docs/architecture', paths: ['/docs/architecture', '/docs/canvas', '/docs/visual-designer'] },
    { id: 'ai-orchestration', title: 'AI Orchestration', defaultPath: '/docs/agents_integration', paths: ['/docs/agents_integration', '/docs/use_your_tools', '/docs/mcp-integration', '/docs/code-view', '/docs/compare-view', '/docs/visual-designer'] },
    { id: 'deployment', title: 'Deployment', defaultPath: '/docs/local-setup', paths: ['/docs/local-setup', '/docs/production-deploy'] },
    { id: 'reference', title: 'Reference', defaultPath: '/docs/api', paths: ['/docs/api', '/docs/contributing'] },
];

const docsNav = [
    { title: 'Introduction', path: '/docs' },
    { title: 'Getting Started', path: '/docs/getting-started' },
    { title: 'Key Concepts', path: '/docs/key-concepts' },
    { title: 'Architecture', path: '/docs/architecture' },
    { title: 'Canvas', path: '/docs/canvas' },
    { title: 'Visual Designer', path: '/docs/visual-designer' },
    { title: 'Agent Integration', path: '/docs/agents_integration' },
    { title: 'Use Your Tools', path: '/docs/use_your_tools' },
    { title: 'MCP Integration', path: '/docs/mcp-integration' },
    { title: 'Code View', path: '/docs/code-view' },
    { title: 'Compare View', path: '/docs/compare-view' },
    { title: 'Local Setup', path: '/docs/local-setup' },
    { title: 'Production Deploy', path: '/docs/production-deploy' },
    { title: 'API Reference', path: '/docs/api' },
    { title: 'Contributing', path: '/docs/contributing' },
];

const DocsSidebar = ({ navItems, onItemClick }: { navItems: typeof docsNav; onItemClick?: () => void }) => {

    return (
        <nav className="space-y-1 py-4">
            {navItems.map((item) => (
                <NavLink
                    key={item.path}
                    to={item.path}
                    end={item.path === '/docs'}
                    onClick={onItemClick}
                    className={({ isActive }) => {
                        return `group flex items-center gap-3 px-4 py-2 text-sm font-medium transition-colors border-l-4 ${isActive
                            ? 'border-primary text-primary bg-primary/5'
                            : 'border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground/20'
                            }`
                    }}
                >
                    <span className="truncate">{item.title}</span>
                </NavLink>
            ))}
        </nav>
    );
};

const DocsLayout: React.FC = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);
    const [isSidebarOpen, setIsSidebarOpen] = React.useState(() => {
        const saved = localStorage.getItem('docs-sidebar-open');
        return saved !== null ? JSON.parse(saved) : true;
    });

    React.useEffect(() => {
        localStorage.setItem('docs-sidebar-open', JSON.stringify(isSidebarOpen));
    }, [isSidebarOpen]);

    const activeCategory = categories.find(c => c.paths.some(p => location.pathname === p))?.id || 'getting-started';
    const currentCategory = categories.find(c => c.id === activeCategory)!;
    const filteredDocsNav = docsNav.filter(doc => currentCategory.paths.includes(doc.path));

    // FastAPI Purple Theme overrides
    const themeOverrides = {
        '--primary': '266 43% 47%', // #7a44ac converted to HSL roughly or just use hex if supported by tailwind vars config. 
        // Tailwind 4 (if used) or standard tailwind uses generic vars. 
        // Since the user asked for #7a44ac, let's inject it directly into the style if possible, 
        // OR better yet, just use inline styles for the provider using the specific color.
        // But wait, the tailwind config uses oklch. 
        // #7a44ac in oklch is approx oklch(0.407 0.165 290.62)
        // Let's try setting the variable directly as the hex/oklch string expected by the CSS.
        // Looking at index.css: --primary: oklch(0.21 0.006 285.885);
        // We will override this.
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
                    <span className="text-primary">FastAPI Style</span>
                    <span>Docs</span>
                </div>
                <Button variant="ghost" size="icon" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
                    {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                </Button>
            </div>

            {/* Mobile Sidebar Overlay */}
            {isMobileMenuOpen && (
                <div className="fixed inset-0 z-40 bg-background/95 md:hidden pt-20 px-6 overflow-y-auto">
                    <DocsSidebar navItems={filteredDocsNav} onItemClick={() => setIsMobileMenuOpen(false)} />
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
                    <div className="mt-4 relative">
                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input placeholder="Search" className="pl-8 h-9 bg-muted/50 border-transparent focus:bg-background transition-all" />
                    </div>
                </div>

                {/* Category Tabs */}
                <div className="px-3 py-3 border-b border-border/40">
                    <div className="flex flex-wrap gap-1">
                        {categories.map((category) => (
                            <button
                                key={category.id}
                                onClick={() => navigate(category.defaultPath)}
                                className={`px-2 py-1.5 text-xs font-medium rounded-md transition-colors ${
                                    activeCategory === category.id
                                        ? 'bg-primary text-primary-foreground'
                                        : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                                }`}
                            >
                                {category.title}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto py-4">
                    <DocsSidebar navItems={filteredDocsNav} />
                </div>
                <div className="p-4 border-t border-border/40 text-xs text-muted-foreground">
                    Version 2.0.0
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
                        <p>© 2026 Kubegram UI</p>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default DocsLayout;
