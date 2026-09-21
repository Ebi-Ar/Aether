'use client';

import { useState, useEffect } from 'react';
import { DndContext, DragEndEvent, DragOverlay, useSensor, useSensors, PointerSensor } from '@dnd-kit/core';
import { toast } from '@/hooks/use-toast';
import { EditorLayout } from "@/components/editor/editor-layout";
import { TopBar } from "@/components/editor/top-bar";
import { LeftSidebar } from "@/components/editor/left-sidebar";
import { RightSidebar } from "@/components/editor/right-sidebar";
import { Canvas } from "@/components/editor/canvas";
import { initialElements, EditorElement } from '@/lib/editor/store';
import { TEMPLATES } from '@/lib/templates';
import { saveSiteData } from '../actions';
import LZString from 'lz-string';

export default function EditorPage() {
    const [elements, setElements] = useState<EditorElement[]>(initialElements);
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [activeDragId, setActiveDragId] = useState<string | null>(null);
    const [pages, setPages] = useState([{ id: 'home', name: 'Home' }]);
    const [activePageId, setActivePageId] = useState('home');
    const [canvasHeight, setCanvasHeight] = useState(800);
    const [isPreview, setIsPreview] = useState(false);
    const [scale, setScale] = useState(1);
    const [showTemplatesModal, setShowTemplatesModal] = useState(false);

    // Auto-scale calculation
    useEffect(() => {
        // Run on mount and resize
        const handleResize = () => {
            // 900px is base width
            // Only auto-scale if we want "match preview" behavior
            // Preview logic was window.innerWidth / 900
            const newScale = Math.max(window.innerWidth / 900, 0.5); // Min scale 0.5
            setScale(newScale);
        };
        handleResize(); // Initial
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }); // Empty dependency array (mount only)? No, logic inside might need deps? standard hook.
    // Actually, usually useEffect.

    // Fixing TypeScript error: useState doesn't accept effect. using useEffect.
    // Re-writing the hook properly in the full replace.

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
            behavior: 'none',
            isLocked: true // Structural
        };

        // No label for the new page section
        setElements(prev => [...prev, newPageSection]);
        toast({ description: "New page section added below" });
    };

    const handleAddText = () => {
        const id = `text-${Date.now()}`;
        const newText: EditorElement = {
            id,
            type: 'text',
            name: 'New Text',
            content: 'Double click to edit',
            style: {
                position: 'absolute',
                top: `${window.scrollY + 100}px`, // Simple viewport relative placement
                left: '100px',
                fontSize: '16px',
                color: 'black',
                fontWeight: '500'
            },
            behavior: 'none'
        };
        setElements(prev => [...prev, newText]);
        toast({ description: "Added new text" });
    };

    const handleAddImage = () => {
        const id = `img-${Date.now()}`;
        const newImage: EditorElement = {
            id,
            type: 'image',
            name: 'New Image',
            content: '', // Placeholder
            style: {
                position: 'absolute',
                top: `${window.scrollY + 150}px`,
                left: '150px',
                width: '200px',
                height: '150px',
                backgroundColor: '#eee',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
            },
            behavior: 'none'
        };
        setElements(prev => [...prev, newImage]);
        toast({ description: "Added new image placeholder" });
    };

    const handleAddTemplate = (templateId: string) => {
        const template = TEMPLATES.find(t => t.id === templateId);
        if (!template) return;

        // Clone elements with new IDs to avoid conflicts
        const newElements = template.elements.map(el => ({
            ...el,
            id: `el-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            style: {
                ...el.style,
                top: `${parseInt(el.style.top?.toString() || '0') + canvasHeight}px` // Stack below current content
            }
        }));

        setElements(prev => [...prev, ...newElements]);
        setCanvasHeight(prev => prev + template.height); // Extend canvas
        setShowTemplatesModal(false);
        toast({ description: `Added ${template.name}` });
    };

    const handleDragStart = (event: any) => {
        setActiveDragId(event.active.id);
    };

    const handleDragEnd = (event: DragEndEvent) => {
        setActiveDragId(null);
        const { over, active } = event;

        if (active.data.current?.type === 'behavior' && over) {
            const behaviorId = active.data.current.behaviorId;
            const targetElementId = over.id;

            // Apply behavior to element
            setElements(prev => prev.map(el => {
                if (el.id === targetElementId) {
                    return { ...el, behavior: behaviorId };
                }
                return el;
            }));

            toast({ description: `Applied behavior to ${targetElementId}` });
        }
        else if (active.data.current?.type === 'element') {
            const elementId = active.data.current.elementId;
            const delta = event.delta;

            setElements(prev => prev.map(el => {
                if (el.id === elementId) {
                    const currentTop = parseInt(el.style.top?.toString() || '0');
                    const currentLeft = parseInt(el.style.left?.toString() || '0');

                    return {
                        ...el,
                        style: {
                            ...el.style,
                            // Divide delta by scale to account for zoom/scaling
                            top: `${currentTop + (delta.y / scale)}px`,
                            left: `${currentLeft + (delta.x / scale)}px`
                        }
                    };
                }
                return el;
            }));
        }
    };

    const handleUpdateElement = (id: string, updates: Partial<EditorElement>) => {
        setElements(prev => prev.map(el => {
            if (el.id === id) {
                return { ...el, ...updates };
            }
            return el;
        }));
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
            // Auto-publish via Server Action
            const result = await saveSiteData(fileContent);

            if (result.success) {
                toast({
                    title: "Published Successfully!",
                    description: "Your changes are now live. Refresh the main page."
                });
            } else {
                throw new Error(result.error);
            }
        } catch (err) {
            console.error("Failed to publish", err);
            // Fallback to clipboard
            await navigator.clipboard.writeText(fileContent);
            toast({
                title: "Auto-Publish Failed",
                description: "Code copied to clipboard. Please paste manually."
            });
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

    return (
        <DndContext id="editor-dnd-context" sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
            <EditorLayout
                topBar={
                    <TopBar
                        isPreview={isPreview}
                        onPreviewToggle={() => setIsPreview(!isPreview)}
                        onShare={handleShare}
                        onPublish={handlePublish}
                        onTemplatesClick={() => setShowTemplatesModal(true)}
                    />
                }
                leftSidebar={!isPreview ? <LeftSidebar
                    elements={elements}
                    onSelect={(id) => {
                        setSelectedId(id);
                        toast({ description: `Selected Layer: ${id}` });
                    }}
                    selectedId={selectedId}

                    // Pages props
                    pages={pages}
                    activePageId={activePageId}
                    onAddPage={handleAddPage}
                    onAddText={handleAddText}
                    onAddImage={handleAddImage}
                    onSelectPage={setActivePageId}
                /> : null}
                rightSidebar={!isPreview ? <RightSidebar
                    element={selectedElement}
                    onUpdate={(updates) => selectedId && handleUpdateElement(selectedId, updates)}
                /> : null}
            >
                <Canvas
                    elements={elements}
                    onSelect={(id) => {
                        setSelectedId(id);
                        toast({ description: `Selected Element: ${id}` });
                    }}
                    selectedId={selectedId}
                    height={canvasHeight}
                    readOnly={isPreview}
                    scale={scale} // Pass calculated scale
                />
            </EditorLayout>

            {/* DragOverlay needs scale? No, it's portal'd usually. But visual might need scaling. 
                Actually default DragOverlay is unscaled. We might need to wrap children in transform.
                Let's stick to base implementation first.
            */}
            <DragOverlay>
                {activeDragId ? (
                    (() => {
                        // Check if it's a Canvas Element
                        const canvasElement = elements.find(e => e.id === activeDragId);
                        if (canvasElement) {
                            // Match visual scale in overlay
                            const { top, left, right, bottom, position, transform, ...visualStyle } = canvasElement.style as any;

                            return (
                                <div
                                    style={{
                                        ...visualStyle,
                                        position: 'relative',
                                        top: 0,
                                        left: 0,
                                        cursor: 'grabbing',
                                        boxShadow: '0 10px 20px rgba(0,0,0,0.2)',
                                        zIndex: 999,
                                        transform: `scale(${scale})`, // Match canvas scale
                                        transformOrigin: 'top left'
                                    }}
                                    className="select-none"
                                >
                                    {canvasElement.content}
                                </div>
                            );
                        }
                        // Default to Sidebar Item style
                        return (
                            <div className="bg-blue-500 text-white px-3 py-1 rounded-full text-xs font-medium shadow-xl">
                                {activeDragId}
                            </div>
                        );
                    })()
                ) : null}
            </DragOverlay>

            {/* Templates Dialog */}
            {showTemplatesModal && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm">
                    <div className="bg-white p-6 rounded-lg shadow-xl w-[800px] h-[600px] flex flex-col">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-semibold">Choose a Template</h3>
                            <button onClick={() => setShowTemplatesModal(false)} className="text-gray-400 hover:text-gray-900">
                                ✕
                            </button>
                        </div>

                        <div className="grid grid-cols-2 gap-4 overflow-auto p-1">
                            {TEMPLATES.map(template => (
                                <div
                                    key={template.id}
                                    onClick={() => handleAddTemplate(template.id)}
                                    className="border rounded-lg p-4 cursor-pointer hover:border-blue-500 hover:shadow-md transition-all group"
                                >
                                    <div className="aspect-video bg-gray-100 rounded mb-3 flex items-center justify-center text-gray-400 group-hover:bg-blue-50 transition-colors">
                                        {/* Placeholder for real thumbnail */}
                                        <div className="text-4xl">📄</div>
                                    </div>
                                    <h4 className="font-semibold mb-1">{template.name}</h4>
                                    <p className="text-sm text-gray-500">{template.description}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
            {/* ... share dialog ... */}
            {showShareDialog && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm">
                    <div className="bg-white p-6 rounded-lg shadow-xl w-[400px]">
                        <h3 className="text-lg font-semibold mb-2">Share Link</h3>
                        <p className="text-sm text-gray-500 mb-4">Copy the link below to share your design.</p>

                        {shareUrl.includes('localhost') && (
                            <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md text-sm text-yellow-800 flex flex-col gap-1">
                                <span className="font-semibold">Local Environment Detected</span>
                                <span>This link will only work on this computer. To share with others, you must deploy your app (e.g. to Vercel).</span>
                            </div>
                        )}

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
