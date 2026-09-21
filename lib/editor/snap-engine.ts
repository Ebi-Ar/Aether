import { EditorElement } from './store';

export type SnapTargetKind = 'edge' | 'center' | 'spacing' | 'grid';

export type SnapTarget = {
    axis: 'x' | 'y';
    position: number;
    kind: SnapTargetKind;
    priority: number;
    sourceElementId?: string;
    sourceElementRect?: { top: number, left: number, width: number, height: number };
};

const PRIORITY_MAP: Record<SnapTargetKind, number> = {
    edge: 1,
    center: 2,
    spacing: 3,
    grid: 4
};

function getCanvasScale(): number {
    if (typeof window === 'undefined') return 1;
    const win = window as Window & { _canvasScale?: number };
    return win._canvasScale || 1;
}

// Elastic pull function
function easeOutQuad(t: number): number {
    return t * (2 - t);
}

export function calculateMagneticPull(rawPos: number, snapPos: number, magneticThreshold: number, hardSnapThreshold: number = 3): number {
    const distance = Math.abs(rawPos - snapPos);

    if (distance > magneticThreshold) return rawPos;
    if (distance <= hardSnapThreshold) return snapPos; // Hard lock when very close

    // Calculate elasticity for the middle zone
    const strength = 1 - (distance / magneticThreshold);
    const easedStrength = easeOutQuad(strength);

    return rawPos + (snapPos - rawPos) * easedStrength;
}

export class SnapEngine {
    private targets: SnapTarget[] = [];
    private canvasWidth: number = 900;
    private canvasHeight: number = 800; // Will be dynamic, but need a baseline
    private gridSize: number = 8; // or 20, as per previous

    constructor(private detectionThreshold: number = 24, private magneticThreshold: number = 16) { }

    public initialize(elements: EditorElement[], activeId: string, canvasW: number, canvasH: number, gridSpacing: number = 20) {
        this.targets = [];
        this.canvasWidth = canvasW;
        this.canvasHeight = canvasH;
        this.gridSize = gridSpacing;

        // 1. Generate Canvas Targets
        this.targets.push({ axis: 'x', position: 0, kind: 'edge', priority: PRIORITY_MAP.edge, sourceElementId: 'canvas' });
        this.targets.push({ axis: 'x', position: this.canvasWidth / 2, kind: 'center', priority: PRIORITY_MAP.center, sourceElementId: 'canvas' });
        this.targets.push({ axis: 'x', position: this.canvasWidth, kind: 'edge', priority: PRIORITY_MAP.edge, sourceElementId: 'canvas' });
        this.targets.push({ axis: 'y', position: 0, kind: 'edge', priority: PRIORITY_MAP.edge, sourceElementId: 'canvas' });
        this.targets.push({ axis: 'y', position: this.canvasHeight / 2, kind: 'center', priority: PRIORITY_MAP.center, sourceElementId: 'canvas' });
        this.targets.push({ axis: 'y', position: this.canvasHeight, kind: 'edge', priority: PRIORITY_MAP.edge, sourceElementId: 'canvas' });

        // 2. Generate Sibling Targets
        elements.forEach(el => {
            if (el.id === activeId) return;

            // Attempt to get accurate dimensions from the DOM first
            const noderef = document.getElementById(el.id);
            let w = 100;
            let h = 100;

            if (noderef) {
                const rect = noderef.getBoundingClientRect();
                const canvasScale = getCanvasScale();
                w = rect.width / canvasScale;
                h = rect.height / canvasScale;
            } else {
                const wStr = el.style.width?.toString();
                if (wStr && wStr.endsWith('px')) w = parseInt(wStr);
                else if (wStr === '100%') w = this.canvasWidth;

                const hStr = el.style.height?.toString();
                if (hStr && hStr.endsWith('px')) h = parseInt(hStr);
            }

            const top = parseInt(el.style.top?.toString() || '0');
            const left = parseInt(el.style.left?.toString() || '0');

            const right = left + w;
            const bottom = top + h;
            const centerX = left + w / 2;
            const centerY = top + h / 2;

            const rect = { top, left, width: w, height: h };

            // X-Axis Edges
            this.targets.push({ axis: 'x', position: left, kind: 'edge', priority: PRIORITY_MAP.edge, sourceElementId: el.id, sourceElementRect: rect });
            this.targets.push({ axis: 'x', position: right, kind: 'edge', priority: PRIORITY_MAP.edge, sourceElementId: el.id, sourceElementRect: rect });
            this.targets.push({ axis: 'x', position: centerX, kind: 'center', priority: PRIORITY_MAP.center, sourceElementId: el.id, sourceElementRect: rect });

            // Y-Axis Edges
            this.targets.push({ axis: 'y', position: top, kind: 'edge', priority: PRIORITY_MAP.edge, sourceElementId: el.id, sourceElementRect: rect });
            this.targets.push({ axis: 'y', position: bottom, kind: 'edge', priority: PRIORITY_MAP.edge, sourceElementId: el.id, sourceElementRect: rect });
            this.targets.push({ axis: 'y', position: centerY, kind: 'center', priority: PRIORITY_MAP.center, sourceElementId: el.id, sourceElementRect: rect });
        });

        // Optimization: Sort targets for faster threshold checks or deduplicate if needed.
    }

