import { DraggableItem } from './draggable-item';
import { DraggableBehaviorItem } from './draggable-behavior';
import { useState } from 'react';
import {
    LayoutTemplate, Plus, Home, Type, Image as ImageIcon, Box, Square, CreditCard, PlayCircle,
    Lock, Eye, MessageSquare, DollarSign, List, PanelBottom, PanelTop
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import {
    DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator,
    DropdownMenuSub, DropdownMenuSubContent, DropdownMenuSubTrigger, DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { EditorElement } from '@/lib/editor/store';

interface LeftSidebarProps {
    elements: EditorElement[];
    onSelect?: (id: string | null) => void;
    selectedId?: string | null;
    pages: { id: string; name: string }[];
    onAddPage: () => void;
    onAddText: () => void;
    onAddImage: () => void;
    activePageId: string;
    onSelectPage: (id: string) => void;
    onAddSection: (subtype: string) => void;
    onAddElement: (subtype: string) => void;
    activeTab?: 'design' | 'elements' | 'layers' | 'behaviors';
    onTabChange?: (tab: 'design' | 'elements' | 'layers' | 'behaviors') => void;
}

export function LeftSidebar({
    elements = [],
    onSelect,
    selectedId,
    pages = [{ id: 'home', name: 'Home' }], // Default
    onAddPage,
    onAddText,
    onAddImage,
    activePageId = 'home',
    onSelectPage,
    onAddSection,
    onAddElement,
    activeTab,
    onTabChange
}: LeftSidebarProps) {
    const sectionItems = ['navbar', 'hero', 'features', 'testimonials', 'pricing', 'faq', 'footer'];
    const [localTab, setLocalTab] = useState<'design' | 'elements' | 'layers' | 'behaviors'>('design');
    const tabValue = activeTab ?? localTab;
    const handleTabChange = (tab: string) => {
        const next = (tab as 'design' | 'elements' | 'layers' | 'behaviors');
        setLocalTab(next);
        onTabChange?.(next);
    };

    return (
        <Tabs value={tabValue} onValueChange={handleTabChange} className="h-full min-h-0 flex flex-col gap-0">
            {/* ... Tabs List ... */}
            <div className="p-3 border-b border-border">
                <TabsList className="w-full grid grid-cols-3 gap-1 p-1">
                    <TabsTrigger value="design" className="min-w-0 px-1 py-1 text-[11px] leading-tight truncate">
                        Sections
                    </TabsTrigger>
                    <TabsTrigger value="elements" className="min-w-0 px-1 py-1 text-[11px] leading-tight truncate">
                        Elements
                    </TabsTrigger>
                    <TabsTrigger value="layers" className="min-w-0 px-1 py-1 text-[11px] leading-tight truncate">
                        Structure
                    </TabsTrigger>
                </TabsList>
            </div>

            {/* ... Search ... */}

            <ScrollArea className="flex-1 min-h-0">
                <TabsContent value="design" className="px-2 py-0 flex flex-col m-0">
                    <div className="mx-1 mt-2 mb-2 rounded-md border border-border/40 bg-muted/20 px-2 py-1.5 text-[10px] text-muted-foreground">
                        Click to add quickly. Drag to place precisely on canvas.
                    </div>
                    <Accordion type="multiple" defaultValue={["sections"]} className="w-full">
                        <AccordionItem value="sections" className="border-b border-border/40">
                            <AccordionTrigger className="py-2 hover:no-underline text-xs uppercase tracking-wider text-muted-foreground font-semibold">
                                <div className="flex items-center gap-2">
                                    <LayoutTemplate className="w-3 h-3" />
                                    Sections
                                    <span className="text-[9px] rounded-sm border border-border/50 px-1 py-0 text-muted-foreground">{sectionItems.length}</span>
                                </div>
                            </AccordionTrigger>
                            <AccordionContent className="flex flex-col gap-2 pb-3">
                                {sectionItems.map(subtype => (
                                    <DraggableItem
                                        key={subtype}
                                        id={`section-${subtype}`}
                                        label={subtype.charAt(0).toUpperCase() + subtype.slice(1).replace('-', ' ')}
                                        type="content"
                                        data={{ subtype }}
                                        icon={
                                            subtype === 'navbar' ? <PanelTop className="w-4 h-4" /> :
                                                subtype === 'hero' ? <Box className="w-4 h-4" /> :
                                                    subtype === 'features' ? <LayoutTemplate className="w-4 h-4" /> :
                                                        subtype === 'testimonials' ? <MessageSquare className="w-4 h-4" /> :
                                                            subtype === 'pricing' ? <DollarSign className="w-4 h-4" /> :
                                                                subtype === 'faq' ? <List className="w-4 h-4" /> :
                                                                    <PanelBottom className="w-4 h-4" />
                                        }
                                        onClick={() => {
                                            onAddSection(subtype);
                                        }}
                                        onQuickAdd={() => onAddSection(subtype)}
                                    />
                                ))}
                            </AccordionContent>
                        </AccordionItem>
                    </Accordion>
                </TabsContent>

                <TabsContent value="elements" className="px-2 py-0 flex flex-col m-0">
                    <div className="mx-1 mt-2 mb-2 rounded-md border border-border/40 bg-muted/20 px-2 py-1.5 text-[10px] text-muted-foreground">
                        Drag to place or click to add elements.
                    </div>
                    <Accordion type="multiple" defaultValue={["elements"]} className="w-full">
                        <AccordionItem value="elements" className="border-b border-border/40">
                            <AccordionTrigger className="py-2 hover:no-underline text-xs uppercase tracking-wider text-muted-foreground font-semibold">
                                <div className="flex items-center gap-2">
                                    <Square className="w-3 h-3" />
                                    Elements
                                    <span className="text-[9px] rounded-sm border border-border/50 px-1 py-0 text-muted-foreground">6</span>
                                </div>
                            </AccordionTrigger>
                            <AccordionContent className="flex flex-col gap-2 pb-3">
                                <DraggableItem id="el-text" label="Text Block" type="content" data={{ subtype: 'text' }} icon={<Type className="w-4 h-4" />} onClick={() => onAddElement('text')} />
                                <DraggableItem id="el-image" label="Image / Placeholder" type="content" data={{ subtype: 'image' }} icon={<ImageIcon className="w-4 h-4" />} onClick={() => onAddElement('image')} />
                                <DraggableItem id="el-box" label="Container Box" type="content" data={{ subtype: 'box' }} icon={<Box className="w-4 h-4" />} onClick={() => onAddElement('box')} />
                                <DraggableItem id="el-button" label="Button" type="content" data={{ subtype: 'button' }} icon={<Square className="w-4 h-4" />} onClick={() => onAddElement('button')} />
                                <DraggableItem id="el-card" label="Card" type="content" data={{ subtype: 'card' }} icon={<CreditCard className="w-4 h-4" />} onClick={() => onAddElement('card')} />
                                <DraggableItem id="el-video" label="Video" type="content" data={{ subtype: 'video' }} icon={<PlayCircle className="w-4 h-4" />} onClick={() => onAddElement('video')} />
                            </AccordionContent>
                        </AccordionItem>
                    </Accordion>
                </TabsContent>

                <TabsContent value="layers" className="px-2 py-2 flex flex-col gap-1 m-0">
                    <div className="mx-1 mt-1 mb-2 rounded-md border border-border/40 bg-muted/20 px-2 py-1.5 text-[10px] text-muted-foreground">
                        Select pages and layers here. Active selection is highlighted.
                    </div>
                    {/* ... (keep existing layers content) ... */}
                    {/* Pages Header */}
                    <div className="flex items-center justify-between px-2 py-1 mt-2 mb-1">
                        <span className="text-xs font-semibold text-foreground/70">Pages ({pages.length})</span>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <button
                                    className="text-muted-foreground hover:text-foreground hover:bg-white/10 p-0.5 rounded transition-colors"
                                >
                                    <Plus className="w-4 h-4" />
                                </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="start" className="w-[180px]">
                                <DropdownMenuItem onClick={onAddPage}>
                                    New Page
                                </DropdownMenuItem>
                                <DropdownMenuSub>
                                    <DropdownMenuSubTrigger>New CMS Page</DropdownMenuSubTrigger>
                                    <DropdownMenuSubContent>
                                        <DropdownMenuItem disabled>Blog Post</DropdownMenuItem>
                                        <DropdownMenuItem disabled>Case Study</DropdownMenuItem>
                                    </DropdownMenuSubContent>
                                </DropdownMenuSub>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={onAddText}>
                                    Add Text
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={onAddImage}>
                                    Add Image
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>

                    {/* Dynamic Layer Tree */}
                    <div className="flex flex-col gap-1">
                        <div className="px-2 pb-1 text-[10px] uppercase tracking-wider text-muted-foreground">Page Tree</div>
                        {/* Dynamic Pages */}
                        {pages.map(page => (
                            <LayerItem
                                key={page.id}
                                label={page.name}
                                isExpanded={page.id === activePageId}
                                active={page.id === activePageId}
                                icon={<Home className="w-3 h-3" />}
                                onClick={() => onSelectPage?.(page.id)}
                            />
                        ))}

                        <div className="px-2 pt-2 pb-1 text-[10px] uppercase tracking-wider text-muted-foreground">Elements ({elements.length})</div>
                        <div className="pl-4 flex flex-col gap-1 border-l border-border/30 ml-2">
                            {elements.map((el) => (
                                <LayerItem
                                    key={el.id}
                                    label={el.name}
                                    type={el.type}
                                    active={selectedId === el.id}
                                    onClick={() => onSelect?.(el.id)}
                                />
                            ))}
                        </div>

                        {elements.length === 0 && (
                            <div className="text-xs text-muted-foreground p-2 text-center">
                                No layers
                            </div>
                        )}
                    </div>
                </TabsContent>

                <TabsContent value="behaviors" className="px-2 py-0 flex flex-col m-0">
                    <div className="mx-1 mt-2 mb-2 rounded-md border border-border/40 bg-muted/20 px-2 py-1.5 text-[10px] text-muted-foreground">
                        Drag an effect onto an element to apply it.
                    </div>
                    <Accordion type="multiple" defaultValue={["text", "image", "page"]} className="w-full">

                        <AccordionItem value="text" className="border-b border-border/40">
                            <AccordionTrigger className="py-2 hover:no-underline text-xs uppercase tracking-wider text-muted-foreground font-semibold">
                                <div className="flex items-center gap-2">
                                    <Type className="w-3 h-3" />
                                    Text
                                </div>
                            </AccordionTrigger>
                            <AccordionContent className="flex flex-col gap-2 pb-3">
                                {/* Use generic DraggableItem instead of DraggableBehaviorItem for consistency if desired, or keep legacy */}
                                <DraggableBehaviorItem id="hydrodynamic" label="Hydrodynamic Text" />
                            </AccordionContent>
                        </AccordionItem>

                        <AccordionItem value="image" className="border-b border-border/40">
                            <AccordionTrigger className="py-2 hover:no-underline text-xs uppercase tracking-wider text-muted-foreground font-semibold">
                                <div className="flex items-center gap-2">
                                    <ImageIcon className="w-3 h-3" />
                                    Image
                                </div>
                            </AccordionTrigger>
                            <AccordionContent className="flex flex-col gap-2 pb-3">
                                <DraggableBehaviorItem id="apple-zoom" label="Apple Zoom (Scroll)" />
                                <DraggableBehaviorItem id="physics-card" label="Gravity Card" />
                            </AccordionContent>
                        </AccordionItem>

                        <AccordionItem value="page" className="border-b-0">
                            <AccordionTrigger className="py-2 hover:no-underline text-xs uppercase tracking-wider text-muted-foreground font-semibold">
                                <div className="flex items-center gap-2">
                                    <LayoutTemplate className="w-3 h-3" />
                                    Page
                                </div>
                            </AccordionTrigger>
                            <AccordionContent className="flex flex-col gap-2 pb-3">
                                <div className="text-[10px] text-muted-foreground px-2 italic">Dragging page behaviors coming soon...</div>
                            </AccordionContent>
                        </AccordionItem>

                    </Accordion>
                </TabsContent>
            </ScrollArea>
        </Tabs>
    );
}

// ... (Rest of component including LayerItem)

function LayerItem({ label, active, isExpanded, type = 'frame', onClick, icon }: { label: string, active?: boolean, isExpanded?: boolean, type?: 'frame' | 'text' | 'image' | 'box', onClick?: () => void, icon?: React.ReactNode }) {
    return (
        <div
            onClick={onClick}
            className={`
            group flex items-center justify-between px-2 py-1.5 rounded-sm text-xs cursor-pointer select-none border transition-colors
            ${active ? 'bg-blue-500/20 text-blue-700 border-blue-500 shadow-sm font-medium' : 'border-transparent hover:bg-muted/40 text-muted-foreground hover:text-foreground'}
        `}>
            <div className="flex items-center gap-2">
                <span className={`w-3 h-3 flex items-center justify-center text-[10px] ${!isExpanded && !active ? 'opacity-0' : ''} ${isExpanded ? 'rotate-0' : '-rotate-90 origin-center transition-transform'}`}>
                    {isExpanded ? '▼' : '▶'}
                </span>
                {/* Better chevron later */}

                <span className="opacity-70">
                    {icon ? icon : (type === 'text' ? <Type className="w-3 h-3" /> : type === 'image' ? <ImageIcon className="w-3 h-3" /> : <LayoutTemplate className="w-3 h-3" />)}
                </span>
                <span>{label}</span>
            </div>
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100">
                <Lock className="w-3 h-3 text-muted-foreground/50 hover:text-foreground" />
                <Eye className="w-3 h-3 text-muted-foreground/50 hover:text-foreground" />
            </div>
        </div>
    )
}
