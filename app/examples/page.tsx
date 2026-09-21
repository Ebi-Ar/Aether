'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, MoveUpRight, LayoutGrid, Sparkles, Filter, Zap, Globe, Command, ChevronRight, ShoppingCart } from 'lucide-react';

// Extend Window interface for dynamically loaded GSAP libraries
declare global {
    interface Window {
        gsap: any;
        ScrollTrigger: any;
    }
}

const App = () => {
    const [gsapLoaded, setGsapLoaded] = useState(false);
    const [activeTab, setActiveTab] = useState('All');
    const mainRef = useRef(null);
    const gridRef = useRef(null);

    useEffect(() => {
        const loadGSAP = async () => {
            const loadScript = (src: string) => {
                return new Promise((resolve, reject) => {
                    const script = document.createElement('script');
                    script.src = src;
                    script.onload = resolve;
                    script.onerror = reject;
                    document.head.appendChild(script);
                });
            };

            try {
                await loadScript('https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.2/gsap.min.js');
                await loadScript('https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.2/ScrollTrigger.min.js');
                setGsapLoaded(true);
            } catch (error) {
                console.error("GSAP load failed", error);
            }
        };

        loadGSAP();
    }, []);

    useEffect(() => {
        if (!gsapLoaded || !window.gsap) return;

        const gsap = window.gsap;
        const ScrollTrigger = window.ScrollTrigger;
        gsap.registerPlugin(ScrollTrigger);

        const ctx = gsap.context(() => {
            // 1. Hero Text Entrance (Framer Style Stagger)
            gsap.from(".hero-text", {
                y: 60,
                opacity: 0,
                rotateX: -15,
                stagger: 0.1,
                duration: 1.2,
                ease: "power4.out",
                delay: 0.2
            });

            // 2. Grid Items Entry
            gsap.from(".template-card", {
                scale: 0.9,
                opacity: 0,
                y: 40,
                stagger: 0.05,
                duration: 0.8,
                ease: "back.out(1.7)",
                scrollTrigger: {
                    trigger: gridRef.current,
                    start: "top 80%"
                }
            });

            // 3. Floating Button Magnetic Effect (Global)
            const buttons = gsap.utils.toArray('.magnetic-btn');
            buttons.forEach((btn: any) => {
                btn.addEventListener('mousemove', (e: MouseEvent) => {
                    const rect = btn.getBoundingClientRect();
                    const x = e.clientX - rect.left - rect.width / 2;
                    const y = e.clientY - rect.top - rect.height / 2;
                    gsap.to(btn, { x: x * 0.4, y: y * 0.4, duration: 0.3, ease: "power2.out" });
                });
                btn.addEventListener('mouseleave', () => {
                    gsap.to(btn, { x: 0, y: 0, duration: 0.5, ease: "elastic.out(1, 0.3)" });
                });
            });

        }, mainRef);

        return () => ctx.revert();
    }, [gsapLoaded]);

    // Simulated Filtering Transition
    useEffect(() => {
        if (!gsapLoaded || !window.gsap) return;
        const gsap = window.gsap;

        gsap.fromTo(".template-card",
            { opacity: 0, y: 10, scale: 0.98 },
            { opacity: 1, y: 0, scale: 1, stagger: 0.03, duration: 0.5, ease: "power2.out" }
        );
    }, [activeTab, gsapLoaded]);

    const categories = ['All', 'Portfolio', 'SaaS', 'E-commerce', 'Agency'];

    const templates = [
        { name: "NOIR.BOOK", author: "NOIR Studio", price: "Live Demo", cat: "Portfolio", img: "/noir-book-preview.jpg", href: "/demos/lookbook" },
        { name: "Lens Flare Cursor", author: "Light Labs", price: "Live Demo", cat: "Agency", img: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?q=80&w=1000", href: "/demos/lens-flare" },
        { name: "Obsidian Pro", author: "Noir Studio", price: "$49", cat: "Portfolio", img: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=1000" },
        { name: "Aether SaaS", author: "CloudLabs", price: "$79", cat: "SaaS", img: "https://images.unsplash.com/photo-1635776062127-d379bfcba9f8?q=80&w=1000" },
        { name: "Croma Shop", author: "Prism", price: "$59", cat: "E-commerce", img: "https://images.unsplash.com/photo-1550684848-fac1c5b4e853?q=80&w=1000" },
        { name: "Flow Agency", author: "Kinetix", price: "$69", cat: "Agency", img: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=1000" },
        { name: "Nexus", author: "Nexus Labs", price: "$49", cat: "Portfolio", img: "https://images.unsplash.com/photo-1614850523296-d8c1af93d400?q=80&w=1000" },
        { name: "Horizon", author: "Velocity", price: "$89", cat: "SaaS", img: "https://images.unsplash.com/photo-1494438639946-1ebd1d20bf85?q=80&w=1000" },
    ];

    const filteredTemplates = activeTab === 'All' ? templates : templates.filter(t => t.cat === activeTab);

    return (
        <div ref={mainRef} className="bg-[#fcfcfc] text-[#0a0a0a] selection:bg-black selection:text-white antialiased min-h-screen font-sans overflow-x-hidden">
            {!gsapLoaded && (
                <div className="fixed inset-0 z-[100] bg-white flex items-center justify-center">
                    <div className="w-8 h-8 border-2 border-neutral-100 border-t-black rounded-full animate-spin" />
                </div>
            )}

            {/* Modern Top Nav */}
            <nav className="fixed top-14 w-full z-50 px-8 lg:px-16 py-6 flex justify-between items-center bg-white/70 backdrop-blur-xl border-b border-black/[0.03]">
                <div className="flex items-center gap-2 cursor-pointer group">
                    <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center transition-transform group-hover:rotate-12">
                        <Command size={16} className="text-white" />
                    </div>
                    <span className="text-lg font-black tracking-tighter uppercase">MARKET</span>
                </div>

                <div className="hidden lg:flex gap-10 items-center text-[11px] font-bold tracking-[0.2em] uppercase">
                    {['Discover', 'Templates', 'Designers', 'Learn'].map(item => (
                        <a key={item} href="#" className="text-neutral-400 hover:text-black transition-colors">{item}</a>
                    ))}
                    <div className="h-4 w-[1px] bg-neutral-200" />
                    <button className="flex items-center gap-2 text-neutral-400 hover:text-black transition-colors">
                        <ShoppingCart size={16} />
                        <span>(0)</span>
                    </button>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="pt-48 pb-24 px-8 lg:px-24">
                <div className="max-w-7xl mx-auto">
                    <div className="hero-text inline-flex items-center gap-2 px-3 py-1 bg-black text-white rounded-full text-[9px] font-bold tracking-widest uppercase mb-8">
                        <Sparkles size={10} fill="white" /> curated for creators
                    </div>
                    <h1 className="hero-text text-6xl lg:text-[8vw] font-black leading-[0.85] tracking-tighter uppercase mb-12">
                        World-class<br /><span className="text-neutral-300">Templates.</span>
                    </h1>
                    <p className="hero-text text-xl lg:text-3xl text-neutral-400 max-w-3xl font-medium leading-tight mb-16">
                        Everything you need to ship your next big idea faster. Optimized for performance and high-end aesthetics.
                    </p>

                    {/* Dynamic Filter Bar */}
                    <div className="hero-text flex flex-wrap gap-4 border-t border-b border-black/[0.05] py-8">
                        <div className="flex items-center gap-2 mr-6 text-neutral-400">
                            <Filter size={14} />
                            <span className="text-[10px] font-bold uppercase tracking-widest">Filters</span>
                        </div>
                        {categories.map(cat => (
                            <button
                                key={cat}
                                onClick={() => setActiveTab(cat)}
                                className={`px-6 py-2 rounded-full text-[10px] font-bold tracking-widest uppercase transition-all ${activeTab === cat ? 'bg-black text-white shadow-xl scale-105' : 'bg-neutral-100 text-neutral-400 hover:bg-neutral-200'}`}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>
                </div>
            </section>

            {/* Templates Grid */}
            <main ref={gridRef} className="px-8 lg:px-24 pb-40">
                <div className="max-w-7xl mx-auto">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-16">
                        {filteredTemplates.map((item, i) => (
                            item.href ? (
                                <Link key={i} href={item.href} className="template-card group cursor-pointer block">
                                    {/* Image Container */}
                                    <div className="relative aspect-[4/3] rounded-[2rem] bg-neutral-100 overflow-hidden mb-8 shadow-sm group-hover:shadow-2xl transition-all duration-700">
                                        <img
                                            src={item.img}
                                            className="w-full h-full object-cover transition-transform duration-[1.5s] group-hover:scale-110"
                                            alt={item.name}
                                        />
                                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-500" />

                                        {/* Floating Action Button */}
                                        <div className="absolute top-6 right-6 opacity-0 group-hover:opacity-100 translate-y-4 group-hover:translate-y-0 transition-all duration-500">
                                            <div className="magnetic-btn w-14 h-14 bg-white rounded-full shadow-2xl flex items-center justify-center text-black">
                                                <MoveUpRight size={20} />
                                            </div>
                                        </div>

                                        {/* Category Badge */}
                                        <div className="absolute bottom-6 left-6">
                                            <span className="px-4 py-1.5 bg-white/20 backdrop-blur-md rounded-full text-[9px] font-bold tracking-widest text-white uppercase border border-white/20">
                                                {item.cat}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Meta Data */}
                                    <div className="flex justify-between items-start px-2">
                                        <div>
                                            <h3 className="text-xl font-bold tracking-tight mb-1 group-hover:text-neutral-500 transition-colors">{item.name}</h3>
                                            <p className="text-[10px] font-bold text-neutral-400 tracking-[0.2em] uppercase">{item.author}</p>
                                        </div>
                                        <div className="text-right">
                                            <span className="block text-lg font-black">{item.price}</span>
                                            <span className="text-[8px] font-bold text-emerald-500 uppercase tracking-widest">Live Demo</span>
                                        </div>
                                    </div>
                                </Link>
                            ) : (
                                <div key={i} className="template-card group cursor-pointer">
                                    {/* Image Container */}
                                    <div className="relative aspect-[4/3] rounded-[2rem] bg-neutral-100 overflow-hidden mb-8 shadow-sm group-hover:shadow-2xl transition-all duration-700">
                                        <img
                                            src={item.img}
                                            className="w-full h-full object-cover transition-transform duration-[1.5s] group-hover:scale-110"
                                            alt={item.name}
                                        />
                                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-500" />

                                        {/* Floating Action Button */}
                                        <div className="absolute top-6 right-6 opacity-0 group-hover:opacity-100 translate-y-4 group-hover:translate-y-0 transition-all duration-500">
                                            <div className="magnetic-btn w-14 h-14 bg-white rounded-full shadow-2xl flex items-center justify-center text-black">
                                                <MoveUpRight size={20} />
                                            </div>
                                        </div>

                                        {/* Category Badge */}
                                        <div className="absolute bottom-6 left-6">
                                            <span className="px-4 py-1.5 bg-white/20 backdrop-blur-md rounded-full text-[9px] font-bold tracking-widest text-white uppercase border border-white/20">
                                                {item.cat}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Meta Data */}
                                    <div className="flex justify-between items-start px-2">
                                        <div>
                                            <h3 className="text-xl font-bold tracking-tight mb-1 group-hover:text-neutral-500 transition-colors">{item.name}</h3>
                                            <p className="text-[10px] font-bold text-neutral-400 tracking-[0.2em] uppercase">{item.author}</p>
                                        </div>
                                        <div className="text-right">
                                            <span className="block text-lg font-black">{item.price}</span>
                                            <span className="text-[8px] font-bold text-emerald-500 uppercase tracking-widest">In Stock</span>
                                        </div>
                                    </div>
                                </div>
                            )
                        ))}
                    </div>

                    {/* Empty State */}
                    {filteredTemplates.length === 0 && (
                        <div className="py-40 text-center opacity-30">
                            <LayoutGrid size={48} className="mx-auto mb-6" />
                            <p className="text-sm font-bold uppercase tracking-widest">No templates found in this category.</p>
                        </div>
                    )}
                </div>
            </main>

            {/* Floating CTA / Sticky Bar */}
            <div className="fixed bottom-12 left-1/2 -translate-x-1/2 z-50">
                <div className="px-8 py-4 bg-black text-white rounded-full shadow-2xl flex items-center gap-8 backdrop-blur-md bg-black/90 border border-white/10 group cursor-pointer hover:scale-105 transition-transform">
                    <div className="flex items-center gap-3">
                        <Zap size={16} className="text-emerald-400" />
                        <span className="text-[10px] font-bold tracking-[0.3em] uppercase">Start Selling Today</span>
                    </div>
                    <div className="h-4 w-[1px] bg-white/20" />
                    <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />
                </div>
            </div>

            {/* Secondary Feature Section */}
            <section className="py-40 bg-[#0a0a0a] text-white px-8 lg:px-24">
                <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-20 items-center">
                    <div>
                        <h2 className="text-5xl lg:text-[7vw] font-black leading-none tracking-tighter uppercase mb-12">
                            Designed for<br /><span className="text-neutral-700 underline decoration-white/5 underline-offset-8">Speed.</span>
                        </h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-10">
                            {[
                                { icon: Globe, t: 'Global CDN', d: 'Lightning fast delivery across the world.' },
                                { icon: Zap, t: 'SEO Optimized', d: 'Index-ready structures for top visibility.' }
                            ].map((feat, i) => (
                                <div key={i} className="space-y-4">
                                    <feat.icon size={24} className="text-neutral-500" />
                                    <h4 className="text-[10px] font-black tracking-widest uppercase">{feat.t}</h4>
                                    <p className="text-xs text-neutral-400 leading-relaxed">{feat.d}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="relative group">
                        <div className="aspect-[16/10] bg-neutral-900 rounded-[3rem] overflow-hidden border border-white/5">
                            <img src="https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=2000" className="w-full h-full object-cover opacity-60 group-hover:scale-105 transition-transform duration-1000" alt="Tech" />
                        </div>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="py-24 px-8 lg:px-24 border-t border-black/[0.05] bg-white text-[#0a0a0a]">
                <div className="max-w-7xl mx-auto flex flex-col lg:flex-row justify-between items-center gap-12">
                    <div className="flex flex-col items-center lg:items-start gap-4">
                        <div className="flex items-center gap-3">
                            <div className="w-5 h-5 bg-black rounded flex items-center justify-center text-[8px] font-bold text-white">M</div>
                            <span className="text-xs font-black tracking-widest uppercase">Marketplace.Labs © 2024</span>
                        </div>
                        <p className="text-[10px] text-neutral-400 font-bold tracking-[0.2em] uppercase">Premium assets for the spatial web</p>
                    </div>

                    <div className="flex gap-12 text-[10px] font-black tracking-[0.4em] uppercase text-neutral-400">
                        {['Twitter', 'Instagram', 'Dribbble'].map(social => (
                            <a key={social} href="#" className="hover:text-black transition-colors">{social}</a>
                        ))}
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default App;
