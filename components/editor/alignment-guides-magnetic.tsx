'use client';

import React, { useEffect, useState } from 'react';
import { snapState, ActiveGuides } from '@/lib/editor/snap-engine';

export function AlignmentGuides() {
    const [guides, setGuides] = useState<ActiveGuides>({ x: null, y: null, spacing: [] });
    const showPrimaryAxisGuides = false;

    useEffect(() => {
        // Subscribe to high-performance snap state
        const unsubscribe = snapState.subscribe(() => {
            setGuides(snapState.get());
        });
        return () => { unsubscribe(); };
    }, []);

    if (!guides.x && !guides.y && guides.spacing.length === 0) return null;

    const horizontalGuides = guides.spacing
        .map((guide, idx) => ({ guide, idx }))
        .filter(item => item.guide.axis === 'x')
        .map(item => ({
            ...item,
            center: (item.guide.start + item.guide.end) / 2
        }))
        .sort((a, b) => a.center - b.center);

    const horizontalRows: number[] = [];
    const horizontalLabelRow = new Map<number, number>();
    horizontalGuides.forEach(item => {
        const minSeparation = 70;
        let row = horizontalRows.findIndex(lastCenter => Math.abs(item.center - lastCenter) > minSeparation);
        if (row === -1) {
            row = horizontalRows.length;
            horizontalRows.push(item.center);
        } else {
            horizontalRows[row] = item.center;
        }
        horizontalLabelRow.set(item.idx, row);
    });

    const verticalGuides = guides.spacing
        .map((guide, idx) => ({ guide, idx }))
        .filter(item => item.guide.axis === 'y')
        .map(item => ({
            ...item,
            center: (item.guide.start + item.guide.end) / 2
        }))
        .sort((a, b) => a.center - b.center);

    const verticalRows: number[] = [];
    const verticalLabelRow = new Map<number, number>();
    verticalGuides.forEach(item => {
        const minSeparation = 40;
        let row = verticalRows.findIndex(lastCenter => Math.abs(item.center - lastCenter) > minSeparation);
        if (row === -1) {
            row = verticalRows.length;
            verticalRows.push(item.center);
        } else {
            verticalRows[row] = item.center;
        }
        verticalLabelRow.set(item.idx, row);
    });

    return (
        <div className="pointer-events-none absolute inset-0 z-[10050] overflow-hidden">
            {/* X-Axis Guide (Vertical Line) */}
            {showPrimaryAxisGuides && guides.x && (
                <div
                    className={`absolute top-0 bottom-0 border-l ${guides.x.target.kind === 'spacing'
                        ? 'border-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.55)]'
                        : 'border-blue-400/50 shadow-[0_0_4px_rgba(59,130,246,0.2)]'
                        }`}
                    style={{
                        left: `${guides.x.target.position}px`,
                        borderLeftStyle: guides.x.target.kind === 'grid' ? 'dotted' : 'solid',
                        borderLeftWidth: guides.x.target.kind === 'center' ? '2px' : '1px'
                    }}
                >
                    {guides.x.distance !== undefined && guides.x.distancePos !== undefined && (
                        <>
                            {/* The Distance Line */}
                            <div
                                className="absolute border-l border-blue-300/50 border-dashed"
                                style={{
                                    left: '0px',
                                    top: `${Math.min(guides.x.distancePos - guides.x.distance / 2, guides.x.distancePos + guides.x.distance / 2)}px`,
                                    height: `${Math.abs(guides.x.distance)}px`,
                                    transform: 'translateX(-50%)'
                                }}
                            />
                            {/* The Distance Label */}
                            <div
                                className="absolute left-[8px] transform -translate-y-1/2 bg-blue-500/55 text-white/85 text-[10px] font-bold px-1.5 py-0.5 rounded shadow-sm whitespace-nowrap"
                                style={{ top: `${guides.x.distancePos}px` }}
                            >
                                {Math.abs(guides.x.distance)}px
                            </div>
                        </>
                    )}
                </div>
            )}

            {/* Y-Axis Guide (Horizontal Line) */}
            {showPrimaryAxisGuides && guides.y && (
                <div
                    className={`absolute left-0 right-0 border-t ${guides.y.target.kind === 'spacing'
                        ? 'border-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.55)]'
                        : 'border-blue-400/50 shadow-[0_0_4px_rgba(59,130,246,0.2)]'
                        }`}
                    style={{
                        top: `${guides.y.target.position}px`,
                        borderTopStyle: guides.y.target.kind === 'grid' ? 'dotted' : 'solid',
                        borderTopWidth: guides.y.target.kind === 'center' ? '2px' : '1px'
                    }}
                >
                    {guides.y.distance !== undefined && guides.y.distancePos !== undefined && (
                        <>
                            {/* The Distance Line */}
                            <div
                                className="absolute border-t border-blue-300/50 border-dashed"
                                style={{
                                    top: '0px',
                                    left: `${Math.min(guides.y.distancePos - guides.y.distance / 2, guides.y.distancePos + guides.y.distance / 2)}px`,
                                    width: `${Math.abs(guides.y.distance)}px`,
                                    transform: 'translateY(-50%)'
                                }}
                            />
                            {/* The Distance Label */}
                            <div
                                className="absolute top-[8px] transform -translate-x-1/2 bg-blue-500/55 text-white/85 text-[10px] font-bold px-1.5 py-0.5 rounded shadow-sm whitespace-nowrap"
                                style={{ left: `${guides.y.distancePos}px` }}
                            >
                                {Math.abs(guides.y.distance)}px
                            </div>
                        </>
                    )}
                </div>
            )}

            {/* Spacing Guides */}
            {guides.spacing.map((guide, idx) => {
                // Keep spacing lines outside blue hitboxes/selection overlays.
                const edgeClearance = 12;
                if (guide.axis === 'x') {
                    // Slightly reduce left-side trim to match perceived spacing on both sides.
                    const leftEdgeClearance = edgeClearance;
                    const rightEdgeClearance = edgeClearance;
                    const rawLeft = Math.min(guide.start, guide.end);
                    const rawRight = Math.max(guide.start, guide.end);
                    const drawLeft = rawLeft + leftEdgeClearance;
                    const drawRight = rawRight - rightEdgeClearance;
                    const drawWidth = Math.max(0, drawRight - drawLeft);
                    const row = horizontalLabelRow.get(idx) ?? 0;
                    return (
                        <div key={`spacing-x-${idx}`}>
                            <div
                                className="absolute border-t-2 border-emerald-500 border-dashed"
                                style={{
                                    left: `${drawLeft}px`,
                                    top: `${guide.position}px`,
                                    width: `${drawWidth}px`,
                                    transform: 'translateY(-50%)',
                                    filter: 'drop-shadow(0 0 3px rgba(16,185,129,0.9))'
                                }}
                            />
                            <div
                                className="absolute transform -translate-x-1/2 -translate-y-1/2 text-red-500 text-[10px] font-semibold whitespace-nowrap"
                                style={{
                                    left: `${(guide.start + guide.end) / 2}px`,
                                    top: `${guide.position - 10 - (row * 16)}px`,
                                    fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
                                    letterSpacing: '0.02em',
                                    textShadow: '0 0 1px rgba(255,255,255,0.95), 0 1px 2px rgba(0,0,0,0.95)'
                                }}
                            >
                                Horizontal: {guide.value}px
                            </div>
                        </div>
                    );
                }

                const dir = guide.end >= guide.start ? 1 : -1;
                const drawStart = guide.start + (edgeClearance * dir);
                const drawEnd = guide.end - (edgeClearance * dir);
                const drawTop = Math.min(drawStart, drawEnd);
                const drawHeight = Math.max(0, Math.abs(drawEnd - drawStart));
                const row = verticalLabelRow.get(idx) ?? 0;
                return (
                    <div key={`spacing-y-${idx}`}>
                        <div
                            className="absolute border-l-2 border-emerald-500 border-dashed"
                            style={{
                                left: `${guide.position}px`,
                                top: `${drawTop}px`,
                                height: `${drawHeight}px`,
                                transform: 'translateX(-50%)',
                                filter: 'drop-shadow(0 0 3px rgba(16,185,129,0.9))'
                            }}
                        />
                        <div
                            className="absolute transform -translate-x-1/2 -translate-y-1/2 text-red-500 text-[10px] font-semibold whitespace-nowrap"
                            style={{
                                left: `${guide.position + 12 + (row * 60)}px`,
                                top: `${(guide.start + guide.end) / 2}px`,
                                fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
                                letterSpacing: '0.02em',
                                textShadow: '0 0 1px rgba(255,255,255,0.95), 0 1px 2px rgba(0,0,0,0.95)'
                            }}
                        >
                            Vertical: {guide.value}px
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
