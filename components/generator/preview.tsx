"use client"
import { useRef, useEffect, useState, memo } from 'react';
import { createPortal } from 'react-dom';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Play, RotateCcw, MousePointer2, Maximize2, Minimize2, Loader2, ArrowRight, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';
import { AnimationStyle, GridItem, GridSize, PhysicsConfig, HorizontalConfig, HydrodynamicConfig } from './types';

if (typeof window !== "undefined") {
    gsap.registerPlugin(ScrollTrigger);
}

interface PreviewProps {
    headline: string;
    imageUrl: string;
    style: AnimationStyle;
    imageSequence?: string[];
    gridItems?: GridItem[];
    textAlwaysVisible?: boolean;
    gridSize?: GridSize;
    scrollerRef?: React.RefObject<HTMLDivElement>;
    physicsConfig?: PhysicsConfig;
    horizontalConfig?: HorizontalConfig;
    onHorizontalConfigChange?: (config: HorizontalConfig) => void;
    hydrodynamicConfig?: HydrodynamicConfig;
    onReset?: () => void;
}

export const Preview = memo<PreviewProps>(function Preview({ headline, imageUrl, style, imageSequence, gridItems, textAlwaysVisible, gridSize, scrollerRef, physicsConfig, horizontalConfig, onHorizontalConfigChange, hydrodynamicConfig, onReset }: PreviewProps) {
    // Internal scroll ref fallback
    const internalScrollRef = useRef<HTMLDivElement>(null);
    const scrollContainerRef = scrollerRef || internalScrollRef;

    const containerRef = useRef<HTMLDivElement>(null);
    const imageRef = useRef<HTMLImageElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const headlineRef = useRef<HTMLHeadingElement>(null);
    const subtitleRef = useRef<HTMLParagraphElement>(null);
    const overlayRef = useRef<HTMLDivElement>(null);
    const [scrollProgress, setScrollProgress] = useState(0);
    const [isFullScreen, setIsFullScreen] = useState(false);

    // NEW: Loading state to prevent the "Jump"
    const [isCanvasLoaded, setIsCanvasLoaded] = useState(false);

    // Horizontal Scroll State
    const [isAtEnd, setIsAtEnd] = useState(false);
    const [isAtStart, setIsAtStart] = useState(true);

    // PHYSICS GRID REFS
    const velocityRef = useRef({ x: 0, y: 0 })
    const lastMouseRef = useRef({ x: 0, y: 0 })
    const lastTimeRef = useRef(0)
    // Drag Logic Refs
    const dragTargetRef = useRef<HTMLDivElement | null>(null)
    const dragStartRef = useRef({ x: 0, y: 0 })
    const dragOffsetRef = useRef({ x: 0, y: 0 }) // offset from element center
    const charsRef = useRef<(HTMLSpanElement | null)[]>([]);

    const toggleFullScreen = () => setIsFullScreen(!isFullScreen);

    const defaultImage = 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1200&q=80';

    // Image Fallback Logic
    const [imgSrc, setImgSrc] = useState(imageUrl || defaultImage);

    useEffect(() => {
        setImgSrc(imageUrl || defaultImage);
    }, [imageUrl]);

    // Horizontal Scroll Wheel Logic (Non-passive for prevention)
    useEffect(() => {
        const container = containerRef.current;
        if (style !== 'horizontal-scroll' || !container) return;

        const handleWheel = (e: WheelEvent) => {
            if (e.deltaY !== 0) {
                e.preventDefault();
                container.scrollLeft += e.deltaY;
            }
        };

        container.addEventListener('wheel', handleWheel, { passive: false });

        return () => {
            container.removeEventListener('wheel', handleWheel);
        };
    }, [style, isFullScreen]);

    const handleImageError = () => {
        if (imgSrc !== defaultImage) {
            setImgSrc(defaultImage);
            toast({
                title: "Image Load Failed",
                description: "The image URL could not be loaded. Reverting to default.",
            })
        }
    };

    useEffect(() => {
        const scrollContainer = scrollContainerRef.current;
        const container = containerRef.current;
        const image = imageRef.current;
        const headlineEl = headlineRef.current;
        const overlay = overlayRef.current;

        if (!scrollContainer || !container || !image || !headlineEl) return;

        // Reset scroll position
        scrollContainer.scrollTop = 0;

        // Reset loading state when style changes
        if (style === 'canvas-scrubber') {
            setIsCanvasLoaded(false);
        }

        const ctx = gsap.context(() => {
            ScrollTrigger.getAll().forEach(st => st.kill());

            if (style === 'apple-zoom') {
                gsap.set(image, { scale: 2.5 });
                gsap.set(headlineEl, { opacity: 0 });

                const tl = gsap.timeline({
                    scrollTrigger: {
                        trigger: container,
                        scroller: scrollContainer,
                        start: 'top top',
                        end: 'bottom bottom',
                        scrub: 1,
                        onUpdate: (self) => setScrollProgress(Math.round(self.progress * 100)),
                    },
                });

                tl.to(image, { scale: 1, ease: 'none' }, 0);
                tl.to(headlineEl, { opacity: 1, ease: 'power2.out' }, 0.3);
            } else if (style === 'parallax-reveal') {
                gsap.set(image, { scale: 1.1 });
                gsap.set(headlineEl, { x: -80, opacity: 0 });
                if (overlay) gsap.set(overlay, { scaleY: 1 });

                const tl = gsap.timeline({
                    scrollTrigger: {
                        trigger: container,
                        scroller: scrollContainer,
                        start: 'top top',
                        end: 'bottom bottom',
                        scrub: 1,
                        onUpdate: (self) => setScrollProgress(Math.round(self.progress * 100)),
                    },
                });

                tl.to(image, { yPercent: -20, ease: 'none' }, 0);
                if (overlay) {
                    tl.to(overlay, { scaleY: 0, transformOrigin: 'top', ease: 'power2.inOut' }, 0);
                }
                tl.to(headlineEl, { x: 0, opacity: 1, ease: 'power3.out' }, 0.2);
            } else if (style === 'canvas-scrubber') {
                const canvas = canvasRef.current;
                const canvasCtx = canvas?.getContext('2d');

                if (canvas && canvasCtx) {
                    // FIX 1: Handle high-DPI (Retina) displays for sharpness
                    const dpr = window.devicePixelRatio || 1;
                    const rect = canvas.getBoundingClientRect();

                    canvas.width = rect.width * dpr;
                    canvas.height = rect.height * dpr;
                    canvasCtx.scale(dpr, dpr);

                    // Important: Set CSS style width/height to match
                    canvas.style.width = `${rect.width}px`;
                    canvas.style.height = `${rect.height}px`;

                    const images: HTMLImageElement[] = [];
                    const currentFrame = { value: 0 };
                    let frameCount = 60; // default

                    // Helper to load images
                    const loadImages = (sources: string[]) => {
                        frameCount = sources.length;
                        let loadedCount = 0;

                        const checkCompletion = () => {
                            loadedCount++;
                            if (loadedCount === frameCount) {
                                // Images ready (or failed, but we proceed)
                                render();
                                setIsCanvasLoaded(true); // Trigger fade-in
                            }
                        };

                        sources.forEach((src, i) => {
                            const img = new Image();
                            img.src = src;
                            img.onload = checkCompletion;
                            img.onerror = checkCompletion; // Proceed even on error
                            images.push(img);
                        });
                    };

                    const render = () => {
                        const frameIndex = Math.min(
                            Math.floor(currentFrame.value),
                            frameCount - 1
                        );
                        const img = images[frameIndex];

                        if (img && img.complete && img.naturalWidth > 0) {
                            // FIX 2: Clear canvas to prevent "Ghosting" shadows
                            canvasCtx.clearRect(0, 0, rect.width, rect.height);

                            // FIX 3: Use Math.min for "Contain" (Fit inside) instead of "Cover"
                            const scale = Math.min(rect.width / img.width, rect.height / img.height);

                            const x = (rect.width / 2) - (img.width / 2) * scale;
                            const y = (rect.height / 2) - (img.height / 2) * scale;

                            canvasCtx.drawImage(img, x, y, img.width * scale, img.height * scale);
                        }
                    };

                    // Determine which images to load
                    if (imageSequence && imageSequence.length > 0) {
                        loadImages(imageSequence);
                    } else {
                        // Apple Demo Fallback
                        const sequenceBase = "https://www.apple.com/105/media/us/airpods-pro/2019/1299e2f5_9206_4470_b28e_08307a42f19b/anim/sequence/large/01-hero-lightpass";
                        const sources = [];
                        for (let i = 0; i < 148; i++) { // Apple uses 148 frames
                            const index = (i + 1).toString().padStart(4, '0');
                            sources.push(`${sequenceBase}/${index}.jpg`);
                        }
                        loadImages(sources);
                    }

                    // Animation Logic
                    gsap.to(currentFrame, {
                        value: () => frameCount - 1,
                        ease: "none",
                        scrollTrigger: {
                            trigger: container,
                            scroller: scrollContainer,
                            start: "top top",
                            end: "bottom bottom",
                            scrub: 0,
                            onUpdate: (self) => {
                                render();
                                setScrollProgress(Math.round(self.progress * 100));
                            }
                        }
                    });
                }
            } else if (style === 'horizontal-scroll') {
                // native scroll, no gsap logic needed here
            }
        }, scrollContainer);

        return () => {
            ctx.revert();
            ScrollTrigger.getAll().forEach(st => st.kill());
        };
    }, [style, headline, imageUrl, imageSequence, scrollerRef]);

    // PHYSICS GRID: Velocity Tracker
    useEffect(() => {
        if (style !== 'physics-card') return;

        const handleMouseMove = (e: MouseEvent) => {
            const now = performance.now()
            const dt = now - lastTimeRef.current

            if (dt > 0) {
                const dx = e.clientX - lastMouseRef.current.x
                const dy = e.clientY - lastMouseRef.current.y

                velocityRef.current = {
                    x: dx / dt, // pixels per ms
                    y: dy / dt
                }
            }

            lastMouseRef.current = { x: e.clientX, y: e.clientY }
            lastTimeRef.current = now
        }

        window.addEventListener('mousemove', handleMouseMove)
        return () => window.removeEventListener('mousemove', handleMouseMove)
    }, [style]);

    const handlePhysicsHover = (e: React.MouseEvent<HTMLImageElement>) => {
        // Disable hover effect if dragging any card
        if (dragTargetRef.current) return;

        const target = e.currentTarget
        const { x, y } = velocityRef.current

        // Force multiplier
        const force = 20

        // 1. Push away based on velocity
        gsap.to(target, {
            x: x * force,
            y: y * force,
            rotation: Math.random() * 10 - 5, // Random wobble
            duration: 0.4,
            ease: "power3.out",
            overwrite: true,
            onComplete: () => {
                // 2. Elastic Recoil (Anti-Gravity)
                gsap.to(target, {
                    x: 0,
                    y: 0,
                    rotation: 0,
                    duration: 1.2,
                    ease: "elastic.out(1, 0.3)"
                })
            }
        })
    };

    // DRAG HANDLERS
    useEffect(() => {
        if (style !== 'physics-card') return;

        const handleMouseMove = (e: MouseEvent) => {
            if (!dragTargetRef.current) return;

            // Calculate new position relative to drag start
            // We want the card to follow the mouse exactly from where we grabbed it
            const dx = e.clientX - dragStartRef.current.x;
            const dy = e.clientY - dragStartRef.current.y;

            // Apply drag movement
            gsap.set(dragTargetRef.current, {
                x: dx,
                y: dy,
                rotation: dx * 0.05, // Slight rotation based on movement
                overwrite: true
            });
        };

        const handleMouseUp = (e: MouseEvent) => {
            if (!dragTargetRef.current) return;

            const target = dragTargetRef.current;
            dragTargetRef.current = null;
            document.body.style.cursor = 'default';

            // Click Detection: If we haven't moved much, it's a click
            const dx = Math.abs(e.clientX - dragStartRef.current.x);
            const dy = Math.abs(e.clientY - dragStartRef.current.y);

            if (dx < 5 && dy < 5) {
                const link = target.getAttribute('data-link');
                if (link && link !== '#') {
                    console.log("Opening Link:", link);
                    window.open(link, '_blank');
                } else {
                    console.log("Card Clicked (No Link)");
                }
            }

            // Snap back elastically
            gsap.to(target, {
                x: 0,
                y: 0,
                rotation: 0,
                scale: 1, // Reset scale
                zIndex: 0, // Reset z-index
                duration: 0.8,
                ease: "elastic.out(1, 0.4)"
            });
        };

        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        }
    }, [style]);

    // HYDRODYNAMIC TEXT: Viscous Magnetic Physics
    useEffect(() => {
        if (style !== 'hydrodynamic-text') return;

        const handleMouseMove = (e: MouseEvent) => {
            const mx = e.clientX;
            const my = e.clientY;

            // Default config values (safety fallback)
            const config = {
                viscosity: hydrodynamicConfig?.viscosity ?? 0.3,
                elasticity: hydrodynamicConfig?.elasticity ?? 0.2,
                radius: hydrodynamicConfig?.interactionRadius ?? 300,
                returnSpeed: hydrodynamicConfig?.returnSpeed ?? 1.2,
                rotationForce: hydrodynamicConfig?.rotationForce ?? 0.05
            };

            charsRef.current.forEach((char, i) => {
                if (!char) return;

                const rect = char.getBoundingClientRect();
                const cx = rect.left + rect.width / 2;
                const cy = rect.top + rect.height / 2;

                const dx = mx - cx;
                const dy = my - cy;
                const dist = Math.sqrt(dx * dx + dy * dy);

                if (dist < config.radius) {
                    // Calculate pull strength (viscous feel)
                    // The closer, the stronger the pull, but capped
                    const strength = gsap.utils.mapRange(0, config.radius, 1, 0, dist);
                    const pullX = dx * config.viscosity * strength;
                    const pullY = dy * config.viscosity * strength;

                    gsap.to(char, {
                        x: pullX,
                        y: pullY,
                        rotation: dx * config.rotationForce,
                        duration: 0.6,
                        ease: "power2.out",
                        overwrite: true
                    });
                } else {
                    // Snap back
                    gsap.to(char, {
                        x: 0,
                        y: 0,
                        rotation: 0,
                        duration: config.returnSpeed,
                        ease: `elastic.out(1, ${config.elasticity})`,
                        overwrite: true
                    });
                }
            });
        };

        const handleMouseLeave = () => {
            const config = {
                returnSpeed: hydrodynamicConfig?.returnSpeed ?? 1.2,
                elasticity: hydrodynamicConfig?.elasticity ?? 0.2,
            };

            charsRef.current.forEach(char => {
                if (char) {
                    gsap.to(char, {
                        x: 0,
                        y: 0,
                        rotation: 0,
                        duration: config.returnSpeed,
                        ease: `elastic.out(1, ${config.elasticity})`,
                        overwrite: true
                    });
                }
            });
        };

        // --- DRAG LOGIC ---
        // --- DRAG LOGIC ---
        let isDragging = false;
        let startX = 0;
        let startY = 0;
        let initialX = 0;
        let initialY = 0;
        let activeTarget: HTMLElement | null = null;

        const targets = [headlineRef.current, subtitleRef.current].filter(Boolean) as HTMLElement[];

        const onMouseDown = (e: MouseEvent) => {
            if (!hydrodynamicConfig?.isDraggable) return;
            const target = e.currentTarget as HTMLElement;
            activeTarget = target;
            isDragging = true;
            startX = e.clientX;
            startY = e.clientY;

            // Get current transform translate values
            const style = window.getComputedStyle(target);
            const matrix = new WebKitCSSMatrix(style.transform);
            initialX = matrix.m41;
            initialY = matrix.m42;

            target.style.cursor = 'grabbing';
            e.preventDefault(); // Prevent text selection
        };

        const onMouseMoveDrag = (e: MouseEvent) => {
            if (!isDragging || !activeTarget) return;
            const dx = e.clientX - startX;
            const dy = e.clientY - startY;

            gsap.set(activeTarget, {
                x: initialX + dx,
                y: initialY + dy,
                overwrite: 'auto'
            });
        };

        const onMouseUpDrag = () => {
            if (isDragging && activeTarget) {
                isDragging = false;
                activeTarget.style.cursor = hydrodynamicConfig?.isDraggable ? 'grab' : 'default';
                activeTarget = null;
            }
        };

        targets.forEach(target => {
            if (hydrodynamicConfig?.isDraggable) {
                target.addEventListener('mousedown', onMouseDown);
                target.style.cursor = 'grab';
            } else {
                target.style.cursor = 'default';
            }
        });

        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseleave', handleMouseLeave);
        if (hydrodynamicConfig?.isDraggable) {
            window.addEventListener('mousemove', onMouseMoveDrag);
            window.addEventListener('mouseup', onMouseUpDrag);
        }

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseleave', handleMouseLeave);
            if (hydrodynamicConfig?.isDraggable) {
                window.removeEventListener('mousemove', onMouseMoveDrag);
                window.removeEventListener('mouseup', onMouseUpDrag);
            }
            targets.forEach(target => {
                target.removeEventListener('mousedown', onMouseDown);
            });
        };
    }, [style, hydrodynamicConfig]);



    const handleCardMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
        const target = e.currentTarget; // The container div
        dragTargetRef.current = target;
        dragStartRef.current = { x: e.clientX, y: e.clientY };

        // Boost z-index and scale up slightly
        gsap.set(target, { zIndex: 50, scale: 1.05 });
        document.body.style.cursor = 'grabbing';
    };

    const [resetKey, setResetKey] = useState(0);

    const handleReplay = () => {
        if (scrollerRef?.current) {
            scrollerRef.current.scrollTop = 0;
        } else if (scrollContainerRef.current) {
            scrollContainerRef.current.scrollTop = 0;
        }

        // Handle Horizontal Scroll Reset
        if (containerRef.current) {
            containerRef.current.scrollTo({ left: 0, behavior: 'smooth' });
        }

        onReset?.(); // Trigger external reset
        setScrollProgress(0);
        setResetKey(prev => prev + 1);
    };

    const handleScrollToEnd = () => {
        if (scrollContainerRef.current) {
            scrollContainerRef.current.scrollTo({
                top: scrollContainerRef.current.scrollHeight,
                behavior: 'smooth',
            });
        }
        // Handle Horizontal Scroll Play
        if (containerRef.current) {
            containerRef.current.scrollTo({
                left: containerRef.current.scrollWidth,
                behavior: 'smooth',
            });
        }
    };

    // Text Drag Logic
    // Text Drag Logic
    const [draggingId, setDraggingId] = useState<number | null>(null);
    const textDragRef = useRef<{ x: number, y: number, initialX: number, initialY: number } | null>(null);
    const activeDragElementRef = useRef<HTMLDivElement | null>(null);

    const handleTextDragStart = (e: React.MouseEvent, itemId: number, currentPos: { x: number, y: number } = { x: 0, y: 0 }) => {
        e.stopPropagation();
        e.preventDefault();
        setDraggingId(itemId);
        // Store reference to the actual DOM element
        activeDragElementRef.current = e.currentTarget as HTMLDivElement;
        activeDragElementRef.current.style.cursor = 'grabbing';
        activeDragElementRef.current.style.transition = 'none'; // DISABLE TRANSITION FOR INSTANT DRAG

        textDragRef.current = {
            x: e.clientX,
            y: e.clientY,
            initialX: currentPos.x,
            initialY: currentPos.y
        };
    };

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (draggingId === null || !textDragRef.current || !activeDragElementRef.current) return;

            const deltaX = e.clientX - textDragRef.current.x;
            const deltaY = e.clientY - textDragRef.current.y;

            // Apply transform directly to DOM for 60fps performance
            // We DON'T update React state here
            const currentX = textDragRef.current.initialX + deltaX;
            const currentY = textDragRef.current.initialY + deltaY;

            activeDragElementRef.current.style.transform = `translate(${currentX}px, ${currentY}px)`;
        };

        const handleMouseUp = (e: MouseEvent) => {
            if (draggingId === null || !textDragRef.current || !horizontalConfig) return;

            // Commit final position to React state
            const deltaX = e.clientX - textDragRef.current.x;
            const deltaY = e.clientY - textDragRef.current.y;

            const finalPos = {
                x: textDragRef.current.initialX + deltaX,
                y: textDragRef.current.initialY + deltaY
            };

            const newItems = horizontalConfig.items.map(item =>
                item.id === draggingId ? { ...item, textPosition: finalPos } : item
            );

            onHorizontalConfigChange?.({ ...horizontalConfig, items: newItems });

            // Reset cursor and transition
            if (activeDragElementRef.current) {
                activeDragElementRef.current.style.cursor = 'move';
                activeDragElementRef.current.style.transition = ''; // RE-ENABLE CSS TRANSITION
            }

            setDraggingId(null);
            textDragRef.current = null;
            activeDragElementRef.current = null;
        };

        if (draggingId !== null) {
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp);
        }

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [draggingId, horizontalConfig, onHorizontalConfigChange]);

    // Move content to a variable to support Portal
    const content = (
        <div className={`${isFullScreen ? 'fixed inset-0 z-[9999] bg-black w-screen h-screen flex flex-col' : 'h-full flex flex-col relative'}`}>
            <div className="flex items-center justify-between p-4 border-b border-border/50 bg-[#0A0A0A] z-[10000] relative">
                <div className="flex items-center gap-4">
                    <div>
                        <h2 className="text-sm font-medium text-foreground">Preview</h2>
                        <p className="text-xs text-muted-foreground capitalize">
                            {style.replace('-', ' ')} • Scroll to animate
                        </p>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <div className="w-24 h-1.5 bg-secondary rounded-full overflow-hidden">
                            <div
                                className="h-full bg-primary transition-all duration-100 ease-out rounded-full"
                                style={{ width: `${scrollProgress}%` }}
                            />
                        </div>
                        <span className="w-8 text-right">{scrollProgress}%</span>
                    </div>
                </div>
                <div className="flex gap-2">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={toggleFullScreen}
                        className="text-muted-foreground hover:text-foreground hover:bg-white/10"
                    >
                        {isFullScreen ? (
                            <>
                                <Minimize2 className="w-4 h-4 mr-1.5" />
                                Exit
                            </>
                        ) : (
                            <>
                                <Maximize2 className="w-4 h-4 mr-1.5" />
                                Expand
                            </>
                        )}
                    </Button>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleReplay}
                        className="text-muted-foreground hover:text-foreground hover:bg-white/10"
                    >
                        <RotateCcw className="w-4 h-4 mr-1.5" />
                        Reset
                    </Button>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleScrollToEnd}
                        className="text-primary hover:text-primary hover:bg-primary/10"
                    >
                        <Play className="w-4 h-4 mr-1.5" />
                        Play
                    </Button>
                </div>
            </div>

            {/* Scrollable preview container */}
            <div
                ref={scrollerRef ? undefined : internalScrollRef}
                className={`flex-1 bg-black pointer-events-auto relative z-10 ${scrollerRef ? '' : 'overflow-y-auto overflow-x-hidden'
                    }`}
            >
                {style === 'physics-card' ? (
                    // PHYSICS GRID LAYOUT
                    <div ref={containerRef} className="min-h-full w-full flex items-center justify-center bg-[#050505]">
                        <div
                            className={`grid w-full max-w-6xl p-10 ${!gridSize || gridSize === 'medium' ? 'grid-cols-2 md:grid-cols-4' :
                                gridSize === 'small' ? 'grid-cols-3 md:grid-cols-6' :
                                    'grid-cols-1 md:grid-cols-2'
                                }`}
                            style={{ gap: physicsConfig?.gridGap ?? 16 }}
                        >
                            {(gridItems || []).map((item) => (
                                <div
                                    key={item.id}
                                    className="overflow-hidden bg-transparent aspect-square relative group cursor-grab active:cursor-grabbing transform-gpu"
                                    style={{ borderRadius: physicsConfig?.cardRadius ?? 12 }}
                                    onMouseDown={handleCardMouseDown}
                                    data-link={item.link} // Store link in data attribute for handler access
                                >
                                    <img
                                        src={item.image || imgSrc}
                                        onError={(e) => {
                                            (e.target as HTMLImageElement).src = defaultImage;
                                            // Optional: toast once if needed, but avoiding spam loop
                                        }}
                                        referrerPolicy="no-referrer"
                                        alt="Physics Item"
                                        className="w-full h-full object-cover pointer-events-none" // pointer-events-none on img so drag works on parent div
                                    // onMouseEnter={handlePhysicsHover} // Moved logic to parent or handle via useEffect for cleanliness if needed, but keeping hover on img is fine if we check drag state
                                    />

                                    {/* Text Overlay */}
                                    <div className={`absolute inset-0 flex items-center justify-center pointer-events-none z-20 transition-opacity duration-300 ${textAlwaysVisible ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                                        }`}>
                                        <span className="text-white font-bold text-lg drop-shadow-md bg-black/40 px-3 py-1 rounded-full backdrop-blur-sm">
                                            {item.text}
                                        </span>
                                    </div>

                                    {/* Helper to catch hover events for the physics push */}
                                    <div
                                        className="absolute inset-0 z-10"
                                        onMouseEnter={(e) => {
                                            if (dragTargetRef.current) return
                                            const parent = e.currentTarget.parentElement
                                            const { x, y } = velocityRef.current

                                            // Config Values
                                            const force = physicsConfig?.hoverForce ?? 20
                                            const maxRot = physicsConfig?.maxRotation ?? 5
                                            const snapDur = physicsConfig?.snapDuration ?? 1.2

                                            gsap.to(parent, {
                                                x: x * force,
                                                y: y * force,
                                                rotation: (Math.random() - 0.5) * maxRot * 2,
                                                duration: 0.4,
                                                ease: "power2.out",
                                                overwrite: true,
                                                onComplete: () => {
                                                    if (dragTargetRef.current === parent) return
                                                    gsap.to(parent, {
                                                        x: 0,
                                                        y: 0,
                                                        rotation: 0,
                                                        duration: snapDur,
                                                        ease: "elastic.out(1, 0.3)"
                                                    })
                                                }
                                            })
                                        }}
                                    />
                                    {/* Optional Overlay */}
                                    <div className="absolute inset-0 bg-black/20 pointer-events-none group-hover:bg-transparent transition-colors" />
                                </div>
                            ))}
                        </div>
                    </div>
                ) : style === 'horizontal-scroll' ? (
                    /* Native Horizontal Scroll Render (Netflix Style) */
                    <div
                        key={resetKey}
                        ref={containerRef}
                        className="h-full w-full bg-[#050505] overflow-x-auto overflow-y-hidden flex items-center scrollbar-hide"
                        onScroll={(e) => {
                            const target = e.currentTarget;
                            // Check start/end status
                            setIsAtStart(target.scrollLeft < 20);
                            setIsAtEnd(target.scrollLeft + target.clientWidth >= target.scrollWidth - 20);

                            // Update Scroll Progress
                            const maxScroll = target.scrollWidth - target.clientWidth;
                            if (maxScroll > 0) {
                                const progress = Math.round((target.scrollLeft / maxScroll) * 100);
                                setScrollProgress(progress);
                            }
                        }}
                        onWheel={(e) => {
                            if (e.deltaY !== 0) {
                                const container = e.currentTarget;
                                container.scrollLeft += e.deltaY * 0.5;

                                // Prevent page scroll if we can still scroll in that direction
                                const canScrollLeft = container.scrollLeft > 0;
                                const canScrollRight = container.scrollLeft < (container.scrollWidth - container.clientWidth);

                                if ((e.deltaY < 0 && canScrollLeft) || (e.deltaY > 0 && canScrollRight)) {
                                    // e.preventDefault(); // React synthetic events might warn about this if not passive, but let's try 
                                    // Actually, for horizontal scroll areas, simply modifying scrollLeft is often enough. 
                                    // But blocking native scroll is tricky with passive listeners.
                                }
                            }
                        }}
                    >
                        {/* Moving Track - Native Flex */}
                        <div className="flex gap-8 h-max items-center">

                            {/* Title Card */}
                            <div
                                className="w-[60vw] md:w-[40vw] h-[60vh] flex flex-col justify-center shrink-0 relative p-8 md:p-12 overflow-hidden rounded-[2rem]"
                                style={{ backgroundColor: horizontalConfig?.startCard?.backgroundColor || '#000000' }}
                            >
                                {horizontalConfig?.startCard?.image && (
                                    <img
                                        src={horizontalConfig.startCard.image}
                                        alt="Title Background"
                                        className="absolute inset-0 w-full h-full object-cover"
                                    />
                                )}
                                <div
                                    className="absolute inset-0 bg-gradient-to-r from-black via-black/40 via-60% to-transparent pointer-events-none"
                                    style={{ opacity: (horizontalConfig?.startCard?.backgroundOverlay ?? 80) / 100 }}
                                />
                                <div
                                    className="relative z-10 cursor-move select-none"
                                    style={{ mixBlendMode: horizontalConfig?.startCard?.blendMode ? 'difference' : 'normal' }}
                                    onMouseDown={(e) => {
                                        const card = e.currentTarget;
                                        const startX = e.clientX;
                                        const startY = e.clientY;
                                        const startLeft = parseFloat(card.style.left || '0');
                                        const startTop = parseFloat(card.style.top || '0');

                                        const handleMouseMove = (moveEvent: MouseEvent) => {
                                            const deltaX = moveEvent.clientX - startX;
                                            const deltaY = moveEvent.clientY - startY;
                                            card.style.left = `${startLeft + deltaX}px`;
                                            card.style.top = `${startTop + deltaY}px`;
                                        };

                                        const handleMouseUp = () => {
                                            document.removeEventListener('mousemove', handleMouseMove);
                                            document.removeEventListener('mouseup', handleMouseUp);
                                        };

                                        document.addEventListener('mousemove', handleMouseMove);
                                        document.addEventListener('mouseup', handleMouseUp);
                                    }}
                                >
                                    <h2
                                        className="text-6xl md:text-8xl font-bold leading-tight mb-6"
                                        style={{
                                            fontSize: `${horizontalConfig?.startCard?.headlineSize || 96}px`,
                                            ...(horizontalConfig?.startCard?.textGradient ? {
                                                backgroundImage: `linear-gradient(to right, ${horizontalConfig.startCard.gradientStart}, ${horizontalConfig.startCard.gradientEnd})`,
                                                backgroundClip: 'text',
                                                WebkitBackgroundClip: 'text',
                                                color: 'transparent'
                                            } : {
                                                color: horizontalConfig?.startCard?.textColor || '#ffffff'
                                            })
                                        }}
                                    >
                                        {headline}
                                    </h2>
                                    {horizontalConfig?.startCard?.subtitle && (
                                        <p
                                            className="text-lg opacity-70"
                                            style={{
                                                ...(horizontalConfig?.startCard?.textGradient ? {
                                                    backgroundImage: `linear-gradient(to right, ${horizontalConfig.startCard.gradientStart}, ${horizontalConfig.startCard.gradientEnd})`,
                                                    backgroundClip: 'text',
                                                    WebkitBackgroundClip: 'text',
                                                    color: 'transparent'
                                                } : {
                                                    color: horizontalConfig?.startCard?.textColor || '#ffffff'
                                                })
                                            }}
                                        >
                                            {horizontalConfig.startCard.subtitle}
                                        </p>
                                    )}
                                </div>
                            </div>

                            {/* Gallery Items */}
                            {(horizontalConfig?.items || [...Array(6)].map((_, i) => ({ id: i }))).map((item, i) => (
                                <div
                                    key={i}
                                    className="relative w-[80vw] md:w-[60vw] h-[60vh] bg-neutral-800 rounded-[2rem] overflow-hidden shrink-0 group cursor-pointer transition-transform duration-300 hover:scale-[0.98]"
                                    style={{
                                        borderRadius: horizontalConfig?.layout.radius ? `${horizontalConfig.layout.radius}px` : '2rem'
                                    }}
                                    onClick={() => {
                                        const link = (horizontalConfig && 'link' in item) ? (item as any).link : '#';
                                        if (link && link !== '#') {
                                            window.open(link, '_blank');
                                        }
                                    }}
                                >
                                    <img
                                        src={
                                            // Prefer item image, then sequence, then main imageUrl, then default
                                            (horizontalConfig && 'image' in item && item.image)
                                                ? (item as any).image
                                                : (imageSequence && imageSequence.length > 0)
                                                    ? imageSequence[i % imageSequence.length]
                                                    : (imageUrl || defaultImage)
                                        }
                                        alt="Gallery"
                                        loading="lazy"
                                        decoding="async"
                                        className="w-full h-full object-cover scale-105 group-hover:scale-100 transition-transform duration-700 ease-out"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60 group-hover:opacity-100 transition-opacity duration-300" />
                                    <div
                                        className={`absolute bottom-0 left-0 right-0 p-8 flex justify-between items-end transition-transform duration-300 ${(horizontalConfig && 'blendMode' in item && (item as any).blendMode) ? 'mix-blend-difference' : ''}`}
                                        style={{
                                            transform: `translate(${(item as any).textPosition?.x || 0}px, ${(item as any).textPosition?.y || 0}px)`,
                                            cursor: 'move'
                                        }}
                                        onMouseDown={(e) => handleTextDragStart(e, item.id, (item as any).textPosition)}
                                        onClick={(e) => e.stopPropagation()} // Prevent card click
                                    >
                                        <div>
                                            <h3
                                                className={`text-3xl font-bold mb-1 ${(horizontalConfig && 'textGradient' in item && (item as any).textGradient) ? 'bg-clip-text text-transparent' : ''}`}
                                                style={{
                                                    fontSize: horizontalConfig?.typography.titleSize ? `${horizontalConfig.typography.titleSize}px` : undefined,
                                                    backgroundImage: (horizontalConfig && 'textGradient' in item && (item as any).textGradient)
                                                        ? `linear-gradient(to bottom, ${(item as any).gradientStart || '#ffffff'}, ${(item as any).gradientEnd || '#999999'})`
                                                        : undefined,
                                                    WebkitBackgroundClip: (horizontalConfig && 'textGradient' in item && (item as any).textGradient) ? 'text' : undefined,
                                                    WebkitTextFillColor: (horizontalConfig && 'textGradient' in item && (item as any).textGradient) ? 'transparent' : undefined,
                                                    color: (horizontalConfig && 'textGradient' in item && (item as any).textGradient) ? undefined : ((horizontalConfig && 'textColor' in item) ? (item as any).textColor : '#ffffff')
                                                }}
                                            >
                                                {(horizontalConfig && 'title' in item) ? (item as any).title : `Project 0${i + 1}`}
                                            </h3>
                                            <p
                                                className="text-sm opacity-80"
                                                style={{
                                                    fontSize: horizontalConfig?.typography.labelSize ? `${horizontalConfig.typography.labelSize}px` : undefined,
                                                    color: (horizontalConfig && 'textColor' in item) ? (item as any).textColor : '#a3a3a3'
                                                }}
                                            >
                                                {(horizontalConfig && 'subtitle' in item) ? (item as any).subtitle : 'Interaction Design'}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ))}

                            {/* End Card */}
                            <div
                                className="w-[60vw] md:w-[40vw] h-[60vh] flex items-center justify-center shrink-0 relative overflow-hidden rounded-[2rem]"
                                style={{ backgroundColor: horizontalConfig?.endCard?.backgroundColor || '#000000' }}
                            >
                                {horizontalConfig?.endCard?.backgroundImage && (
                                    <img
                                        src={horizontalConfig.endCard.backgroundImage}
                                        alt="End Card Background"
                                        className="absolute inset-0 w-full h-full object-cover"
                                    />
                                )}
                                <div
                                    className="absolute inset-0 bg-gradient-to-l from-black via-black/40 via-60% to-transparent pointer-events-none"
                                    style={{ opacity: (horizontalConfig?.endCard?.backgroundOverlay ?? 50) / 100 }}
                                />
                                <div className="text-center group relative">
                                    <div
                                        className="cursor-move select-none relative"
                                        style={{ mixBlendMode: horizontalConfig?.endCard?.blendMode ? 'difference' : 'normal' }}
                                        onMouseDown={(e) => {
                                            const card = e.currentTarget;
                                            const startX = e.clientX;
                                            const startY = e.clientY;
                                            const startLeft = parseFloat(card.style.left || '0');
                                            const startTop = parseFloat(card.style.top || '0');

                                            const handleMouseMove = (moveEvent: MouseEvent) => {
                                                const deltaX = moveEvent.clientX - startX;
                                                const deltaY = moveEvent.clientY - startY;
                                                card.style.left = `${startLeft + deltaX}px`;
                                                card.style.top = `${startTop + deltaY}px`;
                                            };

                                            const handleMouseUp = () => {
                                                document.removeEventListener('mousemove', handleMouseMove);
                                                document.removeEventListener('mouseup', handleMouseUp);
                                            };

                                            document.addEventListener('mousemove', handleMouseMove);
                                            document.addEventListener('mouseup', handleMouseUp);
                                        }}
                                    >
                                        <h3
                                            className="text-4xl font-bold mb-4 group-hover:text-primary transition-colors"
                                            style={{
                                                fontSize: `${horizontalConfig?.endCard?.titleSize || 48}px`,
                                                ...(horizontalConfig?.endCard?.textGradient ? {
                                                    backgroundImage: `linear-gradient(to right, ${horizontalConfig.endCard.gradientStart}, ${horizontalConfig.endCard.gradientEnd})`,
                                                    backgroundClip: 'text',
                                                    WebkitBackgroundClip: 'text',
                                                    color: 'transparent'
                                                } : {
                                                    color: horizontalConfig?.endCard?.textColor || '#ffffff'
                                                })
                                            }}
                                        >
                                            {horizontalConfig?.cta?.text || 'Next Project?'}
                                        </h3>
                                        {horizontalConfig?.endCard?.subtitle && (
                                            <p
                                                className="text-lg opacity-70 mb-4"
                                                style={{
                                                    ...(horizontalConfig?.endCard?.textGradient ? {
                                                        backgroundImage: `linear-gradient(to right, ${horizontalConfig.endCard.gradientStart}, ${horizontalConfig.endCard.gradientEnd})`,
                                                        backgroundClip: 'text',
                                                        WebkitBackgroundClip: 'text',
                                                        color: 'transparent'
                                                    } : {
                                                        color: horizontalConfig?.endCard?.textColor || '#ffffff'
                                                    })
                                                }}
                                            >
                                                {horizontalConfig.endCard.subtitle}
                                            </p>
                                        )}
                                    </div>
                                    <div
                                        className="cursor-move select-none inline-block relative"
                                        onMouseDown={(e) => {
                                            e.stopPropagation();
                                            const card = e.currentTarget;
                                            const startX = e.clientX;
                                            const startY = e.clientY;
                                            const startLeft = parseFloat(card.style.left || '0');
                                            const startTop = parseFloat(card.style.top || '0');

                                            const handleMouseMove = (moveEvent: MouseEvent) => {
                                                const deltaX = moveEvent.clientX - startX;
                                                const deltaY = moveEvent.clientY - startY;
                                                card.style.left = `${startLeft + deltaX}px`;
                                                card.style.top = `${startTop + deltaY}px`;
                                            };

                                            const handleMouseUp = () => {
                                                document.removeEventListener('mousemove', handleMouseMove);
                                                document.removeEventListener('mouseup', handleMouseUp);
                                            };

                                            document.addEventListener('mousemove', handleMouseMove);
                                            document.addEventListener('mouseup', handleMouseUp);
                                        }}
                                    >
                                        <Button
                                            className="rounded-full px-8 py-6 text-lg bg-white text-black hover:bg-neutral-200 pointer-events-auto cursor-move"
                                            style={{ fontSize: `${horizontalConfig?.endCard?.buttonSize || 18}px` }}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                if (horizontalConfig?.cta?.link && horizontalConfig.cta.link !== '#') {
                                                    window.open(horizontalConfig.cta.link, '_blank');
                                                }
                                            }}
                                        >
                                            {horizontalConfig?.cta?.subtext || 'Get in touch'}
                                        </Button>
                                    </div>
                                </div>
                            </div>

                        </div>
                    </div>
                ) : style === 'hydrodynamic-text' ? (
                    // HYDRODYNAMIC TEXT LAYOUT
                    <div className="h-full w-full flex items-center justify-center bg-black/5">
                        <div
                            className="flex items-center justify-center overflow-hidden relative cursor-crosshair shadow-2xl"
                            style={{
                                backgroundColor: hydrodynamicConfig?.backgroundColor || '#050505',
                                width: `${hydrodynamicConfig?.blockWidth || 100}%`,
                                height: `${hydrodynamicConfig?.blockHeight || 100}%`
                            }}
                        >
                            {imageUrl && (
                                <img
                                    src={imageUrl}
                                    alt="Background"
                                    className="absolute inset-0 w-full h-full object-cover"
                                    style={{ opacity: hydrodynamicConfig?.imageOpacity ?? 0.5 }}
                                />
                            )}
                            <h1
                                ref={headlineRef}
                                className={`font-black select-none z-10 px-8 text-center leading-tight drop-shadow-lg ${hydrodynamicConfig?.blendMode ? 'mix-blend-difference' : ''}`}
                                style={{
                                    fontSize: `${hydrodynamicConfig?.fontSize || 120}px`,
                                    letterSpacing: `${hydrodynamicConfig?.letterSpacing || 0}em`,
                                    color: hydrodynamicConfig?.blendMode ? 'white' : (hydrodynamicConfig?.textColor || '#FFFFFF')
                                }}
                            >
                                {headline.split('').map((char, i) => (
                                    <span
                                        key={i}
                                        ref={el => {
                                            // Non-null assertion or check not strictly needed here as we assign directly
                                            if (el) charsRef.current[i] = el;
                                        }}
                                        className="inline-block will-change-transform origin-center"
                                    >
                                        {char === ' ' ? '\u00A0' : char}
                                    </span>
                                ))}
                            </h1>

                            {/* SUBTITLE */}
                            {hydrodynamicConfig?.subtitle && (
                                <div className="absolute top-3/4 w-full text-center px-8 pointer-events-none">
                                    <p
                                        ref={subtitleRef}
                                        className="font-medium select-none text-center leading-normal inline-block max-w-2xl pointer-events-auto drop-shadow-lg"
                                        style={{
                                            fontSize: `${hydrodynamicConfig?.subtitleFontSize || 24}px`,
                                            letterSpacing: `${hydrodynamicConfig?.letterSpacing || 0}em`,
                                            color: hydrodynamicConfig?.subtitleColor || '#9CA3AF'
                                        }}
                                    >
                                        {hydrodynamicConfig.subtitle.split('').map((char, i) => (
                                            <span
                                                key={`sub-${i}`}
                                                ref={el => {
                                                    if (el) charsRef.current[headline.length + i] = el;
                                                }}
                                                className="inline-block will-change-transform origin-center"
                                            >
                                                {char === ' ' ? '\u00A0' : char}
                                            </span>
                                        ))}
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                ) : (
                    // STANDARD SCROLL LAYOUT
                    <div
                        ref={containerRef}
                        className="h-[400%] relative"
                    >
                        {/* Sticky wrapper (25% height = 100% of view) */}
                        <div className="h-[25%] sticky top-0 overflow-hidden bg-black">

                            {/* Loading Indicator for Canvas */}
                            {style === 'canvas-scrubber' && !isCanvasLoaded && (
                                <div className="absolute inset-0 flex flex-col items-center justify-center z-20 text-white/50 bg-black">
                                    <Loader2 className="w-8 h-8 animate-spin mb-2" />
                                    <span className="text-xs">Loading 3D Sequence...</span>
                                </div>
                            )}

                            <canvas
                                ref={canvasRef}
                                className={`absolute inset-0 w-full h-full object-contain transition-opacity duration-700 ${style === 'canvas-scrubber'
                                    ? (isCanvasLoaded ? 'opacity-100' : 'opacity-0')
                                    : 'hidden'
                                    }`}
                            />

                            <img
                                ref={imageRef}
                                src={imgSrc}
                                alt="Preview"
                                className={`absolute inset-0 w-full h-full object-cover ${style === 'apple-zoom' ? 'scale-[2.5]' : 'h-[130%]'
                                    } ${style === 'canvas-scrubber' ? 'hidden' : ''} `}
                                onError={handleImageError}
                                referrerPolicy="no-referrer"
                            />
                            {style === 'parallax-reveal' && (
                                <div
                                    ref={overlayRef}
                                    className="absolute inset-0 bg-background origin-top"
                                />
                            )}
                            <div className={`absolute inset-0 bg-black/30 pointer-events-none ${style === 'apple-zoom' ? 'hidden' : ''}`} />
                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                <h1
                                    ref={headlineRef}
                                    className={`text-2xl md:text-3xl lg:text-4xl font-bold text-white text-center px-6 max-w-xl leading-tight mix-blend-difference ${style === 'apple-zoom' ? 'opacity-0' : ''
                                        } `}
                                >
                                    {headline || 'Your Headline Here'}
                                </h1>
                            </div>
                        </div>
                    </div>
                )}

                {/* Scroll indicator at bottom of sticky area */}
                {style !== 'physics-card' && style !== 'hydrodynamic-text' && (
                    <div
                        className={`absolute top-[85%] left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-white/50 pointer-events-none z-10 transition-opacity duration-300 ${style === 'horizontal-scroll' && !isAtStart && !isAtEnd ? 'opacity-0' : 'opacity-100'
                            }`}
                    >
                        {style === 'horizontal-scroll' ? (
                            <>
                                {isAtEnd && (
                                    <>
                                        <ArrowLeft className="w-4 h-4 animate-pulse" />
                                        <span className="text-xs">Scroll to left</span>
                                    </>
                                )}
                                {isAtStart && (
                                    <>
                                        <ArrowRight className="w-4 h-4 animate-pulse" />
                                        <span className="text-xs">Scroll to right</span>
                                    </>
                                )}
                            </>
                        ) : (
                            <>
                                <MousePointer2 className="w-4 h-4 animate-bounce" />
                                <span className="text-xs">Scroll to preview</span>
                            </>
                        )}
                    </div>
                )}
            </div>
        </div >
    );

    if (isFullScreen && typeof document !== "undefined") {
        return createPortal(content, document.body);
    }

    return content;
});