import { animate } from 'motion';
import { EffectDefinition, EffectSettings } from './types';

// Bounciness slider (0-1) as a Motion spring bounce and as a GSAP elastic
// period (GSAP wobbles more as its period gets smaller).
const springBounce = (s: EffectSettings) => Math.round((0.3 + s.elasticity * 0.6) * 100) / 100;
const elasticPeriod = (s: EffectSettings) => Math.round((0.6 - s.elasticity * 0.45) * 100) / 100;

// Splits the element's text into one inline-block span per letter so each can
// move on its own. Letters are grouped per word (kept on one line) with the
// spaces left as text, so lines still only break between words. Built with
// textContent, so text is never parsed as markup. Elements that already have
// child elements are animated as they are.
function splitLetters(element: HTMLElement): HTMLElement[] {
    const text = element.innerText;
    if (element.children.length > 0 || text.trim().length === 0) {
        return Array.from(element.children) as HTMLElement[];
    }

    const letters: HTMLElement[] = [];
    const nodes = text.split(/(\s+)/).filter(Boolean).map(part => {
        if (/^\s+$/.test(part)) return document.createTextNode(part);
        const word = document.createElement('span');
        word.style.cssText = 'display:inline-block; white-space:nowrap;';
        for (const char of part) {
            const letter = document.createElement('span');
            letter.style.cssText = 'display:inline-block; user-select:none; vertical-align:baseline;';
            letter.textContent = char;
            word.appendChild(letter);
            letters.push(letter);
        }
        return word;
    });
    element.replaceChildren(...nodes);
    return letters;
}

const SPLIT_LETTERS_CODE = `  // One span per letter, grouped per word so lines only break between words.
  const chars = [];
  const parts = el.textContent.split(/(\\s+)/).filter(Boolean);
  el.textContent = "";
  parts.forEach((part) => {
    if (/^\\s+$/.test(part)) return el.append(part);
    const word = document.createElement("span");
    word.style.display = "inline-block";
    word.style.whiteSpace = "nowrap";
    for (const char of part) {
      const letter = document.createElement("span");
      letter.style.display = "inline-block";
      letter.textContent = char;
      word.appendChild(letter);
      chars.push(letter);
    }
    el.appendChild(word);
  });`;

