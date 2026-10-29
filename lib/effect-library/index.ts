import { appleZoom } from './apple-zoom';
import { hydrodynamicText } from './hydrodynamic-text';
import { physicsCard } from './physics-card';
import { EffectDefinition, EffectId, EffectSettings, EffectTrigger } from './types';

export type { EffectContext, EffectDefinition, EffectId, EffectSetting, EffectSettings, EffectTarget, EffectTrigger } from './types';

// Every effect Aether offers. Add a new one here and it appears in the
// editor's Effects tab, its properties panel and its copyable code.
export const EFFECTS: Record<EffectId, EffectDefinition> = {
    'hydrodynamic': hydrodynamicText,
    'physics-card': physicsCard,
    'apple-zoom': appleZoom
};

export const EFFECT_LIST: EffectDefinition[] = Object.values(EFFECTS);

export const EFFECT_TRIGGER_LABELS: Record<EffectTrigger, string> = {
    scroll: 'Scroll',
    cursor: 'Cursor'
};

export const isEffectId = (value: string): value is EffectId => value in EFFECTS;

// A behavior's stored config with every setting filled in: saved numbers win,
// anything missing or not a number falls back to the setting's default.
export function resolveSettings(effect: EffectDefinition, config?: Record<string, unknown>): EffectSettings {
    const settings: EffectSettings = {};
    for (const setting of effect.settings) {
        const value = config?.[setting.key];
        settings[setting.key] = typeof value === 'number' && Number.isFinite(value) ? value : setting.default;
    }
    return settings;
}
