import React from 'react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { useReleaseStatus } from '@/hooks/useReleaseStatus';

const LandingPage: React.FC = () => {
    const navigate = useNavigate();
    const { isReleased, isLoading } = useReleaseStatus();

    return (
        <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
            {/* Navigation */}
            <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
                <div className="container mx-auto px-6 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <img src="/logo.png" alt="Kubegram" className="h-10 w-auto" />
                    </div>
                    <div className="flex items-center gap-4">
                        {isReleased && (
                            <>
                                <Button variant="ghost" onClick={() => {
                                    // Trigger login modal instead of navigating
                                    window.dispatchEvent(new CustomEvent('triggerLoginModal'));
                                }}>Login</Button>
                                <Button onClick={() => navigate('/app')}>Get Started</Button>
                            </>
                        )}
                    </div>
                </div>
            </nav>


            {/* Hero Section */}
            <section className="relative mt-0 pt-32 pb-32 overflow-hidden min-h-[900px] flex items-center">
                <div className="absolute inset-0 z-0">
                    <img src="/intro_background.svg" alt="Background" className="w-full h-full object-cover object-top opacity-100" />
                    <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/20 to-background"></div>
                </div>
                <div className="container mx-auto px-6 relative z-10 text-center">
                    <div className="inline-block mb-8">
                        <img src="/favicon.svg" alt="Kubegram" className="h-24 w-auto mx-auto animate-float drop-shadow-2xl" />
                    </div>
                    <h1 className="text-6xl md:text-8xl font-bold mb-8 tracking-tighter leading-tight">
                        Kubernetes Made <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-500 to-purple-600">Effortless</span>
                    </h1>
                    <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto mb-12 leading-relaxed">
                        Design infrastructure visually. Deploy it instantly. <br className="hidden md:block" />
                        Master Kubernetes without the complexity.
                    </p>
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
                        <Button
                            size="lg"
                            disabled={!isReleased}
                            className="text-lg px-10 py-7 rounded-full bg-purple-600 hover:bg-purple-700 shadow-[0_0_30px_-5px_rgba(147,51,234,0.5)] transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-purple-600 disabled:hover:scale-100 disabled:shadow-none"
                            onClick={() => navigate('/app')}
                        >
                            Start Designing Now
                        </Button>
                        <Button
                            size="lg"
                            variant="outline"
                            className="text-lg px-10 py-7 rounded-full border-purple-500/30 hover:bg-purple-500/10 transition-all duration-300 hover:scale-105"
                            onClick={() => navigate('/docs')}
                        >
                            View Documentation
                        </Button>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section className="py-20 bg-background">
                <div className="container mx-auto px-6">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl md:text-4xl font-bold mb-4">Design Infrastructure Visually</h2>
                        <p className="text-xl text-muted-foreground">Everything you need to build production-ready clusters.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                        {/* Feature 1 */}
                        <div className="p-8 rounded-3xl bg-card/30 backdrop-blur-sm border border-white/10 hover:border-purple-500/50 transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 group">
                            <div className="h-14 w-14 bg-purple-500/20 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                                <img src="/pen_icon.svg" alt="Design" className="h-7 w-7" />
                            </div>
                            <h3 className="text-xl font-bold mb-3">Visual Design</h3>
                            <p className="text-muted-foreground leading-relaxed">Drag and drop nodes to architect your infrastructure as you envision it.</p>
                        </div>

                        {/* Feature 2 */}
                        <div className="p-8 rounded-3xl bg-card/30 backdrop-blur-sm border border-white/10 hover:border-purple-500/50 transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 group">
                            <div className="h-14 w-14 bg-pink-500/20 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                                <img src="/share_icon.svg" alt="Collaborate" className="h-7 w-7" />
                            </div>
                            <h3 className="text-xl font-bold mb-3">Collaborate</h3>
                            <p className="text-muted-foreground leading-relaxed">Share your infrastructure designs with your team in real-time.</p>
                        </div>

                        {/* Feature 3 */}
                        <div className="p-8 rounded-3xl bg-card/30 backdrop-blur-sm border border-white/10 hover:border-purple-500/50 transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 group">
                            <div className="h-14 w-14 bg-blue-500/20 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                                <img src="/design_to_code_icon.svg" alt="Code Gen" className="h-7 w-7" />
                            </div>
                            <h3 className="text-xl font-bold mb-3">Code Generation</h3>
                            <p className="text-muted-foreground leading-relaxed">Automatically update your design into production-ready code.</p>
                        </div>

                        {/* Feature 4 */}
                        <div className="p-8 rounded-3xl bg-card/30 backdrop-blur-sm border border-white/10 hover:border-purple-500/50 transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 group">
                            <div className="h-14 w-14 bg-green-500/20 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                                <img src="/sync_icon.svg" alt="Sync" className="h-7 w-7" />
                            </div>
                            <h3 className="text-xl font-bold mb-3">Always Synced</h3>
                            <p className="text-muted-foreground leading-relaxed">Keep your design and code in perfect sync with GitOps.</p>
                        </div>
                    </div>
                </div>
            </section>



            {/* Middle Section: Integrations & Ecosystem */}
            <section className="py-20 bg-background mb-32">
                <div className="container mx-auto px-6 space-y-32">

                    {/* Works Where Your Developers Work */}
                    <div className="text-center mb-16">
                        <h2 className="text-3xl md:text-5xl font-bold mb-12">Works Where Your Developers Work</h2>
                        <div className="bg-[#1A1A1A] rounded-3xl p-12 flex flex-col md:flex-row items-center justify-between gap-12 border border-white/5">
                            <div className="text-left max-w-xl">
                                <p className="text-lg text-muted-foreground leading-relaxed">
                                    Kubegram integrates natively with your favorite AI-assisted IDE<br />
                                    whether in the browser or through official Kubegram extensions<br />
                                    ensuring a smooth, familiar experience for your development team
                                </p>
                            </div>
                            <div className="flex items-center gap-12 opacity-90">
                                <img src="/antigravity icon.svg" alt="Antigravity" className="h-12 w-12 hover:scale-110 transition-transform duration-300" />
                                <img src="/vs _icon.svg" alt="VS Code" className="h-12 w-12 hover:scale-110 transition-transform duration-300" />
                                <img src="/cursor_icon.svg" alt="Cursor" className="h-12 w-12 hover:scale-110 transition-transform duration-300" />
                                <img src="/windsurf_icon.svg" alt="Windsurf" className="h-12 w-12 hover:scale-110 transition-transform duration-300" />
                            </div>
                        </div>
                    </div>

                    {/* Plug In to Your Existing DevOps Ecosystem */}
                    <div className="flex flex-col md:flex-row items-center justify-between gap-16">
                        <div className="md:w-1/2 text-left">
                            <h2 className="text-3xl md:text-4xl font-bold mb-8">Plug In to Your Existing DevOps Ecosystem</h2>
                            <div className="space-y-6 text-muted-foreground text-lg leading-relaxed">
                                <p>
                                    Kubegram works seamlessly with your existing GitOps and observability stack. It integrates with
                                    leading CD tools like Flux CD and Argo CD, as well as popular monitoring platforms such as
                                    Datadog and Grafana - while still giving you the flexibility to bring your own tooling
                                </p>
                                <p>
                                    Kubegram also simplifies the setup of Flux or Argo across your clusters, handling the installation and
                                    configuration for you and eliminating the usual deployment and maintenance headaches.
                                </p>
                            </div>
                        </div>
                        <div className="md:w-1/2 flex justify-center">
                            <img src="/argo_pigeon.svg" alt="ArgoCD & Flux" className="w-[400px] h-auto drop-shadow-2xl animate-float-slow" />
                        </div>
                    </div>

                    {/* Deploy Anywhere Your Kubernetes Runs */}
                    <div className="flex flex-col md:flex-row-reverse items-center justify-between gap-16">
                        <div className="md:w-1/2 text-left">
                            <h2 className="text-3xl md:text-4xl font-bold mb-8">Deploy Anywhere Your Kubernetes Runs</h2>
                            <div className="space-y-6 text-muted-foreground text-lg leading-relaxed">
                                <p>
                                    Kubegram works seamlessly across the most popular managed Kubernetes platforms
                                    including Amazon EKS and Google Kubernetes Engine and can just as easily be
                                    deployed on your own in-house or self-managed Kubernetes clusters.
                                </p>
                                <p>
                                    Wherever your infrastructure lives, Kubegram meets you there
                                </p>
                            </div>
                        </div>
                        <div className="md:w-1/2 flex justify-center">
                            <div className="relative">
                                {/* Simulating the laptop/screen container from the reference if needed, 
                                    or using the image directly if it contains the frame. 
                                    Assuming eks_gke.svg acts as the visual representation. */}
                                <img src="/eks_gke.svg" alt="EKS & GKE" className="w-[400px] h-auto drop-shadow-2xl" />
                            </div>
                        </div>
                    </div>

                </div>
            </section>

            {/* Pricing Section */}
            <section className="py-20 relative overflow-hidden bg-background">
                <div className="absolute top-0 left-0 right-0 z-0 h-[600px] pointer-events-none">
                    <img src="/pricing_background.svg" alt="Background" className="w-full h-full object-cover object-top opacity-100" />
                </div>

                <div className="container mx-auto px-6 relative z-10">
                    {!isLoading && (
                        !isReleased ? (
                            // PRE-RELEASE STATE
                            <div className="flex flex-col items-center max-w-6xl mx-auto pt-32">
                                <div className="bg-black/90 border-2 border-primary rounded-3xl p-8 flex flex-col items-center text-center relative shadow-2xl shadow-primary/20 w-full max-w-md transform hover:scale-105 transition-all duration-300">
                                    <div className="absolute -top-3 bg-primary text-black text-xs font-bold px-4 py-1.5 rounded-full uppercase tracking-wider">Coming soon</div>
                                    <div className="text-2xl font-bold mb-6 text-primary animate-pulse">Going open source in a week</div>
                                    <p className="text-sm text-gray-400 mb-8 leading-relaxed">Join our community and get ready for the launch. Read our comprehensive documentation while you wait.</p>
                                    <Button className="w-full text-lg py-6 rounded-xl hover:shadow-[0_0_20px_-5px_rgba(147,51,234,0.5)] transition-all duration-300" onClick={() => navigate('/docs')}>Read Docs</Button>
                                </div>
                            </div>
                        ) : (
                            // RELEASED STATE
                            <>
                                <div className="text-center mb-16 pt-20">
                                    <h2 className="text-3xl md:text-5xl font-bold mb-4">Plans that fit all</h2>
                                    <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                                        Whether you're a startup testing the waters or an enterprise managing complex infrastructure at scale,
                                        Kubegram offers flexible pricing to match your needs.
                                    </p>
                                </div>
                                <div className="flex flex-col items-center max-w-6xl mx-auto">
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 w-full pt-10">
                                        {/* Hobbyist */}
                                        <div className="bg-transparent border border-white/10 rounded-3xl p-8 flex flex-col items-center text-center hover:bg-card/10 transition-all duration-300 hover:-translate-y-2">
                                            <h3 className="text-xl font-bold mb-3">Hobbyist</h3>
                                            <div className="text-4xl font-bold mb-4 text-white">$20<span className="text-lg font-normal text-muted-foreground">/mo</span></div>
                                            <p className="text-sm text-muted-foreground mb-8">Perfect for developers with pet projects.</p>
                                            <Button variant="outline" className="w-full rounded-xl border-white/10 hover:bg-white/5">Choose Hobbyist</Button>
                                        </div>

                                        {/* Pro */}
                                        <div className="bg-black/80 backdrop-blur-xl border-2 border-primary rounded-3xl p-8 flex flex-col items-center text-center relative transform md:-translate-y-4 shadow-2xl shadow-primary/20 hover:scale-[1.02] transition-all duration-300 z-10">
                                            <div className="absolute -top-3 bg-primary text-black text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">Most Popular</div>
                                            <h3 className="text-xl font-bold mb-3 text-white">Pro</h3>
                                            <div className="text-4xl font-bold mb-4 text-white">$45<span className="text-lg font-normal text-muted-foreground">/mo</span></div>
                                            <p className="text-sm text-gray-400 mb-8">For freelancers and consultants delivering quality work.</p>
                                            <Button className="w-full rounded-xl py-6 bg-primary hover:bg-primary/90 text-lg shadow-lg hover:shadow-primary/25">Choose Pro</Button>
                                        </div>

                                        {/* Team */}
                                        <div className="bg-card/20 backdrop-blur-md border border-primary/30 rounded-3xl p-8 flex flex-col items-center text-center hover:bg-card/30 transition-all duration-300 hover:-translate-y-2">
                                            <h3 className="text-xl font-bold mb-3 text-primary-foreground">Team</h3>
                                            <div className="text-4xl font-bold mb-4 text-white"><span className="text-xl align-top mr-1">from</span>$100<span className="text-lg font-normal text-muted-foreground">/mo</span></div>
                                            <p className="text-sm text-muted-foreground mb-8">Teams or companies (10+ people) scaling up.</p>
                                            <Button variant="outline" className="w-full rounded-xl border-primary/30 hover:bg-primary/10 hover:border-primary/50">Choose Team</Button>
                                        </div>

                                        {/* Enterprise */}
                                        <div className="bg-purple-900/10 backdrop-blur-md border border-purple-500/20 rounded-3xl p-8 flex flex-col items-center text-center hover:bg-purple-900/20 transition-all duration-300 hover:-translate-y-2">
                                            <h3 className="text-xl font-bold mb-3 text-purple-200">Enterprise</h3>
                                            <div className="text-4xl font-bold mb-4 text-white"><span className="text-xl align-top mr-1">from</span>$400<span className="text-lg font-normal text-muted-foreground">/mo</span></div>
                                            <p className="text-sm text-muted-foreground mb-8">Large teams with custom security requirements.</p>
                                            <Button variant="outline" className="w-full rounded-xl border-purple-500/20 hover:bg-purple-500/10 hover:border-purple-500/50 hover:text-purple-200">Contact Us</Button>
                                        </div>
                                    </div>
                                </div>
                            </>
                        )
                    )}

                    {isReleased && (
                        <div className="mt-16 flex flex-col sm:flex-row justify-center gap-8">
                            <div className="bg-card/50 border border-border p-8 rounded-2xl w-full max-w-sm text-center">
                                <h3 className="text-xl font-bold mb-2">Free Trial</h3>
                            </div>
                            <div className="bg-card/50 border border-border p-8 rounded-2xl w-full max-w-sm text-center">
                                <h3 className="text-xl font-bold mb-2">Pay as you go</h3>
                            </div>
                        </div>
                    )}

                </div>
            </section>

            {/* Footer */}
            <footer className="py-12 bg-black border-t border-gray-900">
                <div className="container mx-auto px-6 grid grid-cols-1 md:grid-cols-3 items-center gap-6 md:gap-0">
                    {/* Left: Copyright */}
                    <div className="text-center md:text-left order-2 md:order-1">
                        <p className="text-gray-500 text-sm">© 2026 Kubegram. All rights reserved.</p>
                    </div>

                    {/* Center: Logo */}
                    <div className="flex justify-center order-1 md:order-2">
                        <img src="/logo.png" alt="Logo" className="h-12 w-12 opacity-50" />
                    </div>

                    {/* Right: About Link */}
                    <div className="text-center md:text-right order-3 flex flex-col items-center md:items-end gap-2">
                        <button onClick={() => navigate('/about')} className="text-sm text-muted-foreground hover:text-white transition-colors">About the Founders</button>
                        <button onClick={() => navigate('/blog')} className="text-sm text-muted-foreground hover:text-white transition-colors">The Kubegram Blog</button>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default LandingPage;
