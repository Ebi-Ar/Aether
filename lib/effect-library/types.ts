// Ids are stored in saved pages and share links, so they never change.
export type EffectId = 'hydrodynamic' | 'physics-card' | 'apple-zoom';

// Element types an effect can be dropped onto (EditorElement['type']).
export type EffectTarget = 'text' | 'image' | 'box';

// What makes the effect move; the editor groups effects by it.
export type EffectTrigger = 'scroll' | 'cursor';

// One slider in the properties panel. `key` is stored in the element's
// behavior config, so it never changes either.
export interface EffectSetting {
    key: string;
    label: string;
    min: number;
    max: number;
    step: number;
    default: number;
    unit?: string;
}

export type EffectSettings = Record<string, number>;

export interface EffectContext {
    // The element the page scrolls inside (the editor canvas); the window when absent.
    scrollContainer?: HTMLElement;
}

// One effect, defined once: the editor's drag-and-drop runtime (Motion) and
// the code developers can copy (GSAP and Motion) both come from here.
export interface EffectDefinition {
    id: EffectId;
    name: string;
    description: string;
    trigger: EffectTrigger;
    targets: EffectTarget[];
    settings: EffectSetting[];
    // Starts the effect on an element and returns a function that stops it.
    apply: (element: HTMLElement, settings: EffectSettings, context: EffectContext) => () => void;
    code: {
        gsap: (settings: EffectSettings) => string;
        motion: (settings: EffectSettings) => string;
    };
}
