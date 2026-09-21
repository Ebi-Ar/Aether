'use client'

import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { useState, useEffect } from 'react'

import { usePathname } from 'next/navigation';

export function Header() {
  const pathname = usePathname();
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  useEffect(() => {
    const scrollContainer = document.getElementById('main-scroll-container') || window;

    const handleScroll = () => {
      const currentScrollY = scrollContainer === window
        ? window.scrollY
        : (scrollContainer as HTMLElement).scrollTop;

      // Hide if scrolling down AND not at the very top (buffer of 50px)
      if (currentScrollY > 50 && currentScrollY > lastScrollY) {
        setIsVisible(false);
      } else {
        // Show if scrolling up OR at the top
        setIsVisible(true);
      }

      setLastScrollY(currentScrollY);
    };

    scrollContainer.addEventListener('scroll', handleScroll, { passive: true });
    return () => scrollContainer.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  // Hide header completely on view page
  if (pathname?.startsWith('/view')) return null;

  return (
    <header
      className={`w-full z-50 border-b border-border bg-background/80 backdrop-blur-md flex-none fixed top-0 left-0 transition-transform duration-300 ${isVisible ? 'translate-y-0' : '-translate-y-full'}`}
    >
      <div className="flex h-14 items-center justify-between px-6">
        <Link href="/" className="flex items-center gap-2 font-semibold hover:opacity-90 transition-opacity">
          <span className="text-lg tracking-tight">AETHER</span>
        </Link>
        <nav className="flex items-center gap-6">
          <Link href="#" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
            Docs
          </Link>
          <Link href="/examples" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
            Examples
          </Link>
          <Link href="/editor" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
            Editor
          </Link>
          <Link href="/legacy-library" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
            Legacy Library
          </Link>
          <Button
            size="sm"
            className="h-8 gap-2 px-4 text-xs font-semibold bg-transparent border border-white/20 text-white hover:bg-white/5 hover:border-white/50 hover:shadow-[0_0_15px_rgba(138,180,248,0.3)] transition-all duration-300 backdrop-blur-sm"
          >
            Get Pro
          </Button>
        </nav>
      </div>
    </header>
  )
}
