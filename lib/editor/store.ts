export type BehaviorType = 'hydrodynamic' | 'physics-card' | 'apple-zoom';

export interface BehaviorConfig {
    id: string;
    type: BehaviorType;
    config?: Record<string, any>;
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

import { createDefaultElement } from './defaults';

// Initial state with pre-populated sections
export const initialElements: EditorElement[] = [
    // Empty start
];
