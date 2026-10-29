'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useDraggable, useDroppable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { EditorElement } from '@/lib/editor/store';
import { sanitizeHtml } from '@/lib/editor/sanitize';
import { EFFECTS, resolveSettings } from '@/lib/effect-library';
import { CANVAS_VIEWPORT_ID } from './canvas-constants';

interface CanvasElementProps {
    element: EditorElement;
    onSelect?: (id: string) => void;
    onUpdate?: (id: string, updates: Partial<EditorElement>) => void;
    selected?: boolean;
    readOnly?: boolean;
    settleDuration?: number;
    canvasIsDragging?: boolean;
}

export function CanvasElement({ element, onSelect, onUpdate, selected, readOnly, settleDuration, canvasIsDragging }: CanvasElementProps) {
    const elRef = useRef<HTMLDivElement>(null);
    const draftTextRef = useRef('');
    const isSectionBackground = element.id.endsWith('-bg');
    const {
        setNodeRef: setDroppableRef,
        isOver
    } = useDroppable({
        id: element.id,
    });

    const {
        attributes,
        listeners,
        setNodeRef: setDraggableRef,
        transform,
        isDragging
    } = useDraggable({
        id: element.id,
        data: {
            type: 'element',
            elementId: element.id,
        },
        // Prevent accidental section grabs: background layers drag only when explicitly selected.
        disabled: !!element.isLocked || (isSectionBackground && !selected)
    });

    // Compose refs
    const setRefs = (node: HTMLDivElement | null) => {
        elRef.current = node;
        if (!readOnly) {
            setDroppableRef(node);
            setDraggableRef(node);
        }
    };

    // Apply drag transformation
    // The Overlay handles the visual movement.
    const dragTransform = transform ? CSS.Translate.toString(transform) : '';
    const baseTransform = element.style.transform?.toString() || '';
    const composedTransform = [baseTransform, dragTransform].filter(Boolean).join(' ');
    const parsedZ = Number(element.style.zIndex);
    const baseZ = Number.isFinite(parsedZ) ? parsedZ : 0;
    const layeredZ = isSectionBackground
        ? Math.min(baseZ, 20)
        : Math.max(baseZ, 30);

    const style: React.CSSProperties = {
        ...element.style,
        transform: composedTransform || undefined,
        opacity: element.style.opacity ?? 1, // Keep source fully visible, DO NOT FADE
        zIndex: isDragging ? 9999 : layeredZ,
    };

    // Run the element's effects (lib/effect-library); re-run when they or the content change.
    useEffect(() => {
        const node = elRef.current;
        if (!node) return;

        const scrollContainer = node.closest<HTMLElement>(`#${CANVAS_VIEWPORT_ID}`) ?? undefined;
        const cleanups = element.behaviors.map(behavior => {
            const effect = EFFECTS[behavior.type];
            return effect.apply(node, resolveSettings(effect, behavior.config), { scrollContainer });
        });

        return () => {
            // Undo in reverse so each effect sees the element as it left it.
            cleanups.reverse().forEach(stop => stop());
        };
    }, [element.behaviors, element.content]);

    const safeContent = useMemo(() => sanitizeHtml(element.content), [element.content]);
    const [isEditing, setIsEditing] = useState(false);
    const isButtonLabelElement = element.type === 'box' && /<button\b[\s\S]*<\/button>/i.test(element.content);
    const isNavbarInlineLabel = /-brand$|-link-\d+$/.test(element.id);
    const isInlineSizedLabel = isButtonLabelElement || isNavbarInlineLabel;
    const isEditableTextElement = element.type === 'text' || isButtonLabelElement;
    const isTextEditing = isEditing && isEditableTextElement;
    const showDropOverBox = !!isOver && !isDragging && !canvasIsDragging && !readOnly && !isTextEditing;
    const showBlueBox = showDropOverBox;
    const buttonEditLayoutStyle: React.CSSProperties = isTextEditing && isInlineSizedLabel
        ? {
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center',
            direction: 'ltr',
            width: style.width,
            height: style.height,
            paddingLeft: '0px',
            paddingRight: '0px',
            boxSizing: 'border-box',
            whiteSpace: 'nowrap'
        }
        : {};

    const escapeHtml = (value: string) => value
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');

    const measureButtonEditWidth = (node: HTMLDivElement) => {
        // Re-measure from intrinsic content width so the box can both grow and shrink live.
        const prevWidth = node.style.width;
        node.style.width = 'auto';
        const measured = Math.ceil(node.scrollWidth + 14);
        node.style.width = prevWidth;
        return Math.max(56, measured);
    };

    useEffect(() => {
        if (readOnly || !onUpdate || !isInlineSizedLabel || isEditing || isDragging) return;
        const node = elRef.current;
        if (!node) return;

        const measuredWidth = measureButtonEditWidth(node);
        const currentWidth = parseFloat(String(element.style.width ?? '0').replace('px', '').trim());
        if (!Number.isFinite(currentWidth) || Math.abs(currentWidth - measuredWidth) > 1) {
            onUpdate(element.id, {
                style: {
                    ...element.style,
                    width: `${measuredWidth}px`
                }
            });
        }
    }, [readOnly, onUpdate, isInlineSizedLabel, isEditing, isDragging, element.id, element.style, element.content]);

    const handleInput = (e: React.FormEvent<HTMLDivElement>) => {
        if (readOnly || !isEditableTextElement) return;
        draftTextRef.current = e.currentTarget.innerText;
        if (isInlineSizedLabel && isEditing && elRef.current) {
            const liveWidth = measureButtonEditWidth(elRef.current);
            elRef.current.style.width = `${liveWidth}px`;
        }
    };

    const handleDoubleClick = () => {
        if (isEditableTextElement) {
            setIsEditing(true);
            requestAnimationFrame(() => {
                const node = elRef.current;
                if (!node) return;

                if (isInlineSizedLabel) {
                    // Replace button markup with plain text while editing to avoid native button focus ring.
                    const currentLabel = node.innerText;
                    node.textContent = currentLabel;
                    // Preserve current visual width on edit start to avoid a rightward jump.
                    node.style.width = `${Math.max(1, Math.ceil(node.offsetWidth))}px`;
                }

                node.focus();
                draftTextRef.current = node.innerText;
                const selection = window.getSelection();
                if (!selection) return;
                const range = document.createRange();
                range.selectNodeContents(node);
                range.collapse(false);
                selection.removeAllRanges();
                selection.addRange(range);
            });
        }
    };

    const handleBlur = () => {
        if (!isEditing) {
            return;
        }

        if (!readOnly && onUpdate && isEditableTextElement) {
            const nextContent = draftTextRef.current;
            if (element.type === 'text') {
                const measuredWidth = (isInlineSizedLabel && elRef.current)
                    ? `${measureButtonEditWidth(elRef.current)}px`
                    : undefined;
                const nextStyle = measuredWidth
                    ? { ...element.style, width: measuredWidth }
                    : undefined;
                const shouldUpdateContent = nextContent !== element.content;
                const shouldUpdateWidth = !!(nextStyle && String(element.style.width ?? '') !== nextStyle.width);
                if (shouldUpdateContent || shouldUpdateWidth) {
                    onUpdate(element.id, {
                        ...(shouldUpdateContent ? { content: nextContent } : {}),
                        ...(nextStyle ? { style: nextStyle } : {})
                    });
                }
            } else if (isButtonLabelElement) {
                const updatedButtonHtml = element.content.replace(
                    /(<button\b[^>]*>)([\s\S]*?)(<\/button>)/i,
                    `$1${escapeHtml(nextContent)}$3`
                );
                const measuredWidth = elRef.current
                    ? measureButtonEditWidth(elRef.current)
                    : undefined;
                const nextStyle: React.CSSProperties | undefined = measuredWidth
                    ? { ...element.style, width: `${measuredWidth}px` }
                    : undefined;

                if (updatedButtonHtml !== element.content || (nextStyle && String(element.style.width) !== nextStyle.width)) {
                    onUpdate(element.id, {
                        content: updatedButtonHtml,
                        ...(nextStyle ? { style: nextStyle } : {})
                    });
                }
            }
        }
        setIsEditing(false);
    };

    const handlePointerDown = () => {
        if (readOnly || isEditing || !isEditableTextElement) return;
        const node = elRef.current;
        if (!node) return;

        const measuredWidth = Math.max(1, Math.ceil(node.offsetWidth));
        const measuredHeight = Math.max(1, Math.ceil(node.offsetHeight));
        // Lock dimensions for this pointer interaction without triggering a React state update
        // (state updates on pointer-down can cancel/interfere with dnd-kit drag start).
        node.style.width = `${measuredWidth}px`;
        node.style.height = `${measuredHeight}px`;
    };

    return (
        <div
            id={element.id}
            ref={setRefs}
            style={{
                ...style,
                ...buttonEditLayoutStyle,
                transition: settleDuration ? `top ${settleDuration}ms cubic-bezier(0.22, 1, 0.36, 1), left ${settleDuration}ms cubic-bezier(0.22, 1, 0.36, 1)` : undefined,
                outline: showBlueBox ? '2px solid #3b82f6' : 'none',
                boxShadow: isTextEditing
                    ? 'inset 0 0 0 2px rgba(59,130,246,0.95), 0 0 0 4px rgba(59,130,246,0.18), 0 8px 22px rgba(30,64,175,0.24)'
                    : undefined,
                backgroundColor: isTextEditing ? 'rgba(219,234,254,0.35)' : style.backgroundColor,
                borderRadius: isTextEditing ? '6px' : style.borderRadius,
                color: isTextEditing ? '#000000' : style.color,
                WebkitTextFillColor: isTextEditing ? '#000000' : undefined,
                caretColor: isTextEditing ? '#1d4ed8' : undefined,
                textAlign: isTextEditing ? 'center' : style.textAlign,
                direction: isTextEditing ? 'ltr' : style.direction,
                unicodeBidi: isTextEditing ? 'plaintext' : style.unicodeBidi,
                textShadow: isDragging && element.type === 'text' ? '0 0 10px rgba(255,255,255,0.55)' : undefined,
                // Removed the backgroundColor override which was erasing section backgrounds
                cursor: element.isLocked || readOnly || (isSectionBackground && !selected)
                    ? 'auto'
                    : (isEditing ? 'text' : (isDragging ? 'grabbing' : 'grab'))
            }}
            {...attributes}
            {...(element.isLocked || readOnly || isEditing ? {} : listeners)} // Don't attach drag listeners if locked, readOnly, or editing
            onClick={(e) => {
                if (readOnly) return;
                e.stopPropagation();
                onSelect?.(element.id);
            }}
            onInput={handleInput}
            onDoubleClick={() => !readOnly && handleDoubleClick()}
            onBlur={handleBlur}
            onPointerDownCapture={handlePointerDown}
            contentEditable={isEditing}
            suppressContentEditableWarning
            className={`group ${isEditing || readOnly ? 'select-text' : 'select-none'} ${isEditing ? 'cursor-text' : ''}`}
            dangerouslySetInnerHTML={{ __html: safeContent }}
        />
    );
}
