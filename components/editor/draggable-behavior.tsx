import React from 'react';
import { useDraggable } from '@dnd-kit/core';
import { Sparkles } from 'lucide-react';

interface DraggableBehaviorItemProps {
    id: string;
    label: string;
}

export function DraggableBehaviorItem({ id, label }: DraggableBehaviorItemProps) {
    const { attributes, listeners, setNodeRef, transform } = useDraggable({
        id: id,
        data: {
            type: 'behavior',
            behaviorId: id
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
            className="flex items-center gap-2 p-2 rounded-md hover:bg-muted/40 cursor-grab active:cursor-grabbing border border-transparent hover:border-border/40 transition-colors"
        >
            <div className="w-8 h-8 rounded bg-blue-500/10 flex items-center justify-center text-blue-400">
                <Sparkles className="w-4 h-4" />
            </div>
            <div className="flex flex-col">
                <span className="text-xs font-medium">{label}</span>
                <span className="text-[10px] text-muted-foreground">Drag to apply</span>
            </div>
        </div>
    );
}
