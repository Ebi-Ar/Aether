'use client';

import React, { useEffect, useRef, useState } from 'react';

/**
 * Aether Landing Page - High Luminosity Version
 * Optimized for a brighter, more brilliant ring effect with 
 * layered glows and enhanced lighting.
 */
export function HomePage() {
    const [gsapLoaded, setGsapLoaded] = useState(false);
    const logoRef = useRef<HTMLDivElement>(null);
    const textRef = useRef<HTMLHeadingElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const cardsRef = useRef<HTMLDivElement>(null);
    const cursorRef = useRef<HTMLDivElement>(null);
    const cursorReflectionRef = useRef<HTMLDivElement>(null);
    const glowRef = useRef<HTMLDivElement>(null);
    const secondaryGlowRef = useRef<HTMLDivElement>(null);
    const foundryRef = useRef<HTMLDivElement>(null);
    const gridRef = useRef<HTMLDivElement>(null);
    const dataStreamRef = useRef<HTMLDivElement>(null);
    const mousePos = useRef({ x: 0, y: 0 });
    const lastMousePos = useRef({ x: 0, y: 0 });
    const currentRotation = useRef(0); // Track current rotation to prevent flips

    // Load GSAP via CDN (Keep existing effect)
    useEffect(() => {
        if ((window as any).gsap) {
            setGsapLoaded(true);
            return;
        }

        const script = document.createElement('script');
        script.src = "https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js";
        script.async = true;
        script.onload = () => {
            // Load ScrollTrigger plugin as well if possible, or just use basic timeline loop
            const stScript = document.createElement('script');
            stScript.src = "https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/ScrollTrigger.min.js";
            stScript.async = true;
            stScript.onload = () => setGsapLoaded(true);
            document.head.appendChild(stScript);
        };
        document.head.appendChild(script);

        return () => {
            if (document.head.contains(script)) {
                document.head.removeChild(script);
            }
        };
    }, []);

    useEffect(() => {
        if (!gsapLoaded || !(window as any).gsap) return;

        const gsap = (window as any).gsap;
        const ScrollTrigger = (window as any).ScrollTrigger;

        if (ScrollTrigger) {
            gsap.registerPlugin(ScrollTrigger);
        }

        const tl = gsap.timeline();

        // 1. Initial Load Animation (Existing)
        tl.fromTo(logoRef.current,
            { scale: 0.7, opacity: 0, filter: 'blur(30px)' },
            { scale: 1, opacity: 1, filter: 'blur(0px)', duration: 3, ease: "power4.out" }
        );

        tl.fromTo(textRef.current,
            { y: 40, opacity: 0, letterSpacing: '0.1em' },
            { y: 0, opacity: 1, letterSpacing: '0.6em', duration: 2.5, ease: "expo.out" },
            "-=2"
        );

        // 2. Enhanced Ambient Pulsing (Existing)
        gsap.to(glowRef.current, {
            opacity: 0.9,
            scale: 1.25,
            repeat: -1,
            yoyo: true,
            duration: 4,
            ease: "sine.inOut"
        });

        gsap.to(secondaryGlowRef.current, {
            opacity: 0.6,
            scale: 1.1,
            repeat: -1,
            yoyo: true,
            duration: 3,
            ease: "sine.inOut",
            delay: 0.5
        });

        // 3. Mouse Parallax & Fluid Physics
        const xTo = (gsap as any).quickTo(cursorRef.current, "x", { duration: 0.7, ease: "power3.out" });
        const yTo = (gsap as any).quickTo(cursorRef.current, "y", { duration: 0.7, ease: "power3.out" });

        // Chromatic reflection layer with slower tracking
        const xToReflection = (gsap as any).quickTo(cursorReflectionRef.current, "x", { duration: 0.9, ease: "power3.out" });
        const yToReflection = (gsap as any).quickTo(cursorReflectionRef.current, "y", { duration: 0.9, ease: "power3.out" });

        const handleMouseMove = (e: MouseEvent) => {
            const { clientX, clientY } = e;

            // Update position tracking (for parallax only)
            lastMousePos.current = { ...mousePos.current };
            mousePos.current = { x: clientX, y: clientY };

            // 1. Get Anchor (Moon) Position
            let anchorX = window.innerWidth / 2;
            let anchorY = window.innerHeight / 2;

            if (logoRef.current) {
                const rect = logoRef.current.getBoundingClientRect();
                anchorX = rect.left + rect.width / 2;
                anchorY = rect.top + rect.height / 2;
            }

            // 2. Calculate Distance & Angle to Mouse
            const dist = Math.sqrt(Math.pow(clientX - anchorX, 2) + Math.pow(clientY - anchorY, 2));
            const angleFromMoon = Math.atan2(clientY - anchorY, clientX - anchorX) * (180 / Math.PI);

            // Check for hover state (Interactive Beam) - EXCLUDING Title/Name
            const target = (e.target as HTMLElement).closest('a, button, .feature-card');
            const isHovering = !!target;
            const isCardHover = target && target.classList.contains('feature-card');

            // 3. Beam Physics (Anchor to Moon, Stretch to Mouse)
            // Base values
            let beamLength = Math.max(dist + 300, 600);
            let scaleY = 1 - (dist / 3000);
            let intensity = 0; // Default to invisible

            // Fade out when close to moon to prevent clutter (within 120px)
            const fadeThreshold = 120;
            const fadeRamp = 100;
            const proximityFade = Math.min(1, Math.max(0, (dist - fadeThreshold) / fadeRamp));

            // Interactive Boost (Only visible when hovering)
            let reflectionMultiplier = 0.7; // Default reflection intensity

            if (isHovering && proximityFade > 0.1) {
                beamLength += 100;

                if (isCardHover) {
                    scaleY *= 1.3; // Constrained width (max ~280px vs 320px glow)
                    intensity = 1.0 * proximityFade;
                    reflectionMultiplier = 1.0;
                } else {
                    scaleY *= 1.1; // Subtle boost (max ~236px)
                    intensity = 0.8 * proximityFade;
                }
            }

            // Update Beam (Main Aura)
            if (cursorRef.current) {
                gsap.to(cursorRef.current, {
                    x: anchorX,
                    y: anchorY,
                    width: beamLength,
                    scaleY: scaleY,
                    rotation: angleFromMoon + "_short",
                    opacity: intensity,
                    duration: 0.2, // Slightly slower for "heavy" spotlight feel
                    ease: "power2.out",
                    overwrite: 'auto'
                });
            }

            // Update Reflection (Secondary Beam)
            if (cursorReflectionRef.current) {
                gsap.to(cursorReflectionRef.current, {
                    x: anchorX,
                    y: anchorY,
                    width: beamLength * 0.9,
                    rotation: angleFromMoon + "_short",
                    opacity: intensity * reflectionMultiplier,
                    duration: 0.15,
                    ease: "none",
                    overwrite: 'auto'
                });
            }

            // Parallax for Content
            const xPos = (clientX / window.innerWidth - 0.5) * 50;
            const yPos = (clientY / window.innerHeight - 0.5) * 50;

            gsap.to(logoRef.current, { x: xPos, y: yPos, duration: 1.8, ease: "power2.out" });
            gsap.to([glowRef.current, secondaryGlowRef.current], {
                x: xPos * 1.15,
                y: yPos * 1.15,
                duration: 2.2,
                ease: "power1.out"
            });
            gsap.to(textRef.current, {
                x: xPos * 0.5,
                y: yPos * 0.5,
                duration: 2,
                ease: "power2.out"
            });
        };

        // Function to update aura rotation based on current positions
        const updateAuraRotation = () => {
            if (!cursorRef.current || !cursorReflectionRef.current) return;

            const clientX = mousePos.current.x;
            const clientY = mousePos.current.y;

            // 1. Get Anchor (Moon) Position
            let anchorX = window.innerWidth / 2;
            let anchorY = window.innerHeight / 2;

            if (logoRef.current) {
                const rect = logoRef.current.getBoundingClientRect();
                anchorX = rect.left + rect.width / 2;
                anchorY = rect.top + rect.height / 2;
            }

            // 2. Calculate Distance & Angle to Mouse
            const dist = Math.sqrt(Math.pow(clientX - anchorX, 2) + Math.pow(clientY - anchorY, 2));
            const angleFromMoon = Math.atan2(clientY - anchorY, clientX - anchorX) * (180 / Math.PI);

            // Check for hover state during scroll
            const elementUnderMouse = document.elementFromPoint(clientX, clientY);
            const target = elementUnderMouse ? (elementUnderMouse as HTMLElement).closest('a, button, .feature-card') : null;
            const isHovering = !!target;
            const isCardHover = target && target.classList.contains('feature-card');

            // 3. Beam Physics (Anchor to Moon, Stretch to Mouse)
            const beamLength = Math.max(dist + 300, 600); // Always extend a bit past cursor, min length
            let scaleY = 1 - (dist / 3000);
            let intensity = 0; // Default to invisible

            // Fade out when close to moon to prevent clutter (within 120px)
            const fadeThreshold = 120;
            const fadeRamp = 100;
            const proximityFade = Math.min(1, Math.max(0, (dist - fadeThreshold) / fadeRamp));

            // Interactive Boost (Only visible when hovering)
            let reflectionMultiplier = 0.7;

            if (isHovering && proximityFade > 0.1) {
                // beamLength += 100; 
                if (isCardHover) {
                    scaleY *= 1.3; // Constrained width (max ~280px)
                    intensity = 1.0 * proximityFade;
                    reflectionMultiplier = 1.0;
                } else {
                    scaleY *= 1.1; // Subtle boost
                    intensity = 0.8 * proximityFade;
                }
            }

            // Update Beam (Main Aura)
            gsap.to(cursorRef.current, {
                x: anchorX,
                y: anchorY,
                width: beamLength + (isHovering ? 100 : 0),
                scaleY: scaleY,
                rotation: angleFromMoon + "_short",
                opacity: intensity,
                duration: 0.1, // Faster updates for anchoring
                ease: "none", // Linear follow for solid anchor
                overwrite: 'auto'
            });

            // Update Reflection (Secondary Beam)
            gsap.to(cursorReflectionRef.current, {
                x: anchorX,
                y: anchorY,
                width: beamLength * 0.9,
                rotation: angleFromMoon + "_short",
                opacity: intensity * reflectionMultiplier,
                duration: 0.15,
                ease: "none",
                overwrite: 'auto'
            });
        };

        window.addEventListener('mousemove', handleMouseMove);

        // Add scroll listener to update aura direction when page scrolls
        const scrollContainer = containerRef.current;
        if (scrollContainer) {
            scrollContainer.addEventListener('scroll', updateAuraRotation);
        }

        if (foundryRef.current) {
            // Continuous Grid Scroll
            gsap.to(gridRef.current, {
                backgroundPosition: "0px 100px",
                duration: 4,
                ease: "none",
                repeat: -1
            });
        }

        // Data Stream Loop (Seamless Track) - Moved outside to ensure independent execution
        if (dataStreamRef.current) {
            gsap.to(dataStreamRef.current, {
                yPercent: -50, // Use yPercent for better compatibility
                duration: 10,
                ease: "none",
                repeat: -1
            });
        }

        // 5. Feature Cards Animation
        if (cardsRef.current && ScrollTrigger) {
            const cards = cardsRef.current.querySelectorAll('.feature-card');

            gsap.fromTo(cards,
                {
                    opacity: 0,
                    y: 100,
                    rotationX: 45,
                    transformPerspective: 1000,
                    transformOrigin: "center bottom"
                },
                {
                    opacity: 1,
                    y: 0,
                    rotationX: 0,
                    duration: 1.5,
                    ease: "power3.out",
                    stagger: 0.2,
                    scrollTrigger: {
                        trigger: cardsRef.current,
                        scroller: containerRef.current,
                        start: "top bottom", // Start as soon as they enter
                        end: "center center", // Finish when centered
                        scrub: 0.5, // Faster response
                    }
                }
            );
        }

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            if (scrollContainer) {
                scrollContainer.removeEventListener('scroll', updateAuraRotation);
            }
        };
    }, [gsapLoaded]);

    return (
        <div ref={containerRef} id="main-scroll-container" style={styles.container}>
            {/* Fluid Cursor - Multi-layer */}
            <div ref={cursorRef} style={styles.cursor} />
            <div ref={cursorReflectionRef} style={styles.cursorReflection} />

            {/* Hero Section */}
            <div style={styles.heroSection}>
                {/* Subtle Background Aura */}
                <div style={styles.backgroundGlow}></div>

                <div style={styles.contentWrapper}>
                    <div style={styles.ringContainer}>
                        {/* Primary Aura (Vibrant glow) */}
                        <div ref={glowRef} style={styles.outerGlow}></div>

                        {/* Secondary Aura (Core bloom) */}
                        <div ref={secondaryGlowRef} style={styles.innerGlow}></div>

                        {/* The Brighter Physical Ring */}
                        <div ref={logoRef} style={styles.ring}></div>
                    </div>

                    <h1 ref={textRef} style={styles.title}>AETHER</h1>
                    <p style={styles.subtitle}>CINEMATIC LANDING PAGE BUILDER</p>

                    <a
                        href="/legacy-library"
                        style={styles.ctaButton}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.transform = 'scale(1.05)';
                            e.currentTarget.style.boxShadow = '0 0 30px rgba(138, 180, 248, 0.4)';
                            e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.8)';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.transform = 'scale(1)';
                            e.currentTarget.style.boxShadow = '0 0 20px rgba(138, 180, 248, 0.1)';
                            e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.3)';
                        }}
                    >
                        INITIALIZE FOUNDRY
                    </a>
                </div>

                <div style={styles.footer}>EST. 2024</div>
            </div>

            {/* Foundry Technical Section */}
            <div ref={foundryRef} style={styles.foundrySection}>
                <div ref={gridRef} style={styles.gridBackground}></div>

                <div style={styles.foundryContent}>
                    <div style={styles.hudContainer}>
                        {/* Left Data Column */}
                        <div style={styles.dataColumn}>
                            <div ref={dataStreamRef} className="data-track">
                                {['VELOCITY', 'FRICTION', 'INERTIA', 'GSAP', 'WEBGL', 'REACT', 'THREE.JS', 'PHYSICS'].map((term, i) => (
                                    <div key={i} className="data-term" style={styles.dataTerm}>{term}</div>
                                ))}
                                {['VELOCITY', 'FRICTION', 'INERTIA', 'GSAP', 'WEBGL', 'REACT', 'THREE.JS', 'PHYSICS'].map((term, i) => (
                                    <div key={`dup-${i}`} className="data-term" style={styles.dataTerm}>{term}</div>
                                ))}
                            </div>
                        </div>

                        {/* Center Message */}
                        <div style={styles.foundryMessage}>
                            <h2 style={styles.foundryTitle}>POWERED BY <span style={{ color: '#a0c4ff' }}>FOUNDRY</span></h2>
                            <p style={styles.foundrySubtitle}>PHYSICS-BASED MOTION PRIMITIVES AT 60FPS</p>
                            <div style={styles.wireframeCube}>
                                <div style={{ ...styles.cubeFace, transform: 'translateZ(25px)' }}></div>
                                <div style={{ ...styles.cubeFace, transform: 'rotateY(180deg) translateZ(25px)' }}></div>
                                <div style={{ ...styles.cubeFace, transform: 'rotateY(90deg) translateZ(25px)' }}></div>
                                <div style={{ ...styles.cubeFace, transform: 'rotateY(-90deg) translateZ(25px)' }}></div>
                                <div style={{ ...styles.cubeFace, transform: 'rotateX(90deg) translateZ(25px)' }}></div>
                                <div style={{ ...styles.cubeFace, transform: 'rotateX(-90deg) translateZ(25px)' }}></div>
                            </div>
                        </div>

                        {/* Right Data Column (Mirrored or Different) */}
                        <div style={styles.dataColumnRight}>
                            <div style={styles.statusLine}>STATUS: ACTIVE</div>
                            <div style={styles.statusLine}>FPS: 60</div>
                            <div style={styles.statusLine}>RENDERER: WEBGL</div>
                            <div style={styles.statusLine}>MEMORY: OPTIMIZED</div>
                        </div>
                    </div>
                </div>
            </div>
            {/* Features Section */}
            <div style={styles.featuresSection}>
                <div ref={cardsRef} style={styles.cardsContainer}>
                    <div className="feature-card" style={styles.featureCard}>
                        <h3 style={styles.cardTitle}>MOTION FIRST</h3>
                        <p style={styles.cardText}>Animation is not an afterthought.</p>
                        <div style={styles.cardGlow}></div>
                    </div>
                    <div className="feature-card" style={styles.featureCard}>
                        <h3 style={styles.cardTitle}>PHYSICS CORE</h3>
                        <p style={styles.cardText}>Gravity, friction, and inertia.</p>
                        <div style={styles.cardGlow}></div>
                    </div>
                    <div className="feature-card" style={styles.featureCard}>
                        <h3 style={styles.cardTitle}>CINEMATIC TYPE</h3>
                        <p style={styles.cardText}>Text that breathes.</p>
                        <div style={styles.cardGlow}></div>
                    </div>
                </div>
            </div>
        </div>
    );
}

