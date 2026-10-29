import { animate, AnimationPlaybackControls } from 'motion';
import { EffectDefinition } from './types';

// Overshoot of the spring back to rest (0 = none, 1 = very bouncy).
const SPRING_BOUNCE = 0.6;

const POINTER_TRACKING = `const pointer = { x: 0, y: 0, time: 0, vx: 0, vy: 0 };
window.addEventListener("mousemove", (e) => {
  const now = performance.now();
  const dt = now - pointer.time;
  if (dt > 0 && dt < 100) {
    pointer.vx = (e.clientX - pointer.x) / dt;
    pointer.vy = (e.clientY - pointer.y) / dt;
  }
  pointer.x = e.clientX;
  pointer.y = e.clientY;
  pointer.time = now;
});`;

export const physicsCard: EffectDefinition = {
    id: 'physics-card',
    name: 'Physics Card',
    description: 'Gets knocked away by the cursor and springs back',
    trigger: 'cursor',
    targets: ['image', 'box', 'text'],
    settings: [
        { key: 'hoverForce', label: 'Push', min: 1, max: 50, step: 1, default: 10 },
        { key: 'maxRotation', label: 'Max tilt', min: 1, max: 45, step: 1, default: 5, unit: '°' },
        { key: 'snapDuration', label: 'Spring back', min: 0.3, max: 3, step: 0.1, default: 1.2, unit: 's' }
    ],

    apply(element, settings) {
        // Cursor speed in px/ms, measured from the last few moves.
        const pointer = { x: 0, y: 0, time: 0, vx: 0, vy: 0 };
        let current: AnimationPlaybackControls | null = null;
        let stopped = false;

        const handleMove = (e: MouseEvent) => {
            const now = performance.now();
            const dt = now - pointer.time;
            if (dt > 0 && dt < 100) {
                pointer.vx = (e.clientX - pointer.x) / dt;
                pointer.vy = (e.clientY - pointer.y) / dt;
            }
            pointer.x = e.clientX;
            pointer.y = e.clientY;
            pointer.time = now;
        };

        const handleEnter = async () => {
            current?.stop();
            const push = animate(element, {
                x: pointer.vx * settings.hoverForce,
                y: pointer.vy * settings.hoverForce,
                rotate: (Math.random() * 2 - 1) * settings.maxRotation
            }, { duration: 0.4, ease: [0.22, 1, 0.36, 1] });
            current = push;
            await push;
            // A newer push or cleanup took over while this one ran.
            if (stopped || current !== push) return;
            current = animate(element, { x: 0, y: 0, rotate: 0 }, {
                type: 'spring',
                visualDuration: settings.snapDuration,
                bounce: SPRING_BOUNCE
            });
        };

        window.addEventListener('mousemove', handleMove);
        element.addEventListener('mouseenter', handleEnter);

        return () => {
            stopped = true;
            window.removeEventListener('mousemove', handleMove);
            element.removeEventListener('mouseenter', handleEnter);
            current?.stop();
            animate(element, { x: 0, y: 0, rotate: 0 }, { duration: 0 });
        };
    },

    code: {
        gsap: (s) => `import gsap from "gsap";

// Physics Card: add class="aether-physics-card" to the element.
${POINTER_TRACKING}

document.querySelectorAll(".aether-physics-card").forEach((el) => {
  el.addEventListener("mouseenter", () => {
    gsap.to(el, {
      x: pointer.vx * ${s.hoverForce},
      y: pointer.vy * ${s.hoverForce},
      rotation: (Math.random() * 2 - 1) * ${s.maxRotation},
      duration: 0.4,
      ease: "power3.out",
      overwrite: true,
      onComplete: () =>
        gsap.to(el, { x: 0, y: 0, rotation: 0, duration: ${s.snapDuration}, ease: "elastic.out(1, 0.3)" }),
    });
  });
});
`,
        motion: (s) => `import { animate } from "motion";

// Physics Card: add class="aether-physics-card" to the element.
${POINTER_TRACKING}

document.querySelectorAll(".aether-physics-card").forEach((el) => {
  el.addEventListener("mouseenter", async () => {
    await animate(el, {
      x: pointer.vx * ${s.hoverForce},
      y: pointer.vy * ${s.hoverForce},
      rotate: (Math.random() * 2 - 1) * ${s.maxRotation},
    }, { duration: 0.4, ease: [0.22, 1, 0.36, 1] });
    animate(el, { x: 0, y: 0, rotate: 0 }, { type: "spring", visualDuration: ${s.snapDuration}, bounce: ${SPRING_BOUNCE} });
  });
});
`
    }
};