export const hydrodynamicText: EffectDefinition = {
    id: 'hydrodynamic',
    name: 'Hydrodynamic Text',
    description: 'Letters are pulled toward the cursor like liquid',
    trigger: 'cursor',
    targets: ['text'],
    settings: [
        { key: 'viscosity', label: 'Pull', min: 0.1, max: 1, step: 0.1, default: 0.3 },
        { key: 'interactionRadius', label: 'Reach', min: 50, max: 500, step: 10, default: 150, unit: 'px' },
        { key: 'rotationForce', label: 'Twist', min: 0, max: 0.2, step: 0.01, default: 0.05 },
        { key: 'elasticity', label: 'Bounciness', min: 0, max: 1, step: 0.1, default: 0.2 },
        { key: 'returnSpeed', label: 'Return time', min: 0.3, max: 3, step: 0.1, default: 1.2, unit: 's' }
    ],

    apply(element, settings) {
        const originalHtml = element.innerHTML;
        const chars = splitLetters(element);
        // Letters currently pulled away from rest, so only they get sent back.
        const displaced = new Set<HTMLElement>();
        const pointer = { x: 0, y: 0 };
        let frame = 0;

        const returnToRest = (char: HTMLElement) => {
            displaced.delete(char);
            animate(char, { x: 0, y: 0, rotate: 0 }, {
                type: 'spring',
                visualDuration: settings.returnSpeed,
                bounce: springBounce(settings)
            });
        };

        const update = () => {
            frame = 0;
            // Pull distances are in the element's own units, so undo any
            // scaling of the page around it (the editor's zoomed canvas).
            const rect = element.getBoundingClientRect();
            const scale = element.offsetWidth > 0 && rect.width > 0 ? rect.width / element.offsetWidth : 1;

            for (const char of chars) {
                const box = char.getBoundingClientRect();
                const dx = pointer.x - (box.left + box.width / 2);
                const dy = pointer.y - (box.top + box.height / 2);
                const distance = Math.hypot(dx, dy);

                if (distance < settings.interactionRadius) {
                    const strength = 1 - distance / settings.interactionRadius;
                    displaced.add(char);
                    animate(char, {
                        x: (dx * settings.viscosity * strength) / scale,
                        y: (dy * settings.viscosity * strength) / scale,
                        rotate: dx * settings.rotationForce
                    }, { duration: 0.6, ease: 'easeOut' });
                } else if (displaced.has(char)) {
                    returnToRest(char);
                }
            }
        };

        const handleMove = (e: MouseEvent) => {
            pointer.x = e.clientX;
            pointer.y = e.clientY;
            if (!frame) frame = requestAnimationFrame(update);
        };
        const handleLeave = () => displaced.forEach(returnToRest);

        window.addEventListener('mousemove', handleMove);
        element.addEventListener('mouseleave', handleLeave);

        return () => {
            window.removeEventListener('mousemove', handleMove);
            element.removeEventListener('mouseleave', handleLeave);
            if (frame) cancelAnimationFrame(frame);
            // Put back the markup from before the letters were split, unless the
            // page has already replaced the content (e.g. the text was edited).
            if (chars.every(char => element.contains(char))) {
                element.innerHTML = originalHtml;
            }
        };
    },

    code: {
        gsap: (s) => `import gsap from "gsap";

// Hydrodynamic Text: add class="aether-hydrodynamic-text" to a text element.
document.querySelectorAll(".aether-hydrodynamic-text").forEach((el) => {
${SPLIT_LETTERS_CODE}

  window.addEventListener("mousemove", (e) => {
    chars.forEach((char) => {
      const box = char.getBoundingClientRect();
      const dx = e.clientX - (box.left + box.width / 2);
      const dy = e.clientY - (box.top + box.height / 2);
      const distance = Math.hypot(dx, dy);
      if (distance < ${s.interactionRadius}) {
        const strength = 1 - distance / ${s.interactionRadius};
        gsap.to(char, {
          x: dx * ${s.viscosity} * strength,
          y: dy * ${s.viscosity} * strength,
          rotation: dx * ${s.rotationForce},
          duration: 0.6,
          ease: "power2.out",
          overwrite: true,
        });
      } else {
        gsap.to(char, {
          x: 0, y: 0, rotation: 0,
          duration: ${s.returnSpeed},
          ease: "elastic.out(1, ${elasticPeriod(s)})",
          overwrite: true,
        });
      }
    });
  });
});
`,
        motion: (s) => `import { animate } from "motion";

// Hydrodynamic Text: add class="aether-hydrodynamic-text" to a text element.
document.querySelectorAll(".aether-hydrodynamic-text").forEach((el) => {
${SPLIT_LETTERS_CODE}
  const displaced = new Set();

  window.addEventListener("mousemove", (e) => {
    chars.forEach((char) => {
      const box = char.getBoundingClientRect();
      const dx = e.clientX - (box.left + box.width / 2);
      const dy = e.clientY - (box.top + box.height / 2);
      const distance = Math.hypot(dx, dy);
      if (distance < ${s.interactionRadius}) {
        const strength = 1 - distance / ${s.interactionRadius};
        displaced.add(char);
        animate(char, {
          x: dx * ${s.viscosity} * strength,
          y: dy * ${s.viscosity} * strength,
          rotate: dx * ${s.rotationForce},
        }, { duration: 0.6, ease: "easeOut" });
      } else if (displaced.has(char)) {
        displaced.delete(char);
        animate(char, { x: 0, y: 0, rotate: 0 }, { type: "spring", visualDuration: ${s.returnSpeed}, bounce: ${springBounce(s)} });
      }
    });
  });
});
`
    }
};
