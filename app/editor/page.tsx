'use client';

import React, { useState, useEffect, useRef } from 'react';
import { DndContext, useSensor, useSensors, DragEndEvent, DragMoveEvent, PointerSensor, Modifier } from '@dnd-kit/core';
import { toast } from '@/hooks/use-toast';
import { EditorLayout } from "@/components/editor/editor-layout";
import { TopBar } from "@/components/editor/top-bar";
import { LeftSidebar } from "@/components/editor/left-sidebar";
import { RightSidebar } from "@/components/editor/right-sidebar";
import { Canvas } from "@/components/editor/canvas";
import { initialElements, EditorElement } from '@/lib/editor/store';
import { createDefaultElement } from '@/lib/editor/defaults';
import { useHistory } from '@/lib/editor/use-history';
import { calculateMagneticPull, globalSnapEngine, snapState, SnapTarget } from '@/lib/editor/snap-engine';
import LZString from 'lz-string';

const gridSize = 20;
const FULL_WIDTH_SECTION_SUBTYPES = new Set([
    'navbar',
    'hero',
    'features',
    'testimonials',
    'pricing',
    'faq',
    'footer'
]);

const SECTION_PREVIEW_HEIGHT: Record<string, number> = {
    navbar: 80,
    hero: 400,
    features: 200,
    testimonials: 400,
    pricing: 400,
    faq: 300,
    footer: 200
};

type DropPreview = {
    targetRect?: { left: number; top: number; width: number; height: number };
    placeholderRect?: { left: number; top: number; width: number; height: number };
    insertionLine?: { axis: 'x' | 'y'; position: number; start: number; end: number };
    label?: string;
};

const snapToGrid: Modifier = ({ transform, active }) => {
    // Only apply visual grid snapping for new sidebar content items.
    // Existing elements use high-precision positioning based on handleDragEnd logic.
    if (active && active.data.current?.type !== 'content') {
        return transform;
    }
    return {
        ...transform,
        x: Math.round(transform.x / gridSize) * gridSize,
        y: Math.round(transform.y / gridSize) * gridSize,
    };
};

