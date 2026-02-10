import React from 'react';

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
                <div className="aspect-square rounded-3xl overflow-hidden bg-card/30 border border-white/10 flex items-center justify-center relative group">
                    {/* Placeholder for Founder Image - You can replace this with an actual image */}
                    <div className="absolute inset-0 bg-gradient-to-tr from-purple-500/20 to-blue-500/20 group-hover:opacity-75 transition-opacity" />
                    <span className="text-6xl">👨‍💻</span>
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
                        {/* Social Links placeholders */}
                        <a href="https://github.com/salehshehata" target="_blank" rel="noreferrer" className="text-muted-foreground hover:text-white transition-colors">GitHub</a>
                        <a href="#" className="text-muted-foreground hover:text-white transition-colors">LinkedIn</a>
                        <a href="#" className="text-muted-foreground hover:text-white transition-colors">Twitter</a>
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
