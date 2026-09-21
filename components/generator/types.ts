export type AnimationStyle = 'apple-zoom' | 'parallax-reveal' | 'canvas-scrubber' | 'physics-card' | 'horizontal-scroll' | 'hydrodynamic-text'

export interface GridItem {
    id: number;
    text: string;
    link: string;
    image?: string;
}


export interface PhysicsConfig {
    hoverForce: number;
    snapDuration: number;
    maxRotation: number;
    cardRadius: number;
    gridGap: number;
}

export type GridSize = 'small' | 'medium' | 'large';

export interface HorizontalScrollItem {
    id: number;
    title: string;
    subtitle: string;
    image: string;
    link?: string;
    textColor?: string;
    textGradient?: boolean;
    gradientStart?: string;
    gradientEnd?: string;
    blendMode?: boolean; // New field for mix-blend-mode
    textPosition?: { x: number; y: number };
}

export interface HorizontalConfig {
    items: HorizontalScrollItem[];
    physics: {
        speed: number;
        skew: number;
        parallax: number;
    };
    layout: {
        width: string;
        height: string;
        gap: number;
        radius: number;
    };
    typography: {
        titleSize: number;
        labelSize: number;
    };
    cta: {
        text: string;
        subtext: string;
        link: string;
    };
    startCard: {
        headlineSize: number;
        subtitle: string;
        textColor: string;
        image?: string;
        textGradient: boolean;
        gradientStart: string;
        gradientEnd: string;
        blendMode: boolean;
        backgroundOverlay: number; // 0-100 opacity percentage
        backgroundColor?: string;
    };
    endCard: {
        titleSize: number;
        buttonSize: number;
        subtitle: string;
        textColor: string;
        textGradient: boolean;
        gradientStart: string;
        gradientEnd: string;
        blendMode: boolean;
        backgroundImage: string;
        backgroundColor: string;
        backgroundOverlay: number;
    };
}

export interface HydrodynamicConfig {
    viscosity: number;
    elasticity: number;
    interactionRadius: number;
    returnSpeed: number;
    rotationForce: number;
    fontSize: number;
    letterSpacing: number;
    blendMode: boolean;
    isDraggable: boolean;
    backgroundColor: string;
    subtitle: string;
    subtitleFontSize: number;
    textColor: string;
    subtitleColor: string;
    imageOpacity: number;
    blockWidth: number;
    blockHeight: number;
}

