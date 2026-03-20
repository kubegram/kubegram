import React, { useState, useEffect, useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import { useLocation, Link } from 'react-router-dom';
import Mermaid from '@/components/Mermaid';
import rawDocsManifest from '@/config/docs-manifest.json';
import { FileText, Folder } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

interface NavItem {
    title: string;
    path: string;
    children?: NavItem[];
    isDirectory?: boolean;
    order?: number;
}

const sortByOrder = (items: NavItem[]): NavItem[] =>
    [...items].sort((a, b) => {
        const aHasOrder = a.order !== undefined;
        const bHasOrder = b.order !== undefined;
        if (aHasOrder && bHasOrder) return a.order! - b.order!;
        if (aHasOrder) return -1;
        if (bHasOrder) return 1;
        return a.title.localeCompare(b.title);
    });

const CategoryIndex: React.FC<{ item: NavItem }> = ({ item }) => {
    const sortedChildren = item.children ? sortByOrder(item.children) : [];
    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div>
                <h1 className="text-4xl font-bold tracking-tight mb-4">{item.title}</h1>
                <p className="text-xl text-muted-foreground">
                    Select a topic below to explore {item.title}.
                </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {sortedChildren.map((child) => (
                    <Link key={child.path} to={child.path} className="block group">
                        <Card className="h-full transition-all hover:border-primary/50 hover:shadow-md dark:hover:border-primary/50 dark:hover:bg-primary/5">
                            <CardHeader>
                                <div className="flex items-center gap-2 mb-2 text-primary/80 group-hover:text-primary transition-colors">
                                    {child.isDirectory ? <Folder className="h-5 w-5" /> : <FileText className="h-5 w-5" />}
                                    <span className="text-xs font-semibold uppercase tracking-wider">
                                        {child.isDirectory ? 'Category' : 'Document'}
                                    </span>
                                </div>
                                <CardTitle className="group-hover:text-primary transition-colors">{child.title}</CardTitle>
                                {child.isDirectory && (
                                    <CardDescription>
                                        {child.children?.length || 0} items
                                    </CardDescription>
                                )}
                            </CardHeader>
                        </Card>
                    </Link>
                ))}
            </div>
        </div>
    );
};

const DocsPage: React.FC = () => {
    const [content, setContent] = useState('');
    const location = useLocation();
    const [isLoading, setIsLoading] = useState(false);

    // Flatten manifest helper or recursive search
    const currentItem = useMemo(() => {
        // Remove trailing slash if present (except root)
        const currentPath = location.pathname.endsWith('/') && location.pathname !== '/'
            ? location.pathname.slice(0, -1)
            : location.pathname;

        // If root docs path, maybe return a root object or handle specifically
        if (currentPath === '/docs') {
            // Return a virtual root item containing top-level manifest items
            return {
                title: 'Documentation',
                path: '/docs',
                isDirectory: true,
                children: rawDocsManifest
            } as NavItem;
        }

        const findItem = (items: NavItem[]): NavItem | undefined => {
            for (const item of items) {
                if (item.path === currentPath) return item;
                if (item.children) {
                    const found = findItem(item.children);
                    if (found) return found;
                }
            }
        };
        return findItem(rawDocsManifest as NavItem[]);
    }, [location.pathname]);

    useEffect(() => {
        // If it's a directory, we don't fetch markdown (unless we want a README.md inside?)
        // For now, if isDirectory is true, we just respect that and don't fetch.
        // But if currentItem is undefined (e.g. direct link to .md not in manifest?), we fallback to fetch.

        if (currentItem?.isDirectory) {
            setContent('');
            return;
        }

        setIsLoading(true);
        // Determines the file to load based on the path
        const path = location.pathname === '/docs' ? '/docs/intro.md' : `${location.pathname}.md`;

        // In a real app, this might come from a CMS or import, 
        // but fetching from public folder is good for this setup.
        fetch(path)
            .then((res) => {
                if (res.ok) return res.text();
                throw new Error('File not found');
            })
            .then((text) => setContent(text))
            .catch((err) => {
                console.error(err);
                if (!currentItem?.isDirectory) {
                    setContent('# 404 Not Found\n\nThe requested documentation page could not be found.');
                }
            })
            .finally(() => setIsLoading(false));
    }, [location.pathname, currentItem]);

    if (currentItem?.isDirectory) {
        return <CategoryIndex item={currentItem} />;
    }

    if (isLoading) {
        return <div className="animate-pulse space-y-4">
            <div className="h-8 bg-muted rounded w-3/4"></div>
            <div className="h-4 bg-muted rounded w-full"></div>
            <div className="h-4 bg-muted rounded w-5/6"></div>
        </div>;
    }

    return (
        <div>
            <div className="prose dark:prose-invert max-w-none prose-headings:scroll-mt-20 prose-headings:font-bold prose-h1:text-4xl prose-h2:text-2xl prose-h2:border-b prose-h2:pb-2 prose-h2:mt-10 prose-a:text-primary prose-a:no-underline hover:prose-a:underline prose-code:text-primary prose-code:bg-muted/30 prose-code:px-1 prose-code:py-0.5 prose-code:rounded-md prose-code:before:content-none prose-code:after:content-none prose-pre:bg-muted/50 prose-pre:border prose-pre:border-border">
                <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    rehypePlugins={[rehypeRaw]}
                    components={{
                        code({ node, inline, className, children, ...props }: any) {
                            const match = /language-(\w+)/.exec(className || '');
                            if (!inline && match && match[1] === 'mermaid') {
                                return <Mermaid chart={String(children).replace(/\n$/, '')} />;
                            }
                            return (
                                <code className={className} {...props}>
                                    {children}
                                </code>
                            );
                        },
                        img: ({ src, alt }) => (
                            <img
                                src={src}
                                alt={alt}
                                className="rounded-xl shadow-lg border border-border my-8 w-full"
                            />
                        )
                    }}
                >
                    {content}
                </ReactMarkdown>
            </div>
        </div>
    );
};

export default DocsPage;
