import React from 'react';

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
