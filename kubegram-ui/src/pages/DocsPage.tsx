import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import { useLocation } from 'react-router-dom';
import Mermaid from '@/components/Mermaid';

const DocsPage: React.FC = () => {
    const [content, setContent] = useState('');
    const location = useLocation();

    useEffect(() => {
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
                setContent('# 404 Not Found\n\nThe requested documentation page could not be found.');
            });
    }, [location.pathname]);

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
