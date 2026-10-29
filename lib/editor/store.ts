import type { EffectId } from '@/lib/effect-library';

// An effect applied to an element; its id names an effect in lib/effect-library.
export type BehaviorType = EffectId;

export interface BehaviorConfig {
    id: string;
    type: BehaviorType;
    config?: Record<string, unknown>;
}

export interface EditorElement {
    id: string;
    type: 'text' | 'image' | 'box';
    name: string;
    content: string;
    style: React.CSSProperties;
    behaviors: BehaviorConfig[];
    isLocked?: boolean;
}

// Initial state with pre-populated sections
export const initialElements: EditorElement[] = [
    // Empty start
];
