"use client"

import { useState, useRef, useEffect } from 'react'
import { Controls } from '@/components/generator/controls'
import { Preview } from '@/components/generator/preview'
import { CodeViewer } from '@/components/generator/code-viewer'
import { GripHorizontal } from 'lucide-react'

import { AnimationStyle, GridItem, GridSize, PhysicsConfig, HorizontalConfig, HydrodynamicConfig } from './types'

const DEFAULT_HORIZONTAL_CONFIG: HorizontalConfig = {
    items: Array.from({ length: 4 }).map((_, i) => ({
        id: i,
        title: `Project 0${i + 1}`,
        subtitle: 'Interaction Design',
        image: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2564&auto=format&fit=crop"
    })),
    physics: {
        speed: 1,
        skew: 0,
        parallax: 0
    },
    layout: {
        width: '60vw',
        height: '60vh',
        gap: 40,
        radius: 32
    },
    typography: {
        titleSize: 32, // px
        labelSize: 14 // px
    },
    cta: {
        text: "Next Project?",
        subtext: "Get in touch",
        link: "#"
    },
    startCard: {
        headlineSize: 96,
        subtitle: "",
        textColor: "#ffffff",
        textGradient: false,
        gradientStart: "#ffffff",
        gradientEnd: "#999999",
        blendMode: false,
        backgroundOverlay: 80,
        backgroundColor: '#000000',
        image: ""
    },
    endCard: {
        titleSize: 48,
        buttonSize: 18,
        subtitle: "",
        textColor: "#ffffff",
        textGradient: false,
        gradientStart: "#ffffff",
        gradientEnd: "#999999",
        blendMode: false,
        backgroundImage: "",
        backgroundColor: "#000000",
        backgroundOverlay: 50
    }
};

const DEFAULT_PHYSICS_CONFIG: PhysicsConfig = {
    hoverForce: 20,
    snapDuration: 1.2,
    maxRotation: 5,
    cardRadius: 12,
    gridGap: 16
};

const DEFAULT_HYDRODYNAMIC_CONFIG: HydrodynamicConfig = {
    viscosity: 0.3,
    elasticity: 0.2,
    interactionRadius: 300,
    returnSpeed: 1.2,
    rotationForce: 0.05,
    fontSize: 80,
    letterSpacing: 0,
    blendMode: false,
    isDraggable: false,
    backgroundColor: '#050505',
    subtitle: "Interactive, fluid typography",
    subtitleFontSize: 24,
    textColor: '#FFFFFF',
    subtitleColor: '#9CA3AF', // text-gray-400
    imageOpacity: 0.5,
    blockWidth: 100,
    blockHeight: 100
};

