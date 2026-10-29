// Reports scroll progress from 0 to 1 as an element travels from just below
// the viewport (its top at the viewport's bottom) to the middle (its centre at
// the viewport's centre), like GSAP's start: "top bottom", end: "center center".
//
// Positions are measured on screen rather than from layout offsets, so the
// progress stays right when the page is drawn scaled (the editor's zoomed
// canvas), and the element's centre is used because scaling the element
// itself doesn't move it.
export function onScrollProgress(
    element: HTMLElement,
    container: HTMLElement | undefined,
    onProgress: (progress: number) => void
): () => void {
    let frame = 0;

    const update = () => {
        frame = 0;
        const viewport = container
            ? container.getBoundingClientRect()
            : { top: 0, bottom: window.innerHeight, height: window.innerHeight };

        // How much the page around the element is scaled on screen.
        const parent = element.offsetParent as HTMLElement | null;
        const pageScale = parent && parent.offsetWidth > 0
            ? parent.getBoundingClientRect().width / parent.offsetWidth
            : 1;
        const height = element.offsetHeight * pageScale;

        const rect = element.getBoundingClientRect();
        const center = rect.top + rect.height / 2;
        const start = viewport.bottom + height / 2;
        const end = viewport.top + viewport.height / 2;
        const progress = start === end ? 1 : (start - center) / (start - end);
        onProgress(Math.min(1, Math.max(0, progress)));
    };

    const schedule = () => {
        if (!frame) frame = requestAnimationFrame(update);
    };

    const scroller: HTMLElement | Window = container ?? window;
    scroller.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);
    update();

    return () => {
        scroller.removeEventListener('scroll', schedule);
        window.removeEventListener('resize', schedule);
        if (frame) cancelAnimationFrame(frame);
    };
}