export default function EditorPage() {
    const {
        state: elements,
        setState: setElements,
        undo,
        redo,
        canUndo,
        canRedo
    } = useHistory<EditorElement[]>(initialElements);

    // const [elements, setElements] = useState<EditorElement[]>(initialElements);
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [activeDragId, setActiveDragId] = useState<string | null>(null);
    const [contactedElementIds, setContactedElementIds] = useState<string[]>([]);
    const [leftSidebarTab, setLeftSidebarTab] = useState<'design' | 'elements' | 'layers' | 'behaviors'>('design');
    const [pages, setPages] = useState([{ id: 'home', name: 'Home' }]);
    const [activePageId, setActivePageId] = useState('home');
    const [canvasHeight, setCanvasHeight] = useState(2500); // Increased default
    const canvasRectRef = useRef<{ left: number, top: number, width: number, height: number } | null>(null);

    // Initial fetch of page items and setup listeners
    const [isPreview, setIsPreview] = useState(false);
    const [scale, setScale] = useState(1);
    const [activeGuide, setActiveGuide] = useState<{ id: string; position: 'top' | 'bottom' | 'left' | 'right'; rect: DOMRect } | null>(null);
    const [suggestedDropY, setSuggestedDropY] = useState<number | null>(null);
    const [suggestedDropHeight, setSuggestedDropHeight] = useState<number>(200);
    const [suggestedDropLabel, setSuggestedDropLabel] = useState<string>('Drop section here');
    const [dropPreview, setDropPreview] = useState<DropPreview | null>(null);
    const [settleDurations, setSettleDurations] = useState<Record<string, number>>({});
    // Stores snapped logical position from magnetic modifier for final drop.
    const activeAlignmentsRef = useRef<{ nodeLeft?: number; nodeTop?: number }>({});
    const settleTimeoutsRef = useRef<Map<string, number>>(new Map());
    const velocityRef = useRef({ vx: 0, vy: 0, lastX: 0, lastY: 0, lastT: 0 });
    const frameClockRef = useRef(0);
    const lastMagneticFrameRef = useRef(-1);
    const lastMagneticTransformRef = useRef<{ x: number; y: number } | null>(null);
    const snapLockRef = useRef<{ x: SnapTarget | null; y: SnapTarget | null }>({ x: null, y: null });
    const measurementBaselineRef = useRef<{ x: number; y: number } | null>(null);
    const measurementPrevLogicalRef = useRef<{ x: number; y: number } | null>(null);
    const measurementAxisRef = useRef<'x' | 'y' | null>(null);
    const measurementAxisHoldFramesRef = useRef(0);
    const nextElementIdRef = useRef(1);
    const contactedElementIdsRef = useRef<string[]>([]);
    const pendingContactedElementIdsRef = useRef<string[]>([]);
    const contactFlushRafRef = useRef<number | null>(null);

    // Global mouse tracker for reliable drop positioning
    const mousePos = React.useRef({ x: 0, y: 0 });

    const clearSnapTransientState = () => {
        activeAlignmentsRef.current = {};
        snapState.set({ x: null, y: null, spacing: [] });
        snapLockRef.current = { x: null, y: null };
        lastMagneticFrameRef.current = -1;
        lastMagneticTransformRef.current = null;
        measurementBaselineRef.current = null;
        measurementPrevLogicalRef.current = null;
        measurementAxisRef.current = null;
        measurementAxisHoldFramesRef.current = 0;
    };

    const updateContactedElementIds = (ids: string[]) => {
        const next = [...ids].sort();
        const prev = contactedElementIdsRef.current;
        const sameLength = prev.length === next.length;
        const sameValues = sameLength && prev.every((value, index) => value === next[index]);
        if (sameValues) return;
        contactedElementIdsRef.current = next;
        setContactedElementIds(next);
    };

    const queueContactedElementIds = (ids: string[]) => {
        const next = [...ids].sort();
        const prevPending = pendingContactedElementIdsRef.current;
        const sameLength = prevPending.length === next.length;
        const sameValues = sameLength && prevPending.every((value, index) => value === next[index]);
        if (sameValues) return;

        pendingContactedElementIdsRef.current = next;
        if (contactFlushRafRef.current !== null) return;

        contactFlushRafRef.current = window.requestAnimationFrame(() => {
            contactFlushRafRef.current = null;
            updateContactedElementIds(pendingContactedElementIdsRef.current);
        });
    };

    const computeContactElementIds = (
        activeId: string,
        activeRect: { left: number; top: number; width: number; height: number; right: number; bottom: number }
    ) => {
        const contactThreshold = 2;
        const guideInset = 3;
        const padX = 10;
        const padY = 4;
        const isEditableLabel = (el: EditorElement) =>
            el.type === 'text' || (el.type === 'box' && /<button\b[\s\S]*<\/button>/i.test(el.content || ''));

        const activeElement = elements.find(el => el.id === activeId);
        const baseActiveRect = activeElement && isEditableLabel(activeElement)
            ? {
                left: activeRect.left - padX,
                top: activeRect.top - padY,
                right: activeRect.right + padX,
                bottom: activeRect.bottom + padY
            }
            : {
                left: activeRect.left,
                top: activeRect.top,
                right: activeRect.right,
                bottom: activeRect.bottom
            };
        const adjustedActiveRect = {
            left: baseActiveRect.left + guideInset,
            top: baseActiveRect.top + guideInset,
            right: baseActiveRect.right - guideInset,
            bottom: baseActiveRect.bottom - guideInset
        };

        const hits: string[] = [];

        for (const el of elements) {
            if (el.id === activeId) continue;
            if (el.id.endsWith('-bg')) continue;
            if (el.type === 'box' && !el.content.trim()) continue;

            const node = document.getElementById(el.id);
            const canvasRect = canvasRectRef.current;
            let left = parseInt(el.style.left?.toString() || '0');
            let top = parseInt(el.style.top?.toString() || '0');

            let width = 0;
            let height = 0;
            if (node) {
                const computed = window.getComputedStyle(node);
                if (
                    computed.display === 'none' ||
                    computed.visibility === 'hidden' ||
                    Number.parseFloat(computed.opacity || '1') < 0.05
                ) {
                    continue;
                }
                const rect = node.getBoundingClientRect();
                if (canvasRect) {
                    left = (rect.left - canvasRect.left) / Math.max(scale, 0.0001);
                    top = (rect.top - canvasRect.top) / Math.max(scale, 0.0001);
                }
                width = rect.width / Math.max(scale, 0.0001);
                height = rect.height / Math.max(scale, 0.0001);
            } else {
                const wStr = el.style.width?.toString();
                const hStr = el.style.height?.toString();
                if (wStr?.endsWith('px')) width = parseInt(wStr);
                if (hStr?.endsWith('px')) height = parseInt(hStr);
            }
            if (width <= 0 || height <= 0) continue;

            let otherLeft = left;
            let otherTop = top;
            let otherRight = left + width;
            let otherBottom = top + height;

            if (isEditableLabel(el)) {
                otherLeft -= padX;
                otherTop -= padY;
                otherRight += padX;
                otherBottom += padY;
            }

            otherLeft += guideInset;
            otherTop += guideInset;
            otherRight -= guideInset;
            otherBottom -= guideInset;
            if (otherRight <= otherLeft || otherBottom <= otherTop) continue;

            const horizontalGap = Math.max(
                otherLeft - adjustedActiveRect.right,
                adjustedActiveRect.left - otherRight,
                0
            );
            const verticalGap = Math.max(
                otherTop - adjustedActiveRect.bottom,
                adjustedActiveRect.top - otherBottom,
                0
            );

            if (horizontalGap <= contactThreshold && verticalGap <= contactThreshold) {
                hits.push(el.id);
            }
        }

        return hits;
    };

    const scheduleSettle = (id: string, durationMs: number) => {
        setSettleDurations(prev => ({ ...prev, [id]: durationMs }));

        const previous = settleTimeoutsRef.current.get(id);
        if (previous) window.clearTimeout(previous);

        const timeoutId = window.setTimeout(() => {
            setSettleDurations(prev => {
                if (!(id in prev)) return prev;
                const next = { ...prev };
                delete next[id];
                return next;
            });
            settleTimeoutsRef.current.delete(id);
        }, durationMs + 80);

        settleTimeoutsRef.current.set(id, timeoutId);
    };

    const isSameTarget = (a: SnapTarget | null, b: SnapTarget | null) => {
        if (!a || !b) return false;
        return a.axis === b.axis &&
            a.position === b.position &&
            a.kind === b.kind &&
            a.sourceElementId === b.sourceElementId;
    };

    const applyHysteresisLock = (
        axis: 'x' | 'y',
        rawPositions: number[],
        best: { target: SnapTarget | null; adjustedPos: number }
    ) => {
        const releaseThreshold = 22;
        const existingLock = snapLockRef.current[axis];

        if (existingLock && !isSameTarget(existingLock, best.target)) {
            const nearestLockDistance = Math.min(...rawPositions.map(pos => Math.abs(pos - existingLock.position)));
            if (nearestLockDistance <= releaseThreshold) {
                const closestRawPos = rawPositions.reduce((closest, current) => {
                    return Math.abs(current - existingLock.position) < Math.abs(closest - existingLock.position) ? current : closest;
                }, rawPositions[0]);
                const pulledPos = calculateMagneticPull(closestRawPos, existingLock.position, 16);
                const offsetNeeded = pulledPos - closestRawPos;

                return {
                    target: existingLock,
                    adjustedPos: rawPositions[0] + offsetNeeded
                };
            }
            snapLockRef.current[axis] = null;
        }

        if (best.target) {
            snapLockRef.current[axis] = best.target;
        } else {
            snapLockRef.current[axis] = null;
        }

        return best;
    };

    const computeSpacingData = (
            activeId: string,
            activeRect: { left: number; top: number; width: number; height: number; right: number; bottom: number }
        ) => {
        type SpacingGuide = {
            axis: 'x' | 'y';
            start: number;
            end: number;
            position: number;
            value: number;
            elementIds?: string[];
        };
        const overlapThreshold = 8;
        const guideInset = 0;
        type Candidate = {
            gap: number;
            start: number;
            end: number;
            position: number;
            fromContainer: boolean;
            elementId?: string;
        };
        type RectInfo = {
            id: string;
            type: EditorElement['type'];
            left: number;
            top: number;
            right: number;
            bottom: number;
            width: number;
            height: number;
        };
        // Spacing guides should snap to visible element borders, not padded edit hitboxes.
        const adjustedActiveRect = {
            left: activeRect.left + guideInset,
            top: activeRect.top + guideInset,
            width: Math.max(0, activeRect.width - guideInset * 2),
            height: Math.max(0, activeRect.height - guideInset * 2),
            right: activeRect.right - guideInset,
            bottom: activeRect.bottom - guideInset
        };

        const activeCenterX = adjustedActiveRect.left + adjustedActiveRect.width / 2;
        const activeCenterY = adjustedActiveRect.top + adjustedActiveRect.height / 2;

        const siblingRects: RectInfo[] = [];
        for (const el of elements) {
            if (el.id === activeId) continue;
            if (!el.id.endsWith('-bg') && el.type === 'box' && !el.content.trim()) continue;

            const node = document.getElementById(el.id);
            const canvasRect = canvasRectRef.current;
            let left = parseInt(el.style.left?.toString() || '0');
            let top = parseInt(el.style.top?.toString() || '0');

            let width = 0;
            let height = 0;

            if (node) {
                const rect = node.getBoundingClientRect();
                if (canvasRect) {
                    left = (rect.left - canvasRect.left) / Math.max(scale, 0.0001);
                    top = (rect.top - canvasRect.top) / Math.max(scale, 0.0001);
                }
                width = rect.width / Math.max(scale, 0.0001);
                height = rect.height / Math.max(scale, 0.0001);
            } else {
                const wStr = el.style.width?.toString();
                const hStr = el.style.height?.toString();
                if (wStr?.endsWith('px')) width = parseInt(wStr);
                if (hStr?.endsWith('px')) height = parseInt(hStr);
            }

            if (width <= 0 || height <= 0) continue;

            const rectInfo: RectInfo = {
                id: el.id,
                type: el.type,
                left: left + guideInset,
                top: top + guideInset,
                right: left + width - guideInset,
                bottom: top + height - guideInset,
                width: Math.max(0, width - guideInset * 2),
                height: Math.max(0, height - guideInset * 2)
            };
            if (rectInfo.width <= 0 || rectInfo.height <= 0) continue;

            siblingRects.push(rectInfo);
        }

        const referenceRects = siblingRects;
        const candidateRects = siblingRects;

        let leftCandidate: Candidate | null = null;
        let rightCandidate: Candidate | null = null;
        let topCandidate: Candidate | null = null;
        let bottomCandidate: Candidate | null = null;

        const shouldReplaceCandidate = (
            current: Candidate | null,
            nextGap: number,
            nextFromContainer: boolean
        ) => {
            if (!current) return true;
            // Prefer real element edges over container walls, then prefer smaller gap.
            if (current.fromContainer && !nextFromContainer) return true;
            if (current.fromContainer === nextFromContainer && nextGap < current.gap) return true;
            return false;
        };

        for (const rect of candidateRects) {
            const isContainerRect = rect.id.endsWith('-bg');

            const overlapY = Math.min(adjustedActiveRect.bottom, rect.bottom) - Math.max(adjustedActiveRect.top, rect.top);
            const minYOverlap = Math.min(adjustedActiveRect.height, rect.height) * 0.35;
            if (overlapY > Math.max(overlapThreshold, minYOverlap)) {
                // Anchor horizontal guide labels/lines to the dragged item's center
                // to avoid jitter from tiny vertical hand movement.
                const yPos = activeCenterY;

                if (isContainerRect && rect.left < adjustedActiveRect.left) {
                    const gap = adjustedActiveRect.left - rect.left;
                    if (gap > 0 && shouldReplaceCandidate(leftCandidate, gap, true)) {
                        leftCandidate = {
                            gap,
                            start: rect.left,
                            end: adjustedActiveRect.left,
                            position: yPos,
                            fromContainer: true,
                            elementId: rect.id
                        };
                    }
                }

                if (isContainerRect && rect.right > adjustedActiveRect.right) {
                    const gap = rect.right - adjustedActiveRect.right;
                    if (gap > 0 && shouldReplaceCandidate(rightCandidate, gap, true)) {
                        rightCandidate = {
                            gap,
                            start: adjustedActiveRect.right,
                            end: rect.right,
                            position: yPos,
                            fromContainer: true,
                            elementId: rect.id
                        };
                    }
                }

                if (rect.right <= adjustedActiveRect.left) {
                    const gap = adjustedActiveRect.left - rect.right;
                    if (gap > 0 && shouldReplaceCandidate(leftCandidate, gap, isContainerRect)) {
                        leftCandidate = {
                            gap,
                            start: rect.right,
                            end: adjustedActiveRect.left,
                            position: yPos,
                            fromContainer: isContainerRect,
                            elementId: rect.id
                        };
                    }
                }

                if (rect.left >= adjustedActiveRect.right) {
                    const gap = rect.left - adjustedActiveRect.right;
                    if (gap > 0 && shouldReplaceCandidate(rightCandidate, gap, isContainerRect)) {
                        rightCandidate = {
                            gap,
                            start: adjustedActiveRect.right,
                            end: rect.left,
                            position: yPos,
                            fromContainer: isContainerRect,
                            elementId: rect.id
                        };
                    }
                }
            }

            const overlapX = Math.min(adjustedActiveRect.right, rect.right) - Math.max(adjustedActiveRect.left, rect.left);
            const minXOverlap = Math.min(adjustedActiveRect.width, rect.width) * 0.35;
            if (overlapX > Math.max(overlapThreshold, minXOverlap)) {
                // Anchor vertical guide labels/lines to the dragged item's center
                // to avoid jitter from tiny horizontal hand movement.
                const xPos = activeCenterX;

                if (isContainerRect && rect.top < adjustedActiveRect.top) {
                    const gap = adjustedActiveRect.top - rect.top;
                    if (gap > 0 && shouldReplaceCandidate(topCandidate, gap, true)) {
                        topCandidate = {
                            gap,
                            start: rect.top,
                            end: adjustedActiveRect.top,
                            position: xPos,
                            fromContainer: true,
                            elementId: rect.id
                        };
                    }
                }

                if (isContainerRect && rect.bottom > adjustedActiveRect.bottom) {
                    const gap = rect.bottom - adjustedActiveRect.bottom;
                    if (gap > 0 && shouldReplaceCandidate(bottomCandidate, gap, true)) {
                        bottomCandidate = {
                            gap,
                            start: adjustedActiveRect.bottom,
                            end: rect.bottom,
                            position: xPos,
                            fromContainer: true,
                            elementId: rect.id
                        };
                    }
                }

                if (rect.bottom <= adjustedActiveRect.top) {
                    const gap = adjustedActiveRect.top - rect.bottom;
                    if (gap > 0 && shouldReplaceCandidate(topCandidate, gap, isContainerRect)) {
                        topCandidate = {
                            gap,
                            start: rect.bottom,
                            end: adjustedActiveRect.top,
                            position: xPos,
                            fromContainer: isContainerRect,
                            elementId: rect.id
                        };
                    }
                }

                if (rect.top >= adjustedActiveRect.bottom) {
                    const gap = rect.top - adjustedActiveRect.bottom;
                    if (gap > 0 && shouldReplaceCandidate(bottomCandidate, gap, isContainerRect)) {
                        bottomCandidate = {
                            gap,
                            start: adjustedActiveRect.bottom,
                            end: rect.top,
                            position: xPos,
                            fromContainer: isContainerRect,
                            elementId: rect.id
                        };
                    }
                }
            }
        }

        const spacing: SpacingGuide[] = [];
        if (leftCandidate) {
            spacing.push({
                axis: 'x',
                start: leftCandidate.start,
                end: leftCandidate.end,
                position: leftCandidate.position,
                value: Math.round(leftCandidate.gap),
                elementIds: leftCandidate.elementId ? [leftCandidate.elementId] : []
            });
        }
        if (rightCandidate) {
            spacing.push({
                axis: 'x',
                start: rightCandidate.start,
                end: rightCandidate.end,
                position: rightCandidate.position,
                value: Math.round(rightCandidate.gap),
                elementIds: rightCandidate.elementId ? [rightCandidate.elementId] : []
            });
        }
        if (topCandidate) {
            spacing.push({
                axis: 'y',
                start: topCandidate.start,
                end: topCandidate.end,
                position: topCandidate.position,
                value: Math.round(topCandidate.gap),
                elementIds: topCandidate.elementId ? [topCandidate.elementId] : []
            });
        }
        if (bottomCandidate) {
            spacing.push({
                axis: 'y',
                start: bottomCandidate.start,
                end: bottomCandidate.end,
                position: bottomCandidate.position,
                value: Math.round(bottomCandidate.gap),
                elementIds: bottomCandidate.elementId ? [bottomCandidate.elementId] : []
            });
        }

        let equalSnapX: number | null = null;
        if (leftCandidate && rightCandidate) {
            const gapDelta = Math.abs(leftCandidate.gap - rightCandidate.gap);
            if (gapDelta <= 10) {
                const leftBoundary = leftCandidate.start;
                const rightBoundary = rightCandidate.end;
                equalSnapX = (leftBoundary + rightBoundary - activeRect.width) / 2;
            }
        }

        let equalSnapY: number | null = null;
        if (topCandidate && bottomCandidate) {
            const gapDelta = Math.abs(topCandidate.gap - bottomCandidate.gap);
            if (gapDelta <= 10) {
                const topBoundary = topCandidate.start;
                const bottomBoundary = bottomCandidate.end;
                equalSnapY = (topBoundary + bottomBoundary - activeRect.height) / 2;
            }
        }

        // Match dragged element gap to existing sibling gaps (distribution alignment).
        const pairSnapThreshold = 64;
        const pairConsistencyTolerance = 16;
        let bestPairSnapX: { snap: number; delta: number; guide: SpacingGuide } | null = null;
        let bestPairSnapY: { snap: number; delta: number; guide: SpacingGuide } | null = null;
        const referenceGapsX: number[] = [];
        const referenceGapsY: number[] = [];

        const byLeft = [...referenceRects].sort((a, b) => a.left - b.left);
        for (let i = 0; i < byLeft.length; i += 1) {
            for (let j = i + 1; j < byLeft.length; j += 1) {
                const a = byLeft[i];
                const b = byLeft[j];
                const overlapY = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top);
                if (overlapY <= overlapThreshold || b.left < a.right) continue;

                const refGap = b.left - a.right;
                referenceGapsX.push(refGap);
                const yPos = Math.max(a.top, b.top) + overlapY / 2;
                const refGuide: SpacingGuide = {
                    axis: 'x',
                    start: a.right,
                    end: b.left,
                    position: yPos,
                    value: Math.round(refGap)
                };

                const candidates = [
                    b.right + refGap, // place dragged element to the right with same gap
                    a.left - refGap - activeRect.width // place dragged element to the left with same gap
                ];

                // place dragged element between a and b with equal gaps on both sides when width permits
                const betweenLeft = a.right + refGap;
                const rightGapIfBetween = b.left - (betweenLeft + activeRect.width);
                if (Math.abs(rightGapIfBetween - refGap) <= pairConsistencyTolerance) {
                    candidates.push(betweenLeft);
                }

                for (const snapLeft of candidates) {
                    const delta = Math.abs(activeRect.left - snapLeft);
                    if (delta > pairSnapThreshold) continue;
                    if (!bestPairSnapX || delta < bestPairSnapX.delta) {
                        bestPairSnapX = { snap: snapLeft, delta, guide: refGuide };
                    }
                }
            }
        }

        // Also allow matching any discovered horizontal reference gap against a single nearby sibling.
        for (const refGap of referenceGapsX) {
            for (const anchor of candidateRects) {
                const overlapY = Math.min(activeRect.bottom, anchor.bottom) - Math.max(activeRect.top, anchor.top);
                if (overlapY <= overlapThreshold) continue;

                const yPos = Math.max(activeRect.top, anchor.top) + overlapY / 2;
                const anchorGuide: SpacingGuide = {
                    axis: 'x',
                    start: anchor.right,
                    end: anchor.right + refGap,
                    position: yPos,
                    value: Math.round(refGap)
                };

                const candidates = [
                    anchor.right + refGap,
                    anchor.left - refGap - activeRect.width
                ];

                for (const snapLeft of candidates) {
                    const delta = Math.abs(activeRect.left - snapLeft);
                    if (delta > pairSnapThreshold) continue;
                    if (!bestPairSnapX || delta < bestPairSnapX.delta) {
                        bestPairSnapX = { snap: snapLeft, delta, guide: anchorGuide };
                    }
                }
            }
        }

        const byTop = [...referenceRects].sort((a, b) => a.top - b.top);
        for (let i = 0; i < byTop.length; i += 1) {
            for (let j = i + 1; j < byTop.length; j += 1) {
                const a = byTop[i];
                const b = byTop[j];
                const overlapX = Math.min(a.right, b.right) - Math.max(a.left, b.left);
                if (overlapX <= overlapThreshold || b.top < a.bottom) continue;

                const refGap = b.top - a.bottom;
                referenceGapsY.push(refGap);
                const xPos = Math.max(a.left, b.left) + overlapX / 2;
                const refGuide: SpacingGuide = {
                    axis: 'y',
                    start: a.bottom,
                    end: b.top,
                    position: xPos,
                    value: Math.round(refGap)
                };

                const candidates = [
                    b.bottom + refGap, // place dragged element below with same gap
                    a.top - refGap - activeRect.height // place dragged element above with same gap
                ];

                // place dragged element between a and b with equal gaps on both sides when height permits
                const betweenTop = a.bottom + refGap;
                const bottomGapIfBetween = b.top - (betweenTop + activeRect.height);
                if (Math.abs(bottomGapIfBetween - refGap) <= pairConsistencyTolerance) {
                    candidates.push(betweenTop);
                }

                for (const snapTop of candidates) {
                    const delta = Math.abs(activeRect.top - snapTop);
                    if (delta > pairSnapThreshold) continue;
                    if (!bestPairSnapY || delta < bestPairSnapY.delta) {
                        bestPairSnapY = { snap: snapTop, delta, guide: refGuide };
                    }
                }
            }
        }

        // Also allow matching any discovered vertical reference gap against a single nearby sibling.
        for (const refGap of referenceGapsY) {
            for (const anchor of candidateRects) {
                const overlapX = Math.min(activeRect.right, anchor.right) - Math.max(activeRect.left, anchor.left);
                if (overlapX <= overlapThreshold) continue;

                const xPos = Math.max(activeRect.left, anchor.left) + overlapX / 2;
                const anchorGuide: SpacingGuide = {
                    axis: 'y',
                    start: anchor.bottom,
                    end: anchor.bottom + refGap,
                    position: xPos,
                    value: Math.round(refGap)
                };

                const candidates = [
                    anchor.bottom + refGap,
                    anchor.top - refGap - activeRect.height
                ];

                for (const snapTop of candidates) {
                    const delta = Math.abs(activeRect.top - snapTop);
                    if (delta > pairSnapThreshold) continue;
                    if (!bestPairSnapY || delta < bestPairSnapY.delta) {
                        bestPairSnapY = { snap: snapTop, delta, guide: anchorGuide };
                    }
                }
            }
        }

        if (bestPairSnapX) {
            const currentDelta = equalSnapX === null ? Infinity : Math.abs(activeRect.left - equalSnapX);
            if (bestPairSnapX.delta <= currentDelta) {
                equalSnapX = bestPairSnapX.snap;
            }
        }

        if (bestPairSnapY) {
            const currentDelta = equalSnapY === null ? Infinity : Math.abs(activeRect.top - equalSnapY);
            if (bestPairSnapY.delta <= currentDelta) {
                equalSnapY = bestPairSnapY.snap;
            }
        }

        return { spacing, equalSnapX, equalSnapY };
    };

    const handleDelete = (idToDelete: string) => {
        if (idToDelete.endsWith('-bg')) {
            const baseId = idToDelete.slice(0, -3);
            setElements(prev => prev.filter(el => !el.id.startsWith(baseId)));
            toast({ description: "Section deleted" });
        } else {
            setElements(prev => prev.filter(el => el.id !== idToDelete));
            toast({ description: "Element deleted" });
        }
        if (selectedId === idToDelete) setSelectedId(null);
    };

    // Auto-resize canvas based on content
    useEffect(() => {
        let maxBottom = 800;
        elements.forEach(el => {
            const top = parseInt(el.style.top?.toString() || '0');
            // Try to parse height, fallback to 100 if auto/missing
            let height = 0;
            const hStr = el.style.height?.toString();
            if (hStr && hStr.endsWith('px')) {
                height = parseInt(hStr);
            } else {
                height = 100; // Estimate for text/auto
            }
            if (top + height > maxBottom) {
                maxBottom = top + height;
            }
        });
        // Add buffer
        setCanvasHeight(Math.max(800, maxBottom));
    }, [elements]);

    useEffect(() => {
        const handlePointerMove = (e: PointerEvent | MouseEvent | TouchEvent) => {
            let x = 0;
            let y = 0;
            if ('touches' in e) {
                x = e.changedTouches[0].clientX;
                y = e.changedTouches[0].clientY;
            } else {
                x = (e as MouseEvent).clientX;
                y = (e as MouseEvent).clientY;
            }

            mousePos.current = { x, y };

            const now = performance.now();
            const { lastX, lastY, lastT } = velocityRef.current;
            if (lastT > 0) {
                const dt = now - lastT;
                if (dt > 0 && dt < 100) {
                    velocityRef.current.vx = (x - lastX) / dt;
                    velocityRef.current.vy = (y - lastY) / dt;
                }
            }
            velocityRef.current.lastX = x;
            velocityRef.current.lastY = y;
            velocityRef.current.lastT = now;
        };

        window.addEventListener('pointermove', handlePointerMove);
        window.addEventListener('mousemove', handlePointerMove);
        window.addEventListener('touchmove', handlePointerMove);

        return () => {
            window.removeEventListener('pointermove', handlePointerMove);
            window.removeEventListener('mousemove', handlePointerMove);
            window.removeEventListener('touchmove', handlePointerMove);
        };
    }, []);

    useEffect(() => {
        let rafId = 0;
        const tick = (ts: number) => {
            frameClockRef.current = Math.floor(ts);
            rafId = requestAnimationFrame(tick);
        };
        rafId = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(rafId);
    }, []);

    useEffect(() => {
        const settleTimeouts = settleTimeoutsRef.current;
        return () => {
            settleTimeouts.forEach(timeoutId => window.clearTimeout(timeoutId));
            settleTimeouts.clear();
            if (contactFlushRafRef.current !== null) {
                window.cancelAnimationFrame(contactFlushRafRef.current);
                contactFlushRafRef.current = null;
            }
        };
    }, []);

    // Auto-scale calculation - fit canvas to window width
    useEffect(() => {
        const handleResize = () => {
            const containerWidth = window.innerWidth;
            const sidebarsWidth = isPreview ? 0 : 520; // Approx 256px (Left) + 260px (Right) + padding
            const availableWidth = containerWidth - sidebarsWidth;
            const canvasWidth = 900; // Base canvas width

            if (isPreview) {
                // In Preview: strictly fit to width, allowing upscale > 1
                // This simulates a full-width experience on a fixed-width design
                const newScale = containerWidth / canvasWidth;
                setScale(newScale);
            } else {
                // In Editor: Scale down for smaller screens, but don't upscale beyond 100%
                // Use a slight buffer (0.95) to prevent edge touching
                const availableWidth = containerWidth - sidebarsWidth;
                const newScale = Math.min((availableWidth / canvasWidth) * 0.95, 1);
                setScale(Math.max(newScale, 0.2)); // Minimum scale safety
            }
        };

        handleResize(); // Initial calculation
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, [isPreview]); // Re-calculate when preview mode toggles

    // Handle Delete Key
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Delete' || e.key === 'Backspace') {
                // Ignore if user is typing in an input/textarea/contentEditable
                const activeEl = document.activeElement;
                const isInput = activeEl?.tagName === 'INPUT' || activeEl?.tagName === 'TEXTAREA' || (activeEl as HTMLElement)?.isContentEditable;

                if (isInput) return;

                if (selectedId) {
                    e.preventDefault(); // Prevent browser back navigation on Backspace
                    handleDelete(selectedId);
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [selectedId]);

    const handleAddPage = () => {
        const newPageId = `page-${Date.now()}`;
        const newPageName = `Page ${pages.length + 1}`;
        const newTop = canvasHeight; // Start at current bottom
        const pageHeight = 800; // Standard page height

        // Add to pages list
        setPages([...pages, { id: newPageId, name: newPageName }]);

        // Extend canvas
        setCanvasHeight(prev => prev + pageHeight);

        // Add visual separator/container for the new page
        const newPageSection: EditorElement = {
            id: newPageId,
            type: 'box',
            name: newPageName, // This will show in layers
            content: '',
            style: {
                position: 'absolute',
                top: `${newTop}px`,
                left: '0px',
                width: '100%',
                height: `${pageHeight}px`,
                borderTop: '1px dashed #ccc', // Visual indicator of new page start
                display: 'flex',
                alignItems: 'start',
                justifyContent: 'center',
                paddingTop: '20px',
                color: '#999',
                fontSize: '12px',
                pointerEvents: 'none' // Don't interfere with drops, just a visual marker
            },
            behaviors: [],
            isLocked: true // Structural
        };

        // No label for the new page section
        setElements(prev => [...prev, newPageSection]);
        toast({ description: "New page section added below" });
    };

    const handleAddText = () => {
        handleAddElement('text');
    };

    const handleAddImage = () => {
        handleAddElement('image');
    };

    const handleAddElement = (subtype: string) => {
        if (FULL_WIDTH_SECTION_SUBTYPES.has(subtype)) {
            handleAddSection(subtype);
            return;
        }

        const id = `${subtype}-${nextElementIdRef.current++}`;
        const canvasNode = document.getElementById('canvas-droppable');
        const scrollContainer = canvasNode?.parentElement?.parentElement as HTMLElement | null;
        const scrollTop = scrollContainer?.scrollTop ?? 0;
        const dropX = 120;
        const dropY = Math.max(40, Math.round((scrollTop / Math.max(scale, 0.01) + 120) / 10) * 10);
        const newElements = createDefaultElement(subtype, id, dropX, dropY);
        setElements(prev => [...prev, ...newElements]);
        setSelectedId(newElements[0]?.id ?? null);
        toast({ description: `Added ${subtype}` });
    };

    const handleDragStart = (event: any) => {
        setActiveDragId(event.active.id);
        queueContactedElementIds([]);
        clearSnapTransientState();
        velocityRef.current.vx = 0;
        velocityRef.current.vy = 0;
        velocityRef.current.lastT = performance.now();
        velocityRef.current.lastX = mousePos.current.x;
        velocityRef.current.lastY = mousePos.current.y;

        // Store scale for DOM calculations
        if (typeof window !== 'undefined') {
            (window as any)._canvasScale = scale;
        }

        const canvas = document.getElementById('canvas-droppable');
        if (canvas) {
            const rect = canvas.getBoundingClientRect();
            canvasRectRef.current = { left: rect.left, top: rect.top, width: rect.width, height: rect.height };
        }

        // Calculate drop suggestion for new content
        if (event.active.data.current?.type === 'content') {
            const activeSubtype = event.active.data.current?.subtype as string | undefined;
            if (activeSubtype && FULL_WIDTH_SECTION_SUBTYPES.has(activeSubtype)) {
                setSuggestedDropHeight(SECTION_PREVIEW_HEIGHT[activeSubtype] ?? 200);
                setSuggestedDropLabel(`Drop ${activeSubtype} here`);
            } else {
                setSuggestedDropHeight(120);
                setSuggestedDropLabel('Drop here');
            }

            let maxBottom = 0;
            elements.forEach(el => {
                // Only snap to main section containers to avoid gaps from inner text
                if (!el.id.endsWith('-bg')) return;

                const top = parseInt(el.style.top?.toString() || '0');
                let h = 0;
                const hStr = el.style.height?.toString();
                if (hStr && hStr.endsWith('px')) h = parseInt(hStr);
                if (top + h > maxBottom) maxBottom = top + h;
            });
            // Defaults to 0
            setSuggestedDropY(maxBottom);
        }

        // Cache canvas element bounds in CANVAS coordinates for snappy magnetic alignment
        const activeIdStr = String(event.active.id);
        if (canvasRectRef.current) {
            globalSnapEngine.initialize(elements, activeIdStr, 900, canvasHeight, gridSize);
        }
    };

    const handleDragMove = (event: DragMoveEvent) => {
        const { over, active } = event;

        // Rail insertion guides are only for dragging new sidebar content.
        if (active.data.current?.type !== 'content') {
            setSuggestedDropY(null);
            setDropPreview(null);
            setActiveGuide(null);
            return;
        }

        const activeSubtype = active.data.current?.subtype as string | undefined;
        const isSectionDrag = !!activeSubtype && FULL_WIDTH_SECTION_SUBTYPES.has(activeSubtype);
        if (!isSectionDrag) {
            setSuggestedDropY(null);
        }

        if (isSectionDrag && canvasRectRef.current) {
            const canvasRect = canvasRectRef.current;
            const isInsideCanvas =
                mousePos.current.x >= canvasRect.left &&
                mousePos.current.x <= canvasRect.left + canvasRect.width &&
                mousePos.current.y >= canvasRect.top &&
                mousePos.current.y <= canvasRect.top + canvasRect.height;
            if (!isInsideCanvas) {
                setSuggestedDropY(null);
                setDropPreview(null);
                setActiveGuide(null);
                snapState.set({ x: null, y: null, spacing: [] });
                return;
            }
            const logicalMouseY = (mousePos.current.y - canvasRect.top) / scale;
            const sections = elements
                .filter(el => el.id.endsWith('-bg'))
                .map(el => {
                    const top = parseInt(el.style.top?.toString() || '0');
                    const height = parseInt(el.style.height?.toString() || '0') || 0;
                    return { id: el.id, top, height, bottom: top + height };
                })
                .sort((a, b) => a.top - b.top);

            if (sections.length === 0) {
                setSuggestedDropY(0);
                const sectionHeight = SECTION_PREVIEW_HEIGHT[activeSubtype] ?? 200;
                setDropPreview({
                    placeholderRect: { left: 0, top: 0, width: 900, height: sectionHeight },
                    insertionLine: { axis: 'y', position: 0, start: 0, end: 900 },
                    label: `Insert ${activeSubtype}`
                });
                setActiveGuide(null);
                snapState.set({ x: null, y: null, spacing: [] });
                return;
            }

            const slotCandidates: Array<{ y: number; sectionId: string; position: 'top' | 'bottom' }> = [];
            sections.forEach(sec => {
                slotCandidates.push({ y: sec.top, sectionId: sec.id, position: 'top' });
                slotCandidates.push({ y: sec.bottom, sectionId: sec.id, position: 'bottom' });
            });

            const uniqueSlots = slotCandidates.reduce<Array<{ y: number; sectionId: string; position: 'top' | 'bottom' }>>((acc, slot) => {
                const exists = acc.some(s => Math.abs(s.y - slot.y) < 0.5);
                if (!exists) acc.push(slot);
                return acc;
            }, []);

            let bestSlot = uniqueSlots[0];
            let bestDist = Math.abs(logicalMouseY - bestSlot.y);
            for (let i = 1; i < uniqueSlots.length; i += 1) {
                const s = uniqueSlots[i];
                const dist = Math.abs(logicalMouseY - s.y);
                if (dist < bestDist) {
                    bestDist = dist;
                    bestSlot = s;
                }
            }

            const targetSection = sections.find(sec => sec.id === bestSlot.sectionId) ?? sections[0];
            const guidePosition: 'top' | 'bottom' = bestSlot.position;
            const previewY = bestSlot.y;
            setSuggestedDropY(previewY);
            const sectionHeight = SECTION_PREVIEW_HEIGHT[activeSubtype] ?? 200;
            setDropPreview({
                targetRect: { left: 0, top: targetSection.top, width: 900, height: targetSection.height },
                placeholderRect: { left: 0, top: previewY, width: 900, height: sectionHeight },
                insertionLine: { axis: 'y', position: previewY, start: 0, end: 900 },
                label: `Insert ${activeSubtype}`
            });

            const targetRect = {
                top: (targetSection.top * scale) + canvasRect.top,
                left: canvasRect.left,
                width: canvasRect.width,
                height: targetSection.height * scale,
                bottom: ((targetSection.top + targetSection.height) * scale) + canvasRect.top,
                right: canvasRect.left + canvasRect.width
            } as DOMRect;

            setActiveGuide(prev => {
                if (prev && prev.id === targetSection.id && prev.position === guidePosition) {
                    return prev;
                }
                return {
                    id: targetSection.id,
                    position: guidePosition,
                    rect: targetRect
                };
            });

            const refTop = (targetRect.top - canvasRect.top) / scale;
            const refH = targetRect.height / scale;
            snapState.set({
                x: null,
                y: {
                    target: {
                        axis: 'y' as const,
                        position: previewY,
                        kind: 'edge' as const,
                        priority: 1,
                        sourceElementId: targetSection.id
                    }
                },
                spacing: []
            });
            return;
        }

        // If not dragging over anything, dragging over self/canvas.
        if (!over || over.id === 'canvas-droppable' || over.id === active.id) {
            setActiveGuide(null);
            setDropPreview(null);
            snapState.set({ x: null, y: null, spacing: [] });
            return;
        }

        // Get rect of the target element
        // @ts-ignore - dnd-kit types for rect are sometimes tricky to access directly on event.over
        const overRect = over.rect;

        if (!overRect) return;

        // Calculate cursor position relative to the target element
        // event.delta gives us movement, but we need absolute position relative to target
        // We can use mousePos.current (global tracker) vs overRect
        // Note: dnd-kit coordinates are viewport relative
        const mouseX = mousePos.current.x;
        const mouseY = mousePos.current.y;

        // Convert DOMRect to simple object if needed, but we used DOMRect in type
        const targetRect = {
            top: overRect.top,
            left: overRect.left,
            width: overRect.width,
            height: overRect.height,
            bottom: overRect.top + overRect.height,
            right: overRect.left + overRect.width
        } as DOMRect;

        const relX = mouseX - targetRect.left;
        const relY = mouseY - targetRect.top;

        // Logic:
        // Top 50% -> Top
        // Bottom 50% -> Bottom
        // Edges (20%) -> Columns
        const edgeThreshold = 40; // px

        let guidePos: 'top' | 'bottom' | 'left' | 'right' | null = null;

        if (relX > targetRect.width - edgeThreshold) {
            guidePos = 'right';
        } else if (relX < edgeThreshold) {
            guidePos = 'left';
        } else if (relY < targetRect.height / 2) {
            guidePos = 'top';
        } else {
            guidePos = 'bottom';
        }

        if (guidePos) {
            setActiveGuide(prev => {
                if (prev && prev.id === over.id && prev.position === guidePos) {
                    return prev;
                }
                return {
                    id: over.id as string,
                    position: guidePos as 'top' | 'bottom' | 'left' | 'right',
                    rect: targetRect
                };
            });
        } else {
            setActiveGuide(prev => prev !== null ? null : prev);
            setDropPreview(null);
        }

        // Mirror content insertion guide into snapState so blue alignment lines remain visible.
        if (canvasRectRef.current) {
            const canvasRect = canvasRectRef.current;
            const refLeft = (targetRect.left - canvasRect.left) / scale;
            const refTop = (targetRect.top - canvasRect.top) / scale;
            const refW = targetRect.width / scale;
            const refH = targetRect.height / scale;

            const subtype = active.data.current?.subtype as string | undefined;
            let previewW = 200;
            let previewH = 100;
            if (subtype === 'hero') { previewW = 900; previewH = 400; }
            else if (subtype === 'features') { previewW = 900; previewH = 200; }
            else if (subtype === 'testimonials') { previewW = 900; previewH = 400; }
            else if (subtype === 'pricing') { previewW = 900; previewH = 400; }
            else if (subtype === 'faq') { previewW = 800; previewH = 300; }
            else if (subtype === 'footer') { previewW = 900; previewH = 200; }
            else if (subtype === 'button') { previewW = 120; previewH = 40; }
            const gap = 16;

            let placeholderLeft = refLeft;
            let placeholderTop = refTop;
            let insertionLine: DropPreview['insertionLine'] = undefined;
            if (guidePos === 'top') {
                placeholderTop = refTop - gap - previewH;
                insertionLine = { axis: 'y', position: refTop, start: refLeft, end: refLeft + refW };
            } else if (guidePos === 'bottom') {
                placeholderTop = refTop + refH + gap;
                insertionLine = { axis: 'y', position: refTop + refH, start: refLeft, end: refLeft + refW };
            } else if (guidePos === 'left') {
                placeholderLeft = refLeft - gap - previewW;
                insertionLine = { axis: 'x', position: refLeft, start: refTop, end: refTop + refH };
            } else if (guidePos === 'right') {
                placeholderLeft = refLeft + refW + gap;
                insertionLine = { axis: 'x', position: refLeft + refW, start: refTop, end: refTop + refH };
            }

            const boxW = Math.max(20, Math.min(previewW, 900));
            const boxH = Math.max(20, previewH);
            setDropPreview({
                targetRect: { left: refLeft, top: refTop, width: refW, height: refH },
                placeholderRect: {
                    left: Math.max(0, Math.min(900 - boxW, placeholderLeft)),
                    top: Math.max(0, placeholderTop),
                    width: boxW,
                    height: boxH
                },
                insertionLine,
                label: subtype ? `Drop ${subtype}` : 'Drop here'
            });

            const contentGuideX = (guidePos === 'left' || guidePos === 'right')
                ? {
                    target: {
                        axis: 'x' as const,
                        position: guidePos === 'left' ? refLeft : (refLeft + refW),
                        kind: 'edge' as const,
                        priority: 1,
                        sourceElementId: String(over.id)
                    }
                }
                : null;

            const contentGuideY = (guidePos === 'top' || guidePos === 'bottom')
                ? {
                    target: {
                        axis: 'y' as const,
                        position: guidePos === 'top' ? refTop : (refTop + refH),
                        kind: 'edge' as const,
                        priority: 1,
                        sourceElementId: String(over.id)
                    }
                }
                : null;

            snapState.set({
                x: contentGuideX,
                y: contentGuideY,
                spacing: []
            });
        }

    };

    const handleDragCancel = () => {
        setActiveDragId(null);
        queueContactedElementIds([]);
        setActiveGuide(null);
        setSuggestedDropY(null);
        setDropPreview(null);
        setSuggestedDropLabel('Drop section here');
        clearSnapTransientState();
    };

    const handleDragEnd = (event: DragEndEvent) => {
        setActiveDragId(null);
        queueContactedElementIds([]);
        const dropVelocity = Math.hypot(velocityRef.current.vx, velocityRef.current.vy);
        const settleMs = Math.max(140, Math.min(320, Math.round(140 + (dropVelocity * 120))));
        const snappedDrop = { ...activeAlignmentsRef.current };

        const { over, active } = event;
        const data = active.data.current;
        setSuggestedDropY(null);
        setDropPreview(null);
        setSuggestedDropLabel('Drop section here');

        if (!data) {
            setActiveGuide(null);
            clearSnapTransientState();
            return;
        }

        // 1. Dropping a Behavior onto an Element
        if (data.type === 'behavior' && over) {
            const behaviorId = data.behaviorId; // e.g. 'hydrodynamic'
            const targetElementId = over.id;

            // Only apply behaviors to valid elements, not the canvas itself unless page-wide
            // For now, assuming drops on specific elements
            setElements(prev => prev.map(el => {
                if (el.id === targetElementId) {
                    const newBehaviorId = `b-${Date.now()}`;
                    const newBehavior = {
                        id: newBehaviorId,
                        type: behaviorId as any,
                        config: {}
                    };
                    return { ...el, behaviors: [...el.behaviors, newBehavior] };
                }
                return el;
            }));
            toast({ description: `Applied ${behaviorId} to element` });
        }

        // 2. Dropping a NEW Layout/Content item onto the Canvas
        // Allow dropping on canvas OR on top of existing elements (which acts as canvas drop)
        const isOverCanvas = over?.id === 'canvas-droppable' || elements.some(el => el.id === over?.id);

        if (data.type === 'content' && isOverCanvas) {
            const subtype = data.subtype;
            const isSectionSubtype = FULL_WIDTH_SECTION_SUBTYPES.has(subtype);

            // Calculate drop position
            let dropX = 100;
            let dropY = 100;

            // For Push Logic
            let shouldPush = false;
            let pushThresholdY = 0;
            let pushAmount = 0;

            // Get the canvas DOM element
            const canvasEl = document.getElementById('canvas-droppable');

            if (canvasEl) {
                const canvasRect = canvasEl.getBoundingClientRect();

                // Section insertions use section-slot stacking (before/after existing sections).
                if (FULL_WIDTH_SECTION_SUBTYPES.has(subtype)) {
                    dropX = 0;
                    dropY = typeof suggestedDropY === 'number' ? suggestedDropY : 0;
                }
                // SMART ALIGNMENT LOGIC
                else if (activeGuide) {
                    const guideRect = activeGuide.rect;
                    const gap = 16;

                    let newW = 200;
                    let newH = 100;
                    if (subtype === 'hero') { newW = 900; newH = 400; }
                    else if (subtype === 'features') { newW = 900; newH = 200; }
                    else if (subtype === 'testimonials') { newW = 900; newH = 400; }
                    else if (subtype === 'pricing') { newW = 900; newH = 400; }
                    else if (subtype === 'faq') { newW = 800; newH = 300; }
                    else if (subtype === 'footer') { newW = 900; newH = 200; }
                    else if (subtype === 'button') { newW = 120; newH = 40; }

                    const refLeft = (guideRect.left - canvasRect.left) / scale;
                    const refTop = (guideRect.top - canvasRect.top) / scale;
                    const refW = guideRect.width / scale;
                    const refH = guideRect.height / scale;

                    if (activeGuide.position === 'top') {
                        dropX = refLeft;
                        dropY = refTop - gap - newH;

                        if (isSectionSubtype) {
                            // Push Down only for full sections.
                            shouldPush = true;
                            pushThresholdY = refTop - (gap / 2); // approximate
                            pushAmount = newH + gap;
                        }

                    } else if (activeGuide.position === 'bottom') {
                        dropX = refLeft;
                        dropY = refTop + refH + gap;

                        if (isSectionSubtype) {
                            // Push Down only for full sections.
                            shouldPush = true;
                            pushThresholdY = refTop + refH + (gap / 2);
                            pushAmount = newH + gap;
                        }

                    } else if (activeGuide.position === 'left') {
                        dropX = refLeft - gap - newW;
                        dropY = refTop;
                    } else if (activeGuide.position === 'right') {
                        dropX = refLeft + refW + gap;
                        dropY = refTop;
                    }
                }
                // STANDARD DRAG LOGIC
                else {
                    const initialRect = active.rect.current?.initial;
                    const delta = event.delta;

                    if (initialRect && delta) {
                        const finalLeft = initialRect.left + delta.x;
                        const finalTop = initialRect.top + delta.y;
                        let rawX = (finalLeft - canvasRect.left) / scale;
                        let rawY = (finalTop - canvasRect.top) / scale;
                        dropX = Math.round(rawX / gridSize) * gridSize;
                        dropY = Math.round(rawY / gridSize) * gridSize;

                        // MAGNETIC SNAP FOR EXISTING SECTIONS
                        // When moving a section, snap to the bottom of the one above it to eliminate gaps
                        const movedId = active.id.toString();
                        if (movedId.endsWith('-bg')) {
                            let closestBottom = 0;
                            let minDiff = 50; // Snap threshold
                            let snapped = false;

                            elements.forEach(el => {
                                if (el.id === movedId) return;
                                if (!el.id.endsWith('-bg')) return;

                                const elTop = parseInt(el.style.top?.toString() || '0');
                                const elH = parseInt(el.style.height?.toString() || '0');
                                const elBottom = elTop + elH;

                                // Check distance
                                const diff = Math.abs(dropY - elBottom);
                                if (diff < minDiff) {
                                    minDiff = diff;
                                    closestBottom = elBottom;
                                    snapped = true;
                                }
                            });

                            if (snapped) {
                                dropY = closestBottom;
                                dropX = 0; // Align left
                            }
                        }
                    } else {
                        const clientX = mousePos.current.x;
                        const clientY = mousePos.current.y;
                        if (clientX && clientY) {
                            let calculatedX = (clientX - canvasRect.left) / scale;
                            let calculatedY = (clientY - canvasRect.top) / scale;
                            const estW = 100; const estH = 100;
                            dropX = Math.round((calculatedX - (estW / 2)) / gridSize) * gridSize;
                            dropY = Math.round((calculatedY - (estH / 2)) / gridSize) * gridSize;
                        }
                    }
                }

                // For new sidebar content drops, keep placement deterministic.
                // Do not override with magnetic transient snap state (can feel random for sidebar drags).
                if (!isSectionSubtype) {
                    // Keep rail logic for full-width sections untouched; regular content stays guide/pointer-based.
                    dropX = Math.round(dropX);
                    dropY = Math.round(dropY);
                }
            } else {
                dropY = window.scrollY + 200;
            }

            const newId = `${subtype}-${Date.now()}`;
            let newElements = createDefaultElement(subtype, newId, dropX, dropY);
            // Keep regular elements above section backgrounds.
            if (!isSectionSubtype) {
                newElements = newElements.map(el => {
                    const existingZ = Number(el.style.zIndex);
                    const normalizedZ = Number.isFinite(existingZ) ? existingZ : 0;
                    return {
                        ...el,
                        style: {
                            ...el.style,
                            zIndex: String(Math.max(150, normalizedZ))
                        }
                    };
                });
            }

            // Apply updates + Push Logic
            setElements(prev => {
                let updated = [...prev];

                // Add new elements first
                updated = [...updated, ...newElements];

                // Section insertions always shift content below insertion point by the new section height.
                if (isSectionSubtype) {
                    const sectionRoot = newElements.find(el => el.id === `${newId}-bg`) ?? newElements.find(el => el.id.endsWith('-bg'));
                    const insertedHeight = parseInt(sectionRoot?.style.height?.toString() || '0') || 0;
                    if (insertedHeight > 0) {
                        updated = updated.map(el => {
                            if (el.id.startsWith(`${newId}-`)) {
                                return el;
                            }
                            const elTop = parseInt(el.style.top?.toString() || '0');
                            if (elTop >= dropY) {
                                return {
                                    ...el,
                                    style: {
                                        ...el.style,
                                        top: `${elTop + insertedHeight}px`
                                    }
                                };
                            }
                            return el;
                        });
                    }
                } else if (shouldPush) {
                    updated = updated.map(el => {
                        const elTop = parseInt(el.style.top?.toString() || '0');
                        // Use a small buffer logic? Or strict > threshold.
                        if (elTop >= pushThresholdY) {
                            return {
                                ...el,
                                style: {
                                    ...el.style,
                                    top: `${elTop + pushAmount}px`
                                }
                            };
                        }
                        return el;
                    });
                }

                return updated;
            }); toast({ description: `Added ${subtype}` });
        }


        // 3. Moving an existing Element via Drag
        else if (data.type === 'element') {
            const elementId = data.elementId;
            const delta = event.delta;
            const shouldSettle = !elementId.endsWith('-bg');
            const isSectionMove = elementId.endsWith('-bg');
            const droppedOnSectionId = (typeof over?.id === 'string' && over.id.endsWith('-bg') && over.id !== elementId)
                ? over.id
                : null;

            const canvasEl = document.getElementById('canvas-droppable');
            const canvasRect = canvasEl?.getBoundingClientRect();

            setElements(prev => {
                const targetElement = prev.find(el => el.id === elementId);
                if (!targetElement) return prev;

                // Explicit section swap/reorder: dropping one section on another changes stack order.
                if (isSectionMove && droppedOnSectionId) {
                    const orderedSections = prev
                        .filter(el => el.id.endsWith('-bg'))
                        .sort((a, b) => parseInt(a.style.top?.toString() || '0') - parseInt(b.style.top?.toString() || '0'));

                    const fromIndex = orderedSections.findIndex(sec => sec.id === elementId);
                    const toIndex = orderedSections.findIndex(sec => sec.id === droppedOnSectionId);
                    if (fromIndex >= 0 && toIndex >= 0 && fromIndex !== toIndex) {
                        const reordered = [...orderedSections];
                        const [moved] = reordered.splice(fromIndex, 1);
                        reordered.splice(toIndex, 0, moved);

                        let currentY = 0;
                        const newTops = new Map<string, number>();
                        reordered.forEach(sec => {
                            newTops.set(sec.id, currentY);
                            const h = parseInt(sec.style.height?.toString() || '0') || 100;
                            currentY += h;
                        });

                        const topDeltas = new Map<string, number>();
                        reordered.forEach(sec => {
                            const originalSec = prev.find(p => p.id === sec.id);
                            const originalTop = parseInt(originalSec?.style.top?.toString() || '0');
                            const targetTop = newTops.get(sec.id) || 0;
                            const baseId = sec.id.replace('-bg', '');
                            topDeltas.set(baseId, targetTop - originalTop);
                        });

                        return prev.map(el => {
                            if (newTops.has(el.id)) {
                                return { ...el, style: { ...el.style, top: `${newTops.get(el.id)}px`, left: '0' } };
                            }
                            for (const [baseId, deltaY] of topDeltas.entries()) {
                                if (deltaY !== 0 && el.id.startsWith(`${baseId}-`) && el.id !== `${baseId}-bg`) {
                                    const currentTop = parseInt(el.style.top?.toString() || '0');
                                    return { ...el, style: { ...el.style, top: `${currentTop + deltaY}px` } };
                                }
                            }
                            return el;
                        });
                    }
                }

                let newTop = 0;
                let newLeft = 0;

                // For Push Logic
                let shouldPush = false;
                let pushThresholdY = 0;
                let pushAmount = 0;

                // SMART Placement
                if (activeGuide && canvasRect && active.rect.current?.translated) {
                    const guideRect = activeGuide.rect;
                    const gap = 16;
                    const rect = active.rect.current.translated;
                    const w = rect.width / scale;
                    const h = rect.height / scale;

                    const refLeft = (guideRect.left - canvasRect.left) / scale;
                    const refTop = (guideRect.top - canvasRect.top) / scale;
                    const refW = guideRect.width / scale;
                    const refH = guideRect.height / scale;

                    if (activeGuide.position === 'top') {
                        newLeft = refLeft;
                        newTop = refTop - gap - h;

                        if (isSectionMove) {
                            shouldPush = true;
                            pushThresholdY = refTop - (gap / 2);
                            pushAmount = h + gap;
                        }

                    } else if (activeGuide.position === 'bottom') {
                        newLeft = refLeft;
                        newTop = refTop + refH + gap;

                        if (isSectionMove) {
                            shouldPush = true;
                            pushThresholdY = refTop + refH + (gap / 2);
                            pushAmount = h + gap;
                        }

                    } else if (activeGuide.position === 'left') {
                        newLeft = refLeft - gap - w;
                        newTop = refTop;
                    } else if (activeGuide.position === 'right') {
                        newLeft = refLeft + refW + gap;
                        newTop = refTop;
                    }
                }
                // GRID SNAP (Standard)
                else {
                    const currentTop = parseInt(targetElement.style.top?.toString() || '0');
                    const currentLeft = parseInt(targetElement.style.left?.toString() || '0');

                    // High precision drag (No grid snap by default)
                    newTop = Math.round(currentTop + (delta.y / scale));
                    newLeft = Math.round(currentLeft + (delta.x / scale));

                    // Check if Magnetic Modifer stored snapped coordinates for us to drop on
                    if (snappedDrop.nodeLeft != null) newLeft = Math.round(snappedDrop.nodeLeft);
                    if (snappedDrop.nodeTop != null) newTop = Math.round(snappedDrop.nodeTop);

                    if (targetElement.style.width === '100%') newLeft = 0;
                }

                // Apply changes
                let updated = prev.map(el => {
                    // Update the moved element
                    if (el.id === elementId) {
                        return {
                            ...el,
                            style: { ...el.style, top: `${newTop}px`, left: `${newLeft}px` }
                        };
                    }
                    // Shift others if needed
                    if (shouldPush) {
                        const elTop = parseInt(el.style.top?.toString() || '0');
                        if (elTop >= pushThresholdY) {
                            return {
                                ...el,
                                style: { ...el.style, top: `${elTop + pushAmount}px` }
                            };
                        }
                    }
                    return el;
                });

                // STRICT STACKING: If moving a section, enforce 0-gap stacking based on current sort order
                if (elementId.endsWith('-bg')) {
                    const sections = updated.filter(el => el.id.endsWith('-bg'))
                        .sort((a, b) => parseInt(a.style.top?.toString() || '0') - parseInt(b.style.top?.toString() || '0'));

                    let currentY = 0;
                    const newTops = new Map<string, number>();

                    sections.forEach(sec => {
                        newTops.set(sec.id, currentY);
                        const h = parseInt(sec.style.height?.toString() || '0') || 100;
                        currentY += h; // 0 gap
                    });

                    // Calculate absolute delta from original 'prev' state
                    const topDeltas = new Map<string, number>();
                    sections.forEach(sec => {
                        const originalSec = prev.find(p => p.id === sec.id);
                        const originalTop = parseInt(originalSec?.style.top?.toString() || '0');
                        const targetTop = newTops.get(sec.id) || 0;
                        const baseId = sec.id.replace('-bg', '');
                        topDeltas.set(baseId, targetTop - originalTop);
                    });

                    updated = updated.map(el => {
                        // Background section itself
                        if (newTops.has(el.id)) {
                            // Force left:0 for sections
                            return { ...el, style: { ...el.style, top: `${newTops.get(el.id)}px`, left: '0' } };
                        }

                        // Child elements docked to the section
                        for (const [baseId, deltaY] of topDeltas.entries()) {
                            if (deltaY !== 0 && el.id.startsWith(`${baseId}-`) && el.id !== `${baseId}-bg`) {
                                const currentTop = parseInt(el.style.top?.toString() || '0');
                                return { ...el, style: { ...el.style, top: `${currentTop + deltaY}px` } };
                            }
                        }

                        return el;
                    });
                }

                return updated;
            });

            if (shouldSettle) {
                scheduleSettle(elementId, settleMs);
            }
        }

        // Always clear the guide and snap state
        setActiveGuide(null);
        clearSnapTransientState();
    };

    const handleUpdateElement = (id: string, updates: Partial<EditorElement>) => {
        setElements(prev => prev.map(el => {
            if (el.id === id) {
                return { ...el, ...updates };
            }
            return el;
        }));
    };

    const handleUpdateBehavior = (elementId: string, behaviorId: string, configUpdates: Record<string, any>) => {
        setElements(prev => prev.map(el => {
            if (el.id === elementId) {
                return {
                    ...el,
                    behaviors: el.behaviors.map(b => {
                        if (b.id === behaviorId) {
                            return { ...b, config: { ...b.config, ...configUpdates } };
                        }
                        return b;
                    })
                };
            }
            return el;
        }));
    };

    const handleRemoveBehavior = (elementId: string, behaviorId: string) => {
        setElements(prev => prev.map(el => {
            if (el.id === elementId) {
                return {
                    ...el,
                    behaviors: el.behaviors.filter(b => b.id !== behaviorId)
                };
            }
            return el;
        }));
        toast({ description: "Behavior removed" });
    };

    const [showShareDialog, setShowShareDialog] = useState(false);
    const [shareUrl, setShareUrl] = useState('');

    const handlePublish = async () => {
        const fileContent = `import { EditorElement } from "./editor/store";

export const SITE_DATA: {
    elements: EditorElement[];
    bg: string;
    height: number;
} = {
    elements: ${JSON.stringify(elements, null, 4)},
    bg: '#ffffff',
    height: ${canvasHeight}
};`;

        try {
            await navigator.clipboard.writeText(fileContent);
            toast({
                title: "Code Copied!",
                description: "Paste the code into 'lib/site-data.ts' and deploy to publish."
            });
        } catch (err) {
            console.error("Failed to copy", err);
        }
    };

    const handleShare = async () => {
        try {
            // 1. Create a snapshot
            const state = {
                elements,
                pages,
                activePageId,
                canvasHeight
            };

            // 2. Compress to encoded URI component
            const jsonString = JSON.stringify(state);
            const compressed = LZString.compressToEncodedURIComponent(jsonString);

            // 3. Generate URL
            let origin = window.location.origin;
            if (origin.includes('localhost')) {
                origin = origin.replace('https://', 'http://');
            }
            const url = `${origin}/view?data=${compressed}`;
            setShareUrl(url);
            setShowShareDialog(true);

            // 4. Try copy
            await navigator.clipboard.writeText(url);
            toast({
                title: "Link Copied!",
                description: "Share link has been copied to clipboard."
            });
        } catch (error) {
            console.error('Share failed:', error);
            toast({
                title: "Share Failed",
                description: "Could not generate share link."
            });
        }
    };

    const selectedElement = elements.find(el => el.id === selectedId);

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 5,
            },
        })
    );

    // ... (rest of component)


    // Quick Add Section (Plus Button)
    const handleAddSection = (subtype: string) => {
        const newId = `${subtype}-${Date.now()}`;
        const sectionTemplate = createDefaultElement(subtype, newId, 0, 0);
        const sectionRoot = sectionTemplate.find(el => el.id.endsWith('-bg'));
        const newSectionHeight = parseInt(sectionRoot?.style.height?.toString() || '0') || 0;

        const sections = elements
            .filter(el => el.id.endsWith('-bg'))
            .map(el => {
                const top = parseInt(el.style.top?.toString() || '0');
                const height = parseInt(el.style.height?.toString() || '0') || 0;
                return { top, height, bottom: top + height };
            })
            .sort((a, b) => a.top - b.top);

        let dropY = 0;
        let insertedIntoGap = false;

        if (sections.length > 0) {
            const firstTop = sections[0].top;
            if (firstTop >= newSectionHeight) {
                dropY = 0;
                insertedIntoGap = true;
            } else {
                let foundGapY: number | null = null;
                for (let i = 0; i < sections.length - 1; i += 1) {
                    const current = sections[i];
                    const next = sections[i + 1];
                    const gapHeight = next.top - current.bottom;
                    if (gapHeight >= newSectionHeight) {
                        foundGapY = current.bottom;
                        break;
                    }
                }

                if (foundGapY !== null) {
                    dropY = foundGapY;
                    insertedIntoGap = true;
                } else {
                    dropY = sections[sections.length - 1].bottom;
                }
            }
        }

        const newElements = createDefaultElement(subtype, newId, 0, dropY);
        setElements(prev => [...prev, ...newElements]);
        toast({ description: insertedIntoGap ? `Added ${subtype} to first empty slot` : `Appended ${subtype} to bottom` });
    };

    const magneticSnapModifier: Modifier = ({ transform, active, draggingNodeRect }) => {
        if (!draggingNodeRect || !active || !canvasRectRef.current) {
            return transform;
        }

        const dragType = active.data.current?.type;
        if (dragType !== 'element' && dragType !== 'content') {
            return transform;
        }

        const frame = frameClockRef.current;
        if (lastMagneticFrameRef.current === frame && lastMagneticTransformRef.current) {
            return {
                ...transform,
                x: lastMagneticTransformRef.current.x,
                y: lastMagneticTransformRef.current.y
            };
        }
        lastMagneticFrameRef.current = frame;

        const canvasRect = canvasRectRef.current;

        // The dragging element's visual position on screen (viewport coords)
        const screenX = draggingNodeRect.left + transform.x;
        const screenY = draggingNodeRect.top + transform.y;

        // Convert to Logical coordinates relative to Canvas (unscaled, 0-900)
        const logicalX = (screenX - canvasRect.left) / scale;
        const logicalY = (screenY - canvasRect.top) / scale;

        const logicalW = draggingNodeRect.width / scale;
        const logicalH = draggingNodeRect.height / scale;

        let effectiveLogicalX = logicalX;
        let effectiveLogicalY = logicalY;

        // Measurement-only stabilization:
        // Use per-frame movement (not total-from-start movement) so direction changes update live.
        if (!measurementBaselineRef.current) {
            measurementBaselineRef.current = { x: logicalX, y: logicalY };
        }
        if (!measurementPrevLogicalRef.current) {
            measurementPrevLogicalRef.current = { x: logicalX, y: logicalY };
        }
        const baseline = measurementBaselineRef.current;
        const prevLogical = measurementPrevLogicalRef.current;
        const stepX = Math.abs(logicalX - prevLogical.x);
        const stepY = Math.abs(logicalY - prevLogical.y);
        prevLogical.x = logicalX;
        prevLogical.y = logicalY;

        const shakeDeadzone = 18;
        const horizontalIntent = stepX > 1.2 && stepX > stepY * 1.55;
        const verticalIntent = stepY > 1.2 && stepY > stepX * 1.55;
        const smoothing = 0.18;

        if (horizontalIntent) {
            measurementAxisRef.current = 'x';
            measurementAxisHoldFramesRef.current = 6;
        } else if (verticalIntent) {
            measurementAxisRef.current = 'y';
            measurementAxisHoldFramesRef.current = 6;
        } else if (measurementAxisHoldFramesRef.current > 0) {
            measurementAxisHoldFramesRef.current -= 1;
        } else {
            measurementAxisRef.current = null;
        }

        // Opposite direction can override, but only if it's clearly stronger.
        if (measurementAxisRef.current === 'x' && stepY > stepX * 2 && stepY > 2.2) {
            measurementAxisRef.current = 'y';
            measurementAxisHoldFramesRef.current = 6;
            baseline.x = logicalX;
            baseline.y = logicalY;
        } else if (measurementAxisRef.current === 'y' && stepX > stepY * 2 && stepX > 2.2) {
            measurementAxisRef.current = 'x';
            measurementAxisHoldFramesRef.current = 6;
            baseline.x = logicalX;
            baseline.y = logicalY;
        }

        if (measurementAxisRef.current === 'x') {
            const yDelta = logicalY - baseline.y;
            if (Math.abs(yDelta) > shakeDeadzone) {
                baseline.y += yDelta * smoothing;
            }
            baseline.x = logicalX;
            effectiveLogicalY = baseline.y;
        } else if (measurementAxisRef.current === 'y') {
            const xDelta = logicalX - baseline.x;
            if (Math.abs(xDelta) > shakeDeadzone) {
                baseline.x += xDelta * smoothing;
            }
            baseline.y = logicalY;
            effectiveLogicalX = baseline.x;
        } else {
            // Ambiguous movement: no lock, keep measurements aligned with pointer.
            baseline.x = logicalX;
            baseline.y = logicalY;
        }

        const logicalXPositions = [logicalX, logicalX + logicalW / 2, logicalX + logicalW];
        const logicalYPositions = [logicalY, logicalY + logicalH / 2, logicalY + logicalH];

        const allowGridSnap = dragType === 'content';
        let bestX = applyHysteresisLock('x', logicalXPositions, globalSnapEngine.findBestSnap('x', logicalXPositions, {
            allowGrid: allowGridSnap,
            gridThreshold: 6
        }));
        let bestY = applyHysteresisLock('y', logicalYPositions, globalSnapEngine.findBestSnap('y', logicalYPositions, {
            allowGrid: allowGridSnap,
            gridThreshold: 6
        }));

        const spacingData = (dragType === 'element')
            ? computeSpacingData(String(active.id), {
            left: effectiveLogicalX,
            top: effectiveLogicalY,
            width: logicalW,
            height: logicalH,
            right: effectiveLogicalX + logicalW,
            bottom: effectiveLogicalY + logicalH
        })
            : { spacing: [], equalSnapX: null, equalSnapY: null };
        let hardLockX = false;
        let hardLockY = false;

        if (spacingData.equalSnapX !== null && Math.abs(effectiveLogicalX - spacingData.equalSnapX) <= 40) {
            const deltaX = Math.abs(logicalX - spacingData.equalSnapX);
            const detentX = 8;
            bestX = {
                target: {
                    axis: 'x',
                    position: spacingData.equalSnapX,
                    kind: 'spacing',
                    priority: 3,
                    sourceElementId: 'equal-gap'
                },
                adjustedPos: deltaX <= detentX
                    ? spacingData.equalSnapX
                    : calculateMagneticPull(logicalX, spacingData.equalSnapX, 22, 3)
            };
            hardLockX = deltaX <= detentX;
        }

        if (spacingData.equalSnapY !== null && Math.abs(effectiveLogicalY - spacingData.equalSnapY) <= 40) {
            const deltaY = Math.abs(logicalY - spacingData.equalSnapY);
            const detentY = 8;
            bestY = {
                target: {
                    axis: 'y',
                    position: spacingData.equalSnapY,
                    kind: 'spacing',
                    priority: 3,
                    sourceElementId: 'equal-gap'
                },
                adjustedPos: deltaY <= detentY
                    ? spacingData.equalSnapY
                    : calculateMagneticPull(logicalY, spacingData.equalSnapY, 22, 3)
            };
            hardLockY = deltaY <= detentY;
        }

        // Header interactions should feel direct: disable magnetic pull in top band.
        const headerBandBottom = 130;
        const dragCenterY = logicalY + logicalH / 2;
        const isHeaderDrag = dragType === 'element' && dragCenterY <= headerBandBottom;
        if (isHeaderDrag) {
            bestX = { target: null, adjustedPos: logicalX };
            bestY = { target: null, adjustedPos: logicalY };
            snapLockRef.current = { x: null, y: null };
        }

        // Keep drag feeling anchored to cursor: cap how far snap can pull per axis.
        if (dragType === 'element' && !isHeaderDrag) {
            const maxSnapPullX = 10;
            const maxSnapPullY = 8;
            const pullX = bestX.adjustedPos - logicalX;
            const pullY = bestY.adjustedPos - logicalY;

            if (!hardLockX && Math.abs(pullX) > maxSnapPullX) {
                bestX = { ...bestX, adjustedPos: logicalX + Math.sign(pullX) * maxSnapPullX };
            }
            if (!hardLockY && Math.abs(pullY) > maxSnapPullY) {
                bestY = { ...bestY, adjustedPos: logicalY + Math.sign(pullY) * maxSnapPullY };
            }
        }

        // Calculate distance if tied to a specific element block
        let distanceX: number | undefined;
        let distanceXPos: number | undefined;
        if (bestX.target?.sourceElementRect) {
            const tr = bestX.target.sourceElementRect;
            // Snapped on X (vertical line). Distance is measured vertically (Y).
            // Are we above or below?
            if (effectiveLogicalY + logicalH < tr.top) {
                // Dragged is above target
                distanceX = Math.round(tr.top - (effectiveLogicalY + logicalH));
                distanceXPos = effectiveLogicalY + logicalH + distanceX / 2;
            } else if (effectiveLogicalY > tr.top + tr.height) {
                // Dragged is below target
                distanceX = Math.round(effectiveLogicalY - (tr.top + tr.height));
                distanceXPos = tr.top + tr.height + distanceX / 2;
            }
        }

        let distanceY: number | undefined;
        let distanceYPos: number | undefined;
        if (bestY.target?.sourceElementRect) {
            const tr = bestY.target.sourceElementRect;
            // Snapped on Y (horizontal line). Distance is measured horizontally (X).
            if (effectiveLogicalX + logicalW < tr.left) {
                // Dragged is left of target
                distanceY = Math.round(tr.left - (effectiveLogicalX + logicalW));
                distanceYPos = effectiveLogicalX + logicalW + distanceY / 2;
            } else if (effectiveLogicalX > tr.left + tr.width) {
                // Dragged is right of target
                distanceY = Math.round(effectiveLogicalX - (tr.left + tr.width));
                distanceYPos = tr.left + tr.width + distanceY / 2;
            }
        }

        snapState.set({
            x: bestX.target ? { target: bestX.target, distance: distanceX, distancePos: distanceXPos } : null,
            y: bestY.target ? { target: bestY.target, distance: distanceY, distancePos: distanceYPos } : null,
            spacing: dragType === 'element' ? spacingData.spacing : []
        });

        if (dragType === 'element') {
            const touchedIds = new Set<string>();
            const activeId = String(active.id);
            const isValidGuideElementId = (id?: string) =>
                !!id && id !== activeId && id !== 'canvas' && id !== 'grid' && id !== 'equal-gap' && !id.endsWith('-bg');

            const directContactIds = computeContactElementIds(activeId, {
                left: effectiveLogicalX,
                top: effectiveLogicalY,
                width: logicalW,
                height: logicalH,
                right: effectiveLogicalX + logicalW,
                bottom: effectiveLogicalY + logicalH
            });
            directContactIds.forEach(id => touchedIds.add(id));

            spacingData.spacing.forEach(guide => {
                guide.elementIds?.forEach(id => {
                    if (isValidGuideElementId(id)) touchedIds.add(id);
                });
            });

            const xSourceElementId = bestX.target?.sourceElementId;
            const ySourceElementId = bestY.target?.sourceElementId;
            if (isValidGuideElementId(xSourceElementId)) {
                touchedIds.add(xSourceElementId);
            }
            if (isValidGuideElementId(ySourceElementId)) {
                touchedIds.add(ySourceElementId);
            }

            queueContactedElementIds(Array.from(touchedIds));
        } else if (contactedElementIdsRef.current.length > 0) {
            queueContactedElementIds([]);
        }

        // Update the ref so handleDragEnd knows exactly where to drop it in logical space
        activeAlignmentsRef.current.nodeLeft = bestX.adjustedPos;
        activeAlignmentsRef.current.nodeTop = bestY.adjustedPos;

        // Reconvert the snapped Logical coordinate back to Screen coordinate to update the modifier transform
        const snappedScreenX = (bestX.adjustedPos * scale) + canvasRect.left;
        const snappedScreenY = (bestY.adjustedPos * scale) + canvasRect.top;

        const snappedTransform = {
            x: snappedScreenX - draggingNodeRect.left,
            y: snappedScreenY - draggingNodeRect.top
        };
        lastMagneticTransformRef.current = snappedTransform;

        return {
            ...transform,
            x: snappedTransform.x,
            y: snappedTransform.y
        };
    };

    const snapToCanvasLayout: Modifier = ({ transform, active, draggingNodeRect }) => {
        // Only apply "Rail Snap" to sidebar content items
        if (active && active.data.current?.type === 'content') {
            const subtype = active.data.current?.subtype as string | undefined;
            if (!subtype || !FULL_WIDTH_SECTION_SUBTYPES.has(subtype)) {
                return transform;
            }
            if (canvasRectRef.current && draggingNodeRect) {
                const canvasRect = canvasRectRef.current;
                // Force X alignment to match the canvas column exactly
                return {
                    ...transform,
                    x: (canvasRect.left + 2) - draggingNodeRect.left
                };
            }
        }
        return transform;
    };

    return (
        <DndContext
            id="editor-dnd-context"
            sensors={sensors}
            onDragStart={handleDragStart}
            onDragMove={handleDragMove}
            onDragCancel={handleDragCancel}
            onDragEnd={handleDragEnd}
            modifiers={[snapToGrid, snapToCanvasLayout, magneticSnapModifier]}
        >
            <EditorLayout
                topBar={<TopBar
                    isPreview={isPreview}
                    onPreviewToggle={() => setIsPreview(!isPreview)}
                    onShare={handleShare}
                    onPublish={handlePublish}
                    onUndo={undo}
                    onRedo={redo}
                    canUndo={canUndo}
                    canRedo={canRedo}
                    onEffectsClick={() => setLeftSidebarTab('behaviors')}
                    isEffectsActive={leftSidebarTab === 'behaviors'}
                />}
                leftSidebar={!isPreview ? <LeftSidebar
                    elements={elements}
                    onSelect={(id: string | null) => {
                        setSelectedId(id);
                        if (id) toast({ description: `Selected Layer: ${id}` });
                    }}
                    selectedId={selectedId}

                    // Pages props
                    pages={pages}
                    activePageId={activePageId}
                    onAddPage={handleAddPage}
                    onAddText={handleAddText}
                    onAddImage={handleAddImage}
                    onSelectPage={setActivePageId}
                    onAddSection={handleAddSection}
                    onAddElement={handleAddElement}
                    activeTab={leftSidebarTab}
                    onTabChange={setLeftSidebarTab}
                /> : null}
                rightSidebar={!isPreview ? <RightSidebar
                    element={selectedElement}
                    elements={elements}
                    onUpdate={(updates: Partial<EditorElement>) => selectedId && handleUpdateElement(selectedId, updates)}
                    onUpdateBehavior={(behaviorId: string, updates: Record<string, any>) => selectedId && handleUpdateBehavior(selectedId, behaviorId, updates)}
                    onRemoveBehavior={(behaviorId: string) => selectedId && handleRemoveBehavior(selectedId, behaviorId)}
                    onDelete={() => {
                        if (selectedId) {
                            handleDelete(selectedId);
                        }
                    }}
                /> : null}
            >
                <Canvas
                    elements={elements}
                    onSelect={(id: string) => {
                        setSelectedId(id);
                        toast({ description: `Selected Element: ${id}` });
                    }}
                    onUpdate={handleUpdateElement}
                    selectedId={selectedId}
                    height={canvasHeight}
                    readOnly={isPreview}
                    scale={scale} // Pass calculated scale
                    isDragging={!!activeDragId}
                    activeDragId={activeDragId}
                    contactedElementIds={contactedElementIds}
                    suggestedDropY={suggestedDropY}
                    suggestedDropHeight={suggestedDropHeight}
                    suggestedDropLabel={suggestedDropLabel}
                    dropPreview={dropPreview}
                    settleDurations={settleDurations}
                />
            </EditorLayout>

            {/* ... share dialog ... */}
            {showShareDialog && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm">
                    <div className="bg-white p-6 rounded-lg shadow-xl w-[400px]">
                        <h3 className="text-lg font-semibold mb-2">Share Link</h3>
                        <p className="text-sm text-gray-500 mb-4">Copy the link below to share your design.</p>



                        <div className="flex gap-2">
                            <input
                                type="text"
                                readOnly
                                value={shareUrl}
                                className="flex-1 p-2 border border-gray-300 rounded text-sm bg-gray-50 text-black"
                                onClick={(e) => e.currentTarget.select()}
                            />
                            <button
                                onClick={() => {
                                    navigator.clipboard.writeText(shareUrl);
                                    toast({ description: "Copied!" });
                                }}
                                className="px-4 py-2 bg-blue-600 text-white rounded text-sm font-medium hover:bg-blue-700"
                            >
                                Copy
                            </button>
                        </div>
                        <button
                            onClick={() => setShowShareDialog(false)}
                            className="mt-4 w-full py-2 text-sm text-gray-500 hover:text-gray-900"
                        >
                            Close
                        </button>
                    </div>
                </div>
            )}
        </DndContext>
    );
}
