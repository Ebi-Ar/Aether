import type { CSSProperties } from 'react';
import { isEffectId } from '@/lib/effect-library';
import { BehaviorConfig, EditorElement } from './store';

export interface EditorPage {
    id: string;
    name: string;
}

// Everything needed to restore an editor session. Shared through /view links
// and saved in the browser, so it is validated before use.
export interface EditorDocument {
    elements: EditorElement[];
    pages: EditorPage[];
    activePageId: string;
}

export const DEFAULT_PAGES: EditorPage[] = [{ id: 'home', name: 'Home' }];

const MIN_CANVAS_HEIGHT = 800;
const ESTIMATED_AUTO_HEIGHT = 100;

const ELEMENT_TYPES = new Set<string>(['text', 'image', 'box']);

const isRecord = (value: unknown): value is Record<string, unknown> =>
    typeof value === 'object' && value !== null && !Array.isArray(value);

function parseStyle(value: unknown): CSSProperties | null {
    if (!isRecord(value)) return null;
    const style: Record<string, string | number> = {};
    for (const [key, entry] of Object.entries(value)) {
        if (typeof entry === 'string' || typeof entry === 'number') style[key] = entry;
    }
    return style as CSSProperties;
}

function parseBehavior(value: unknown): BehaviorConfig | null {
    if (!isRecord(value)) return null;
    if (typeof value.id !== 'string' || typeof value.type !== 'string' || !isEffectId(value.type)) return null;
    if (value.config !== undefined && !isRecord(value.config)) return null;
    return { id: value.id, type: value.type, config: value.config };
}

function parseElement(value: unknown): EditorElement | null {
    if (!isRecord(value)) return null;
    const { id, type, name, content, isLocked } = value;
    if (typeof id !== 'string' || !id) return null;
    if (typeof type !== 'string' || !ELEMENT_TYPES.has(type)) return null;
    if (typeof name !== 'string' || typeof content !== 'string') return null;
    if (isLocked !== undefined && typeof isLocked !== 'boolean') return null;

    const style = parseStyle(value.style);
    if (!style || !Array.isArray(value.behaviors)) return null;
    const behaviors = value.behaviors.map(parseBehavior);
    if (behaviors.some(b => b === null)) return null;

    return {
        id,
        type: type as EditorElement['type'],
        name,
        content,
        style,
        behaviors: behaviors as BehaviorConfig[],
        ...(isLocked !== undefined ? { isLocked } : {})
    };
}

// Returns null when the value isn't a well-formed document.
export function parseEditorDocument(value: unknown): EditorDocument | null {
    if (!isRecord(value) || !Array.isArray(value.elements)) return null;

    const elements = value.elements.map(parseElement);
    if (elements.some(el => el === null)) return null;

    let pages = DEFAULT_PAGES;
    if (value.pages !== undefined) {
        if (!Array.isArray(value.pages)) return null;
        const valid = value.pages.every(p => isRecord(p) && typeof p.id === 'string' && typeof p.name === 'string');
        if (!valid) return null;
        pages = (value.pages as EditorPage[]).map(({ id, name }) => ({ id, name }));
    }

    const activePageId = typeof value.activePageId === 'string' ? value.activePageId : pages[0]?.id ?? 'home';

    return { elements: elements as EditorElement[], pages, activePageId };
}

// The canvas grows to fit its lowest element; elements with an automatic
// height are estimated.
export function computeCanvasHeight(elements: EditorElement[]): number {
    let maxBottom = MIN_CANVAS_HEIGHT;
    elements.forEach(el => {
        const top = parseInt(el.style.top?.toString() || '0');
        const hStr = el.style.height?.toString();
        const height = hStr && hStr.endsWith('px') ? parseInt(hStr) : ESTIMATED_AUTO_HEIGHT;
        if (top + height > maxBottom) {
            maxBottom = top + height;
        }
    });
    return maxBottom;
}
