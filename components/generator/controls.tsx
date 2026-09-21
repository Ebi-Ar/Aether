"use client"

import { Label } from '@/components/ui/label';
import { useRef, useState } from 'react';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Type, Image, Wand2, Upload, ChevronDown, Copy, X } from 'lucide-react';
import { AnimationStyle, GridItem, GridSize, PhysicsConfig, HorizontalConfig, HydrodynamicConfig } from './types';
import { StyleGuideCard } from './style-guide';

interface ControlsProps {
    headline: string;
    imageUrl: string;
    style: AnimationStyle;
    onHeadlineChange: (value: string) => void;
    onImageUrlChange: (value: string) => void;
    onStyleChange: (value: AnimationStyle) => void;
    imageSequence?: string[];
    onSequenceChange?: (sequence: string[]) => void;
    gridItems?: GridItem[];
    onGridItemsChange?: (items: GridItem[]) => void;
    textAlwaysVisible?: boolean;
    onTextVisibilityChange?: (visible: boolean) => void;
    gridSize?: GridSize;
    onGridSizeChange?: (size: GridSize) => void;
    physicsConfig?: PhysicsConfig;
    onPhysicsConfigChange?: (config: PhysicsConfig) => void;
    horizontalConfig?: HorizontalConfig;
    onHorizontalConfigChange?: (config: HorizontalConfig) => void;
    hydrodynamicConfig?: HydrodynamicConfig;
    onHydrodynamicConfigChange?: (config: HydrodynamicConfig) => void;
}

