import { useState, useEffect } from "react"

export interface Toast {
    id: string
    title?: string
    description?: string
    action?: React.ReactNode
}

export function useToast() {
    const [toasts, setToasts] = useState<Toast[]>([])

    const toast = ({ title, description, action }: Omit<Toast, "id">) => {
        const id = Math.random().toString(36).substring(2, 9)
        const newToast = { id, title, description, action }
        setToasts((prev) => [...prev, newToast])

        // Auto dismiss after 3 seconds
        setTimeout(() => {
            setToasts((prev) => prev.filter((t) => t.id !== id))
        }, 3000)
    }

    return { toast, toasts }
}

// Export a singleton or context-based toaster if needed, but for now
// we'll just export a simple hook since the user code imports { toast } from hooks/use-toast.
// Use a simple event emitter or global state for a real app, but for this snippet:
// The user code uses `import { toast } from '@/hooks/use-toast'`, suggesting a direct export.
// Standard shadcn use-toast exports { toast } as a function that dispatches events.
// Let's implement a minimal event-based version to work across components.

type ToastEvent = {
    title?: string
    description?: string
}

const listeners: ((toast: ToastEvent) => void)[] = []

export const toast = (props: ToastEvent) => {
    listeners.forEach((listener) => listener(props))
}

export function useToastListener() {
    const [toasts, setToasts] = useState<ToastEvent[]>([])

    useEffect(() => {
        const handler = (toast: ToastEvent) => {
            setToasts((prev) => [...prev, toast])
            setTimeout(() => {
                setToasts((prev) => prev.slice(1))
            }, 3000)
        }
        listeners.push(handler)
        return () => {
            const index = listeners.indexOf(handler)
            if (index > -1) listeners.splice(index, 1)
        }
    }, [])

    return { toasts }
}
