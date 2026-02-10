import React from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { Book, Menu, X, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const docsNav = [
    { title: 'Introduction', path: '/docs' },
    { title: 'Getting Started', path: '/docs/getting-started' },
    { title: 'Architecture', path: '/docs/architecture' },
    { title: 'Agent Integration', path: '/docs/agents_integration' },
    { title: 'Use Your Tools', path: '/docs/use_your_tools' },
    { title: 'Contributing', path: '/docs/contributing' },
    { title: 'API Reference', path: '/docs/api' },
];

const DocsSidebar = ({ onItemClick }: { onItemClick?: () => void }) => {

    return (
        <nav className="space-y-1 py-4">
            {docsNav.map((item) => (
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
    const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);

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
                    <DocsSidebar onItemClick={() => setIsMobileMenuOpen(false)} />
                </div>
            )}

            {/* Desktop Sidebar */}
            <aside className="hidden md:flex w-72 flex-col border-r border-border h-screen sticky top-0 bg-background z-30">
                <div className="p-6 border-b border-border/40">
                    <div className="flex items-center gap-2 font-bold text-xl">
                        {/* Logo placeholder */}
                        <div className="h-8 w-8 rounded-md bg-primary text-primary-foreground flex items-center justify-center">
                            <Book className="h-5 w-5" />
                        </div>
                        <span className="tracking-tight">Kubegram</span>
                    </div>
                    <div className="mt-4 relative">
                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input placeholder="Search" className="pl-8 h-9 bg-muted/50 border-transparent focus:bg-background transition-all" />
                    </div>
                </div>
                <div className="flex-1 overflow-y-auto py-4">
                    <DocsSidebar />
                </div>
                <div className="p-4 border-t border-border/40 text-xs text-muted-foreground">
                    Version 2.0.0
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 min-w-0 bg-background" style={{ backgroundImage: 'none' }}>
                <div className="container max-w-4xl mx-auto px-6 py-10 md:py-16">
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