const styles: { [key: string]: React.CSSProperties } = {
    container: {
        height: '100vh',
        width: '100vw',
        backgroundColor: '#000000', // Pure black for max contrast
        overflowY: 'auto',
        overflowX: 'hidden',
        color: 'white',
        fontFamily: '"Inter", -apple-system, sans-serif',
        position: 'relative',
    },
    heroSection: {
        height: '100vh',
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        minHeight: '800px', // Ensure it doesn't get too small
    },
    backgroundGlow: {
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        background: 'radial-gradient(circle at 50% 50%, rgba(30, 60, 120, 0.2) 0%, transparent 80%)',
        pointerEvents: 'none',
    },
    contentWrapper: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        zIndex: 10,
    },
    ringContainer: {
        position: 'relative',
        width: '320px',
        height: '320px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: '60px',
        transform: 'translateY(100px)', // Moved up 40px (140 -> 100)
    },
    ring: {
        width: '215px',
        height: '215px',
        borderRadius: '50%',
        // Ultra-bright border
        border: '2px solid rgba(255, 255, 255, 0.9)',
        boxShadow: `
            0 0 20px rgba(255, 255, 255, 0.6),
            0 0 60px rgba(138, 180, 248, 1), 
            0 0 100px rgba(100, 160, 255, 0.6),
            inset 0 0 35px rgba(255, 255, 255, 0.3)
        `,
        zIndex: 5,
        backdropFilter: 'blur(10px)',
        backgroundColor: 'rgba(255, 255, 255, 0.08)',
    },
    outerGlow: {
        position: 'absolute',
        width: '320px',
        height: '320px',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(138, 180, 248, 0.7) 0%, rgba(100, 160, 255, 0.3) 50%, transparent 80%)',
        opacity: 0.9,
        filter: 'blur(50px)',
        zIndex: 1,
    },
    innerGlow: {
        position: 'absolute',
        width: '220px',
        height: '220px',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(255, 255, 255, 0.6) 0%, rgba(138, 180, 248, 0.3) 60%, transparent 90%)',
        opacity: 0.7,
        filter: 'blur(25px)',
        zIndex: 2,
    },
    title: {
        fontSize: '3.8rem',
        fontWeight: '200',
        textTransform: 'uppercase',
        margin: 0,
        letterSpacing: '0.7em',
        textAlign: 'center',
        // Stronger text bloom
        textShadow: `
            0 0 20px rgba(255, 255, 255, 0.6),
            0 0 50px rgba(138, 180, 248, 0.4)
        `,
        color: '#ffffff',
        marginTop: '70px',
    },
    subtitle: {
        fontSize: '0.75rem',
        fontWeight: '400',
        letterSpacing: '0.9em',
        marginTop: '25px',
        opacity: 0.5,
        textTransform: 'uppercase',
        color: '#a0c4ff',
    },
    footer: {
        position: 'absolute',
        bottom: '40px',
        fontSize: '0.6rem',
        letterSpacing: '0.5em',
        opacity: 0.3,
    },
    ctaButton: {
        marginTop: '50px',
        padding: '16px 32px',
        background: 'rgba(255, 255, 255, 0.03)',
        border: '1px solid rgba(255, 255, 255, 0.3)',
        borderRadius: '4px',
        color: '#fff',
        textDecoration: 'none',
        fontSize: '0.8rem',
        letterSpacing: '0.3em',
        transition: 'all 0.4s cubic-bezier(0.2, 0.8, 0.2, 1)',
        backdropFilter: 'blur(10px)',
        cursor: 'pointer',
        textTransform: 'uppercase',
        boxShadow: '0 0 20px rgba(138, 180, 248, 0.1)',
        position: 'relative',
        zIndex: 20,
    },
    foundrySection: {
        height: '80vh',
        width: '100%',
        position: 'relative',
        borderTop: '1px solid rgba(255,255,255,0.1)',
        background: 'linear-gradient(180deg, rgba(1,1,2,1) 0%, rgba(5,10,20,1) 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
    },
    gridBackground: {
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '200%', // Larger for scrolling animation
        backgroundImage: `
            linear-gradient(rgba(138, 180, 248, 0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(138, 180, 248, 0.1) 1px, transparent 1px)
        `,
        backgroundSize: '50px 50px',
        perspective: '1000px',
        transform: 'rotateX(60deg) scale(2)',
        transformOrigin: '50% 0%',
        opacity: 0.2,
    },
    foundryContent: {
        zIndex: 5,
        width: '100%',
        maxWidth: '1200px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
    },
    hudContainer: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        width: '100%',
        padding: '0 50px',
    },
    dataColumn: {
        height: '300px',
        overflow: 'hidden',
        fontSize: '0.8rem',
        fontFamily: 'monospace',
        color: 'rgba(138, 180, 248, 0.5)',
        display: 'flex',
        flexDirection: 'column',
        maskImage: 'linear-gradient(to bottom, transparent, black 10%, black 90%, transparent)',
        WebkitMaskImage: 'linear-gradient(to bottom, transparent, black 10%, black 90%, transparent)',
    },
    dataColumnRight: {
        height: '300px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'flex-start',
        gap: '15px',
        fontSize: '0.7rem',
        fontFamily: 'monospace',
        color: 'rgba(138, 180, 248, 0.7)',
        borderLeft: '1px solid rgba(138, 180, 248, 0.3)',
        paddingLeft: '20px',
    },
    dataTerm: {
        padding: '5px 0',
        letterSpacing: '0.2em',
    },
    foundryMessage: {
        textAlign: 'center',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '30px',
    },
    foundryTitle: {
        fontSize: '2rem',
        fontWeight: '300',
        letterSpacing: '0.5em',
        margin: 0,
    },
    foundrySubtitle: {
        fontSize: '0.8rem',
        letterSpacing: '0.3em',
        opacity: 0.6,
        color: '#a0c4ff',
    },
    wireframeCube: {
        width: '50px',
        height: '50px',
        position: 'relative',
        transformStyle: 'preserve-3d',
        animation: 'spin 10s infinite linear', // Fallback
    },
    cubeFace: {
        position: 'absolute',
        width: '50px',
        height: '50px',
        border: '1px solid rgba(138, 180, 248, 0.8)',
        background: 'rgba(138, 180, 248, 0.1)',
        boxShadow: '0 0 10px rgba(138, 180, 248, 0.2)',
    },
    statusLine: {
        letterSpacing: '0.1em',
    },
    featuresSection: {
        minHeight: '80vh',
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#050a14', // Slightly lighter than foundry for contrast
        padding: '100px 20px',
        perspective: '1000px', // Crucial for 3D tilt effect
    },
    cardsContainer: {
        display: 'flex',
        gap: '40px',
        flexWrap: 'wrap',
        justifyContent: 'center',
        maxWidth: '1200px',
        width: '100%',
    },
    featureCard: {
        flex: '1 1 300px',
        maxWidth: '350px',
        height: '400px',
        background: 'rgba(255, 255, 255, 0.02)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: '16px',
        padding: '40px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'flex-end',
        position: 'relative',
        overflow: 'hidden',
        backdropFilter: 'blur(10px)',
        transformStyle: 'preserve-3d',
        // opacity: 0, // Handled by GSAP
    },
    cardTitle: {
        fontSize: '1.5rem',
        fontWeight: '300',
        letterSpacing: '0.2em',
        marginBottom: '15px',
        color: '#fff',
        zIndex: 2,
    },
    cardText: {
        fontSize: '1rem',
        color: '#a0c4ff',
        lineHeight: '1.6',
        opacity: 0.8,
        zIndex: 2,
    },
    cardGlow: {
        position: 'absolute',
        top: '-50%',
        left: '-50%',
        width: '200%',
        height: '200%',
        background: 'radial-gradient(circle at 50% 50%, rgba(138, 180, 248, 0.1) 0%, transparent 60%)',
        pointerEvents: 'none',
        zIndex: 1,
    },
    cursor: {
        position: 'fixed',
        top: 0,
        left: 0,
        height: '215px', // Match Moon Ring size (215px)
        borderRadius: '50px',
        // Continuous Moonbeam: Bright source (left) -> Fades (right)
        background: 'linear-gradient(90deg, rgba(160, 210, 255, 0.6) 0%, rgba(120, 180, 255, 0.3) 20%, rgba(100, 160, 255, 0.1) 60%, transparent 100%)',
        transformOrigin: 'left center', // Anchors rotation/scale to the Moon (left side)
        transform: 'translate(0, -50%)', // Vertically Center on anchor, Left align horizontally
        pointerEvents: 'none',
        zIndex: 9999,
        mixBlendMode: 'screen',
        filter: 'blur(30px)',
        willChange: 'transform, width, height',
        opacity: 0, // Start invisible to prevent flash on load
    },
    cursorReflection: {
        position: 'fixed',
        top: 0,
        left: 0,
        height: '140px', // Smaller core
        borderRadius: '50px',
        // Secondary Prism Beam
        background: 'linear-gradient(90deg, rgba(180, 160, 255, 0.4) 0%, rgba(160, 140, 255, 0.2) 20%, rgba(140, 120, 255, 0.05) 50%, transparent 100%)',
        transformOrigin: 'left center',
        transform: 'translate(0, -50%)',
        pointerEvents: 'none',
        zIndex: 9998,
        mixBlendMode: 'screen',
        filter: 'blur(40px)',
        willChange: 'transform, width, height',
        opacity: 0, // Start invisible to prevent flash on load
    }
};
