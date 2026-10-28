import { toast as sonnerToast } from "sonner"

export interface ToastOptions {
    title?: string
    description?: string
}

// Shows a notification through the app's single <Toaster /> (Sonner, mounted in
// components/providers.tsx). A toast with only a description uses it as the message.
export const toast = ({ title, description }: ToastOptions) => {
    if (title) {
        sonnerToast(title, { description })
    } else if (description) {
        sonnerToast(description)
    }
}
