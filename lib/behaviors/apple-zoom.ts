import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

if (typeof window !== "undefined") {
    gsap.registerPlugin(ScrollTrigger);
}

export function applyAppleZoomBehavior(element: HTMLElement, config?: any) {
    // Ensure we are targeting an image if possible, or scale the container
    const target = element.tagName === 'IMG' ? element : element.querySelector('img') || element;

    // Set initial state
    gsap.set(target, { scale: 1.5 });

    // We need a scroll container. For the editor, it's the specific parent with overflow.
    // In a real page, it's the window or body.
    // For now, let's try to find the closest scrollable parent or use the window if in full page mode.
    // In the editor, ".overflow-auto" of the canvas is the scroller.
    const scroller = element.closest('.overflow-auto') || window;

    const anim = gsap.to(target, {
        scale: 1,
        ease: 'none',
        scrollTrigger: {
            trigger: element,
            scroller: scroller,
            start: 'top bottom', // Start when top of element hits bottom of viewport
            end: 'center center', // End when center of element hits center of viewport
            scrub: true,
        }
    });

    return () => {
        anim.kill();
        if (anim.scrollTrigger) anim.scrollTrigger.kill();
        gsap.set(target, { scale: 1 }); // Reset
    };
}
