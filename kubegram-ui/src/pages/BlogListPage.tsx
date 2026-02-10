import React from 'react';
import { Link } from 'react-router-dom';
import { Calendar, User } from 'lucide-react';

// Hardcoded posts for now - could be moved to a separate config file
const posts = [
    {
        id: 'welcome',
        title: 'Welcome to Kubegram',
        excerpt: 'Introducing the future of Kubernetes infrastructure design. Learn how Kubegram simplifies cluster management through visual architecture.',
        date: 'January 24, 2026',
        author: 'Kubegram Team',
        readTime: '3 min read',
        tags: ['Announcement', 'Kubernetes'],
        slug: 'welcome'
    }
];

const BlogListPage: React.FC = () => {
    return (
        <div className="space-y-12">
            <div className="text-center space-y-4 mb-16">
                <h1 className="text-4xl md:text-5xl font-bold tracking-tight">Engineering Blog</h1>
                <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                    Thoughts, tutorials, and updates from the Kubegram team.
                </p>
            </div>

            <div className="grid gap-8">
                {posts.map((post) => (
                    <article
                        key={post.id}
                        className="group relative flex flex-col space-y-3 p-6 rounded-3xl border border-border bg-card/30 hover:bg-card/50 transition-colors"
                    >
                        <div className="flex items-center gap-4 text-sm text-muted-foreground mb-2">
                            <span className="flex items-center gap-1">
                                <Calendar className="h-4 w-4" />
                                {post.date}
                            </span>
                            <span className="flex items-center gap-1">
                                <User className="h-4 w-4" />
                                {post.author}
                            </span>
                        </div>

                        <h2 className="text-2xl font-bold group-hover:text-primary transition-colors">
                            <Link to={`/blog/${post.slug}`} className="absolute inset-0">
                                <span className="sr-only">View Article</span>
                            </Link>
                            {post.title}
                        </h2>

                        <p className="text-muted-foreground leading-relaxed">
                            {post.excerpt}
                        </p>

                        <div className="flex gap-2 pt-4">
                            {post.tags.map(tag => (
                                <span key={tag} className="inline-flex items-center rounded-full border border-primary/20 bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2">
                                    {tag}
                                </span>
                            ))}
                            <span className="ml-auto text-sm text-muted-foreground">{post.readTime}</span>
                        </div>
                    </article>
                ))}
            </div>
        </div>
    );
};

export default BlogListPage;
