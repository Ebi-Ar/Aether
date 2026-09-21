'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Canvas } from "@/components/editor/canvas";
import { EditorElement } from '@/lib/editor/store';
import LZString from 'lz-string';

// Separate component to use useSearchParams
function ViewCanvas() {
    const searchParams = useSearchParams();
    const data = searchParams.get('data');

    const [elements, setElements] = useState<EditorElement[]>([]);
    const [canvasHeight, setCanvasHeight] = useState(800);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (data) {
            try {
                // Decode: LZString -> JSON String -> Object
                const jsonString = LZString.decompressFromEncodedURIComponent(data);
                if (!jsonString) throw new Error("Decompression failed");
                const state = JSON.parse(jsonString);

                if (state.elements) {
                    setElements(state.elements);
                }
                if (state.canvasHeight) {
                    setCanvasHeight(state.canvasHeight);
                }
            } catch (e) {
                console.error("Failed to parse shared data", e);
                setError("Invalid share link.");
            }
        }
    }, [data]);

    if (error) {
        return (
            <div className="w-full h-screen flex items-center justify-center bg-[#121212] text-white">
                <div className="text-center">
                    <h1 className="text-2xl font-bold mb-2">Oops!</h1>
                    <p className="text-gray-400">{error}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="w-full h-screen bg-[#121212] overflow-hidden">
            <Canvas
                elements={elements}
                height={canvasHeight}
                readOnly={true} // Important: Disable interactions
            />
        </div>
    );
}

export default function ViewPage() {
    return (
        <Suspense fallback={<div className="w-full h-screen bg-[#121212] text-white flex items-center justify-center">Loading...</div>}>
            <ViewCanvas />
        </Suspense>
    );
}
