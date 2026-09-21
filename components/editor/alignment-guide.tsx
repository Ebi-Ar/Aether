import React from 'react';

interface AlignmentGuideProps {
    position: 'top' | 'bottom' | 'left' | 'right';
    rect: DOMRect;
    scale?: number;
}

export function AlignmentGuide({ position, rect, scale = 1 }: AlignmentGuideProps) {
    if (!rect) return null;

    // Define styles relative to the target element's rect
    // We assume this component is rendered in an overlay that matches the canvas coordinate system

    // Adjust thickness based on scale so it remains visible but crisp
    const thickness = 4; // px
    const color = '#3b82f6'; // blue-500
    const glow = `0 0 8px rgba(59, 130, 246, 0.8)`;

    const commonStyle: React.CSSProperties = {
        position: 'absolute',
        backgroundColor: color,
        borderRadius: '9999px',
        boxShadow: glow,
        zIndex: 50,
        pointerEvents: 'none',
    };

    let style: React.CSSProperties = { ...commonStyle };

    switch (position) {
        case 'top':
            style = {
                ...style,
                top: `${rect.top}px`, // Exact top edge
                left: `${rect.left}px`,
                width: `${rect.width}px`,
                height: `${thickness}px`,
                transform: `translateY(-50%)`, // Center on line
            };
            break;
        case 'bottom':
            style = {
                ...style,
                top: `${rect.bottom}px`, // Exact bottom edge
                left: `${rect.left}px`,
                width: `${rect.width}px`,
                height: `${thickness}px`,
                transform: `translateY(-50%)`,
            };
            break;
        case 'left':
            style = {
                ...style,
                top: `${rect.top}px`,
                left: `${rect.left}px`,
                width: `${thickness}px`,
                height: `${rect.height}px`,
                transform: `translateX(-50%)`,
            };
            break;
        case 'right':
            style = {
                ...style,
                top: `${rect.top}px`,
                left: `${rect.right}px`,
                width: `${thickness}px`,
                height: `${rect.height}px`,
                transform: `translateX(-50%)`,
            };
            break;
    }

    return <div style={style} className="animate-pulse" />;
}
