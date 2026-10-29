import { animate } from 'motion';
import { onScrollProgress } from './scroll-progress';
import { EffectDefinition } from './types';

// Zoom the picture inside the element when there is one, so its frame stays put.
const zoomTarget = (element: HTMLElement) =>
    element.tagName === 'IMG' ? element : element.querySelector<HTMLElement>('img') ?? element;

export const appleZoom: EffectDefinition = {
    id: 'apple-zoom',
    name: 'Apple Zoom',
    description: 'Starts zoomed in and settles as it scrolls into view',
    trigger: 'scroll',
    targets: ['image', 'box', 'text'],
    settings: [
        { key: 'startScale', label: 'Start zoom', min: 1.1, max: 2.5, step: 0.1, default: 1.5, unit: '×' }
    ],

    apply(element, settings, { scrollContainer }) {
        const target = zoomTarget(element);
        // A paused animation scrubbed by scroll position.
        const zoom = animate(target, { scale: [settings.startScale, 1] }, { duration: 1, ease: 'linear' });
        zoom.pause();
        const stopTracking = onScrollProgress(element, scrollContainer, (progress) => {
            zoom.time = progress;
        });

        return () => {
            stopTracking();
            zoom.cancel();
        };
    },

    code: {
        gsap: (s) => `import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

// Apple Zoom: add class="aether-apple-zoom" to an image or its container.
document.querySelectorAll(".aether-apple-zoom").forEach((el) => {
  const target = el.tagName === "IMG" ? el : el.querySelector("img") || el;
  gsap.fromTo(target, { scale: ${s.startScale} }, {
    scale: 1,
    ease: "none",
    scrollTrigger: { trigger: el, start: "top bottom", end: "center center", scrub: true },
  });
});
`,
        motion: (s) => `import { animate, scroll } from "motion";

// Apple Zoom: add class="aether-apple-zoom" to an image or its container.
document.querySelectorAll(".aether-apple-zoom").forEach((el) => {
  const target = el.tagName === "IMG" ? el : el.querySelector("img") || el;
  scroll(
    animate(target, { scale: [${s.startScale}, 1] }, { ease: "linear" }),
    { target: el, offset: ["start end", "center center"] }
  );
});
`
    }
};
