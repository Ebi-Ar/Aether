'use client';

import { Suspense, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { Canvas } from "@/components/editor/canvas";
import { computeCanvasHeight, EditorDocument, parseEditorDocument } from '@/lib/editor/document';
import LZString from 'lz-string';

function decodeShareData(data: string): EditorDocument | null {
    try {
        // Decode: LZString -> JSON String -> validated document
        const jsonString = LZString.decompressFromEncodedURIComponent(data);
        if (!jsonString) return null;
        return parseEditorDocument(JSON.parse(jsonString));
    } catch (e) {
        console.error("Failed to parse shared data", e);
        return null;
    }
}

// Separate component to use useSearchParams
function ViewCanvas() {
    const searchParams = useSearchParams();
    const data = searchParams.get('data');
    const doc = useMemo(() => (data ? decodeShareData(data) : null), [data]);

    if (!doc) {
        return (
            <div className="w-full h-screen flex items-center justify-center bg-[#121212] text-white">
                <div className="text-center">
                    <h1 className="text-2xl font-bold mb-2">Oops!</h1>
                    <p className="text-gray-400">{data ? 'Invalid share link.' : 'This link has no page to show.'}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="w-full h-screen bg-[#121212] overflow-hidden">
            <Canvas
                elements={doc.elements}
                height={computeCanvasHeight(doc.elements)}
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
