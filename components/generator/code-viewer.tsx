"use client"
import { useState } from 'react';
import { Highlight, themes } from 'prism-react-renderer';
import { Copy, Check, Code2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';
import { GridItem, AnimationStyle, GridSize, PhysicsConfig, HorizontalConfig, HydrodynamicConfig } from './types';
import { generateReactGsapCode } from '@/lib/templates/react-gsap';

interface CodeViewerProps {
    headline: string
    imageUrl: string
    style: AnimationStyle
    textAlwaysVisible?: boolean
    gridItems?: GridItem[]
    gridSize?: GridSize
    physicsConfig?: PhysicsConfig
    horizontalConfig?: HorizontalConfig
    hydrodynamicConfig?: HydrodynamicConfig;
}

export function CodeViewer({ headline, imageUrl, style, textAlwaysVisible, gridItems, gridSize, physicsConfig, horizontalConfig, hydrodynamicConfig }: CodeViewerProps) {
    const code = generateReactGsapCode(style, headline, imageUrl, textAlwaysVisible, gridItems, gridSize, physicsConfig, horizontalConfig, hydrodynamicConfig)
    const [copied, setCopied] = useState(false);

    const handleCopy = async () => {
        await navigator.clipboard.writeText(code);
        setCopied(true);
        toast({
            title: 'Copied to clipboard',
            description: 'The code has been copied to your clipboard.',
        });
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="h-full flex flex-col border-t border-border/50">
            <div className="flex items-center justify-between p-4 border-b border-border/50 bg-card/50">
                <div className="flex items-center gap-2">
                    <Code2 className="w-4 h-4 text-muted-foreground" />
                    <h2 className="text-sm font-medium text-foreground">Generated Code</h2>
                    <span className="text-xs text-muted-foreground bg-secondary px-2 py-0.5 rounded">
                        React + GSAP
                    </span>
                </div>
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleCopy}
                    className={copied
                        ? 'text-green-500 hover:text-green-500 hover:bg-green-500/10'
                        : 'text-muted-foreground hover:text-foreground hover:bg-surface-hover'
                    }
                >
                    {copied ? (
                        <>
                            <Check className="w-4 h-4 mr-1.5" />
                            Copied!
                        </>
                    ) : (
                        <>
                            <Copy className="w-4 h-4 mr-1.5" />
                            Copy Code
                        </>
                    )}
                </Button>
            </div>

            <div className="flex-1 overflow-auto p-4 bg-[#0d1117]">
                <Highlight
                    theme={themes.nightOwl}
                    code={code}
                    language="tsx"
                >
                    {({ className, style, tokens, getLineProps, getTokenProps }) => (
                        <pre
                            className={`${className} text-sm leading-relaxed`}
                            style={{ ...style, background: 'transparent' }}
                        >
                            {tokens.map((line, i) => (
                                <div key={i} {...getLineProps({ line })}>
                                    <span className="inline-block w-10 text-muted-foreground/50 text-right pr-4 select-none text-xs">
                                        {i + 1}
                                    </span>
                                    {line.map((token, key) => (
                                        <span key={key} {...getTokenProps({ token })} />
                                    ))}
                                </div>
                            ))}
                        </pre>
                    )}
                </Highlight>
            </div>
        </div>
    );
};