export function Controls({
    headline, onHeadlineChange,
    imageUrl, onImageUrlChange,
    style, onStyleChange,
    imageSequence, onSequenceChange,
    gridItems, onGridItemsChange,
    textAlwaysVisible, onTextVisibilityChange,
    gridSize, onGridSizeChange,
    physicsConfig, onPhysicsConfigChange,
    horizontalConfig, onHorizontalConfigChange,
    hydrodynamicConfig, onHydrodynamicConfigChange,
}: ControlsProps) {

    // Accordion State for Horizontal Scroll
    const [openCardId, setOpenCardId] = useState<number | null>(0); // Default open first card

    const toggleCard = (id: number) => {
        setOpenCardId(openCardId === id ? null : id);
    };

    const updateHorizontalConfig = (field: keyof HorizontalConfig, value: any) => {
        if (!onHorizontalConfigChange || !horizontalConfig) return;
        onHorizontalConfigChange({ ...horizontalConfig, [field]: value });
    };

    const updateHorizontalItem = (id: number, field: 'title' | 'subtitle' | 'image' | 'link' | 'textColor' | 'textGradient' | 'gradientStart' | 'gradientEnd' | 'blendMode', value: string | boolean) => {
        if (!onHorizontalConfigChange || !horizontalConfig) return;
        const newItems = horizontalConfig.items.map(item =>
            item.id === id ? { ...item, [field]: value } : item
        );
        onHorizontalConfigChange({ ...horizontalConfig, items: newItems });
    };

    const applyFieldToAll = (field: 'title' | 'subtitle' | 'image' | 'link' | 'textColor' | 'textGradient' | 'gradientStart' | 'gradientEnd' | 'blendMode', value: string | boolean) => {
        if (!onHorizontalConfigChange || !horizontalConfig) return;
        // Apply to all items except the first one (id 0)
        const newItems = horizontalConfig.items.map(item =>
            item.id > 0 ? { ...item, [field]: value } : item
        );
        onHorizontalConfigChange({ ...horizontalConfig, items: newItems });
    };

    const updateHorizontalCount = (countStr: string) => {
        if (!onHorizontalConfigChange || !horizontalConfig) return;
        const count = parseInt(countStr);
        const currentCount = horizontalConfig.items.length;

        if (count === currentCount) return;

        let newItems = [...horizontalConfig.items];
        if (count > currentCount) {
            // Add items
            for (let i = currentCount; i < count; i++) {
                newItems.push({
                    id: i,
                    title: `Project 0${i + 1}`,
                    subtitle: 'Interaction Design',
                    image: '',
                    link: '#',
                    textColor: '#ffffff',
                    blendMode: false,
                    textGradient: false
                });
            }
        } else {
            // Remove items
            newItems = newItems.slice(0, count);
        }
        onHorizontalConfigChange({ ...horizontalConfig, items: newItems });
    };

    const updatePhysics = (field: keyof PhysicsConfig, value: number) => {
        if (onPhysicsConfigChange && physicsConfig) {
            onPhysicsConfigChange({ ...physicsConfig, [field]: value });
        }
    };

    const updateHydrodynamic = (field: keyof HydrodynamicConfig, value: number | boolean | string) => {
        if (onHydrodynamicConfigChange && hydrodynamicConfig) {
            onHydrodynamicConfigChange({ ...hydrodynamicConfig, [field]: value });
        }
    };

    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (files) {
            if (style === 'canvas-scrubber' && onSequenceChange) {
                // Handle multiple files for sequence
                const fileArray = Array.from(files).sort((a, b) => a.name.localeCompare(b.name));
                const sequenceUrls = fileArray.map(file => URL.createObjectURL(file));
                onSequenceChange(sequenceUrls);

                // Also set the first image as the preview image logic if needed, 
                // but primarily we rely on the sequence.
                // We'll set the first image as imageUrl for compatibility
                if (sequenceUrls.length > 0) {
                    onImageUrlChange(sequenceUrls[0]);
                }
            } else {
                // Handle single file (existing logic)
                const file = files[0];
                const objectUrl = URL.createObjectURL(file);
                onImageUrlChange(objectUrl);
            }
        }
    };

    const handleItemImageUpload = (e: React.ChangeEvent<HTMLInputElement>, id: number) => {
        const file = e.target.files?.[0];
        if (file) {
            const objectUrl = URL.createObjectURL(file);
            updateHorizontalItem(id, 'image', objectUrl);
        }
    };

    const updateGridItem = (id: number, field: keyof GridItem, value: string) => {
        if (!onGridItemsChange || !gridItems) return;
        const newItems = gridItems.map(item =>
            item.id === id ? { ...item, [field]: value } : item
        );
        onGridItemsChange(newItems);
    };

    const updateGridCount = (countStr: string) => {
        if (!onGridItemsChange || !gridItems) return;
        const count = parseInt(countStr);
        const currentCount = gridItems.length;

        if (count === currentCount) return;

        let newItems = [...gridItems];
        if (count > currentCount) {
            // Add items
            for (let i = currentCount; i < count; i++) {
                newItems.push({
                    id: i,
                    text: `Card ${i + 1}`,
                    link: '#',
                    image: '' // Initialize with empty image
                });
            }
        } else {
            // Remove items
            newItems = newItems.slice(0, count);
        }
        onGridItemsChange(newItems);
    };

    return (
        <div className="h-full flex flex-col p-6 space-y-6 animate-in fade-in slide-in-from-left-4 duration-500">
            <div>
                <h2 className="text-lg font-semibold text-foreground mb-1">Configuration</h2>
                <p className="text-sm text-muted-foreground">Configure your scroll animation</p>
            </div>

            <ScrollArea className="flex-1 -mr-4 pr-4">
                <div className="space-y-5 pb-4">
                    <div className="space-y-2">
                        <Label htmlFor="style" className="text-sm font-medium text-foreground flex items-center gap-2">
                            <Wand2 className="w-4 h-4 text-muted-foreground" />
                            Animation Style
                        </Label>
                        <Select value={style} onValueChange={(v) => onStyleChange(v as AnimationStyle)}>
                            <SelectTrigger className="bg-secondary border-border/50 focus:border-primary/50 text-foreground">
                                <SelectValue placeholder="Select a style" />
                            </SelectTrigger>
                            <SelectContent className="bg-card border-border">
                                <SelectItem value="apple-zoom" className="focus:bg-secondary text-foreground">
                                    Apple Zoom
                                </SelectItem>
                                <SelectItem value="parallax-reveal" className="focus:bg-secondary text-foreground">
                                    Parallax Reveal
                                </SelectItem>
                                <SelectItem value="canvas-scrubber" className="focus:bg-secondary text-foreground">
                                    Video Scrubber (Canvas)
                                </SelectItem>
                                <SelectItem value="physics-card" className="focus:bg-secondary text-foreground">
                                    Physics / Anti-Gravity Grid
                                </SelectItem>
                                <SelectItem value="horizontal-scroll" className="focus:bg-secondary text-foreground">
                                    Horizontal Scroll Gallery
                                </SelectItem>
                                <SelectItem value="hydrodynamic-text" className="focus:bg-secondary text-foreground">
                                    Hydrodynamic Text
                                </SelectItem>
                            </SelectContent>
                        </Select>
                        <StyleGuideCard selectedStyle={style} />
                    </div>

                    {style !== 'horizontal-scroll' && (
                        <>
                            <div className="space-y-2">
                                <Label htmlFor="headline" className="text-sm font-medium text-foreground flex items-center gap-2">
                                    <Type className="w-4 h-4 text-muted-foreground" />
                                    Headline Text
                                </Label>
                                <Input
                                    id="headline"
                                    value={headline}
                                    onChange={(e) => onHeadlineChange(e.target.value)}
                                    placeholder="Enter your headline..."
                                    className="bg-secondary border-border/50 focus:border-primary/50 text-foreground placeholder:text-muted-foreground"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="imageUrl" className="text-sm font-medium text-foreground flex items-center gap-2">
                                    <Image className="w-4 h-4 text-muted-foreground" />
                                    Image URL
                                </Label>
                                <div className="flex gap-2">
                                    {imageUrl && imageUrl.startsWith('data:') && imageUrl.length > 200 ? (
                                        <div className="flex-1 flex gap-2">
                                            <Input
                                                value="(Uploaded Image Data)"
                                                disabled
                                                className="bg-secondary border-border/50 text-muted-foreground flex-1"
                                            />
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => onImageUrlChange('')}
                                                title="Clear Image"
                                                className="h-10 w-10"
                                            >
                                                <span className="sr-only">Clear</span>
                                                <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-4 w-4"><path d="M11.7816 4.03157C12.0062 3.80702 12.0062 3.44295 11.7816 3.2184C11.5571 2.99385 11.193 2.99385 10.9685 3.2184L7.50005 6.68682L4.03164 3.2184C3.80708 2.99385 3.44301 2.99385 3.21846 3.2184C2.99391 3.44295 2.99391 3.80702 3.21846 4.03157L6.68688 7.49999L3.21846 10.9684C2.99391 11.193 2.99391 11.557 3.21846 11.7816C3.44301 12.0061 3.80708 12.0061 4.03164 11.7816L7.50005 8.31316L10.9685 11.7816C11.193 12.0061 11.5571 12.0061 11.7816 11.7816C12.0062 11.557 12.0062 11.193 11.7816 10.9684L8.31322 7.49999L11.7816 4.03157Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd"></path></svg>
                                            </Button>
                                        </div>
                                    ) : (
                                        <div className="relative flex-1">
                                            <Input
                                                id="imageUrl"
                                                value={imageUrl}
                                                onChange={(e) => onImageUrlChange(e.target.value)}
                                                placeholder="https://example.com/image.jpg"
                                                className="bg-secondary border-border/50 focus:border-primary/50 text-foreground placeholder:text-muted-foreground pr-8"
                                            />
                                            {imageUrl && (
                                                <button
                                                    onClick={() => onImageUrlChange('')}
                                                    className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                                >
                                                    <X className="w-3 h-3" />
                                                </button>
                                            )}
                                        </div>
                                    )}
                                    <input
                                        type="file"
                                        ref={fileInputRef}
                                        className="hidden"
                                        accept="image/*"
                                        multiple={style === 'canvas-scrubber'}
                                        onChange={handleImageUpload}
                                    />
                                    <Button
                                        variant="outline"
                                        size="icon"
                                        onClick={() => fileInputRef.current?.click()}
                                        title={style === 'canvas-scrubber' ? "Upload Image Sequence" : "Upload Image"}
                                        className="bg-secondary border-border/50 hover:bg-secondary/80"
                                    >
                                        <Upload className="w-4 h-4 text-muted-foreground" />
                                    </Button>
                                </div>
                                {/* Image Opacity Slider */}
                                {imageUrl && (
                                    <>
                                        <div className="space-y-1">
                                            <div className="flex justify-between items-center">
                                                <Label className="text-xs text-muted-foreground">Image Opacity</Label>
                                                <span className="text-xs font-mono text-primary text-[10px]">{Math.round((hydrodynamicConfig?.imageOpacity || 0.5) * 100)}%</span>
                                            </div>
                                            <input
                                                type="range"
                                                min="0" max="1" step="0.05"
                                                value={hydrodynamicConfig?.imageOpacity ?? 0.5} // Use nullish coalescing to ensure default 0.5
                                                onChange={(e) => updateHydrodynamic('imageOpacity', parseFloat(e.target.value))}
                                                className="w-full h-1 bg-secondary rounded-lg appearance-none cursor-pointer accent-primary"
                                            />
                                        </div>
                                    </>
                                )}
                            </div>
                        </>
                    )}

                    {style === 'hydrodynamic-text' && hydrodynamicConfig && (
                        <div className="space-y-6 pt-2 animate-in fade-in slide-in-from-left-2 duration-500">
                            {/* BACKGROUND COLOR */}
                            <div className="space-y-2">
                                <div className="flex justify-between items-center">
                                    <Label className="text-xs text-muted-foreground">Background Color</Label>
                                    <span className="text-xs font-mono text-primary uppercase">{hydrodynamicConfig.backgroundColor}</span>
                                </div>
                                <div className="flex gap-2 items-center">
                                    <input
                                        type="color"
                                        value={hydrodynamicConfig.backgroundColor}
                                        onChange={(e) => updateHydrodynamic('backgroundColor', e.target.value)}
                                        className="w-8 h-8 rounded border border-white/10 shrink-0 p-0 overflow-hidden cursor-pointer bg-transparent"
                                    />
                                    <div className="relative flex-1">
                                        <input
                                            type="text"
                                            value={hydrodynamicConfig.backgroundColor}
                                            onChange={(e) => updateHydrodynamic('backgroundColor', e.target.value)}
                                            className="w-full h-8 bg-background/50 border border-border/50 rounded px-2 text-xs font-mono uppercase"
                                        />
                                        <button
                                            onClick={() => {
                                                updateHydrodynamic('backgroundColor', '#050505');
                                                if (imageUrl) updateHydrodynamic('imageOpacity', 1);
                                            }}
                                            disabled={hydrodynamicConfig.backgroundColor === '#050505' && (!imageUrl || (hydrodynamicConfig.imageOpacity === 1))}
                                            className={`absolute right-2 top-1/2 -translate-y-1/2 hover:text-foreground ${(hydrodynamicConfig.backgroundColor === '#050505' && (!imageUrl || hydrodynamicConfig.imageOpacity === 1)) ? 'text-muted-foreground/30 cursor-not-allowed' : 'text-muted-foreground'}`}
                                            title="Reset to Default (Clears Tint)"
                                        >
                                            <X className="w-3 h-3" />
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* BLOCK DIMENSIONS */}
                            <div className="space-y-4 pt-4 border-t border-border/50">
                                {/* WIDTH */}
                                <div className="space-y-1">
                                    <div className="flex justify-between items-center">
                                        <Label className="text-xs text-muted-foreground">Block Width</Label>
                                        <span className="text-xs font-mono text-primary text-[10px]">{hydrodynamicConfig?.blockWidth || 100}%</span>
                                    </div>
                                    <input
                                        type="range"
                                        min="10" max="100" step="1"
                                        value={hydrodynamicConfig?.blockWidth || 100}
                                        onChange={(e) => updateHydrodynamic('blockWidth', parseInt(e.target.value))}
                                        className="w-full h-1 bg-secondary rounded-lg appearance-none cursor-pointer accent-primary"
                                    />
                                </div>
                                {/* HEIGHT */}
                                <div className="space-y-1">
                                    <div className="flex justify-between items-center">
                                        <Label className="text-xs text-muted-foreground">Block Height</Label>
                                        <span className="text-xs font-mono text-primary text-[10px]">{hydrodynamicConfig?.blockHeight || 100}%</span>
                                    </div>
                                    <input
                                        type="range"
                                        min="10" max="100" step="1"
                                        value={hydrodynamicConfig?.blockHeight || 100}
                                        onChange={(e) => updateHydrodynamic('blockHeight', parseInt(e.target.value))}
                                        className="w-full h-1 bg-secondary rounded-lg appearance-none cursor-pointer accent-primary"
                                    />
                                </div>
                            </div>

                            {/* TOGGLES */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-3 bg-secondary/50 rounded-lg flex items-center justify-between">
                                    <Label className="text-xs cursor-pointer" htmlFor="hydro-blend">Invert Colors</Label>
                                    <input
                                        id="hydro-blend"
                                        type="checkbox"
                                        checked={hydrodynamicConfig.blendMode}
                                        onChange={(e) => updateHydrodynamic('blendMode', e.target.checked)}
                                        className="accent-primary"
                                    />
                                </div>
                                <div className="p-3 bg-secondary/50 rounded-lg flex items-center justify-between">
                                    <Label className="text-xs cursor-pointer" htmlFor="hydro-drag">Draggable</Label>
                                    <input
                                        id="hydro-drag"
                                        type="checkbox"
                                        checked={hydrodynamicConfig.isDraggable}
                                        onChange={(e) => updateHydrodynamic('isDraggable', e.target.checked)}
                                        className="accent-primary"
                                    />
                                </div>
                            </div>
                        </div>
                    )}







                    {/* Grid Item Configuration */}
                    {
                        style === 'physics-card' && gridItems && (
                            <div className="space-y-4 pt-4 border-t border-border/50">
                                <div className="flex items-center justify-between">
                                    <Label className="text-sm font-medium text-foreground">Grid Items</Label>
                                    <div className="flex items-center gap-2">
                                        <Label htmlFor="text-vis" className="text-xs text-muted-foreground cursor-pointer">Always Show Text</Label>
                                        <input
                                            id="text-vis"
                                            type="checkbox"
                                            checked={textAlwaysVisible}
                                            onChange={(e) => onTextVisibilityChange && onTextVisibilityChange(e.target.checked)}
                                            className="accent-primary"
                                        />
                                    </div>
                                </div>

                                {/* Count Selector */}
                                <div className="flex items-center justify-between px-1">
                                    <Label className="text-xs text-muted-foreground">Number of Cards</Label>
                                    <Select value={String(gridItems.length)} onValueChange={updateGridCount}>
                                        <SelectTrigger className="w-[80px] h-8 text-xs">
                                            <SelectValue placeholder="Count" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {Array.from({ length: 12 }).map((_, i) => (
                                                <SelectItem key={i + 1} value={String(i + 1)}>
                                                    {i + 1}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                {/* Card Size Selector */}
                                <div className="flex items-center justify-between px-1">
                                    <Label className="text-xs text-muted-foreground">Card Size</Label>
                                    <Select
                                        value={gridSize || 'medium'}
                                        onValueChange={(val) => onGridSizeChange && onGridSizeChange(val as GridSize)}
                                    >
                                        <SelectTrigger className="w-[100px] h-8 text-xs">
                                            <SelectValue placeholder="Size" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="small">Small</SelectItem>
                                            <SelectItem value="medium">Medium</SelectItem>
                                            <SelectItem value="large">Large</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                {/* Physics Settings */}
                                {physicsConfig && (
                                    <>
                                        <div className="space-y-4 pt-4 border-t border-border/50">
                                            <Label className="text-[10px] text-muted-foreground uppercase font-bold tracking-tighter">Physics Engine</Label>

                                            <div className="space-y-2">
                                                <div className="flex justify-between items-center">
                                                    <Label className="text-xs text-muted-foreground">Hover Force</Label>
                                                    <span className="text-xs font-mono text-primary">{physicsConfig.hoverForce}</span>
                                                </div>
                                                <input
                                                    type="range"
                                                    min="0" max="100"
                                                    value={physicsConfig.hoverForce}
                                                    onChange={(e) => updatePhysics('hoverForce', Number(e.target.value))}
                                                    className="w-full h-1 bg-secondary rounded-lg appearance-none cursor-pointer accent-primary"
                                                />
                                            </div>

                                            <div className="space-y-2">
                                                <div className="flex justify-between items-center">
                                                    <Label className="text-xs text-muted-foreground">Snap Elasticity</Label>
                                                    <span className="text-xs font-mono text-primary">{physicsConfig.snapDuration}s</span>
                                                </div>
                                                <input
                                                    type="range"
                                                    min="0.1" max="3" step="0.1"
                                                    value={physicsConfig.snapDuration}
                                                    onChange={(e) => updatePhysics('snapDuration', Number(e.target.value))}
                                                    className="w-full h-1 bg-secondary rounded-lg appearance-none cursor-pointer accent-primary"
                                                />
                                            </div>

                                            <div className="space-y-2">
                                                <div className="flex justify-between items-center">
                                                    <Label className="text-xs text-muted-foreground">Max Rotation</Label>
                                                    <span className="text-xs font-mono text-primary">{physicsConfig.maxRotation}°</span>
                                                </div>
                                                <input
                                                    type="range"
                                                    min="0" max="45"
                                                    value={physicsConfig.maxRotation}
                                                    onChange={(e) => updatePhysics('maxRotation', Number(e.target.value))}
                                                    className="w-full h-1 bg-secondary rounded-lg appearance-none cursor-pointer accent-primary"
                                                />
                                            </div>
                                        </div>

                                        <div className="space-y-4 pt-4 border-t border-border/50">
                                            <Label className="text-[10px] text-muted-foreground uppercase font-bold tracking-tighter">Visual Aesthetics</Label>

                                            <div className="space-y-2">
                                                <div className="flex justify-between items-center">
                                                    <Label className="text-xs text-muted-foreground">Card Rounding</Label>
                                                    <span className="text-xs font-mono text-primary">{physicsConfig.cardRadius}px</span>
                                                </div>
                                                <input
                                                    type="range"
                                                    min="0" max="40"
                                                    value={physicsConfig.cardRadius}
                                                    onChange={(e) => updatePhysics('cardRadius', Number(e.target.value))}
                                                    className="w-full h-1 bg-secondary rounded-lg appearance-none cursor-pointer accent-primary"
                                                />
                                            </div>

                                            <div className="space-y-2">
                                                <div className="flex justify-between items-center">
                                                    <Label className="text-xs text-muted-foreground">Grid Gap</Label>
                                                    <span className="text-xs font-mono text-primary">{physicsConfig.gridGap}px</span>
                                                </div>
                                                <input
                                                    type="range"
                                                    min="0" max="100"
                                                    value={physicsConfig.gridGap}
                                                    onChange={(e) => updatePhysics('gridGap', Number(e.target.value))}
                                                    className="w-full h-1 bg-secondary rounded-lg appearance-none cursor-pointer accent-primary"
                                                />
                                            </div>
                                        </div>
                                    </>
                                )}

                                <div className="space-y-3">
                                    {gridItems.map((item) => (
                                        <div key={item.id} className="p-3 rounded-lg bg-secondary/50 border border-border/50 space-y-2">
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs font-mono text-muted-foreground min-w-[20px]">{item.id + 1}</span>
                                                <Input
                                                    value={item.text}
                                                    onChange={(e) => updateGridItem(item.id, 'text', e.target.value)}
                                                    placeholder="Label"
                                                    className="h-8 text-xs bg-background/50 border-border/50"
                                                />
                                            </div>
                                            <div className="pl-[28px] space-y-2">
                                                <Input
                                                    value={item.link}
                                                    onChange={(e) => updateGridItem(item.id, 'link', e.target.value)}
                                                    placeholder="On-Click URL (e.g. https://google.com)"
                                                    className="h-8 text-xs bg-background/50 border-border/50"
                                                />
                                                <Input
                                                    value={item.image || ''}
                                                    onChange={(e) => updateGridItem(item.id, 'image', e.target.value)}
                                                    placeholder="Card Image URL (jpg, png, etc)"
                                                    className="h-8 text-xs bg-background/50 border-border/50"
                                                />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )
                    }


                    {/* Horizontal Scroll Configuration */}
                    {
                        style === 'horizontal-scroll' && horizontalConfig && (
                            <Tabs defaultValue="content" className="w-full pt-4 border-t border-border/50">
                                <TabsList className="grid w-full grid-cols-4 bg-secondary/50 p-1 h-9 rounded-lg mb-4">
                                    <TabsTrigger value="content" className="text-[10px] h-7 px-1">Content</TabsTrigger>
                                    <TabsTrigger value="start" className="text-[10px] h-7 px-1">Start</TabsTrigger>
                                    <TabsTrigger value="end" className="text-[10px] h-7 px-1">End</TabsTrigger>
                                    <TabsTrigger value="settings" className="text-[10px] h-7 px-1">Settings</TabsTrigger>
                                </TabsList>

                                {/* CONTENT TAB */}
                                <TabsContent value="content" className="space-y-4 focus-visible:outline-none">
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between">
                                            <Label className="text-sm font-medium text-foreground">
                                                Gallery Items
                                                <span className="ml-2 text-xs text-muted-foreground font-normal">{horizontalConfig.items.length} Cards</span>
                                            </Label>
                                            <Select value={String(horizontalConfig.items.length)} onValueChange={updateHorizontalCount}>
                                                <SelectTrigger className="w-[80px] h-7 text-xs bg-secondary border-border/50">
                                                    <SelectValue placeholder="Count" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {Array.from({ length: 9 }).map((_, i) => ( // 2 to 10
                                                        <SelectItem key={i + 2} value={String(i + 2)}>
                                                            {i + 2}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        <div className="space-y-2">
                                            {horizontalConfig.items.map((item) => (
                                                <div key={item.id} className="rounded-lg bg-secondary/30 border border-border/50 overflow-hidden">
                                                    {/* Header */}
                                                    <div
                                                        className="flex items-center justify-between p-3 cursor-pointer hover:bg-secondary/50 transition-colors"
                                                        onClick={() => toggleCard(item.id)}
                                                    >
                                                        <div className="flex items-center gap-3">
                                                            <span className="text-xs font-mono text-muted-foreground min-w-[20px]">{item.id + 1}</span>
                                                            <span className="text-xs font-medium text-foreground truncate max-w-[150px]">{item.title}</span>
                                                        </div>
                                                        <ChevronDown className={`w-3 h-3 text-muted-foreground transition-transform duration-200 ${openCardId === item.id ? 'rotate-180' : ''}`} />
                                                    </div>

                                                    {/* Body */}
                                                    {openCardId === item.id && (
                                                        <div className="p-3 pt-0 space-y-3 animate-in fade-in slide-in-from-top-1 duration-200">
                                                            <div className="space-y-1">
                                                                <div className="flex justify-between items-center">
                                                                    <Label className="text-[10px] text-muted-foreground">Title</Label>
                                                                    {item.id === 0 && (
                                                                        <button
                                                                            onClick={(e) => {
                                                                                e.stopPropagation();
                                                                                applyFieldToAll('title', item.title);
                                                                            }}
                                                                            className="text-[10px] text-primary hover:text-primary/80 flex items-center gap-1 cursor-pointer transition-colors"
                                                                            title="Apply this title to all cards"
                                                                        >
                                                                            <Copy className="w-3 h-3" />
                                                                            All
                                                                        </button>
                                                                    )}
                                                                </div>
                                                                <Input
                                                                    value={item.title}
                                                                    onChange={(e) => updateHorizontalItem(item.id, 'title', e.target.value)}
                                                                    className="h-7 text-xs bg-background/50 border-border/50"
                                                                />
                                                            </div>
                                                            <div className="space-y-1">
                                                                <div className="flex justify-between items-center">
                                                                    <Label className="text-[10px] text-muted-foreground">Link URL</Label>
                                                                    {item.id === 0 && (
                                                                        <button
                                                                            onClick={(e) => {
                                                                                e.stopPropagation();
                                                                                applyFieldToAll('link', item.link || '#');
                                                                            }}
                                                                            className="text-[10px] text-primary hover:text-primary/80 flex items-center gap-1 cursor-pointer transition-colors"
                                                                            title="Apply this link to all cards"
                                                                        >
                                                                            <Copy className="w-3 h-3" />
                                                                            All
                                                                        </button>
                                                                    )}
                                                                </div>
                                                                <Input
                                                                    value={item.link || ''}
                                                                    onChange={(e) => updateHorizontalItem(item.id, 'link', e.target.value)}
                                                                    className="h-7 text-xs bg-background/50 border-border/50"
                                                                    placeholder="#"
                                                                />
                                                            </div>
                                                            <div className="space-y-1">
                                                                <div className="flex justify-between items-center mb-1">
                                                                    <div className="flex items-center gap-2">
                                                                        <Label className="text-[10px] text-muted-foreground">Text Color</Label>
                                                                        <div className="flex items-center gap-1">
                                                                            <input
                                                                                type="checkbox"
                                                                                id={`blend-${item.id}`}
                                                                                checked={item.blendMode || false}
                                                                                onChange={(e) => updateHorizontalItem(item.id, 'blendMode', e.target.checked)}
                                                                                className="w-3 h-3 rounded border-border/50 bg-background/50"
                                                                            />
                                                                            <Label htmlFor={`blend-${item.id}`} className="text-[9px] text-muted-foreground cursor-pointer" title="Mix Blend Mode: Difference">Blend</Label>
                                                                        </div>
                                                                        <div className="flex items-center gap-1">
                                                                            <input
                                                                                type="checkbox"
                                                                                id={`gradient-${item.id}`}
                                                                                checked={item.textGradient || false}
                                                                                onChange={(e) => updateHorizontalItem(item.id, 'textGradient', e.target.checked)}
                                                                                className="w-3 h-3 rounded border-border/50 bg-background/50"
                                                                            />
                                                                            <Label htmlFor={`gradient-${item.id}`} className="text-[9px] text-muted-foreground cursor-pointer">Gradient</Label>
                                                                        </div>
                                                                    </div>
                                                                    {item.id === 0 && (
                                                                        <button
                                                                            onClick={(e) => {
                                                                                e.stopPropagation();
                                                                                if (!onHorizontalConfigChange || !horizontalConfig) return;
                                                                                const newItems = horizontalConfig.items.map(it =>
                                                                                    it.id > 0 ? {
                                                                                        ...it,
                                                                                        blendMode: item.blendMode || false,
                                                                                        textGradient: item.textGradient || false,
                                                                                        textColor: item.textColor || '#ffffff',
                                                                                        gradientStart: item.gradientStart || '#ffffff',
                                                                                        gradientEnd: item.gradientEnd || '#999999'
                                                                                    } : it
                                                                                );
                                                                                onHorizontalConfigChange({ ...horizontalConfig, items: newItems });
                                                                            }}
                                                                            className="text-[10px] text-primary hover:text-primary/80 flex items-center gap-1 cursor-pointer transition-colors"
                                                                            title="Apply all text styles (Color, Gradient, Blend) to all cards"
                                                                        >
                                                                            <Copy className="w-3 h-3" />
                                                                            Apply All
                                                                        </button>
                                                                    )}
                                                                </div>
                                                                <div className="flex gap-2">
                                                                    {!item.textGradient ? (
                                                                        <>
                                                                            <input
                                                                                type="color"
                                                                                value={item.textColor || '#ffffff'}
                                                                                onChange={(e) => updateHorizontalItem(item.id, 'textColor', e.target.value)}
                                                                                className="w-7 h-7 rounded border border-border/50 shrink-0 p-0 overflow-hidden cursor-pointer bg-transparent"
                                                                            />
                                                                            <Input
                                                                                value={item.textColor || '#ffffff'}
                                                                                onChange={(e) => updateHorizontalItem(item.id, 'textColor', e.target.value)}
                                                                                className="h-7 text-xs bg-background/50 border-border/50 font-mono"
                                                                            />
                                                                        </>
                                                                    ) : (
                                                                        <div className="flex gap-2 w-full">
                                                                            <div className="flex flex-col gap-1 w-1/2">
                                                                                <Label className="text-[9px] text-muted-foreground">Start</Label>
                                                                                <div className="flex gap-1">
                                                                                    <input
                                                                                        type="color"
                                                                                        value={item.gradientStart || '#ffffff'}
                                                                                        onChange={(e) => updateHorizontalItem(item.id, 'gradientStart', e.target.value)}
                                                                                        className="w-7 h-7 rounded border border-border/50 shrink-0 p-0 overflow-hidden cursor-pointer bg-transparent"
                                                                                    />
                                                                                    <Input
                                                                                        value={item.gradientStart || '#ffffff'}
                                                                                        onChange={(e) => updateHorizontalItem(item.id, 'gradientStart', e.target.value)}
                                                                                        className="h-7 text-xs bg-background/50 border-border/50 font-mono p-1"
                                                                                    />
                                                                                </div>
                                                                            </div>
                                                                            <div className="flex flex-col gap-1 w-1/2">
                                                                                <Label className="text-[9px] text-muted-foreground">End</Label>
                                                                                <div className="flex gap-1">
                                                                                    <input
                                                                                        type="color"
                                                                                        value={item.gradientEnd || '#999999'}
                                                                                        onChange={(e) => updateHorizontalItem(item.id, 'gradientEnd', e.target.value)}
                                                                                        className="w-7 h-7 rounded border border-border/50 shrink-0 p-0 overflow-hidden cursor-pointer bg-transparent"
                                                                                    />
                                                                                    <Input
                                                                                        value={item.gradientEnd || '#999999'}
                                                                                        onChange={(e) => updateHorizontalItem(item.id, 'gradientEnd', e.target.value)}
                                                                                        className="h-7 text-xs bg-background/50 border-border/50 font-mono p-1"
                                                                                    />
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                            <div className="space-y-1">
                                                                <div className="flex justify-between items-center">
                                                                    <Label className="text-[10px] text-muted-foreground">Subtitle</Label>
                                                                    {item.id === 0 && (
                                                                        <button
                                                                            onClick={(e) => {
                                                                                e.stopPropagation();
                                                                                applyFieldToAll('subtitle', item.subtitle);
                                                                            }}
                                                                            className="text-[10px] text-primary hover:text-primary/80 flex items-center gap-1 cursor-pointer transition-colors"
                                                                            title="Apply this subtitle to all cards"
                                                                        >
                                                                            <Copy className="w-3 h-3" />
                                                                            All
                                                                        </button>
                                                                    )}
                                                                </div>
                                                                <Input
                                                                    value={item.subtitle}
                                                                    onChange={(e) => updateHorizontalItem(item.id, 'subtitle', e.target.value)}
                                                                    className="h-7 text-xs bg-background/50 border-border/50"
                                                                />
                                                            </div>
                                                            <div className="space-y-1">
                                                                <div className="flex justify-between items-center">
                                                                    <Label className="text-[10px] text-muted-foreground">Image URL</Label>
                                                                    {/* Apply All Button only on Card 1 (Index 0) */}
                                                                    {item.id === 0 && (
                                                                        <button
                                                                            onClick={(e) => {
                                                                                e.stopPropagation();
                                                                                applyFieldToAll('image', item.image);
                                                                            }}
                                                                            className="text-[10px] text-primary hover:text-primary/80 flex items-center gap-1 cursor-pointer transition-colors"
                                                                            title="Apply this image to all subsequent cards"
                                                                        >
                                                                            <Copy className="w-3 h-3" />
                                                                            All
                                                                        </button>
                                                                    )}
                                                                </div>
                                                                <div className="flex gap-2">
                                                                    {item.image && item.image.startsWith('data:') && item.image.length > 200 ? (
                                                                        <div className="flex-1 flex gap-2">
                                                                            <Input
                                                                                value="(Uploaded Image Data)"
                                                                                disabled
                                                                                className="h-7 text-xs bg-background/50 border-border/50 flex-1 text-muted-foreground"
                                                                            />
                                                                            <Button
                                                                                variant="ghost"
                                                                                size="icon"
                                                                                onClick={() => updateHorizontalItem(item.id, 'image', '')}
                                                                                title="Clear Image"
                                                                                className="h-7 w-7"
                                                                            >
                                                                                <span className="sr-only">Clear</span>
                                                                                <svg width="12" height="12" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-3 w-3"><path d="M11.7816 4.03157C12.0062 3.80702 12.0062 3.44295 11.7816 3.2184C11.5571 2.99385 11.193 2.99385 10.9685 3.2184L7.50005 6.68682L4.03164 3.2184C3.80708 2.99385 3.44301 2.99385 3.21846 3.2184C2.99391 3.44295 2.99391 3.80702 3.21846 4.03157L6.68688 7.49999L3.21846 10.9684C2.99391 11.193 2.99391 11.557 3.21846 11.7816C3.44301 12.0061 3.80708 12.0061 4.03164 11.7816L7.50005 8.31316L10.9685 11.7816C11.193 12.0061 11.5571 12.0061 11.7816 11.7816C12.0062 11.557 12.0062 11.193 11.7816 10.9684L8.31322 7.49999L11.7816 4.03157Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd"></path></svg>
                                                                            </Button>
                                                                        </div>
                                                                    ) : (
                                                                        <Input
                                                                            value={item.image}
                                                                            onChange={(e) => updateHorizontalItem(item.id, 'image', e.target.value)}
                                                                            className="h-7 text-xs bg-background/50 border-border/50 flex-1"
                                                                        />
                                                                    )}
                                                                    <input
                                                                        type="file"
                                                                        id={`upload-${item.id}`}
                                                                        className="hidden"
                                                                        accept="image/*"
                                                                        onChange={(e) => handleItemImageUpload(e, item.id)}
                                                                    />
                                                                    <Button
                                                                        variant="outline"
                                                                        size="icon"
                                                                        onClick={() => document.getElementById(`upload-${item.id}`)?.click()}
                                                                        title="Upload Image"
                                                                        className="h-7 w-7 bg-secondary border-border/50 hover:bg-secondary/80"
                                                                    >
                                                                        <Upload className="w-3 h-3 text-muted-foreground" />
                                                                    </Button>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* End Card (CTA) */}
                                </TabsContent>


                                {/* START TAB (Intro Card) */}
                                <TabsContent value="start" className="space-y-4 focus-visible:outline-none">
                                    <div className="space-y-2">
                                        <Label htmlFor="headline-start" className="text-sm font-medium text-foreground flex items-center gap-2">
                                            <Type className="w-4 h-4 text-muted-foreground" />
                                            Headline Text
                                        </Label>
                                        <Input
                                            id="headline-start"
                                            value={headline}
                                            onChange={(e) => onHeadlineChange(e.target.value)}
                                            placeholder="Enter your headline..."
                                            className="bg-secondary border-border/50 focus:border-primary/50 text-foreground placeholder:text-muted-foreground"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="imageUrl-start" className="text-sm font-medium text-foreground flex items-center gap-2">
                                            <Image className="w-4 h-4 text-muted-foreground" />
                                            Image URL
                                        </Label>
                                        <div className="flex gap-2">
                                            <div className="relative flex-1">
                                                <Input
                                                    id="imageUrl-start"
                                                    value={horizontalConfig.startCard.image || ''}
                                                    onChange={(e) => updateHorizontalConfig('startCard', { ...horizontalConfig.startCard, image: e.target.value })}
                                                    placeholder="https://example.com/image.jpg"
                                                    className="bg-secondary border-border/50 focus:border-primary/50 text-foreground placeholder:text-muted-foreground pr-8"
                                                />
                                                {horizontalConfig.startCard.image && (
                                                    <button
                                                        onClick={() => updateHorizontalConfig('startCard', { ...horizontalConfig.startCard, image: '' })}
                                                        className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                                    >
                                                        <X className="w-3 h-3" />
                                                    </button>
                                                )}
                                            </div>
                                            <input
                                                type="file"
                                                id="fileInputRef-start" // Use a unique ID for this file input
                                                className="hidden"
                                                accept="image/*"
                                                multiple={false}
                                                onChange={(e) => {
                                                    const file = e.target.files?.[0];
                                                    if (file) {
                                                        const objectUrl = URL.createObjectURL(file);
                                                        updateHorizontalConfig('startCard', { ...horizontalConfig.startCard, image: objectUrl });
                                                    }
                                                }}
                                            />
                                            <Button
                                                variant="outline"
                                                size="icon"
                                                onClick={() => document.getElementById('fileInputRef-start')?.click()} // Reference by ID
                                                title="Upload Image"
                                                className="bg-secondary border-border/50 hover:bg-secondary/80"
                                            >
                                                <Upload className="w-4 h-4 text-muted-foreground" />
                                            </Button>
                                        </div>
                                    </div>

                                    <div className="space-y-1">
                                        <Label className="text-[10px] text-muted-foreground">Background Color</Label>
                                        <div className="flex gap-2">
                                            <input
                                                type="color"
                                                value={horizontalConfig.startCard.backgroundColor}
                                                onChange={(e) => updateHorizontalConfig('startCard', { ...horizontalConfig.startCard, backgroundColor: e.target.value })}
                                                className="w-7 h-7 rounded border border-border/50 shrink-0 p-0 overflow-hidden cursor-pointer bg-transparent"
                                            />
                                            <Input
                                                value={horizontalConfig.startCard.backgroundColor}
                                                onChange={(e) => updateHorizontalConfig('startCard', { ...horizontalConfig.startCard, backgroundColor: e.target.value })}
                                                className="h-7 text-xs bg-background/50 border-border/50 font-mono"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <div className="flex justify-between items-center">
                                            <Label className="text-xs text-muted-foreground">Background Overlay</Label>
                                            <span className="text-xs font-mono text-primary">{horizontalConfig.startCard.backgroundOverlay}%</span>
                                        </div>
                                        <input
                                            type="range"
                                            min="0" max="100"
                                            value={horizontalConfig.startCard.backgroundOverlay}
                                            onChange={(e) => updateHorizontalConfig('startCard', { ...horizontalConfig.startCard, backgroundOverlay: Number(e.target.value) })}
                                            className="w-full h-1 bg-secondary rounded-lg appearance-none cursor-pointer accent-primary"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <div className="flex justify-between items-center">
                                            <Label className="text-xs text-muted-foreground">Headline Size</Label>
                                            <span className="text-xs font-mono text-primary">{horizontalConfig.startCard.headlineSize}px</span>
                                        </div>
                                        <input
                                            type="range"
                                            min="48" max="120"
                                            value={horizontalConfig.startCard.headlineSize}
                                            onChange={(e) => updateHorizontalConfig('startCard', { ...horizontalConfig.startCard, headlineSize: Number(e.target.value) })}
                                            className="w-full h-1 bg-secondary rounded-lg appearance-none cursor-pointer accent-primary"
                                        />
                                    </div>

                                    <div className="space-y-1">
                                        <Label className="text-[10px] text-muted-foreground">Subtitle</Label>
                                        <Input
                                            value={horizontalConfig.startCard.subtitle}
                                            onChange={(e) => updateHorizontalConfig('startCard', { ...horizontalConfig.startCard, subtitle: e.target.value })}
                                            className="h-7 text-xs bg-background/50 border-border/50"
                                            placeholder="Optional subtitle"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <div className="flex justify-between items-center mb-1">
                                            <div className="flex items-center gap-2">
                                                <Label className="text-[10px] text-muted-foreground">Text Color</Label>
                                                <div className="flex items-center gap-1">
                                                    <input
                                                        type="checkbox"
                                                        id="start-blend"
                                                        checked={horizontalConfig.startCard.blendMode}
                                                        onChange={(e) => updateHorizontalConfig('startCard', { ...horizontalConfig.startCard, blendMode: e.target.checked })}
                                                        className="w-3 h-3 rounded border-border/50 bg-background/50"
                                                    />
                                                    <Label htmlFor="start-blend" className="text-[9px] text-muted-foreground cursor-pointer">Blend</Label>
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    <input
                                                        type="checkbox"
                                                        id="start-gradient"
                                                        checked={horizontalConfig.startCard.textGradient}
                                                        onChange={(e) => updateHorizontalConfig('startCard', { ...horizontalConfig.startCard, textGradient: e.target.checked })}
                                                        className="w-3 h-3 rounded border-border/50 bg-background/50"
                                                    />
                                                    <Label htmlFor="start-gradient" className="text-[9px] text-muted-foreground cursor-pointer">Gradient</Label>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex gap-2">
                                            {!horizontalConfig.startCard.textGradient ? (
                                                <>
                                                    <input
                                                        type="color"
                                                        value={horizontalConfig.startCard.textColor}
                                                        onChange={(e) => updateHorizontalConfig('startCard', { ...horizontalConfig.startCard, textColor: e.target.value })}
                                                        className="w-7 h-7 rounded border border-border/50 shrink-0 p-0 overflow-hidden cursor-pointer bg-transparent"
                                                    />
                                                    <Input
                                                        value={horizontalConfig.startCard.textColor}
                                                        onChange={(e) => updateHorizontalConfig('startCard', { ...horizontalConfig.startCard, textColor: e.target.value })}
                                                        className="h-7 text-xs bg-background/50 border-border/50 font-mono"
                                                    />
                                                </>
                                            ) : (
                                                <div className="flex gap-2 w-full">
                                                    <div className="flex flex-col gap-1 w-1/2">
                                                        <Label className="text-[9px] text-muted-foreground">Start</Label>
                                                        <div className="flex gap-1">
                                                            <input
                                                                type="color"
                                                                value={horizontalConfig.startCard.gradientStart}
                                                                onChange={(e) => updateHorizontalConfig('startCard', { ...horizontalConfig.startCard, gradientStart: e.target.value })}
                                                                className="w-7 h-7 rounded border border-border/50 shrink-0 p-0 overflow-hidden cursor-pointer bg-transparent"
                                                            />
                                                            <Input
                                                                value={horizontalConfig.startCard.gradientStart}
                                                                onChange={(e) => updateHorizontalConfig('startCard', { ...horizontalConfig.startCard, gradientStart: e.target.value })}
                                                                className="h-7 text-xs bg-background/50 border-border/50 font-mono p-1"
                                                            />
                                                        </div>
                                                    </div>
                                                    <div className="flex flex-col gap-1 w-1/2">
                                                        <Label className="text-[9px] text-muted-foreground">End</Label>
                                                        <div className="flex gap-1">
                                                            <input
                                                                type="color"
                                                                value={horizontalConfig.startCard.gradientEnd}
                                                                onChange={(e) => updateHorizontalConfig('startCard', { ...horizontalConfig.startCard, gradientEnd: e.target.value })}
                                                                className="w-7 h-7 rounded border border-border/50 shrink-0 p-0 overflow-hidden cursor-pointer bg-transparent"
                                                            />
                                                            <Input
                                                                value={horizontalConfig.startCard.gradientEnd}
                                                                onChange={(e) => updateHorizontalConfig('startCard', { ...horizontalConfig.startCard, gradientEnd: e.target.value })}
                                                                className="h-7 text-xs bg-background/50 border-border/50 font-mono p-1"
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </TabsContent>

                                {/* END TAB (CTA Card) */}
                                <TabsContent value="end" className="space-y-4 focus-visible:outline-none">
                                    <div className="space-y-4">
                                        <div className="space-y-2">
                                            <div className="flex justify-between items-center">
                                                <Label className="text-xs text-muted-foreground">Title Size</Label>
                                                <span className="text-xs font-mono text-primary">{horizontalConfig.endCard.titleSize}px</span>
                                            </div>
                                            <input
                                                type="range"
                                                min="24" max="100"
                                                value={horizontalConfig.endCard.titleSize}
                                                onChange={(e) => updateHorizontalConfig('endCard', { ...horizontalConfig.endCard, titleSize: Number(e.target.value) })}
                                                className="w-full h-1 bg-secondary rounded-lg appearance-none cursor-pointer accent-primary"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <div className="flex justify-between items-center">
                                                <Label className="text-xs text-muted-foreground">Button Size</Label>
                                                <span className="text-xs font-mono text-primary">{horizontalConfig.endCard.buttonSize}px</span>
                                            </div>
                                            <input
                                                type="range"
                                                min="12" max="32"
                                                value={horizontalConfig.endCard.buttonSize}
                                                onChange={(e) => updateHorizontalConfig('endCard', { ...horizontalConfig.endCard, buttonSize: Number(e.target.value) })}
                                                className="w-full h-1 bg-secondary rounded-lg appearance-none cursor-pointer accent-primary"
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <Label className="text-[10px] text-muted-foreground">Subtitle</Label>
                                            <Input
                                                value={horizontalConfig.endCard.subtitle}
                                                onChange={(e) => updateHorizontalConfig('endCard', { ...horizontalConfig.endCard, subtitle: e.target.value })}
                                                className="h-7 text-xs bg-background/50 border-border/50"
                                                placeholder="Optional subtitle"
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <div className="flex justify-between items-center mb-1">
                                                <div className="flex items-center gap-2">
                                                    <Label className="text-[10px] text-muted-foreground">Text Color</Label>
                                                    <div className="flex items-center gap-1">
                                                        <input
                                                            type="checkbox"
                                                            id="end-blend"
                                                            checked={horizontalConfig.endCard.blendMode}
                                                            onChange={(e) => updateHorizontalConfig('endCard', { ...horizontalConfig.endCard, blendMode: e.target.checked })}
                                                            className="w-3 h-3 rounded border-border/50 bg-background/50"
                                                        />
                                                        <Label htmlFor="end-blend" className="text-[9px] text-muted-foreground cursor-pointer">Blend</Label>
                                                    </div>
                                                    <div className="flex items-center gap-1">
                                                        <input
                                                            type="checkbox"
                                                            id="end-gradient"
                                                            checked={horizontalConfig.endCard.textGradient}
                                                            onChange={(e) => updateHorizontalConfig('endCard', { ...horizontalConfig.endCard, textGradient: e.target.checked })}
                                                            className="w-3 h-3 rounded border-border/50 bg-background/50"
                                                        />
                                                        <Label htmlFor="end-gradient" className="text-[9px] text-muted-foreground cursor-pointer">Gradient</Label>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex gap-2">
                                                {!horizontalConfig.endCard.textGradient ? (
                                                    <>
                                                        <input
                                                            type="color"
                                                            value={horizontalConfig.endCard.textColor}
                                                            onChange={(e) => updateHorizontalConfig('endCard', { ...horizontalConfig.endCard, textColor: e.target.value })}
                                                            className="w-7 h-7 rounded border border-border/50 shrink-0 p-0 overflow-hidden cursor-pointer bg-transparent"
                                                        />
                                                        <Input
                                                            value={horizontalConfig.endCard.textColor}
                                                            onChange={(e) => updateHorizontalConfig('endCard', { ...horizontalConfig.endCard, textColor: e.target.value })}
                                                            className="h-7 text-xs bg-background/50 border-border/50 font-mono"
                                                        />
                                                    </>
                                                ) : (
                                                    <div className="flex gap-2 w-full">
                                                        <div className="flex flex-col gap-1 w-1/2">
                                                            <Label className="text-[9px] text-muted-foreground">Start</Label>
                                                            <div className="flex gap-1">
                                                                <input
                                                                    type="color"
                                                                    value={horizontalConfig.endCard.gradientStart}
                                                                    onChange={(e) => updateHorizontalConfig('endCard', { ...horizontalConfig.endCard, gradientStart: e.target.value })}
                                                                    className="w-7 h-7 rounded border border-border/50 shrink-0 p-0 overflow-hidden cursor-pointer bg-transparent"
                                                                />
                                                                <Input
                                                                    value={horizontalConfig.endCard.gradientStart}
                                                                    onChange={(e) => updateHorizontalConfig('endCard', { ...horizontalConfig.endCard, gradientStart: e.target.value })}
                                                                    className="h-7 text-xs bg-background/50 border-border/50 font-mono p-1"
                                                                />
                                                            </div>
                                                        </div>
                                                        <div className="flex flex-col gap-1 w-1/2">
                                                            <Label className="text-[9px] text-muted-foreground">End</Label>
                                                            <div className="flex gap-1">
                                                                <input
                                                                    type="color"
                                                                    value={horizontalConfig.endCard.gradientEnd}
                                                                    onChange={(e) => updateHorizontalConfig('endCard', { ...horizontalConfig.endCard, gradientEnd: e.target.value })}
                                                                    className="w-7 h-7 rounded border border-border/50 shrink-0 p-0 overflow-hidden cursor-pointer bg-transparent"
                                                                />
                                                                <Input
                                                                    value={horizontalConfig.endCard.gradientEnd}
                                                                    onChange={(e) => updateHorizontalConfig('endCard', { ...horizontalConfig.endCard, gradientEnd: e.target.value })}
                                                                    className="h-7 text-xs bg-background/50 border-border/50 font-mono p-1"
                                                                />
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="space-y-3 pt-3 border-t border-border/30">
                                        <div className="space-y-1">
                                            <Label className="text-[10px] text-muted-foreground">CTA Text</Label>
                                            <Input
                                                value={horizontalConfig.cta?.text || ''}
                                                onChange={(e) => updateHorizontalConfig('cta', { ...(horizontalConfig.cta || {}), text: e.target.value })}
                                                className="h-7 text-xs bg-background/50 border-border/50"
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <Label className="text-[10px] text-muted-foreground">CTA Subtext (Button)</Label>
                                            <Input
                                                value={horizontalConfig.cta?.subtext || ''}
                                                onChange={(e) => updateHorizontalConfig('cta', { ...(horizontalConfig.cta || {}), subtext: e.target.value })}
                                                className="h-7 text-xs bg-background/50 border-border/50"
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <Label className="text-[10px] text-muted-foreground">CTA Link</Label>
                                            <Input
                                                value={horizontalConfig.cta?.link || ''}
                                                onChange={(e) => updateHorizontalConfig('cta', { ...(horizontalConfig.cta || {}), link: e.target.value })}
                                                className="h-7 text-xs bg-background/50 border-border/50"
                                                placeholder="https://..."
                                            />
                                        </div>
                                        <div className="space-y-2 pt-2 border-t border-border/30">
                                            <div className="flex justify-between items-center">
                                                <Label className="text-xs text-muted-foreground">Background Overlay</Label>
                                                <span className="text-xs font-mono text-primary">{horizontalConfig.endCard.backgroundOverlay}%</span>
                                            </div>
                                            <input
                                                type="range"
                                                min="0" max="100"
                                                value={horizontalConfig.endCard.backgroundOverlay}
                                                onChange={(e) => updateHorizontalConfig('endCard', { ...horizontalConfig.endCard, backgroundOverlay: Number(e.target.value) })}
                                                className="w-full h-1 bg-secondary rounded-lg appearance-none cursor-pointer accent-primary"
                                            />
                                        </div>
                                        <div className="space-y-2 pt-2 border-t border-border/30">
                                            <Label className="text-[10px] text-muted-foreground">Background Image</Label>
                                            <div className="flex gap-2">
                                                <Input
                                                    value={horizontalConfig.endCard.backgroundImage}
                                                    onChange={(e) => updateHorizontalConfig('endCard', { ...horizontalConfig.endCard, backgroundImage: e.target.value })}
                                                    className="h-7 text-xs bg-background/50 border-border/50"
                                                    placeholder="Image URL (optional)"
                                                />
                                                <Button
                                                    variant="outline"
                                                    size="icon"
                                                    onClick={() => {
                                                        const input = document.createElement('input');
                                                        input.type = 'file';
                                                        input.accept = 'image/*';
                                                        input.onchange = (e) => {
                                                            const file = (e.target as HTMLInputElement).files?.[0];
                                                            if (file) {
                                                                const reader = new FileReader();
                                                                reader.onload = (event) => {
                                                                    const imageUrl = event.target?.result as string;
                                                                    updateHorizontalConfig('endCard', { ...horizontalConfig.endCard, backgroundImage: imageUrl });
                                                                };
                                                                reader.readAsDataURL(file);
                                                            }
                                                        };
                                                        input.click();
                                                    }}
                                                    title="Upload Background Image"
                                                    className="h-7 w-7 bg-secondary border-border/50 hover:bg-secondary/80 shrink-0"
                                                >
                                                    <Upload className="w-3 h-3 text-muted-foreground" />
                                                </Button>
                                            </div>
                                        </div>
                                        <div className="space-y-1">
                                            <Label className="text-[10px] text-muted-foreground">Background Color</Label>
                                            <div className="flex gap-2">
                                                <input
                                                    type="color"
                                                    value={horizontalConfig.endCard.backgroundColor}
                                                    onChange={(e) => updateHorizontalConfig('endCard', { ...horizontalConfig.endCard, backgroundColor: e.target.value })}
                                                    className="w-7 h-7 rounded border border-border/50 shrink-0 p-0 overflow-hidden cursor-pointer bg-transparent"
                                                />
                                                <Input
                                                    value={horizontalConfig.endCard.backgroundColor}
                                                    onChange={(e) => updateHorizontalConfig('endCard', { ...horizontalConfig.endCard, backgroundColor: e.target.value })}
                                                    className="h-7 text-xs bg-background/50 border-border/50 font-mono"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </TabsContent>

                                {/* SETTINGS TAB */}
                                <TabsContent value="settings" className="space-y-4 focus-visible:outline-none">
                                    <div className="space-y-4">
                                        <Label className="text-[10px] text-muted-foreground uppercase font-bold tracking-tighter">Typography</Label>
                                        <div className="space-y-2">
                                            <div className="flex justify-between items-center">
                                                <Label className="text-xs text-muted-foreground">Title Size</Label>
                                                <span className="text-xs font-mono text-primary">{horizontalConfig.typography.titleSize}px</span>
                                            </div>
                                            <input
                                                type="range"
                                                min="24" max="120"
                                                value={horizontalConfig.typography.titleSize}
                                                onChange={(e) => updateHorizontalConfig('typography', { ...horizontalConfig.typography, titleSize: Number(e.target.value) })}
                                                className="w-full h-1 bg-secondary rounded-lg appearance-none cursor-pointer accent-primary"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <div className="flex justify-between items-center">
                                                <Label className="text-xs text-muted-foreground">Label Size</Label>
                                                <span className="text-xs font-mono text-primary">{horizontalConfig.typography.labelSize}px</span>
                                            </div>
                                            <input
                                                type="range"
                                                min="12" max="24"
                                                value={horizontalConfig.typography.labelSize}
                                                onChange={(e) => updateHorizontalConfig('typography', { ...horizontalConfig.typography, labelSize: Number(e.target.value) })}
                                                className="w-full h-1 bg-secondary rounded-lg appearance-none cursor-pointer accent-primary"
                                            />
                                        </div>
                                    </div>
                                </TabsContent>
                            </Tabs>
                        )}

                    {style === 'hydrodynamic-text' && hydrodynamicConfig && (
                        <div className="space-y-6 pt-6 border-t border-border/50 animate-in fade-in slide-in-from-left-2 duration-500">
                            <div>
                                <h3 className="text-sm font-medium text-foreground mb-4 flex items-center gap-2">
                                    <Wand2 className="w-4 h-4 text-muted-foreground" />
                                    Hydrodynamic Physics
                                </h3>
                                <div className="space-y-4">
                                    {/* VISCOSITY */}
                                    <div className="space-y-2">
                                        <div className="flex justify-between items-center">
                                            <Label className="text-xs text-muted-foreground">Liquid Viscosity</Label>
                                            <span className="text-xs font-mono text-primary">{hydrodynamicConfig.viscosity}</span>
                                        </div>
                                        <input
                                            type="range"
                                            min="0.1" max="0.8" step="0.1"
                                            value={hydrodynamicConfig.viscosity}
                                            onChange={(e) => updateHydrodynamic('viscosity', parseFloat(e.target.value))}
                                            className="w-full h-1 bg-secondary rounded-lg appearance-none cursor-pointer accent-primary"
                                        />
                                    </div>

                                    {/* ELASTICITY */}
                                    <div className="space-y-2">
                                        <div className="flex justify-between items-center">
                                            <Label className="text-xs text-muted-foreground">Elastic Tension</Label>
                                            <span className="text-xs font-mono text-primary">{hydrodynamicConfig.elasticity}</span>
                                        </div>
                                        <input
                                            type="range"
                                            min="0.1" max="1.0" step="0.1"
                                            value={hydrodynamicConfig.elasticity}
                                            onChange={(e) => updateHydrodynamic('elasticity', parseFloat(e.target.value))}
                                            className="w-full h-1 bg-secondary rounded-lg appearance-none cursor-pointer accent-primary"
                                        />
                                    </div>

                                    {/* MAGNETIC RADIUS */}
                                    <div className="space-y-2">
                                        <div className="flex justify-between items-center">
                                            <Label className="text-xs text-muted-foreground">Interaction Radius</Label>
                                            <span className="text-xs font-mono text-primary">{hydrodynamicConfig.interactionRadius}px</span>
                                        </div>
                                        <input
                                            type="range"
                                            min="100" max="600" step="50"
                                            value={hydrodynamicConfig.interactionRadius}
                                            onChange={(e) => updateHydrodynamic('interactionRadius', parseInt(e.target.value))}
                                            className="w-full h-1 bg-secondary rounded-lg appearance-none cursor-pointer accent-primary"
                                        />
                                    </div>

                                    {/* RETURN SPEED */}
                                    <div className="space-y-2">
                                        <div className="flex justify-between items-center">
                                            <Label className="text-xs text-muted-foreground">Return Speed (s)</Label>
                                            <span className="text-xs font-mono text-primary">{hydrodynamicConfig.returnSpeed}s</span>
                                        </div>
                                        <input
                                            type="range"
                                            min="0.5" max="3.0" step="0.1"
                                            value={hydrodynamicConfig.returnSpeed}
                                            onChange={(e) => updateHydrodynamic('returnSpeed', parseFloat(e.target.value))}
                                            className="w-full h-1 bg-secondary rounded-lg appearance-none cursor-pointer accent-primary"
                                        />
                                    </div>

                                    {/* TURBULENCE / ROTATION */}
                                    <div className="space-y-2">
                                        <div className="flex justify-between items-center">
                                            <Label className="text-xs text-muted-foreground">Rotation Force</Label>
                                            <span className="text-xs font-mono text-primary">{hydrodynamicConfig.rotationForce}</span>
                                        </div>
                                        <input
                                            type="range"
                                            min="0.01" max="0.2" step="0.01"
                                            value={hydrodynamicConfig.rotationForce}
                                            onChange={(e) => updateHydrodynamic('rotationForce', parseFloat(e.target.value))}
                                            className="w-full h-1 bg-secondary rounded-lg appearance-none cursor-pointer accent-primary"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* TYPOGRAPHY & INTERACTION */}
                            <div className="space-y-4 pt-4 border-t border-border/50">
                                <h3 className="text-sm font-medium text-foreground flex items-center gap-2">
                                    <Type className="w-4 h-4 text-muted-foreground" />
                                    Typography & Interaction
                                </h3>

                                {/* FONT SIZE */}
                                <div className="space-y-4">
                                    {/* FONT SIZE & COLOR */}
                                    <div className="space-y-2">
                                        <div className="flex justify-between items-center">
                                            <Label className="text-xs text-muted-foreground">Font Size (px)</Label>
                                            <div className="flex items-center gap-2">
                                                <div className="relative flex items-center gap-1 group">
                                                    <input
                                                        type="color"
                                                        value={hydrodynamicConfig.textColor || '#FFFFFF'}
                                                        onChange={(e) => updateHydrodynamic('textColor', e.target.value)}
                                                        className="w-4 h-4 rounded-sm border-none cursor-pointer bg-transparent p-0"
                                                        title="Headline Color"
                                                    />
                                                    <button
                                                        onClick={() => updateHydrodynamic('textColor', '#FFFFFF')}
                                                        disabled={!hydrodynamicConfig.textColor || hydrodynamicConfig.textColor === '#FFFFFF'}
                                                        className={`hover:text-foreground ${(!hydrodynamicConfig.textColor || hydrodynamicConfig.textColor === '#FFFFFF') ? 'text-muted-foreground/30 cursor-not-allowed' : 'text-muted-foreground'}`}
                                                        title="Reset to Default"
                                                    >
                                                        <X className="w-3 h-3" />
                                                    </button>
                                                </div>
                                                <span className="text-xs font-mono text-primary">{hydrodynamicConfig.fontSize}px</span>
                                            </div>
                                        </div>
                                        <input
                                            type="range"
                                            min="40" max="400"
                                            value={hydrodynamicConfig.fontSize}
                                            onChange={(e) => updateHydrodynamic('fontSize', parseInt(e.target.value))}
                                            className="w-full h-1 bg-secondary rounded-lg appearance-none cursor-pointer accent-primary"
                                        />
                                    </div>

                                    {/* SUBTITLE */}
                                    <div className="space-y-2">
                                        <Label className="text-xs text-muted-foreground">Subtitle</Label>
                                        <Input
                                            value={hydrodynamicConfig.subtitle || ''}
                                            onChange={(e) => updateHydrodynamic('subtitle', e.target.value)}
                                            className="h-8 text-xs bg-background/50 border-border/50"
                                            placeholder="Enter subtitle text..."
                                        />
                                    </div>

                                    {/* SUBTITLE SIZE & COLOR */}
                                    <div className="space-y-2">
                                        <div className="flex justify-between items-center">
                                            <Label className="text-xs text-muted-foreground">Subtitle Size (px)</Label>
                                            <div className="flex items-center gap-2">
                                                <div className="relative flex items-center gap-1 group">
                                                    <input
                                                        type="color"
                                                        value={hydrodynamicConfig.subtitleColor || '#9CA3AF'}
                                                        onChange={(e) => updateHydrodynamic('subtitleColor', e.target.value)}
                                                        className="w-4 h-4 rounded-sm border-none cursor-pointer bg-transparent p-0"
                                                        title="Subtitle Color"
                                                    />
                                                    <button
                                                        onClick={() => updateHydrodynamic('subtitleColor', '#9CA3AF')}
                                                        disabled={!hydrodynamicConfig.subtitleColor || hydrodynamicConfig.subtitleColor === '#9CA3AF'}
                                                        className={`hover:text-foreground ${(!hydrodynamicConfig.subtitleColor || hydrodynamicConfig.subtitleColor === '#9CA3AF') ? 'text-muted-foreground/30 cursor-not-allowed' : 'text-muted-foreground'}`}
                                                        title="Reset to Default"
                                                    >
                                                        <X className="w-3 h-3" />
                                                    </button>
                                                </div>
                                                <span className="text-xs font-mono text-primary">{hydrodynamicConfig.subtitleFontSize || 24}px</span>
                                            </div>
                                        </div>
                                        <input
                                            type="range"
                                            min="14" max="60"
                                            value={hydrodynamicConfig.subtitleFontSize || 24}
                                            onChange={(e) => updateHydrodynamic('subtitleFontSize', parseInt(e.target.value))}
                                            className="w-full h-1 bg-secondary rounded-lg appearance-none cursor-pointer accent-primary"
                                        />
                                    </div>
                                </div>

                                {/* LETTER SPACING */}
                                <div className="space-y-2">
                                    <div className="flex justify-between items-center">
                                        <Label className="text-xs text-muted-foreground">Letter Spacing (em)</Label>
                                        <span className="text-xs font-mono text-primary">{hydrodynamicConfig.letterSpacing}em</span>
                                    </div>
                                    <input
                                        type="range"
                                        min="-0.1" max="0.5" step="0.01"
                                        value={hydrodynamicConfig.letterSpacing}
                                        onChange={(e) => updateHydrodynamic('letterSpacing', parseFloat(e.target.value))}
                                        className="w-full h-1 bg-secondary rounded-lg appearance-none cursor-pointer accent-primary"
                                    />
                                </div>


                            </div>
                        </div>
                    )}
                </div>
            </ScrollArea>
            <div className="pt-4 border-t border-border/50">
                <p className="text-xs text-muted-foreground">
                    Changes update the preview in real-time
                </p>
            </div>
        </div>
    );
};
