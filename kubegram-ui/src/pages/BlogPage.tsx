import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import { useParams } from 'react-router-dom';
import Mermaid from '@/components/Mermaid';

const BlogPage: React.FC = () => {
    const { slug } = useParams();
    const [content, setContent] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    useEffect(() => {
        if (!slug) return;

        fetch(`/blog/${slug}.md`)
            .then((res) => {
                if (res.ok) return res.text();
                throw new Error('Post not found');
            })
            .then((text) => {
                setContent(text);
                setLoading(false);
            })
            .catch((err) => {
                console.error(err);
                setError(true);
                setLoading(false);
            });
    }, [slug]);

    if (loading) {
        return <div className="flex justify-center py-20 px-4">Loading article...</div>;
    }

    if (error) {
        return (
            <div className="text-center py-20 px-4">
                <h1 className="text-2xl font-bold mb-4">Article not found</h1>
                <p className="text-muted-foreground">The requested blog post doesn't exist.</p>
            </div>
        );
    }

    return (
        <article className="prose prose-lg prose-invert max-w-none prose-headings:text-foreground prose-p:text-muted-foreground prose-strong:text-foreground prose-code:text-primary prose-a:text-primary hover:prose-a:underline">
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
                        <figure className="my-12">
                            <img
                                src={src}
                                alt={alt}
                                className="rounded-xl shadow-lg border border-border w-full"
                            />
                            {alt && <figcaption className="text-center text-sm text-muted-foreground mt-4">{alt}</figcaption>}
                        </figure>
                    )
                }}
            >
                {content}
            </ReactMarkdown>
        </article>
    );
};

export default BlogPage;