export function Generator() {
    const [headline, setHeadline] = useState("Pro Level Design")
    // Using a nice high-res dark aesthetic image from Unsplash
    const [imageUrl, setImageUrl] = useState("https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2564&auto=format&fit=crop")
    const [imageSequence, setImageSequence] = useState<string[]>([])
    const [style, setStyle] = useState<AnimationStyle>('apple-zoom')

    // Physics Grid Items State
    const [gridItems, setGridItems] = useState<GridItem[]>(
        Array.from({ length: 12 }).map((_, i) => ({
            id: i,
            text: `Card ${i + 1}`,
            link: '#'
        }))
    )
    const [gridSize, setGridSize] = useState<GridSize>('medium')
    const [textAlwaysVisible, setTextAlwaysVisible] = useState(false)

    // Physics Config State
    const [physicsConfig, setPhysicsConfig] = useState<PhysicsConfig>(DEFAULT_PHYSICS_CONFIG)

    // Hydrodynamic Config State
    const [hydrodynamicConfig, setHydrodynamicConfig] = useState<HydrodynamicConfig>(DEFAULT_HYDRODYNAMIC_CONFIG)

    // Horizontal Scroll Config State
    const [horizontalConfig, setHorizontalConfig] = useState<HorizontalConfig>(DEFAULT_HORIZONTAL_CONFIG)

    // Resizable Logic
    const [previewHeight, setPreviewHeight] = useState(600)
    const [isDragging, setIsDragging] = useState(false)
    const dragStartRef = useRef<{ y: number, h: number }>({ y: 0, h: 0 })

    // Scroller Ref for the right panel
    const rightPanelRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (!isDragging) return

            const delta = e.clientY - dragStartRef.current.y
            const newHeight = Math.max(200, dragStartRef.current.h + delta)
            setPreviewHeight(newHeight)
        }

        const handleMouseUp = () => {
            setIsDragging(false)
            document.body.style.cursor = 'default'
            document.body.style.userSelect = 'auto'
        }

        if (isDragging) {
            window.addEventListener('mousemove', handleMouseMove)
            window.addEventListener('mouseup', handleMouseUp)
        }

        return () => {
            window.removeEventListener('mousemove', handleMouseMove)
            window.removeEventListener('mouseup', handleMouseUp)
        }
    }, [isDragging])

    const startDragging = (e: React.MouseEvent) => {
        setIsDragging(true)
        dragStartRef.current = { y: e.clientY, h: previewHeight }
        document.body.style.cursor = 'row-resize'
        document.body.style.userSelect = 'none'
    }

    const handleReset = () => {
        setHorizontalConfig(DEFAULT_HORIZONTAL_CONFIG)
        setPhysicsConfig(DEFAULT_PHYSICS_CONFIG)
        setHydrodynamicConfig(DEFAULT_HYDRODYNAMIC_CONFIG)
        setGridItems(Array.from({ length: 12 }).map((_, i) => ({
            id: i,
            text: `Card ${i + 1}`,
            link: '#'
        })))
        // Reset generally applicable things if needed
        setHeadline("Pro Level Design")
    }

    return (
        <div className="flex h-full w-full bg-background text-foreground overflow-hidden">
            {/* Left Panel: Controls */}
            <aside className="w-[380px] flex-shrink-0 border-r border-border bg-card/30 p-6 flex flex-col gap-6 overflow-y-auto">
                <Controls
                    headline={headline} onHeadlineChange={setHeadline}
                    imageUrl={imageUrl} onImageUrlChange={setImageUrl}
                    style={style} onStyleChange={setStyle}
                    imageSequence={imageSequence} onSequenceChange={setImageSequence}
                    gridItems={gridItems} onGridItemsChange={setGridItems}
                    textAlwaysVisible={textAlwaysVisible} onTextVisibilityChange={setTextAlwaysVisible}
                    gridSize={gridSize} onGridSizeChange={setGridSize}
                    physicsConfig={physicsConfig} onPhysicsConfigChange={setPhysicsConfig}
                    horizontalConfig={horizontalConfig} onHorizontalConfigChange={setHorizontalConfig}
                    hydrodynamicConfig={hydrodynamicConfig} onHydrodynamicConfigChange={setHydrodynamicConfig}
                />
            </aside>

            {/* Right Area: Preview + Code */}
            <div
                ref={rightPanelRef}
                className="flex-1 h-screen overflow-y-auto relative z-10 flex flex-col"
            >
                {/* Top: Preview */}
                <div
                    className="relative bg-[url('/grid-pattern.svg')] bg-center bg-[#050505] flex flex-col shrink-0"
                    style={{ height: previewHeight }}
                >

                    <div className="flex-1 w-full min-h-0 p-4 md:p-8 flex flex-col items-center justify-center">
                        <div className="w-full h-full max-w-5xl bg-background rounded-xl border border-border shadow-2xl overflow-hidden ring-1 ring-white/5 relative flex-none">
                            <Preview
                                headline={headline}
                                imageUrl={imageUrl}
                                style={style}
                                imageSequence={imageSequence}
                                gridItems={gridItems}
                                textAlwaysVisible={textAlwaysVisible}
                                gridSize={gridSize}
                                physicsConfig={physicsConfig}
                                horizontalConfig={horizontalConfig}
                                onHorizontalConfigChange={setHorizontalConfig}
                                hydrodynamicConfig={hydrodynamicConfig}
                                onReset={handleReset}
                            />
                        </div>
                    </div>
                </div>

                {/* Drag Handle */}
                <div
                    className="h-4 bg-[#0A0A0A] border-t border-b border-white/5 hover:bg-white/5 cursor-row-resize flex items-center justify-center shrink-0 transition-colors z-20 sticky top-0 md:relative"
                    onMouseDown={startDragging}
                >
                    <GripHorizontal className="w-4 h-4 text-muted-foreground/50" />
                </div>

                {/* Bottom: Code */}
                <div
                    className="bg-[#0A0A0A] border-t border-border min-h-[600px] flex flex-col"
                >
                    <div className="p-4 border-b border-white/5 bg-black/50 backdrop-blur-sm sticky top-0 z-10">
                        <span className="text-sm font-medium text-white/70">Generated Code</span>
                    </div>
                    <div className="flex-1 relative">
                        <CodeViewer
                            headline={headline}
                            imageUrl={imageUrl}
                            style={style}
                            textAlwaysVisible={textAlwaysVisible}
                            gridItems={gridItems}
                            gridSize={gridSize}
                            physicsConfig={physicsConfig}
                            horizontalConfig={horizontalConfig}
                            hydrodynamicConfig={hydrodynamicConfig}
                        />
                    </div>
                </div>
            </div>
        </div >
    )
}
