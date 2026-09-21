'use client';

import React from 'react';

export interface AlignmentGuideData {
    guideX?: number | null;
    guideY?: number | null;
    nodeLeft?: number | null;
    nodeTop?: number | null;
}

interface MagneticGuidesProps {
    guides: AlignmentGuideData;
}

export function MagneticGuides({ guides }: MagneticGuidesProps) {
    if (guides.guideX == null && guides.guideY == null) return null;

    return (
        <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            pointerEvents: 'none',
            zIndex: 9998, // Just below dragged item or above selection
            overflow: 'hidden'
        }}>
            {/* Vertical Guide */}
            {typeof guides.guideX === 'number' && (
                <div style={{
                    position: 'absolute',
                    top: 0,
                    left: `${guides.guideX}px`,
                    width: '1px',
                    height: '100%',
                    backgroundColor: '#eab308', // Yellow-500
                    transform: 'translateX(-50%)'
                }} />
            )}

            {/* Horizontal Guide */}
            {typeof guides.guideY === 'number' && (
                <div style={{
                    position: 'absolute',
                    top: `${guides.guideY}px`,
                    left: 0,
                    width: '100%',
                    height: '1px',
                    backgroundColor: '#eab308', // Yellow-500
                    transform: 'translateY(-50%)'
                }} />
            )}
        </div>
    );
}
