import gsap from 'gsap';

export interface PhysicsCardConfig {
    hoverForce: number;
    maxRotation: number;
    snapDuration: number;
}

export function applyPhysicsCardBehavior(
    element: HTMLElement,
    config: Partial<PhysicsCardConfig> = {}
) {
    const fullConfig = {
        hoverForce: 10,
        maxRotation: 5,
        snapDuration: 1.2,
        ...config
    };
    const state = {
        lastMouse: { x: 0, y: 0 },
        velocity: { x: 0, y: 0 },
        lastTime: 0
    };

    const handleWindowMouseMove = (e: MouseEvent) => {
        const now = performance.now();
        const dt = now - state.lastTime;

        if (dt > 0) {
            const dx = e.clientX - state.lastMouse.x;
            const dy = e.clientY - state.lastMouse.y;
            state.velocity = { x: dx / dt, y: dy / dt };
        }

        state.lastMouse = { x: e.clientX, y: e.clientY };
        state.lastTime = now;
    };

    const handleMouseEnter = (e: MouseEvent) => {
        const { x, y } = state.velocity;

        // Push away based on velocity
        gsap.to(element, {
            x: x * fullConfig.hoverForce,
            y: y * fullConfig.hoverForce,
            rotation: Math.random() * fullConfig.maxRotation * 2 - fullConfig.maxRotation,
            duration: 0.4,
            ease: "power3.out",
            overwrite: true,
            onComplete: () => {
                // Elastic Recoil
                gsap.to(element, {
                    x: 0,
                    y: 0,
                    rotation: 0,
                    duration: fullConfig.snapDuration,
                    ease: "elastic.out(1, 0.3)"
                });
            }
        });
    };

    window.addEventListener('mousemove', handleWindowMouseMove);
    element.addEventListener('mouseenter', handleMouseEnter);

    return () => {
        window.removeEventListener('mousemove', handleWindowMouseMove);
        element.removeEventListener('mouseenter', handleMouseEnter);
    };
}
