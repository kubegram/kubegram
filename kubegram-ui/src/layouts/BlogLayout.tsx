import React from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

const BlogLayout: React.FC = () => {
    return (
        <div className="min-h-screen bg-background text-foreground flex flex-col">
            {/* Blog Header */}
            <header className="border-b border-border bg-background/80 backdrop-blur-md sticky top-0 z-50">
                <div className="container mx-auto px-4 py-4 flex items-center justify-between">
                    <NavLink to="/" className="flex items-center gap-2 font-bold text-lg hover:text-primary transition-colors">
                        <ArrowLeft className="h-5 w-5" />
                        <span>Back to Home</span>
                    </NavLink>
                    <div className="font-bold text-primary text-xl">Kubegram Blog</div>
                    <div className="w-24"></div> {/* Spacer for centering if needed */}
                </div>
            </header>

            {/* Main Content */}
            <main className="flex-1 container max-w-4xl mx-auto px-4 py-12">
                <Outlet />
            </main>

            {/* Blog Footer */}
            <footer className="py-12 border-t border-border mt-12 bg-card/10">
                <div className="container mx-auto px-4 text-center text-muted-foreground">
                    <p>© 2026 Kubegram. All rights reserved.</p>
                </div>
            </footer>
        </div>
    );
};

export default BlogLayout;