    public findBestSnap(
        axis: 'x' | 'y',
        rawPositions: number[],
        options?: { allowGrid?: boolean; gridThreshold?: number }
    ): { target: SnapTarget | null, adjustedPos: number } {
        // rawPositions could be [left, centerX, right] for X axis.
        // We check all relevant points of the dragged element against the targets.

        // For simplicity in step 1, assume we pass [rawLeft, rawCenterX, rawRight]
        let bestTarget: SnapTarget | null = null;
        let smallestDistance = Infinity;
        let correspondingRawPos = 0; // The specific point on the active element that snapped

        for (const target of this.targets) {
            if (target.axis !== axis) continue;

            for (const rawP of rawPositions) {
                const distance = Math.abs(rawP - target.position);
                if (distance <= this.detectionThreshold) {
                    if (
                        !bestTarget ||
                        distance < smallestDistance ||
                        (distance === smallestDistance && target.priority < bestTarget.priority)
                    ) {
                        bestTarget = target;
                        smallestDistance = distance;
                        correspondingRawPos = rawP;
                    }
                }
            }
        }

        if (bestTarget) {
            const pulledPos = calculateMagneticPull(correspondingRawPos, bestTarget.position, this.magneticThreshold);
            const offsetNeeded = pulledPos - correspondingRawPos;

            return {
                target: bestTarget,
                adjustedPos: rawPositions[0] + offsetNeeded
            };
        }

        // 3. Fallback to Grid Snap
        const allowGrid = options?.allowGrid ?? true;
        if (!allowGrid) {
            return { target: null, adjustedPos: rawPositions[0] };
        }

        const primaryPos = rawPositions[0]; // Usually 'left' or 'top'
        const gridSnapPos = Math.round(primaryPos / this.gridSize) * this.gridSize;
        const gridDist = Math.abs(primaryPos - gridSnapPos);
        const gridThreshold = options?.gridThreshold ?? Math.min(this.detectionThreshold, 8);

        if (gridDist <= gridThreshold) {
            const pulledGridPos = calculateMagneticPull(primaryPos, gridSnapPos, this.magneticThreshold);
            return {
                target: { axis, position: gridSnapPos, kind: 'grid', priority: PRIORITY_MAP.grid, sourceElementId: 'grid' },
                adjustedPos: pulledGridPos
            }
        }

        return { target: null, adjustedPos: rawPositions[0] };
    }
}

// Global High-Performance Snap Engine Instance
export const globalSnapEngine = new SnapEngine();

// Simple Subscribe/Publish for active guides (bypasses full React tree render)
export type ActiveGuides = {
    x: { target: SnapTarget; distance?: number; distancePos?: number } | null;
    y: { target: SnapTarget; distance?: number; distancePos?: number } | null;
    spacing: Array<{
        axis: 'x' | 'y';
        start: number;
        end: number;
        position: number;
        value: number;
        elementIds?: string[];
    }>;
};

let activeGuides: ActiveGuides = { x: null, y: null, spacing: [] };
const guideSubscribers: Set<() => void> = new Set();

export const snapState = {
    get: () => activeGuides,
    set: (newGuides: ActiveGuides) => {
        // Only notify if there's a reference change or deep equality change (simple version here)
        if (activeGuides.x?.target.position !== newGuides.x?.target.position ||
            activeGuides.y?.target.position !== newGuides.y?.target.position ||
            activeGuides.x?.distance !== newGuides.x?.distance ||
            activeGuides.y?.distance !== newGuides.y?.distance ||
            activeGuides.spacing.length !== newGuides.spacing.length ||
            activeGuides.spacing.some((guide, i) => {
                const next = newGuides.spacing[i];
                return !next ||
                    guide.axis !== next.axis ||
                    guide.start !== next.start ||
                    guide.end !== next.end ||
                    guide.position !== next.position ||
                    guide.value !== next.value ||
                    (guide.elementIds?.join(',') || '') !== (next.elementIds?.join(',') || '');
            })) {

            activeGuides = newGuides;
            // Defer the state updates to avoid React's "Cannot update a component while rendering a different component" error.
            queueMicrotask(() => {
                guideSubscribers.forEach(sub => sub());
            });
        }
    },
    subscribe: (callback: () => void) => {
        guideSubscribers.add(callback);
        return () => guideSubscribers.delete(callback);
    }
};
