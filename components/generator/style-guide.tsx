import { Info } from 'lucide-react';
import { AnimationStyle } from './types';

interface StyleGuideInfo {
    title: string;
    description: string;
    requirements?: string[];
    proTip?: string;
    sampleLink?: string;
}

const STYLE_GUIDES: Record<AnimationStyle, StyleGuideInfo> = {
    'apple-zoom': {
        title: "Apple Zoom",
        description: "Best for Hero sections. Use a high-res landscape image (1920x1080).",
    },
    'parallax-reveal': {
        title: "Parallax Reveal",
        description: "Classic parallax effect. Use an image with focus in the center.",
    },
    'canvas-scrubber': {
        title: "Video Scrubber",
        description: "Boss Mode. Requires an Image Sequence (not a video). Upload 60+ images named 001.jpg, 002.jpg... to simulate 3D rotation.",
    },
    'physics-card': {
        title: "Physics Grid",
        description: "High-end anti-gravity effect. Cards react to mouse velocity with elastic recoil. Perfect for awards sites or portfolios.",
        requirements: ["No special assets needed", "Uses standard images"],
        proTip: "Move your mouse fast over the grid to see the physics engine kick in."
    },
    'horizontal-scroll': {
        title: "Horizontal Scroll Gallery",
        description: "Side-scrolling gallery triggered by vertical scroll. Perfect for Portfolios and Timelines.",
        requirements: ["Landscape images recommended", "Automatic width calculation"],
        proTip: "Use the scroll wheel to navigate seamlessly through the gallery."
    },
    'hydrodynamic-text': {
        title: "Hydrodynamic Text",
        description: "Liquid text animation with physics-based interactions. Text flows and deforms like water when hovered.",
        requirements: ["No special assets needed", "Works with any background image"],
        proTip: "Hover over individual letters to see the fluid physics in action."
    }
};

interface StyleGuideCardProps {
    selectedStyle: AnimationStyle;
}

export function StyleGuideCard({ selectedStyle }: StyleGuideCardProps) {
    const guide = STYLE_GUIDES[selectedStyle];

    if (!guide) return null;

    return (
        <div className="bg-blue-50/10 border border-blue-500/20 rounded-lg p-3 text-sm text-foreground/80 space-y-2">
            <div className="flex items-start gap-2">
                <Info className="w-4 h-4 text-blue-400 mt-0.5 shrink-0" />
                <div className="space-y-1">
                    <p className="font-medium text-foreground">{guide.title}</p>
                    <p className="text-muted-foreground">{guide.description}</p>
                    {guide.requirements && (
                        <ul className="list-disc list-inside text-xs text-muted-foreground/80 pt-1">
                            {guide.requirements.map((req, i) => (
                                <li key={i}>{req}</li>
                            ))}
                        </ul>
                    )}
                    {guide.proTip && (
                        <p className="text-xs text-blue-400/80 pt-1">
                            <span className="font-semibold">Pro Tip:</span> {guide.proTip}
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
}
