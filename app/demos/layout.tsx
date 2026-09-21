import { ReactNode } from 'react';

export default function DemosLayout({
    children,
}: {
    children: ReactNode;
}) {
    return (
        <div className="absolute inset-0 overflow-y-auto">
            {children}
        </div>
    );
}
