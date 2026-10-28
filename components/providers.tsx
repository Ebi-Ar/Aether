"use client"

import * as React from "react"
import { Toaster } from "@/components/ui/sonner"
import { TooltipProvider } from "@/components/ui/tooltip"

export function Providers({ children }: { children: React.ReactNode }) {
    return (
        <TooltipProvider>
            {children}
            <Toaster />
        </TooltipProvider>
    )
}
