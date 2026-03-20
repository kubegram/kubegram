import React from 'react';

const GitHubIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z"/>
    </svg>
);

const LinkedInIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
    </svg>
);

const AboutPage: React.FC = () => {
    return (
        <div className="container mx-auto px-6 py-20 max-w-4xl">
            <div className="text-center mb-16">
                <h1 className="text-4xl md:text-5xl font-bold mb-6 text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-500 to-purple-600 pb-2">About us</h1>
                <p className="text-xl text-muted-foreground leading-relaxed">
                    Building the future of infrastructure design, one node at a time.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center mb-20">
                <div className="aspect-square rounded-3xl overflow-hidden bg-card/30 border border-white/10 relative group">
                    <img src="/profile.JPG" alt="Saleh Shehata" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-tr from-purple-500/20 to-blue-500/20 opacity-0 group-hover:opacity-75 transition-opacity" />
                </div>
                <div className="space-y-6">
                    <div>
                        <h2 className="text-3xl font-bold mb-2">Saleh Shehata</h2>
                        <h3 className="text-primary text-xl font-medium">Co-Founder & CTO</h3>
                    </div>
                    <p className="text-muted-foreground text-lg leading-relaxed">
                        Passionate about simplifying complex distributed systems. With a background in cloud engineering and full-stack development, Saleh leads the technical vision of Kubegram, ensuring that powerful infrastructure tools remain accessible and intuitive.
                    </p>
                    <div className="flex gap-4 pt-4">
                        <a href="https://github.com/shehats" target="_blank" rel="noreferrer" className="text-muted-foreground hover:text-white transition-colors" aria-label="GitHub">
                            <GitHubIcon />
                        </a>
                        <a href="https://www.linkedin.com/in/salehshehata/" target="_blank" rel="noreferrer" className="text-muted-foreground hover:text-white transition-colors" aria-label="LinkedIn">
                            <LinkedInIcon />
                        </a>
                    </div>
                </div>
            </div>

            {/* Mission Section */}
            <div className="bg-card/10 border border-white/5 rounded-3xl p-10 mt-20 text-center relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-purple-500/5 to-blue-500/5" />
                <div className="relative z-10">
                    <h2 className="text-3xl font-bold mb-6">Our Mission</h2>
                    <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                        We believe that Kubernetes is the operating system of the cloud, but it shouldn't require a PhD to operate.
                        Our mission is to democratize access to scalable infrastructure by bridging the gap between visual design and production-grade code.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default AboutPage;
