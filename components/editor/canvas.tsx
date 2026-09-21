'use client';

import React, { useEffect, useRef } from 'react';
import { EditorElement } from '@/lib/editor/store';
import { CanvasElement } from './canvas-element';
import { AlignmentGuides } from './alignment-guides-magnetic';

import { useDroppable } from '@dnd-kit/core';

interface CanvasProps {
    elements: EditorElement[];
    onSelect?: (id: string) => void;
    onUpdate?: (id: string, updates: Partial<EditorElement>) => void;
    selectedId?: string | null;
    height?: number; // Dynamic height
    readOnly?: boolean;
    scale?: number;
    isDragging?: boolean;
    activeDragId?: string | null;
    contactedElementIds?: string[];
    suggestedDropY?: number | null;
    suggestedDropHeight?: number;
    suggestedDropLabel?: string;
    dropPreview?: {
        targetRect?: { left: number; top: number; width: number; height: number };
        placeholderRect?: { left: number; top: number; width: number; height: number };
        insertionLine?: { axis: 'x' | 'y'; position: number; start: number; end: number };
        label?: string;
    } | null;
    settleDurations?: Record<string, number>;
}

export function Canvas({ elements, onSelect, onUpdate, selectedId, height = 800, readOnly, scale = 1, isDragging, activeDragId, contactedElementIds, suggestedDropY, suggestedDropHeight = 200, suggestedDropLabel = 'Drop here', dropPreview, settleDurations }: CanvasProps) {
    const { setNodeRef, isOver } = useDroppable({
        id: 'canvas-droppable',
        disabled: readOnly
    });
    const containerRef = useRef<HTMLDivElement>(null);
    const selectionOverlayRef = useRef<HTMLDivElement>(null);
    const contactOverlayLayerRef = useRef<HTMLDivElement>(null);
    const dragOverlayRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        // Ensure editor always opens at the top-left of the canvas viewport.
        if (readOnly) return;
        const container = containerRef.current;
        if (!container) return;
        container.scrollTop = 0;
        container.scrollLeft = 0;
    }, [readOnly]);

    useEffect(() => {
        const overlay = selectionOverlayRef.current;
        if (!overlay) return;

        if (!selectedId || readOnly || isDragging) {
            overlay.style.display = 'none';
            return;
        }

        let rafId = 0;

        const updateOverlay = () => {
            const sel = elements.find(e => e.id === selectedId);
            if (!sel) {
                overlay.style.display = 'none';
                rafId = requestAnimationFrame(updateOverlay);
                return;
            }

            const selectedNode = document.getElementById(sel.id);
            const isEditableText = sel.type === 'text' || /<button\b[\s\S]*<\/button>/i.test(sel.content || '');
            const measuredWidth = selectedNode
                ? Math.max(selectedNode.offsetWidth, selectedNode.scrollWidth)
                : undefined;
            const measuredHeight = selectedNode
                ? Math.max(selectedNode.offsetHeight, selectedNode.scrollHeight)
                : undefined;
            const padX = isEditableText ? 10 : 0;
            const padY = isEditableText ? 4 : 0;
            const rawTop = Number.parseFloat(String(sel.style.top ?? '0').replace('px', ''));
            const rawLeft = Number.parseFloat(String(sel.style.left ?? '0').replace('px', ''));
            const safeTop = Number.isFinite(rawTop) ? rawTop : 0;
            const safeLeft = Number.isFinite(rawLeft) ? rawLeft : 0;
            const baseWidth = measuredWidth && measuredWidth > 0
                ? measuredWidth
                : Number.parseFloat(String(sel.style.width ?? '0').replace('px', '')) || 0;
            const baseHeight = measuredHeight && measuredHeight > 0
                ? measuredHeight
                : Number.parseFloat(String(sel.style.height ?? '0').replace('px', '')) || 0;

            overlay.style.display = 'block';
            overlay.style.top = `${safeTop - padY}px`;
            overlay.style.left = `${safeLeft - padX}px`;
            overlay.style.width = `${Math.max(0, baseWidth + padX * 2)}px`;
            overlay.style.height = `${Math.max(0, baseHeight + padY * 2)}px`;
            overlay.style.transform = String(sel.style.transform ?? '');
            overlay.style.borderRadius = isEditableText
                ? '8px'
                : String(sel.style.borderRadius ?? '');

            rafId = requestAnimationFrame(updateOverlay);
        };

        rafId = requestAnimationFrame(updateOverlay);
        return () => {
            cancelAnimationFrame(rafId);
            overlay.style.display = 'none';
        };
    }, [selectedId, readOnly, isDragging, elements]);

    useEffect(() => {
        const layer = contactOverlayLayerRef.current;
        if (!layer) return;

        if (readOnly || !isDragging || !contactedElementIds || contactedElementIds.length === 0) {
            layer.innerHTML = '';
            return;
        }

        let rafId = 0;

        const updateOverlays = () => {
            const activeIds = new Set(
                contactedElementIds.filter(id => id !== activeDragId)
            );

            const existingNodes = Array.from(layer.querySelectorAll<HTMLDivElement>('[data-contact-id]'));
            for (const node of existingNodes) {
                const id = node.dataset.contactId || '';
                if (!activeIds.has(id)) {
                    node.remove();
                }
            }

            for (const id of contactedElementIds) {
                if (id === activeDragId) continue;
                const target = elements.find(e => e.id === id);
                if (!target) continue;

                const targetNode = document.getElementById(target.id);
                const isEditableText = target.type === 'text' || /<button\b[\s\S]*<\/button>/i.test(target.content || '');
                const measuredWidth = targetNode
                    ? Math.max(targetNode.offsetWidth, targetNode.scrollWidth)
                    : undefined;
                const measuredHeight = targetNode
                    ? Math.max(targetNode.offsetHeight, targetNode.scrollHeight)
                    : undefined;
                const padX = isEditableText ? 10 : 0;
                const padY = isEditableText ? 4 : 0;
                const rawTop = Number.parseFloat(String(target.style.top ?? '0').replace('px', ''));
                const rawLeft = Number.parseFloat(String(target.style.left ?? '0').replace('px', ''));
                const safeTop = Number.isFinite(rawTop) ? rawTop : 0;
                const safeLeft = Number.isFinite(rawLeft) ? rawLeft : 0;
                const baseWidth = measuredWidth && measuredWidth > 0
                    ? measuredWidth
                    : Number.parseFloat(String(target.style.width ?? '0').replace('px', '')) || 0;
                const baseHeight = measuredHeight && measuredHeight > 0
                    ? measuredHeight
                    : Number.parseFloat(String(target.style.height ?? '0').replace('px', '')) || 0;

                let box = layer.querySelector<HTMLDivElement>(`[data-contact-id="${id}"]`);
                if (!box) {
                    box = document.createElement('div');
                    box.dataset.contactId = id;
                    box.className = 'absolute pointer-events-none border-2 border-blue-500';
                    layer.appendChild(box);
                }

                box.style.top = `${safeTop - padY}px`;
                box.style.left = `${safeLeft - padX}px`;
                box.style.width = `${Math.max(0, baseWidth + padX * 2)}px`;
                box.style.height = `${Math.max(0, baseHeight + padY * 2)}px`;
                box.style.transform = String(target.style.transform ?? '');
                box.style.borderRadius = isEditableText
                    ? '8px'
                    : String(target.style.borderRadius ?? '');
            }

            rafId = requestAnimationFrame(updateOverlays);
        };

        rafId = requestAnimationFrame(updateOverlays);
        return () => {
            cancelAnimationFrame(rafId);
            layer.innerHTML = '';
        };
    }, [readOnly, isDragging, contactedElementIds, elements, activeDragId]);

    useEffect(() => {
        const overlay = dragOverlayRef.current;
        if (!overlay) return;

        if (readOnly || !isDragging || !activeDragId) {
            overlay.style.display = 'none';
            return;
        }

        let rafId = 0;

        const updateDragOverlay = () => {
            const target = elements.find(e => e.id === activeDragId);
            const targetNode = document.getElementById(activeDragId);
            const canvasNode = document.getElementById('canvas-droppable');
            if (!target || !targetNode || !canvasNode) {
                overlay.style.display = 'none';
                rafId = requestAnimationFrame(updateDragOverlay);
                return;
            }

            const isEditableText = target.type === 'text' || /<button\b[\s\S]*<\/button>/i.test(target.content || '');
            const padX = isEditableText ? 10 : 0;
            const padY = isEditableText ? 4 : 0;

            const canvasRect = canvasNode.getBoundingClientRect();
            const nodeRect = targetNode.getBoundingClientRect();
            const safeScale = Math.max(scale, 0.0001);
            const logicalLeft = (nodeRect.left - canvasRect.left) / safeScale;
            const logicalTop = (nodeRect.top - canvasRect.top) / safeScale;
            const logicalWidth = nodeRect.width / safeScale;
            const logicalHeight = nodeRect.height / safeScale;

            overlay.style.display = 'block';
            overlay.style.top = `${logicalTop - padY}px`;
            overlay.style.left = `${logicalLeft - padX}px`;
            overlay.style.width = `${Math.max(0, logicalWidth + padX * 2)}px`;
            overlay.style.height = `${Math.max(0, logicalHeight + padY * 2)}px`;
            overlay.style.borderRadius = isEditableText
                ? '8px'
                : String(target.style.borderRadius ?? '');
            overlay.style.transform = '';

            rafId = requestAnimationFrame(updateDragOverlay);
        };

        rafId = requestAnimationFrame(updateDragOverlay);
        return () => {
            cancelAnimationFrame(rafId);
            overlay.style.display = 'none';
        };
    }, [readOnly, isDragging, activeDragId, elements, scale]);

    const containerClasses = readOnly
        ? "w-full h-full overflow-x-hidden overflow-y-auto relative bg-white"
        : "w-full h-full overflow-auto relative bg-gray-100 cursor-grab active:cursor-grabbing";

    const wrapperClasses = readOnly
        ? "min-h-full min-w-full flex items-start justify-center relative z-10"
        : "min-h-full min-w-full flex items-start justify-center p-20 relative z-10";

    return (
        <div ref={containerRef} className={containerClasses}>
            {/* Scrollable Content Wrapper */}
            <div
                className={wrapperClasses}
            >
                {/* Page Frame */}
                <div
                    ref={setNodeRef}
                    id="canvas-droppable"
                    suppressHydrationWarning
                    className={`
                        relative bg-[#09090b] w-[900px] transition-all duration-200 shadow-xl
                        ${isDragging && !readOnly ? 'ring-4 ring-blue-500/30 ring-dashed cursor-copy' : ''}
                        ${isOver && !readOnly ? 'ring-4 ring-blue-500 ring-offset-2 ring-offset-[#09090b] !bg-blue-900/20' : ''}
                    `}
                    style={{
                        height: `${height}px`, // Apply dynamic height
                        border: readOnly ? 'none' : '1px solid rgba(255,255,255,0.1)',
                        minHeight: readOnly ? '100vh' : 'auto',
                        transform: `scale(${scale})`, // Unified scaling
                        transformOrigin: 'top center', // Always scale from top center to keep alignment
                        backgroundImage: !readOnly ? 'radial-gradient(circle, rgba(255,255,255,0.25) 1px, transparent 1px)' : 'none',
                        backgroundSize: '24px 24px'
                    }}
                >
                    {/* Shadow Drop Guide (Ghost) */}
                    {suggestedDropY !== undefined && suggestedDropY !== null && !readOnly && !dropPreview && (
                        <div
                            className="absolute left-0 w-full flex items-center justify-center border-2 border-dashed border-red-400 bg-red-500/10 text-red-500 font-semibold text-sm pointer-events-none z-[10020] transition-all duration-150"
                            style={{
                                top: `${suggestedDropY}px`,
                                height: `${suggestedDropHeight}px`,
                            }}
                        >
                            <span className="rounded bg-black/35 px-2 py-1 tracking-wide">
                                {suggestedDropLabel}
                            </span>
                            <div className="absolute left-0 right-0 top-0 border-t border-red-400/90" />
                            <div className="absolute left-0 right-0 bottom-0 border-b border-red-400/90" />
                        </div>
                    )}

                    {/* Precise Drop Indicator (Insertion line + target highlight + preview placeholder) */}
                    {!readOnly && dropPreview && (
                        <>
                            {dropPreview.targetRect && (
                                <div
                                    className="absolute pointer-events-none z-[10020] rounded-md border border-blue-400/70 bg-blue-400/8"
                                    style={{
                                        left: `${dropPreview.targetRect.left}px`,
                                        top: `${dropPreview.targetRect.top}px`,
                                        width: `${dropPreview.targetRect.width}px`,
                                        height: `${dropPreview.targetRect.height}px`
                                    }}
                                />
                            )}

                            {dropPreview.placeholderRect && (
                                <div
                                    className="absolute pointer-events-none z-[10021] rounded-md border-2 border-dashed border-red-400/90 bg-red-500/10"
                                    style={{
                                        left: `${dropPreview.placeholderRect.left}px`,
                                        top: `${dropPreview.placeholderRect.top}px`,
                                        width: `${dropPreview.placeholderRect.width}px`,
                                        height: `${dropPreview.placeholderRect.height}px`
                                    }}
                                >
                                    {dropPreview.label && (
                                        <div className="absolute left-2 top-2 rounded bg-black/40 px-2 py-1 text-[11px] font-medium tracking-wide text-red-200">
                                            {dropPreview.label}
                                        </div>
                                    )}
                                </div>
                            )}

                            {dropPreview.insertionLine && dropPreview.insertionLine.axis === 'y' && (
                                <div
                                    className="absolute pointer-events-none z-[10022] border-t-2 border-red-400"
                                    style={{
                                        left: `${Math.min(dropPreview.insertionLine.start, dropPreview.insertionLine.end)}px`,
                                        width: `${Math.abs(dropPreview.insertionLine.end - dropPreview.insertionLine.start)}px`,
                                        top: `${dropPreview.insertionLine.position}px`
                                    }}
                                />
                            )}

                            {dropPreview.insertionLine && dropPreview.insertionLine.axis === 'x' && (
                                <div
                                    className="absolute pointer-events-none z-[10022] border-l-2 border-red-400"
                                    style={{
                                        top: `${Math.min(dropPreview.insertionLine.start, dropPreview.insertionLine.end)}px`,
                                        height: `${Math.abs(dropPreview.insertionLine.end - dropPreview.insertionLine.start)}px`,
                                        left: `${dropPreview.insertionLine.position}px`
                                    }}
                                />
                            )}
                        </>
                    )}

                    {/* Frame Label */}
                    {!readOnly && (
                        <div className="absolute -top-6 left-0 text-xs text-muted-foreground font-medium">
                            Desktop
                        </div>
                    )}

                    {/* Elements */}
                    {elements.map(el => (
                        <CanvasElement
                            key={el.id}
                            element={el}
                            onSelect={onSelect}
                            onUpdate={onUpdate}
                            selected={selectedId === el.id}
                            readOnly={readOnly}
                            settleDuration={settleDurations?.[el.id]}
                            canvasIsDragging={!!isDragging}
                        />
                    ))}

                    {/* High-Performance Snapping Guides */}
                    <AlignmentGuides />

                    {/* Contact Overlays (Match Selection Box Style) */}
                    {!readOnly && (
                        <div
                            ref={contactOverlayLayerRef}
                            className="absolute pointer-events-none inset-0 z-[9998]"
                        />
                    )}

                    {/* Selection Overlay (Always on Top) */}
                    {!readOnly && (
                        <div
                            ref={selectionOverlayRef}
                            className="absolute pointer-events-none z-[9999] border-2 border-blue-500 hidden"
                        />
                    )}

                    {/* Drag Overlay (Never Disappears Over Other Elements) */}
                    {!readOnly && (
                        <div
                            ref={dragOverlayRef}
                            className="absolute pointer-events-none z-[10060] border-2 border-blue-500 hidden"
                        />
                    )}
                </div>
            </div>

            {/* Zoom Controls Removed - Auto-scale active */}
        </div>
    );
}
