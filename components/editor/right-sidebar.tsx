import React from 'react';
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Slider } from "@/components/ui/slider";
import { EditorElement } from '@/lib/editor/store';

interface RightSidebarProps {
    element?: EditorElement;
    elements?: EditorElement[];
    onUpdate?: (updates: Partial<EditorElement>) => void;
    onUpdateBehavior?: (behaviorId: string, updates: Record<string, unknown>) => void;
    onRemoveBehavior?: (behaviorId: string) => void;
    onDelete?: () => void;
}

export function RightSidebar({ element, elements = [], onUpdate, onUpdateBehavior, onRemoveBehavior, onDelete }: RightSidebarProps) {
    if (!element) {
        return (
            <div className="h-full flex items-center justify-center text-xs text-muted-foreground p-4 text-center">
                Select an element to edit properties
            </div>
        );
    }

    const style = element.style || {};
    const behaviors = element.behaviors || [];

    const updateStyle = (newStyle: React.CSSProperties) => {
        onUpdate?.({ style: { ...style, ...newStyle } });
    };

    const parsePx = (value: string | number | undefined, fallback = 0) => {
        if (value === undefined || value === null) return fallback;
        const num = parseFloat(String(value).replace('px', '').trim());
        return Number.isFinite(num) ? num : fallback;
    };

    const currentLeft = parsePx(style.left, 0);
    const currentTop = parsePx(style.top, 0);
    const canvasMetrics = (() => {
        if (typeof document === 'undefined') {
            return { width: 900, height: 2500 };
        }
        const canvasNode = document.getElementById('canvas-droppable');
        return {
            width: canvasNode?.offsetWidth ?? 900,
            height: canvasNode?.offsetHeight ?? 2500
        };
    })();

    const parseDimension = (value: string | number | undefined, axis: 'x' | 'y', fallback = 0) => {
        if (value === undefined || value === null) return fallback;
        const raw = String(value).trim();
        if (!raw) return fallback;
        if (raw.endsWith('%')) {
            const percent = parseFloat(raw.replace('%', ''));
            if (!Number.isFinite(percent)) return fallback;
            const base = axis === 'x' ? canvasMetrics.width : canvasMetrics.height;
            return (base * percent) / 100;
        }
        const numeric = parseFloat(raw.replace('px', ''));
        return Number.isFinite(numeric) ? numeric : fallback;
    };

    const getElementSize = (elId: string, css: React.CSSProperties) => {
        const cssWidth = parseDimension(css.width as string | number | undefined, 'x', 0);
        const cssHeight = parseDimension(css.height as string | number | undefined, 'y', 0);
        if (cssWidth > 0 && cssHeight > 0) {
            return { width: cssWidth, height: cssHeight };
        }
        if (typeof document !== 'undefined') {
            const node = document.getElementById(elId);
            if (node) {
                return { width: node.offsetWidth, height: node.offsetHeight };
            }
        }
        return { width: Math.max(cssWidth, 1), height: Math.max(cssHeight, 1) };
    };
    const currentSize = getElementSize(element.id, style);

    const containingSectionRect = (() => {
        const activeRect = {
            left: currentLeft,
            top: currentTop,
            right: currentLeft + currentSize.width,
            bottom: currentTop + currentSize.height
        };
        const centerX = (activeRect.left + activeRect.right) / 2;
        const centerY = (activeRect.top + activeRect.bottom) / 2;

        const sections = elements
            .filter((el) => el.id.endsWith('-bg') && el.id !== element.id)
            .map((el) => {
                const top = parsePx(el.style?.top, 0);
                const left = parsePx(el.style?.left, 0);
                const size = getElementSize(el.id, el.style || {});
                return {
                    top,
                    left,
                    right: left + size.width,
                    bottom: top + size.height
                };
            })
            .filter((rect) => centerX >= rect.left && centerX <= rect.right && centerY >= rect.top && centerY <= rect.bottom)
            .sort((a, b) => (a.right - a.left) * (a.bottom - a.top) - (b.right - b.left) * (b.bottom - b.top));

        return sections[0] ?? null;
    })();

    const wallRect = (() => {
        if (containingSectionRect) return containingSectionRect;
        return {
            left: 0,
            top: 0,
            right: canvasMetrics.width,
            bottom: canvasMetrics.height
        };
    })();

    const sideGaps = (() => {
        const activeRect = {
            left: currentLeft,
            top: currentTop,
            right: currentLeft + currentSize.width,
            bottom: currentTop + currentSize.height
        };
        const overlapThreshold = 8;
        type GapCandidate = {
            side: 'left' | 'right' | 'top' | 'bottom';
            relation: 'inside' | 'outside';
            value: number;
            refLeft: number;
            refRight: number;
            refTop: number;
            refBottom: number;
        };
        let left: GapCandidate | null = null;
        let right: GapCandidate | null = null;
        let top: GapCandidate | null = null;
        let bottom: GapCandidate | null = null;

        elements.forEach((other) => {
            if (other.id === element.id) return;
            if (other.id.endsWith('-bg')) return; // section boundaries handled explicitly below
            const otherLeft = parsePx(other.style?.left, 0);
            const otherTop = parsePx(other.style?.top, 0);
            const otherSize = getElementSize(other.id, other.style || {});
            const otherRect = {
                left: otherLeft,
                top: otherTop,
                right: otherLeft + otherSize.width,
                bottom: otherTop + otherSize.height
            };

            const overlapY = Math.min(activeRect.bottom, otherRect.bottom) - Math.max(activeRect.top, otherRect.top);
            if (overlapY > overlapThreshold) {
                if (otherRect.left <= activeRect.left && otherRect.right >= activeRect.left) {
                    const gap = activeRect.left - otherRect.left;
                    if (!left || gap < left.value) {
                        left = {
                            side: 'left',
                            relation: 'inside',
                            value: Math.round(gap),
                            refLeft: otherRect.left,
                            refRight: otherRect.right,
                            refTop: otherRect.top,
                            refBottom: otherRect.bottom
                        };
                    }
                }
                if (otherRect.right <= activeRect.left) {
                    const gap = activeRect.left - otherRect.right;
                    if (!left || gap < left.value) {
                        left = {
                            side: 'left',
                            relation: 'outside',
                            value: Math.round(gap),
                            refLeft: otherRect.left,
                            refRight: otherRect.right,
                            refTop: otherRect.top,
                            refBottom: otherRect.bottom
                        };
                    }
                }
                if (otherRect.left <= activeRect.right && otherRect.right >= activeRect.right) {
                    const gap = otherRect.right - activeRect.right;
                    if (!right || gap < right.value) {
                        right = {
                            side: 'right',
                            relation: 'inside',
                            value: Math.round(gap),
                            refLeft: otherRect.left,
                            refRight: otherRect.right,
                            refTop: otherRect.top,
                            refBottom: otherRect.bottom
                        };
                    }
                }
                if (otherRect.left >= activeRect.right) {
                    const gap = otherRect.left - activeRect.right;
                    if (!right || gap < right.value) {
                        right = {
                            side: 'right',
                            relation: 'outside',
                            value: Math.round(gap),
                            refLeft: otherRect.left,
                            refRight: otherRect.right,
                            refTop: otherRect.top,
                            refBottom: otherRect.bottom
                        };
                    }
                }
            }

            const overlapX = Math.min(activeRect.right, otherRect.right) - Math.max(activeRect.left, otherRect.left);
            if (overlapX > overlapThreshold) {
                if (otherRect.top < activeRect.top) {
                    const gap = activeRect.top - otherRect.top;
                    if (!top || gap < top.value) {
                        top = {
                            side: 'top',
                            relation: 'inside',
                            value: Math.round(gap),
                            refLeft: otherRect.left,
                            refRight: otherRect.right,
                            refTop: otherRect.top,
                            refBottom: otherRect.bottom
                        };
                    }
                }
                if (otherRect.bottom > activeRect.bottom) {
                    const gap = otherRect.bottom - activeRect.bottom;
                    if (!bottom || gap < bottom.value) {
                        bottom = {
                            side: 'bottom',
                            relation: 'inside',
                            value: Math.round(gap),
                            refLeft: otherRect.left,
                            refRight: otherRect.right,
                            refTop: otherRect.top,
                            refBottom: otherRect.bottom
                        };
                    }
                }
                if (otherRect.bottom <= activeRect.top) {
                    const gap = activeRect.top - otherRect.bottom;
                    if (!top || gap < top.value) {
                        top = {
                            side: 'top',
                            relation: 'outside',
                            value: Math.round(gap),
                            refLeft: otherRect.left,
                            refRight: otherRect.right,
                            refTop: otherRect.top,
                            refBottom: otherRect.bottom
                        };
                    }
                }
                if (otherRect.top >= activeRect.bottom) {
                    const gap = otherRect.top - activeRect.bottom;
                    if (!bottom || gap < bottom.value) {
                        bottom = {
                            side: 'bottom',
                            relation: 'outside',
                            value: Math.round(gap),
                            refLeft: otherRect.left,
                            refRight: otherRect.right,
                            refTop: otherRect.top,
                            refBottom: otherRect.bottom
                        };
                    }
                }
            }
        });

        // Always provide deterministic wall distances as fallback.
        if (wallRect) {
            top = {
                side: 'top',
                relation: 'inside',
                value: Math.max(0, Math.round(activeRect.top - wallRect.top)),
                refLeft: wallRect.left,
                refRight: wallRect.right,
                refTop: wallRect.top,
                refBottom: wallRect.bottom
            };
            bottom = {
                side: 'bottom',
                relation: 'inside',
                value: Math.max(0, Math.round(wallRect.bottom - activeRect.bottom)),
                refLeft: wallRect.left,
                refRight: wallRect.right,
                refTop: wallRect.top,
                refBottom: wallRect.bottom
            };

            // Use section edges as fallback horizontal references when no sibling ref exists.
            if (!left) {
                left = {
                    side: 'left',
                    relation: 'inside',
                    value: Math.max(0, Math.round(activeRect.left - wallRect.left)),
                    refLeft: wallRect.left,
                    refRight: wallRect.right,
                    refTop: wallRect.top,
                    refBottom: wallRect.bottom
                };
            }
            if (!right) {
                right = {
                    side: 'right',
                    relation: 'inside',
                    value: Math.max(0, Math.round(wallRect.right - activeRect.right)),
                    refLeft: wallRect.left,
                    refRight: wallRect.right,
                    refTop: wallRect.top,
                    refBottom: wallRect.bottom
                };
            }
        }

        return { left, right, top, bottom };
    })();

    const isButtonLabelElement = element.type === 'box' && /<button\b[\s\S]*<\/button>/i.test(element.content || '');
    const isEditableContent = element.type === 'text' || isButtonLabelElement;
    const buttonStyleMatch = isButtonLabelElement
        ? (element.content || '').match(/<button\b[^>]*style=(["'])([\s\S]*?)\1/i)
        : null;
    const buttonStyleText = buttonStyleMatch?.[2] || '';

    const parseInlineStyle = (rawStyle: string) => {
        const entries = rawStyle
            .split(';')
            .map(part => part.trim())
            .filter(Boolean)
            .map(part => {
                const firstColon = part.indexOf(':');
                if (firstColon < 0) return null;
                const key = part.slice(0, firstColon).trim();
                const value = part.slice(firstColon + 1).trim();
                return [key, value] as const;
            })
            .filter((entry): entry is readonly [string, string] => !!entry);

        return Object.fromEntries(entries) as Record<string, string>;
    };

    const inlineStyleMap = parseInlineStyle(buttonStyleText);

    const escapeHtml = (value: string) => value
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');

    const getEditableContentValue = () => {
        if (element.type === 'text') return element.content || '';
        if (isButtonLabelElement) {
            const match = (element.content || '').match(/<button\b[^>]*>([\s\S]*?)<\/button>/i);
            return match ? match[1].replace(/<[^>]*>/g, '') : '';
        }
        return '';
    };

    const handleContentChange = (rawValue: string) => {
        if (!isEditableContent) return;

        if (element.type === 'text') {
            onUpdate?.({ content: rawValue });
            return;
        }

        if (isButtonLabelElement) {
            const next = (element.content || '').replace(
                /(<button\b[^>]*>)([\s\S]*?)(<\/button>)/i,
                `$1${escapeHtml(rawValue)}$3`
            );
            onUpdate?.({ content: next });
        }
    };

    const toKebab = (value: string) => value.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`);

    const styleValueToString = (value: React.CSSProperties[keyof React.CSSProperties]) =>
        typeof value === 'number' ? String(value) : String(value);

    const updateTextStyle = (stylePatch: React.CSSProperties) => {
        if (!isEditableContent) return;
        const nextStyle = { ...style, ...stylePatch };

        if (!isButtonLabelElement) {
            onUpdate?.({ style: nextStyle });
            return;
        }

        const buttonStyle = parseInlineStyle(buttonStyleText);
        Object.entries(stylePatch).forEach(([key, raw]) => {
            if (raw === undefined || raw === null) return;
            buttonStyle[toKebab(key)] = styleValueToString(raw);
        });
        const serializedButtonStyle = Object.entries(buttonStyle)
            .map(([key, value]) => `${key}:${value}`)
            .join('; ');
        const nextContent = (element.content || '').replace(
            /(<button\b[^>]*style=(["']))([\s\S]*?)(\2)/i,
            `$1${serializedButtonStyle}$4`
        );
        onUpdate?.({ style: nextStyle, content: nextContent });
    };

    const readTextStyle = (camelKey: keyof React.CSSProperties, cssKey: string, fallback: string) => {
        const styleValue = style[camelKey];
        if (styleValue !== undefined && styleValue !== null && String(styleValue).trim() !== '') {
            return String(styleValue);
        }
        return inlineStyleMap[cssKey] || fallback;
    };

    const handleCoordinateInput = (prop: 'width' | 'height', rawValue: string) => {
        const trimmed = rawValue.trim();
        if (!trimmed) return;

        // Allow raw percentage for width/height when desired.
        if ((prop === 'width' || prop === 'height') && trimmed.endsWith('%')) {
            updateStyle({ [prop]: trimmed } as React.CSSProperties);
            return;
        }

        const numeric = parseFloat(trimmed.replace('px', ''));
        if (!Number.isFinite(numeric)) return;

        updateStyle({ [prop]: `${Math.round(numeric)}px` } as React.CSSProperties);
    };

    const handleGapInput = (side: 'left' | 'right' | 'top' | 'bottom', rawValue: string) => {
        const trimmed = rawValue.trim();
        if (!trimmed) return;
        const numeric = parseFloat(trimmed.replace('px', ''));
        if (!Number.isFinite(numeric)) return;
        const gap = Math.max(0, Math.round(numeric));

        if (side === 'left' && sideGaps.left) {
            const ref = sideGaps.left;
            const nextLeft = ref.relation === 'inside'
                ? Math.round(ref.refLeft + gap)
                : Math.round(ref.refRight + gap);
            updateStyle({ left: `${nextLeft}px` });
            return;
        }
        if (side === 'right' && sideGaps.right) {
            const ref = sideGaps.right;
            const nextLeft = ref.relation === 'inside'
                ? Math.round(ref.refRight - currentSize.width - gap)
                : Math.round(ref.refLeft - currentSize.width - gap);
            updateStyle({ left: `${nextLeft}px` });
            return;
        }
        if (side === 'top' && sideGaps.top) {
            const ref = sideGaps.top;
            const nextTop = ref.relation === 'inside'
                ? Math.round(ref.refTop + gap)
                : Math.round(ref.refBottom + gap);
            updateStyle({ top: `${nextTop}px` });
            return;
        }
        if (side === 'bottom' && sideGaps.bottom) {
            const ref = sideGaps.bottom;
            const nextTop = ref.relation === 'inside'
                ? Math.round(ref.refBottom - currentSize.height - gap)
                : Math.round(ref.refTop - currentSize.height - gap);
            updateStyle({ top: `${nextTop}px` });
        }
    };

    return (
        <div className="h-full flex flex-col">
            <ScrollArea className="flex-1">
                <div className="flex flex-col">
                    <div className="p-4 border-b border-border/40">
                        <h2 className="text-sm font-semibold">{element.name}</h2>
                        <p className="text-[10px] text-muted-foreground uppercase">{element.type}</p>
                    </div>

                    {isEditableContent && (
                        <>
                            <PropertySection title="Content">
                                <textarea
                                    key={`${element.id}-content`}
                                    className="w-full min-h-[92px] resize-y rounded-md border border-border/40 bg-muted/10 px-2 py-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary/40"
                                    defaultValue={getEditableContentValue()}
                                    placeholder="Type text content..."
                                    onBlur={(e) => handleContentChange(e.currentTarget.value)}
                                />
                                <div className="mt-2 text-[10px] text-muted-foreground">
                                    Edits text directly for this selected element.
                                </div>
                            </PropertySection>
                            <Separator className="bg-border/40" />
                        </>
                    )}

                    {isEditableContent && (
                        <>
                            <PropertySection title="Text">
                                <div className="grid grid-cols-2 gap-2 mb-3">
                                    <QuickInput
                                        label="Size"
                                        value={readTextStyle('fontSize', 'font-size', '16px').replace('px', '')}
                                        onChange={(val) => {
                                            const numeric = parseFloat(val.replace('px', '').trim());
                                            if (!Number.isFinite(numeric)) return;
                                            updateTextStyle({ fontSize: `${Math.round(numeric)}px` });
                                        }}
                                        placeholder="16"
                                    />
                                    <div className="flex items-center gap-2 bg-muted/10 border border-border/20 rounded-sm px-2 py-1.5">
                                        <span className="text-[10px] text-muted-foreground font-medium">Weight</span>
                                        <select
                                            className="ml-auto bg-transparent text-xs text-right focus:outline-none font-mono text-foreground"
                                            value={readTextStyle('fontWeight', 'font-weight', '500')}
                                            onChange={(e) => updateTextStyle({ fontWeight: e.target.value })}
                                        >
                                            <option value="400">Regular</option>
                                            <option value="500">Medium</option>
                                            <option value="600">Semibold</option>
                                            <option value="700">Bold</option>
                                            <option value="800">Extra Bold</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between text-xs mb-3">
                                    <span className="text-muted-foreground">Text Color</span>
                                    <div className="flex items-center gap-2">
                                        <div className="w-4 h-4 rounded-sm border border-white/20 shadow-sm relative overflow-hidden">
                                            <div
                                                className="absolute inset-0 z-0"
                                                style={{ backgroundColor: readTextStyle('color', 'color', '#000000') }}
                                            />
                                            <input
                                                type="color"
                                                className="opacity-0 absolute inset-0 w-full h-full cursor-pointer z-10"
                                                value={readTextStyle('color', 'color', '#000000')}
                                                onChange={(e) => updateTextStyle({ color: e.target.value })}
                                            />
                                        </div>
                                        <div className="w-20 text-right">
                                            <span className="text-xs text-muted-foreground font-mono">
                                                {readTextStyle('color', 'color', '#000000')}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div className="mb-3">
                                    <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1.5">Format</div>
                                    <div className="grid grid-cols-3 gap-1">
                                        <button
                                            onClick={() => updateTextStyle({
                                                fontWeight: Number(readTextStyle('fontWeight', 'font-weight', '500')) >= 600 ? '500' : '700'
                                            })}
                                            className={`rounded-sm border px-2 py-1 text-xs font-semibold transition-colors ${Number(readTextStyle('fontWeight', 'font-weight', '500')) >= 600 ? 'border-blue-500 bg-blue-500/15 text-blue-700' : 'border-border/30 hover:bg-muted/40'}`}
                                        >
                                            B
                                        </button>
                                        <button
                                            onClick={() => updateTextStyle({
                                                fontStyle: readTextStyle('fontStyle', 'font-style', 'normal') === 'italic' ? 'normal' : 'italic'
                                            })}
                                            className={`rounded-sm border px-2 py-1 text-xs italic transition-colors ${readTextStyle('fontStyle', 'font-style', 'normal') === 'italic' ? 'border-blue-500 bg-blue-500/15 text-blue-700' : 'border-border/30 hover:bg-muted/40'}`}
                                        >
                                            I
                                        </button>
                                        <button
                                            onClick={() => updateTextStyle({
                                                textDecoration: readTextStyle('textDecoration', 'text-decoration', 'none') === 'underline' ? 'none' : 'underline'
                                            })}
                                            className={`rounded-sm border px-2 py-1 text-xs underline transition-colors ${readTextStyle('textDecoration', 'text-decoration', 'none') === 'underline' ? 'border-blue-500 bg-blue-500/15 text-blue-700' : 'border-border/30 hover:bg-muted/40'}`}
                                        >
                                            U
                                        </button>
                                    </div>
                                </div>

                                <div className="mb-3">
                                    <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1.5">Align</div>
                                    <div className="grid grid-cols-3 gap-1">
                                        {(['left', 'center', 'right'] as const).map((align) => (
                                            <button
                                                key={align}
                                                onClick={() => updateTextStyle({ textAlign: align })}
                                                className={`rounded-sm border px-2 py-1 text-xs capitalize transition-colors ${readTextStyle('textAlign', 'text-align', 'center') === align ? 'border-blue-500 bg-blue-500/15 text-blue-700' : 'border-border/30 hover:bg-muted/40'}`}
                                            >
                                                {align}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-2">
                                    <QuickInput
                                        label="Line"
                                        value={readTextStyle('lineHeight', 'line-height', '1.4')}
                                        onChange={(val) => {
                                            const numeric = parseFloat(val.trim());
                                            if (!Number.isFinite(numeric)) return;
                                            updateTextStyle({ lineHeight: String(numeric) });
                                        }}
                                        placeholder="1.4"
                                    />
                                    <QuickInput
                                        label="Letter"
                                        value={readTextStyle('letterSpacing', 'letter-spacing', '0px').replace('px', '')}
                                        onChange={(val) => {
                                            const numeric = parseFloat(val.replace('px', '').trim());
                                            if (!Number.isFinite(numeric)) return;
                                            updateTextStyle({ letterSpacing: `${numeric}px` });
                                        }}
                                        placeholder="0"
                                    />
                                </div>
                            </PropertySection>
                            <Separator className="bg-border/40" />
                        </>
                    )}

                    {/* Style Section */}
                    <PropertySection title="Style">
                        <div className="grid grid-cols-2 gap-2 mb-1">
                            <QuickInput
                                label="Left"
                                value={String(sideGaps.left?.value ?? 0)}
                                onChange={(val) => handleGapInput('left', val)}
                                placeholder="0"
                                live
                            />
                            <QuickInput
                                label="Right"
                                value={String(sideGaps.right?.value ?? 0)}
                                onChange={(val) => handleGapInput('right', val)}
                                placeholder="0"
                                live
                            />
                            <QuickInput
                                label="Top"
                                value={String(sideGaps.top?.value ?? 0)}
                                onChange={(val) => handleGapInput('top', val)}
                                placeholder="0"
                                live
                            />
                            <QuickInput
                                label="Bottom"
                                value={String(sideGaps.bottom?.value ?? 0)}
                                onChange={(val) => handleGapInput('bottom', val)}
                                placeholder="0"
                                live
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-2 mb-1">
                            <QuickInput
                                label="W"
                                value={style.width ? String(style.width).replace('px', '') : ''}
                                onChange={(val) => handleCoordinateInput('width', val)}
                                placeholder="auto"
                            />
                            <QuickInput
                                label="H"
                                value={style.height ? String(style.height).replace('px', '') : ''}
                                onChange={(val) => handleCoordinateInput('height', val)}
                                placeholder="auto"
                            />
                        </div>
                        <div className="text-[10px] text-muted-foreground mb-3">
                            Tip: edit each side gap directly (left/right/top/bottom).
                        </div>

                        <div className="flex items-center justify-between text-xs mb-2">
                            <span className="text-muted-foreground">Background</span>
                            <div className="flex items-center gap-2">
                                <div className="w-4 h-4 rounded-sm border border-white/20 shadow-sm relative overflow-hidden">
                                    <div
                                        className="absolute inset-0 z-0"
                                        style={{ backgroundColor: style.backgroundColor || 'transparent' }}
                                    />
                                    <input
                                        type="color"
                                        className="opacity-0 absolute inset-0 w-full h-full cursor-pointer z-10"
                                        value={style.backgroundColor || '#ffffff'}
                                        onChange={(e) => updateStyle({ backgroundColor: e.target.value })}
                                    />
                                </div>
                                <div className="w-20 text-right">
                                    <span className="text-xs text-muted-foreground font-mono">
                                        {style.backgroundColor || 'None'}
                                    </span>
                                </div>
                            </div>
                        </div>
                        <div className="mb-3">
                            <div className="flex items-center justify-between text-xs mb-1">
                                <span className="text-muted-foreground">Border Width</span>
                                <span className="text-xs font-mono text-muted-foreground">{parseInt(String(style.borderWidth || '0'))}px</span>
                            </div>
                            <SliderControl
                                value={parseInt(String(style.borderWidth || '0')) || 0}
                                onChange={(val) => updateStyle({ borderWidth: `${val}px`, borderStyle: 'solid' })}
                                step={1}
                                max={20}
                            />
                        </div>
                        <div className="mb-3">
                            <div className="flex items-center justify-between text-xs mb-1">
                                <span className="text-muted-foreground">Radius</span>
                                <span className="text-xs font-mono text-muted-foreground">{parseInt(String(style.borderRadius || '0'))}px</span>
                            </div>
                            <SliderControl
                                value={parseInt(String(style.borderRadius || '0')) || 0}
                                onChange={(val) => updateStyle({ borderRadius: `${val}px` })}
                                step={1}
                                max={100}
                            />
                        </div>

                    </PropertySection>

                    <Separator className="bg-border/40" />

                    {/* Behaviors Section */}
                    {behaviors.length > 0 && (
                        <>
                            <PropertySection title="Behaviors">
                                {behaviors.map((behavior) => {
                                    const config = behavior.config || {};
                                    return (
                                        <div key={behavior.id} className="mb-4 last:mb-0 p-3 bg-muted/5 rounded-md border border-border/20">
                                            <div className="flex items-center justify-between mb-3">
                                                <div className="flex items-center gap-2">
                                                    <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                                                    <span className="text-xs font-semibold capitalize">{behavior.type.replace('-', ' ')}</span>
                                                </div>
                                                <button
                                                    onClick={() => onRemoveBehavior?.(behavior.id)}
                                                    className="text-[10px] text-red-500 hover:text-red-600 hover:bg-red-50 p-1 rounded transition-colors"
                                                >
                                                    Remove
                                                </button>
                                            </div>

                                            {/* Dynamic Config Controls */}
                                            {behavior.type === 'hydrodynamic' && (
                                                <div className="space-y-4 pl-1">
                                                    <div>
                                                        <div className="flex items-center justify-between text-xs mb-1.5">
                                                            <span className="text-muted-foreground text-[10px]">Viscosity</span>
                                                            <span className="font-mono text-[10px]">{config.viscosity ?? 0.3}</span>
                                                        </div>
                                                        <SliderControl
                                                            value={config.viscosity ?? 0.3}
                                                            onChange={(val) => onUpdateBehavior?.(behavior.id, { viscosity: val })}
                                                            min={0.1} max={1} step={0.1}
                                                        />
                                                    </div>
                                                    <div>
                                                        <div className="flex items-center justify-between text-xs mb-1.5">
                                                            <span className="text-muted-foreground text-[10px]">Elasticity</span>
                                                            <span className="font-mono text-[10px]">{config.elasticity ?? 0.2}</span>
                                                        </div>
                                                        <SliderControl
                                                            value={config.elasticity ?? 0.2}
                                                            onChange={(val) => onUpdateBehavior?.(behavior.id, { elasticity: val })}
                                                            min={0} max={1} step={0.1}
                                                        />
                                                    </div>
                                                    <div>
                                                        <div className="flex items-center justify-between text-xs mb-1.5">
                                                            <span className="text-muted-foreground text-[10px]">Radius</span>
                                                            <span className="font-mono text-[10px]">{config.interactionRadius ?? 150}</span>
                                                        </div>
                                                        <SliderControl
                                                            value={config.interactionRadius ?? 150}
                                                            onChange={(val) => onUpdateBehavior?.(behavior.id, { interactionRadius: val })}
                                                            min={50} max={500} step={10}
                                                        />
                                                    </div>
                                                </div>
                                            )}

                                            {behavior.type === 'physics-card' && (
                                                <div className="space-y-4 pl-1">
                                                    <div>
                                                        <div className="flex items-center justify-between text-xs mb-1.5">
                                                            <span className="text-muted-foreground text-[10px]">Force</span>
                                                            <span className="font-mono text-[10px]">{config.hoverForce ?? 10}</span>
                                                        </div>
                                                        <SliderControl
                                                            value={config.hoverForce ?? 10}
                                                            onChange={(val) => onUpdateBehavior?.(behavior.id, { hoverForce: val })}
                                                            min={1} max={50} step={1}
                                                        />
                                                    </div>
                                                    <div>
                                                        <div className="flex items-center justify-between text-xs mb-1.5">
                                                            <span className="text-muted-foreground text-[10px]">Max Rotation</span>
                                                            <span className="font-mono text-[10px]">{config.maxRotation ?? 5}deg</span>
                                                        </div>
                                                        <SliderControl
                                                            value={config.maxRotation ?? 5}
                                                            onChange={(val) => onUpdateBehavior?.(behavior.id, { maxRotation: val })}
                                                            min={1} max={45} step={1}
                                                        />
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </PropertySection>
                            <Separator className="bg-border/40" />
                        </>
                    )}


                    <PropertySection title="Actions">
                        <button
                            onClick={onDelete}
                            className="w-full py-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-md text-xs font-medium border border-red-200 transition-colors"
                        >
                            Delete Element
                        </button>
                    </PropertySection>

                    <PropertySection title="Add Behavior">
                        <div className="p-4 border border-dashed border-border rounded-md text-xs text-center text-muted-foreground">
                            Drag behavior from sidebar
                        </div>
                    </PropertySection>

                </div>
            </ScrollArea>
        </div>
    );
}

function PropertySection({ title, children }: { title: string, children: React.ReactNode }) {
    return (
        <div className="p-4">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">{title}</h3>
            {children}
        </div>
    )
}

function SliderControl({ value, onChange, min = 0, max = 100, step = 1 }: { value: number, onChange: (val: number) => void, min?: number, max?: number, step?: number }) {
    return (
        <Slider
            value={[value]}
            max={max}
            min={min}
            step={step}
            onValueChange={(vals) => onChange(vals[0])}
            className="w-full"
        />
    )
}

function QuickInput({ label, value, onChange, placeholder, live = false }: { label?: string, value: string, onChange?: (val: string) => void, placeholder?: string, live?: boolean }) {
    const [draft, setDraft] = React.useState(value);

    React.useEffect(() => {
        setDraft(value);
    }, [value]);

    const commit = (next: string) => {
        onChange?.(next);
    };

    const nudgeNumeric = (delta: number) => {
        const trimmed = draft.trim();
        const numeric = parseFloat(trimmed.replace('px', ''));
        if (!Number.isFinite(numeric)) return;
        const next = String(Math.round((numeric + delta) * 100) / 100);
        setDraft(next);
        commit(next);
    };

    return (
        <div className="flex items-center gap-2 bg-muted/10 border border-border/20 rounded-sm px-2 py-1.5 focus-within:ring-1 ring-primary/20">
            {label && <span className="text-[10px] text-muted-foreground font-medium">{label}</span>}
            <input
                className="w-full bg-transparent text-xs text-right focus:outline-none font-mono text-foreground placeholder:text-muted-foreground/50"
                value={draft}
                placeholder={placeholder}
                onChange={(e) => {
                    const next = e.currentTarget.value;
                    setDraft(next);
                    if (live) {
                        onChange?.(next);
                    }
                }}
                onBlur={(e) => commit(e.target.value)}
                onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                        commit(e.currentTarget.value);
                        e.currentTarget.blur();
                        return;
                    }
                    if (e.key === 'ArrowUp') {
                        e.preventDefault();
                        nudgeNumeric(e.shiftKey ? 10 : 1);
                        return;
                    }
                    if (e.key === 'ArrowDown') {
                        e.preventDefault();
                        nudgeNumeric(e.shiftKey ? -10 : -1);
                    }
                }}
            />
        </div>
    )
}
