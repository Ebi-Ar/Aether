import gsap from 'gsap';

export interface HydrodynamicConfig {
    viscosity: number;
    elasticity: number;
    interactionRadius: number;
    returnSpeed: number;
    rotationForce: number;
    isDraggable?: boolean;
}

export function applyHydrodynamicBehavior(
    element: HTMLElement,
    config: Partial<HydrodynamicConfig> = {}
) {
    const fullConfig = {
        viscosity: 0.3,
        elasticity: 0.2,
        interactionRadius: 150,
        returnSpeed: 1.2,
        rotationForce: 0.05,
        ...config
    };
    // We assume the element itself or its children are the characters to be animated.
    // If it's a single block, we might need to split it into spans if it's not already.
    // For now, let's assume the element passed is the CONTAINER of characters.

    // Check if we need to split text
    const textContent = element.innerText;
    // Simple check: if it has no span children, split it
    if (element.children.length === 0 && textContent.trim().length > 0) {
        element.innerHTML = textContent.split('').map(char =>
            `<span style="display:inline-block; user-select:none; vertical-align:baseline;">${char === ' ' ? '&nbsp;' : char}</span>`
        ).join('');
    }

    const chars = Array.from(element.children) as HTMLElement[];

    const handleMouseMove = (e: MouseEvent) => {
        const mx = e.clientX;
        const my = e.clientY;

        // Calculate current visual scale to normalize forces
        // If the container is scaled (CMD+ vs CMD- or CSS transform), we need to adjust the applied translation
        const rect = element.getBoundingClientRect(); // Visual dimensions
        const layoutWidth = element.offsetWidth; // Layout dimensions
        const scale = (layoutWidth > 0 && rect.width > 0) ? (rect.width / layoutWidth) : 1;

        chars.forEach((char) => {
            const charRect = char.getBoundingClientRect();
            const cx = charRect.left + charRect.width / 2;
            const cy = charRect.top + charRect.height / 2;

            const dx = mx - cx;
            const dy = my - cy;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < fullConfig.interactionRadius) {
                const strength = gsap.utils.mapRange(0, fullConfig.interactionRadius, 1, 0, dist);
                // Adjust pull force by scale to keep visual movement 1:1 with mouse
                const pullX = (dx * fullConfig.viscosity * strength) / scale;
                const pullY = (dy * fullConfig.viscosity * strength) / scale;

                gsap.to(char, {
                    x: pullX,
                    y: pullY,
                    rotation: dx * fullConfig.rotationForce,
                    duration: 0.6,
                    ease: "power2.out",
                    overwrite: true
                });
            } else {
                gsap.to(char, {
                    x: 0,
                    y: 0,
                    rotation: 0,
                    duration: fullConfig.returnSpeed,
                    ease: `elastic.out(1, ${fullConfig.elasticity})`,
                    overwrite: true
                });
            }
        });
    };

    const handleMouseLeave = () => {
        chars.forEach(char => {
            gsap.to(char, {
                x: 0,
                y: 0,
                rotation: 0,
                duration: fullConfig.returnSpeed,
                ease: `elastic.out(1, ${fullConfig.elasticity})`,
                overwrite: true
            });
        });
    };

    window.addEventListener('mousemove', handleMouseMove);
    element.addEventListener('mouseleave', handleMouseLeave);

    // Return cleanup function
    return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        element.removeEventListener('mouseleave', handleMouseLeave);
        // Optional: revert text split? keeping it simple for now
    };
}
