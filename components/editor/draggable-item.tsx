import React from 'react';
import { useDraggable } from '@dnd-kit/core';
import { Plus } from 'lucide-react';

interface DraggableItemProps {
    id: string;
    label: string;
    type: 'behavior' | 'content';
    data?: any;
    icon?: React.ReactNode;
    onClick?: () => void;
    onQuickAdd?: () => void;
}

export function DraggableItem({ id, label, type, data, icon, onClick, onQuickAdd }: DraggableItemProps) {
    const { attributes, listeners, setNodeRef, transform } = useDraggable({
        id: id,
        data: {
            type: type,
            id: id,
            ...data
        }
    });

    const style = transform ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
    } : undefined;

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...listeners}
            {...attributes}
            onClick={onClick}
            className="group relative flex items-center gap-2 p-2 rounded-md hover:bg-muted/40 cursor-grab active:cursor-grabbing border border-transparent hover:border-border/40 transition-colors pr-9"
        >
            <div className="w-8 h-8 rounded bg-muted/20 flex items-center justify-center text-muted-foreground/80">
                {icon}
            </div>
            <div className="flex flex-col">
                <span className="text-xs font-medium">{label}</span>
                <span className="text-[10px] text-muted-foreground">Click or drag to add</span>
            </div>

            {onQuickAdd && (
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        onQuickAdd();
                    }}
                    className="absolute right-2 top-1/2 -translate-y-1/2 w-6 h-6 flex items-center justify-center rounded-sm hover:bg-blue-100 hover:text-blue-600 opacity-0 group-hover:opacity-100 transition-all pointer-events-auto cursor-pointer"
                    title="Add to bottom"
                    onPointerDown={(e) => e.stopPropagation()} // Prevent drag start
                >
                    <Plus className="w-4 h-4" />
                </button>
            )}
        </div>
    );
}
