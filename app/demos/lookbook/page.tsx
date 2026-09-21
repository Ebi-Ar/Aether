'use client';

import React, { useEffect, useRef, useState } from 'react';
import { BookOpen, Command, ChevronRight, Play, Compass, ArrowRight, Share2, Info } from 'lucide-react';

// Extend Window interface for dynamically loaded GSAP libraries
declare global {
    interface Window {
        gsap: any;
        ScrollTrigger: any;
    }
}

const App = () => {
    const [gsapLoaded, setGsapLoaded] = useState(false);
    const mainRef = useRef(null);

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
            const pages = gsap.utils.toArray('.magazine-page');

            pages.forEach((page: any, i: number) => {
                // We skip the last page to keep it as the "back cover"
                if (i < pages.length - 1) {
                    const content = page.querySelector('.page-content');
                    const shadow = page.querySelector('.page-shadow');

                    const tl = gsap.timeline({
                        scrollTrigger: {
                            trigger: page,
                            start: "top top",
                            end: "+=120%",
                            scrub: 1,
                            pin: true,
                            pinSpacing: false, // Essential for stacking reveal
                            invalidateOnRefresh: true,
                        }
                    });

                    tl.to(page, {
                        rotationX: -115,
                        yPercent: -20,
                        scale: 0.9,
                        z: -400,
                        transformOrigin: "center top",
                        ease: "none",
                    })
                        .to(content, {
                            opacity: 0,
                            filter: "blur(20px)",
                            y: -100,
                            ease: "none"
                        }, 0)
                        .to(shadow, {
                            opacity: 0.8,
                            ease: "none"
                        }, 0);
                }
            });

            // Scroll-triggered internal text entrance
            pages.forEach((page: any) => {
                const textItems = page.querySelectorAll('.stagger-text');
                if (textItems.length) {
                    gsap.from(textItems, {
                        y: 30,
                        opacity: 0,
                        stagger: 0.1,
                        duration: 1,
                        ease: "power3.out",
                        scrollTrigger: {
                            trigger: page,
                            start: "top 60%",
                            toggleActions: "play none none reverse"
                        }
                    });
                }
            });

        }, mainRef);

        return () => ctx.revert();
    }, [gsapLoaded]);

    const sections = [
        {
            vol: "01",
            title: "Raw Form",
            tag: "Architectural Noir",
            img: "https://images.unsplash.com/photo-1449156001437-dc909a704730?q=80&w=2000",
            body: "A study in brutalist silhouettes and the rhythmic repetition of concrete geometry."
        },
        {
            vol: "02",
            title: "Velvet Static",
            tag: "Digital Grain",
            img: "https://images.unsplash.com/photo-1550684848-fac1c5b4e853?q=80&w=2000",
            body: "Capturing the texture of noise in high-contrast cinematic environments."
        },
        {
            vol: "03",
            title: "Obsidian",
            tag: "Deep Material",
            img: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2000",
            body: "The interplay of pitch-black surfaces and the sharp reflection of artificial light."
        },
        {
            vol: "04",
            title: "Prism Lab",
            tag: "Optical Physics",
            img: "https://images.unsplash.com/photo-1494438639946-1ebd1d20bf85?q=80&w=2000",
            body: "Deconstructing light into its fundamental spectral components."
        }
    ];

    return (
        <div ref={mainRef} className="bg-[#050505] text-white selection:bg-white selection:text-black antialiased font-sans overflow-x-hidden">
            {!gsapLoaded && (
                <div className="fixed inset-0 z-[100] bg-black flex items-center justify-center">
                    <div className="w-8 h-8 border-2 border-white/5 border-t-white rounded-full animate-spin" />
                </div>
            )}

            {/* Luxury Nav */}
            <nav className="fixed top-14 w-full z-50 px-8 lg:px-16 py-10 flex justify-between items-center mix-blend-difference">
                <div className="flex items-center gap-4 group cursor-pointer">
                    <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center transition-transform duration-700 group-hover:rotate-[360deg]">
                        <Command size={20} className="text-black" />
                    </div>
                    <span className="text-xl font-black tracking-tighter uppercase italic">NOIR.BOOK</span>
                </div>

                <div className="hidden lg:flex gap-14 items-center text-[10px] font-bold tracking-[0.5em] uppercase text-white/40">
                    <a href="#" className="hover:text-white transition-colors relative group">
                        Editions
                        <span className="absolute -bottom-1 left-0 w-0 h-[1px] bg-white transition-all group-hover:w-full" />
                    </a>
                    <a href="#" className="hover:text-white transition-colors">Manifesto</a>
                    <button className="px-8 py-3 bg-white text-black rounded-full font-black tracking-widest hover:bg-neutral-200 transition-all shadow-xl shadow-black/20">
                        CONNECT
                    </button>
                </div>
            </nav>

            {/* Main Perspective Wrapper */}
            <main className="relative perspective-[2500px] transform-style-3d">
                {sections.map((section, i) => (
                    <section
                        key={i}
                        className="magazine-page relative h-screen w-full flex items-center justify-center overflow-hidden will-change-transform bg-[#050505]"
                    >
                        {/* Dark Shading Overlay (Page Shadow) */}
                        <div className="page-shadow absolute inset-0 bg-black opacity-0 z-20 pointer-events-none" />

                        {/* Background Layer */}
                        <div className="absolute inset-0 z-0">
                            <img
                                src={section.img}
                                className="w-full h-full object-cover opacity-60 grayscale hover:grayscale-0 transition-all duration-[2s]"
                                alt={section.title}
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black" />
                        </div>

                        {/* Content Spread */}
                        <div className="page-content relative z-10 w-full container mx-auto px-8 lg:px-24 flex flex-col justify-center h-full">
                            <div className="max-w-5xl">
                                <div className="flex items-center gap-6 mb-12 stagger-text">
                                    <span className="w-12 h-[1px] bg-white/20" />
                                    <span className="text-white/40 font-mono text-[10px] tracking-[0.6em] uppercase">Volume {section.vol} / {section.tag}</span>
                                </div>

                                <h2 className="stagger-text text-7xl lg:text-[13vw] font-black leading-[0.75] tracking-tighter uppercase mb-16 italic">
                                    {section.title}
                                </h2>

                                <div className="grid lg:grid-cols-2 gap-20 items-end">
                                    <p className="stagger-text text-xl lg:text-3xl text-white/50 font-light leading-tight max-w-xl">
                                        {section.body}
                                    </p>
                                    <div className="stagger-text flex items-center gap-10 lg:justify-end">
                                        <div className="text-right">
                                            <span className="block text-[9px] uppercase tracking-widest text-white/20 mb-1">Status</span>
                                            <span className="text-lg font-mono">Verified.</span>
                                        </div>
                                        <div className="w-20 h-20 rounded-full border border-white/10 flex items-center justify-center group hover:border-white transition-colors cursor-pointer shadow-2xl">
                                            <Play size={20} className="group-hover:scale-125 transition-transform" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Pagination Decor */}
                        <div className="absolute bottom-12 right-8 lg:right-24 flex items-center gap-6 opacity-20">
                            <span className="text-[10px] font-black tracking-[0.4em] uppercase">P. 0{i + 1}</span>
                            <BookOpen size={16} />
                        </div>
                    </section>
                ))}

                {/* Closing "Back Cover" CTA */}
                <section className="h-screen w-full bg-white text-black flex flex-col justify-center items-center text-center px-6 relative z-10">
                    <div className="absolute top-0 left-0 w-full h-full opacity-[0.03] select-none pointer-events-none overflow-hidden">
                        <h3 className="text-[35vw] font-black leading-none uppercase -translate-x-1/4 translate-y-1/4">END</h3>
                    </div>

                    <div className="relative z-10 max-w-4xl">
                        <span className="text-[10px] font-black tracking-[1em] uppercase text-black/20 mb-12 block">The Back Cover</span>
                        <h2 className="text-6xl lg:text-[11vw] font-black tracking-tighter uppercase leading-[0.8] mb-16">
                            Join the<br /><span className="text-neutral-200 underline decoration-black/5 underline-offset-8">Archives.</span>
                        </h2>
                        <div className="flex flex-col lg:flex-row gap-8 justify-center items-center">
                            <button className="px-14 py-6 bg-black text-white rounded-full font-black uppercase text-xs tracking-widest hover:scale-110 transition-transform shadow-[0_30px_60px_-15px_rgba(0,0,0,0.5)] flex items-center gap-4">
                                Get Full Volume <ArrowRight size={20} />
                            </button>
                            <button className="group flex items-center gap-3 text-xs font-black tracking-widest uppercase hover:opacity-40 transition-opacity">
                                View Studio <ChevronRight size={20} className="group-hover:translate-x-1 transition-transform" />
                            </button>
                        </div>
                    </div>
                </section>
            </main>

            {/* Global Grain/Noise Layer */}
            <div className="fixed inset-0 pointer-events-none opacity-[0.05] z-[999] bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />

            <footer className="py-24 px-10 lg:px-24 bg-black border-t border-white/5 flex flex-col lg:flex-row justify-between items-center gap-12 relative z-20">
                <div className="flex flex-col items-center lg:items-start gap-4">
                    <div className="flex items-center gap-2">
                        <Compass size={18} className="text-indigo-500" />
                        <span className="text-xs font-black tracking-[0.5em] uppercase text-white/30 tracking-widest">NOIR.STUDIO © 2024</span>
                    </div>
                    <p className="text-[10px] font-medium text-white/10 tracking-[0.4em] uppercase">
                        Crafted for the modern editorial connoisseur
                    </p>
                </div>

                <div className="flex gap-14 text-[10px] font-black tracking-[0.4em] uppercase text-white/20">
                    {['Instagram', 'Dribbble', 'Twitter'].map(social => (
                        <a key={social} href="#" className="hover:text-white transition-colors">{social}</a>
                    ))}
                </div>
            </footer>

            <style dangerouslySetInnerHTML={{
                __html: `
        .transform-style-3d { transform-style: preserve-3d; }
        ::selection { background: white; color: black; }
      `}} />
        </div>
    );
};

export default App;
