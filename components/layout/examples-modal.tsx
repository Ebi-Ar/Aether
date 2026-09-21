'use client'

import Link from 'next/link'
import Image from 'next/image'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'

interface ExamplesModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
}

const examples = [
    {
        id: 'lookbook',
        title: 'Interactive Lookbook',
        category: 'Product',
        preview: '/lookbook_preview_1767991499507.png',
        href: '/demos/lookbook',
        available: true,
    },
    {
        id: 'landing',
        title: 'Landing Page Template',
        category: 'Marketing',
        preview: '/landing_page_preview_1767991514343.png',
        href: '#',
        available: false,
    },
    {
        id: 'portfolio',
        title: 'Portfolio Template',
        category: 'Showcase',
        preview: '/portfolio_preview_1767991527813.png',
        href: '#',
        available: false,
    },
]

export function ExamplesModal({ open, onOpenChange }: ExamplesModalProps) {
    const handleCardClick = (example: typeof examples[0]) => {
        if (example.available) {
            onOpenChange(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-6xl max-h-[85vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="text-2xl font-bold">Examples</DialogTitle>
                    <DialogDescription>
                        Explore our collection of interactive examples and templates built with AETHER.
                    </DialogDescription>
                </DialogHeader>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
                    {examples.map((example) => {
                        const cardContent = (
                            <>
                                {/* Preview Image */}
                                <div className="relative aspect-[16/10] w-full overflow-hidden bg-muted">
                                    <Image
                                        src={example.preview}
                                        alt={example.title}
                                        fill
                                        className={`object-cover transition-transform duration-500 ${example.available ? 'group-hover:scale-105' : ''
                                            }`}
                                    />

                                    {/* Coming Soon Overlay */}
                                    {!example.available && (
                                        <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-[2px]">
                                            <Badge variant="secondary" className="text-sm font-semibold px-4 py-2">
                                                Coming Soon
                                            </Badge>
                                        </div>
                                    )}
                                </div>

                                {/* Card Footer */}
                                <div className="p-4">
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="flex-1 min-w-0">
                                            <h3 className="font-semibold text-sm truncate">{example.title}</h3>
                                            <p className="text-xs text-muted-foreground mt-1">{example.category}</p>
                                        </div>
                                    </div>
                                </div>
                            </>
                        )

                        const cardClassName = `group relative overflow-hidden rounded-lg border border-border bg-card transition-all duration-300 ${example.available
                            ? 'cursor-pointer hover:shadow-xl hover:shadow-primary/20 hover:border-primary/50 hover:-translate-y-1'
                            : 'cursor-not-allowed opacity-60'
                            }`

                        if (example.available) {
                            return (
                                <Link
                                    key={example.id}
                                    href={example.href}
                                    onClick={() => handleCardClick(example)}
                                    className={cardClassName}
                                >
                                    {cardContent}
                                </Link>
                            )
                        }

                        return (
                            <div
                                key={example.id}
                                onClick={() => handleCardClick(example)}
                                className={cardClassName}
                            >
                                {cardContent}
                            </div>
                        )
                    })}
                </div>
            </DialogContent>
        </Dialog>
    )
}
