'use client';

import React, { useEffect, useRef, useState } from 'react';
import { MousePointer2, Sparkles, Shield, Compass, Zap, Command, ChevronRight, ExternalLink, ArrowRight } from 'lucide-react';

// Extend Window interface for dynamically loaded GSAP libraries
declare global {
    interface Window {
        gsap: any;
        ScrollTrigger: any;
    }
}

const App = () => {
    const [gsapLoaded, setGsapLoaded] = useState(false);
    const containerRef = useRef(null);
    const revealLayerRef = useRef(null);
    const revealContentRef = useRef(null);
    const baseContentRef = useRef(null);
    const lightRef = useRef(null);

    useEffect(() => {
        const loadScripts = async () => {
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

        loadScripts();
    }, []);

    useEffect(() => {
        if (!gsapLoaded || !window.gsap) return;

        const gsap = window.gsap;
        const ScrollTrigger = window.ScrollTrigger;
        gsap.registerPlugin(ScrollTrigger);

        const mouse = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
        const pos = { x: mouse.x, y: mouse.y };

        const maskSetter = gsap.quickSetter(revealLayerRef.current, "css");
        const flareSetter = gsap.quickSetter(lightRef.current, "css");

        const handleMouseMove = (e: MouseEvent) => {
            mouse.x = e.clientX;
            mouse.y = e.clientY;
        };

        const updateMouse = () => {
            const dt = 1.0 - Math.pow(1.0 - 0.15, gsap.ticker.deltaRatio());
            pos.x += (mouse.x - pos.x) * dt;
            pos.y += (mouse.y - pos.y) * dt;

            maskSetter({
                "--mask-x": `${pos.x}px`,
                "--mask-y": `${pos.y}px`
            });

            flareSetter({
                transform: `translate(${pos.x}px, ${pos.y}px)`
            });
        };

        window.addEventListener("mousemove", handleMouseMove);
        gsap.ticker.add(updateMouse);

        const ctx = gsap.context(() => {
            ScrollTrigger.create({
                trigger: containerRef.current,
                start: "top top",
                end: "bottom bottom",
                scrub: 1,
                onUpdate: (self: any) => {
                    const progress = self.progress;
                    // Drive movement for the entire site content
                    const moveY = progress * -4500;

                    gsap.set([baseContentRef.current, revealContentRef.current], {
                        y: moveY
                    });

                    // Hero specific fade-out
                    const heroFade = Math.max(0, 1 - progress * 5);
                    gsap.set(".hero-section-wrapper", {
                        opacity: heroFade,
                        filter: `blur(${progress * 20}px)`
                    });
                }
            });

            gsap.from(".reveal-init", {
                opacity: 0,
                filter: "blur(20px)",
                y: 30,
                duration: 2,
                ease: "expo.out",
                stagger: 0.1
            });

        }, containerRef);

        return () => {
            ctx.revert();
            window.removeEventListener("mousemove", handleMouseMove);
            gsap.ticker.remove(updateMouse);
        };
    }, [gsapLoaded]);

    const showcaseItems = [
        { id: 'I', title: 'The Chronos', desc: 'Hand-assembled movements in a titanium cage.', img: 'https://images.unsplash.com/photo-1508685096489-7aac2968b955?q=80&w=2000' },
        { id: 'II', title: 'Solaris Ring', desc: 'Encapsulated light forged in zero-gravity.', img: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?q=80&w=2000' },
        { id: 'III', title: 'Vanta Blade', desc: 'The darkest alloy known to engineering.', img: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2000' }
    ];

    const HeroSection = ({ isRevealed }: { isRevealed: boolean }) => (
        <div className={`hero-section-wrapper flex flex-col justify-center items-center text-center px-6 h-screen ${isRevealed ? '' : 'reveal-init'}`}>
            <span className={`text-[10px] font-bold tracking-[1em] uppercase mb-12 block ${isRevealed ? 'text-white/40' : 'text-white/5'}`}>
                Limited Series 001
            </span>
            <h1 className="text-7xl lg:text-[14vw] font-black leading-[0.8] tracking-tighter uppercase mb-16 select-none">
                <span className={isRevealed ? 'text-white' : 'text-[#111]'}>Secrets</span><br />
                <span className={isRevealed ? 'text-white' : 'text-[#111]'}>Unearthed.</span>
            </h1>
            <div className={`flex flex-col items-center gap-6 ${isRevealed ? 'opacity-40' : 'opacity-5'}`}>
                <MousePointer2 size={20} className="animate-bounce" />
                <p className="text-[9px] tracking-[0.4em] uppercase font-bold italic">Sweep the lens to find the truth</p>
            </div>
        </div>
    );

    const FullSiteLayout = ({ isRevealed }: { isRevealed: boolean }) => (
        <div className="w-full">
            {/* 1. HERO */}
            <HeroSection isRevealed={isRevealed} />

            {/* 2. MID-TEXT */}
            <div className="h-screen w-full flex items-center justify-center">
                <h2 className={`text-[18vw] font-black uppercase italic select-none ${isRevealed ? 'text-white/5' : 'text-white/[0.01]'}`}>GOLD_STANDARD</h2>
            </div>

            {/* 3. SHOWCASE */}
            <div className="max-w-7xl mx-auto py-64 px-10 lg:px-24 space-y-[40vh] pb-[20vh]">
                {showcaseItems.map((item, i) => (
                    <div key={item.id} className="grid lg:grid-cols-2 gap-32 items-center">
                        <div className={`relative aspect-[3/4] rounded-2xl overflow-hidden ${i % 2 !== 0 ? 'lg:order-2' : ''}`}>
                            <img
                                src={item.img}
                                className={`w-full h-full object-cover ${isRevealed ? 'grayscale-0 brightness-100' : 'grayscale brightness-[0.05]'}`}
                                alt={item.title}
                            />
                            <div className={`absolute inset-0 bg-gradient-to-t from-black/80 to-transparent ${isRevealed ? 'opacity-100' : 'opacity-20'}`} />
                        </div>
                        <div className="space-y-10">
                            <span className={`text-sm font-serif italic tracking-widest ${isRevealed ? 'text-yellow-600' : 'text-[#111]'}`}>{item.id}</span>
                            <h3 className={`text-6xl lg:text-8xl font-black uppercase tracking-tighter leading-none ${isRevealed ? 'text-white' : 'text-[#111]'}`}>{item.title}</h3>
                            <p className={`text-xl leading-relaxed font-light italic ${isRevealed ? 'text-white/50' : 'text-[#111]'}`}>{item.desc}</p>
                            {isRevealed && (
                                <button className="flex items-center gap-6 text-xs font-bold tracking-[0.5em] uppercase hover:text-yellow-600 transition-colors pointer-events-auto">
                                    The Blueprint <ArrowRight size={18} />
                                </button>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {/* 4. "LIGHT" SECTION (NOW EFFECTED BY CURSOR) */}
            <section className={`py-64 px-10 lg:px-24 rounded-t-[5rem] transition-colors duration-500 ${isRevealed ? 'bg-white text-black' : 'bg-transparent text-[#111]'}`}>
                <div className="max-w-7xl mx-auto flex flex-col lg:flex-row gap-20 items-start">
                    <div className="lg:w-1/2">
                        <h2 className={`text-6xl lg:text-[10vw] font-black tracking-tighter uppercase leading-[0.8] ${isRevealed ? 'text-black' : 'text-[#111]'}`}>
                            Beyond <br /><span className={isRevealed ? 'text-neutral-200 underline decoration-black/5 underline-offset-10' : 'text-[#080808]'}>The Lens.</span>
                        </h2>
                    </div>
                    <div className="lg:w-1/2 lg:pt-14 space-y-12">
                        <p className={`text-2xl lg:text-4xl font-medium leading-[1.1] tracking-tight ${isRevealed ? 'text-neutral-800' : 'text-[#111]'}`}>
                            Our interface uses proprietary interpolation to bridge the gap between curiosity and discovery.
                        </p>
                        <div className="grid grid-cols-2 gap-12">
                            {[
                                { icon: Sparkles, t: 'Soft Mask', d: 'Feathered radial gradients for organic reveals.' },
                                { icon: Zap, t: 'QuickSet', d: 'Zero-latency mouse tracking at sub-pixel levels.' }
                            ].map((feat, i) => (
                                <div key={i} className="space-y-4">
                                    <feat.icon size={24} className={isRevealed ? "text-yellow-600" : "text-[#111]"} />
                                    <h4 className={`text-[10px] font-black tracking-widest uppercase ${isRevealed ? 'text-black' : 'text-[#111]'}`}>{feat.t}</h4>
                                    <p className={`text-xs leading-relaxed ${isRevealed ? 'text-neutral-500' : 'text-[#0a0a0a]'}`}>{feat.d}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* 5. FOOTER */}
            <footer className={`py-20 px-10 lg:px-24 border-t transition-colors duration-500 ${isRevealed ? 'bg-black text-white/30 border-white/5' : 'bg-transparent text-[#111] border-transparent'}`}>
                <div className="max-w-7xl mx-auto flex flex-col lg:flex-row justify-between items-center gap-10 text-center lg:text-left">
                    <div className="flex flex-col gap-3">
                        <span className="text-[10px] font-bold tracking-[0.5em] uppercase">Mystique Archives v2.4</span>
                        <div className="flex gap-6 text-[9px] font-mono tracking-widest uppercase">
                            <span>Status: Secret</span>
                            <span>Light Radius: 220px</span>
                            <span>Engine: GSAP v3.12</span>
                        </div>
                    </div>
                    <div className="flex gap-14 text-[10px] font-bold tracking-widest uppercase">
                        {['Instagram', 'Dribbble', 'LinkedIn'].map(social => (
                            <a key={social} href="#" className={`transition-colors ${isRevealed ? 'hover:text-white' : 'pointer-events-none'}`}>{social}</a>
                        ))}
                    </div>
                </div>
            </footer>
        </div>
    );

    return (
        <div ref={containerRef} className="relative min-h-[800vh] bg-[#050505] text-white selection:bg-neutral-800 antialiased cursor-none">
            {!gsapLoaded && (
                <div className="fixed inset-0 z-[100] bg-black flex items-center justify-center">
                    <div className="w-10 h-10 border-2 border-white/5 border-t-white rounded-full animate-spin" />
                </div>
            )}

            {/* Visual Flare */}
            <div
                ref={lightRef}
                className="fixed top-0 left-0 w-[500px] h-[500px] -ml-[250px] -mt-[250px] rounded-full pointer-events-none z-[60] opacity-40 mix-blend-screen"
                style={{
                    background: 'radial-gradient(circle, rgba(212,175,55,0.2) 0%, rgba(212,175,55,0.05) 50%, transparent 70%)',
                    filter: 'blur(60px)'
                }}
            />

            {/* Cursor Point */}
            <div
                className="fixed top-0 left-0 w-1.5 h-1.5 bg-white rounded-full pointer-events-none z-[70] shadow-[0_0_20px_white]"
                style={{ left: 'var(--mask-x)', top: 'var(--mask-y)', position: 'fixed', transform: 'translate(-50%, -50%)' }}
            />

            <nav className="fixed top-14 w-full z-[100] px-10 py-10 flex justify-between items-center mix-blend-difference">
                <div className="flex items-center gap-3 cursor-pointer">
                    <Command size={24} className="text-white" />
                    <span className="text-xl font-bold tracking-[0.4em] uppercase">MYS.TIQUE</span>
                </div>
                <div className="hidden lg:flex gap-16 items-center text-[10px] font-bold tracking-[0.5em] uppercase text-white/50">
                    <a href="#" className="hover:text-white transition-colors">Heritage</a>
                    <a href="#" className="hover:text-white transition-colors">Atelier</a>
                    <button className="px-10 py-3 border border-white/20 rounded-full hover:bg-white hover:text-black transition-all">
                        Join Waitlist
                    </button>
                </div>
            </nav>

            {/* FIXED BASE LAYER (Everything dark) */}
            <div className="fixed inset-0 z-10 w-full h-full overflow-hidden pointer-events-none">
                <div ref={baseContentRef} className="w-full will-change-transform">
                    <FullSiteLayout isRevealed={false} />
                </div>
            </div>

            {/* FIXED REVEALED LAYER (Everything lit up) */}
            <div
                ref={revealLayerRef}
                className="fixed inset-0 z-50 pointer-events-none overflow-hidden"
                style={{
                    maskImage: 'radial-gradient(circle 220px at var(--mask-x, 50%) var(--mask-y, 50%), black 0%, transparent 100%)',
                    WebkitMaskImage: 'radial-gradient(circle 220px at var(--mask-x, 50%) var(--mask-y, 50%), black 0%, transparent 100%)',
                }}
            >
                <div ref={revealContentRef} className="w-full bg-black relative will-change-transform">
                    <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]" />
                    <FullSiteLayout isRevealed={true} />
                </div>
            </div>

            <div className="shroud fixed inset-0 z-40 bg-black/98 pointer-events-none" />

            {/* Spacer to allow for the full length of the site to scroll */}
            <div className="h-[750vh] w-full pointer-events-none" />
        </div>
    );
};

export default App;
