import React from 'react';
import { Button } from '@/components/ui/button';
import {
    MousePointer2,
    Type,
    Layout,
    Image as ImageIcon,
    Sparkles,
    Play,
    ChevronLeft,
    Monitor,
    Share2,
    Undo2,
    Redo2
} from 'lucide-react';
import Link from 'next/link';


interface TopBarProps {
    isPreview?: boolean;
    onPreviewToggle?: () => void;
    onShare?: () => void;
    onPublish?: () => void;
    onUndo?: () => void;
    onRedo?: () => void;
    canUndo?: boolean;
    canRedo?: boolean;
    onEffectsClick?: () => void;
    isEffectsActive?: boolean;
}

export function TopBar({ isPreview, onPreviewToggle, onShare, onPublish, onUndo, onRedo, canUndo, canRedo, onEffectsClick, isEffectsActive }: TopBarProps) {
    return (
        <div className="h-full w-full flex items-center justify-between px-4 bg-background/80 backdrop-blur-md">
            {/* Left: Navigation */}
            <div className="ui-cluster-lg">
                <Link href="/">
                    <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
                        <ChevronLeft className="w-5 h-5" />
                    </Button>
                </Link>
                <div className="flex flex-col">
                    <span className="text-sm font-medium">Untitled Page</span>
                    <span className="text-xs text-muted-foreground">Draft</span>
                </div>
            </div>

            {/* Center: Tools */}
            {!isPreview && (
                <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
                    <div className="ui-cluster-xs bg-muted/30 p-1 rounded-lg border border-border/40">
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground" onClick={onUndo} disabled={!canUndo}>
                            <Undo2 className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground" onClick={onRedo} disabled={!canRedo}>
                            <Redo2 className="w-4 h-4" />
                        </Button>

                        <div className="w-px h-4 bg-border/40 mx-1" />

                        <Button variant="secondary" size="icon" className="h-8 w-8 bg-primary/10 text-primary">
                            <MousePointer2 className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                            <Layout className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                            <Type className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                            <ImageIcon className="w-4 h-4" />
                        </Button>
                        <Button
                            variant={isEffectsActive ? "secondary" : "ghost"}
                            size="icon"
                            className={`h-8 w-8 ${isEffectsActive ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:text-foreground'}`}
                            onClick={onEffectsClick}
                        >
                            <Sparkles className="w-4 h-4" />
                        </Button>
                    </div>
                </div>
            )}

            {/* Right: Actions */}
            <div className="ui-button-row relative z-50">
                <div className="ui-cluster-sm mr-4 text-xs text-muted-foreground">
                    <Monitor className="w-3 h-3" />
                    <span>100%</span>
                </div>
                <Button
                    size="sm"
                    className={`h-8 gap-2 ${isPreview ? 'bg-secondary text-secondary-foreground hover:bg-secondary/80' : 'bg-blue-600 hover:bg-blue-500 text-white'}`}
                    onClick={onPreviewToggle}
                >
                    {isPreview ? (
                        <>
                            <span className="w-3 h-3 flex items-center justify-center font-bold">✕</span>
                            Exit
                        </>
                    ) : (
                        <>
                            <Play className="w-3 h-3 fill-current" />
                            Preview
                        </>
                    )}
                </Button>
                {!isPreview && (
                    <>
                        <Button size="sm" variant="outline" className="h-8 gap-2 bg-transparent" onClick={() => {
                            console.log("TopBar: Share button clicked");
                            if (onShare) onShare();
                            else console.error("TopBar: onShare prop is missing");
                        }}>
                            <Share2 className="w-3 h-3" />
                            Share
                        </Button>
                        <Button
                            size="sm"
                            className="h-8 px-4 bg-white text-black hover:bg-gray-200 text-xs font-semibold tracking-wide border border-transparent"
                            onClick={onPublish}
                        >
                            PUBLISH
                        </Button>
                    </>
                )}
            </div>
        </div>
    );
}
