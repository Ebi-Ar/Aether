import React from 'react';
import Link from 'next/link';
import { Monitor } from 'lucide-react';

interface EditorLayoutProps {
    children: React.ReactNode;
    topBar: React.ReactNode;
    leftSidebar: React.ReactNode;
    rightSidebar: React.ReactNode;
}


export function EditorLayout({
    children,
    topBar,
    leftSidebar,
    rightSidebar,
}: EditorLayoutProps) {
    return (
        <div className="flex flex-col h-screen w-screen bg-background text-foreground overflow-hidden">
            {/* The two sidebars leave no room for the canvas below 1024px wide */}
            <div className="fixed inset-0 z-[200] flex lg:hidden flex-col items-center justify-center gap-4 bg-background px-8 text-center">
                <Monitor className="w-8 h-8 text-muted-foreground" />
                <h1 className="text-lg font-semibold">The editor needs a bigger screen</h1>
                <p className="max-w-xs text-sm text-muted-foreground">
                    Open Aether on a laptop or desktop, at least 1024px wide, to build pages.
                </p>
                <Link href="/" className="text-sm font-medium underline underline-offset-4">
                    Back to home
                </Link>
            </div>

            {/* Top Bar Area */}
            <div className="flex-none h-12 border-b border-border z-50">
                {topBar}
            </div>

            {/* Main Content Area */}
            <div className="flex-1 flex overflow-hidden">
                {/* Left Sidebar */}
                {leftSidebar && (
                    <div className="flex-none w-64 h-full min-h-0 overflow-hidden border-r border-border bg-card/50 backdrop-blur-sm z-40">
                        {leftSidebar}
                    </div>
                )}

                {/* Canvas Area */}
                <div className="flex-1 relative bg-neutral-900/50 overflow-hidden">
                    {children}
                </div>

                {/* Right Sidebar */}
                {rightSidebar && (
                    <div className="flex-none w-72 h-full min-h-0 overflow-hidden border-l border-border bg-card/50 backdrop-blur-sm z-40">
                        {rightSidebar}
                    </div>
                )}
            </div>
        </div>
    );
}
