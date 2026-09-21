import { PhysicsConfig, HorizontalConfig, HydrodynamicConfig } from "@/components/generator/types"

export const ANIMATION_TEMPLATES = {
  'physics-card': `import { useEffect, useRef } from 'react'
import gsap from 'gsap'

export default function PhysicsGrid() {
  const containerRef = useRef(null)
  const charsRef = useRef([])
  const headlineRef = useRef(null)
  const subtitleRef = useRef(null)

  // Configuration
  const COLS = {{COLS}}
  const GAP = {{GAP}}
  const CARD_RADIUS = {{RADIUS}} // rounded-xl estimated
  const MAX_ROTATION = {{ROTATION}} // degrees
  const HOVER_FORCE = {{HOVER}} // pixel push
  const SNAP_DURATION = {{SNAP}} // seconds

  useEffect(() => {
    // Layout Calculation
    const layoutCards = () => {
      if (!containerRef.current) return
      const containerWidth = containerRef.current.offsetWidth
      const cardWidth = (containerWidth - (COLS - 1) * GAP) / COLS
      // Aspect ratio 4:5 approx from image
      const cardHeight = cardWidth * 1.25 

      cardsRef.current.forEach((card, i) => {
        if (!card) return
        const row = Math.floor(i / COLS)
        const col = i % COLS
        const x = col * (cardWidth + GAP)
        const y = row * (cardHeight + GAP)
        
        gsap.set(card, { 
          width: cardWidth, 
          height: cardHeight, 
          x, 
          y,
          borderRadius: CARD_RADIUS
        })
      })
      
      // Set container height
      const rows = Math.ceil(cardsRef.current.length / COLS)
      gsap.set(containerRef.current, { 
        height: rows * (cardHeight + GAP) - GAP 
      })
    }

    // Interaction Logic
    const handleMouseMove = (e) => {
      const mx = e.clientX
      const my = e.clientY

      cardsRef.current.forEach(card => {
        if (!card) return
        const rect = card.getBoundingClientRect()
        const cx = rect.left + rect.width / 2
        const cy = rect.top + rect.height / 2

        const dist = Math.sqrt(Math.pow(mx - cx, 2) + Math.pow(my - cy, 2))
        const maxDist = 300 // Interaction radius

        if (dist < maxDist) {
          const power = (1 - dist / maxDist) * HOVER_FORCE
          const angle = Math.atan2(my - cy, mx - cx)
          const rx = Math.cos(angle) * power
          const ry = Math.sin(angle) * power
          
          // Rotation based on position relative to mouse
          const rotX = (my - cy) / maxDist * MAX_ROTATION
          const rotY = -(mx - cx) / maxDist * MAX_ROTATION

          gsap.to(card, {
            x: rx,
            y: ry,
            rotationX: rotX,
            rotationY: rotY,
            scale: 1.02,
            duration: 0.4,
            ease: "power2.out",
            overwrite: "auto"
          })
        } else {
          gsap.to(card, {
            x: 0,
            y: 0,
            rotationX: 0,
            rotationY: 0,
            scale: 1,
            duration: SNAP_DURATION, // Configurable snap back
            ease: "elastic.out(1, 0.3)",
            overwrite: "auto"
          })
        }
      })
    }
    
    // Initial Layout & Resize Listener
    layoutCards()
    window.addEventListener('resize', layoutCards)
    window.addEventListener('mousemove', handleMouseMove)

    return () => {
      window.removeEventListener('resize', layoutCards)
      window.removeEventListener('mousemove', handleMouseMove)
    }
  }, [])

  const items = {{GRID_ITEMS}}

  return (
    <div className="min-h-screen bg-neutral-950 p-8 flex items-center justify-center">
      <div ref={containerRef} className="relative w-full max-w-6xl mx-auto transform-style-3d perspective-1000">
        {items.map((item, i) => (
          <div
            key={item.id}
            ref={el => cardsRef.current[i] = el}
            className="absolute bg-neutral-900 overflow-hidden border border-white/10 shadow-2xl origin-center will-change-transform cursor-pointer group"
          >
            {/* Image Placeholder */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-white/0 z-10" />
            
            {/* Content */}
            <div className="absolute inset-0 flex items-center justify-center p-6 text-center z-20">
               <div>
                  <h3 className="text-white font-bold text-xl mb-2 opacity-0 translate-y-4 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300">
                    {item.text}
                  </h3>
                  <a href={item.link} className="text-white/50 text-sm hover:text-white transition-colors">
                    Explore &rarr;
                  </a>
               </div>
            </div>
            
            {/* Grid Pattern Overlay */}
            <div className="absolute inset-0 opacity-20 pointer-events-none" 
                 style={{ backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)', backgroundSize: '16px 16px' }} 
            />
          </div>
        ))}
      </div>
    </div>
  )
}`,

  'apple-zoom': `import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import ScrollTrigger from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

export default function AppleZoom() {
  const containerRef = useRef(null)
  const textRef = useRef(null)
  const imageRef = useRef(null)
  const headline = "{{HEADLINE}}"
  const imageUrl = "{{IMAGE_URL}}"

  useEffect(() => {
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: containerRef.current,
        start: "top top",
        end: "+=200%",
        scrub: true,
        pin: true
      }
    })

    tl.to(imageRef.current, {
      scale: 1,
      duration: 1
    })
    .to(textRef.current, {
      opacity: 1,
      y: 0,
      duration: 0.5
    }, "-=0.5")

  }, [])

  return (
    <div ref={containerRef} className="h-screen w-full overflow-hidden bg-black flex items-center justify-center relative">
      <img 
        ref={imageRef}
        src={imageUrl} 
        alt="Product" 
        className="absolute w-full h-full object-cover scale-[2.5]"
      />
      
      <h1 
        ref={textRef}
        className="relative z-10 text-white text-6xl font-bold opacity-0 translate-y-20 mix-blend-difference text-center px-4"
      >
        {headline}
      </h1>
    </div>
  )
}`,

  'canvas-scrubber': `import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import ScrollTrigger from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

export default function CanvasScrubber() {
  const canvasRef = useRef(null)
  const containerRef = useRef(null)
  
  // Configuration
  const frameCount = 148 // Replace with your sequence length
  const images = []
  const currentFrame = { index: 0 }

  useEffect(() => {
    const canvas = canvasRef.current
    const context = canvas.getContext('2d')
    canvas.width = 1920
    canvas.height = 1080

    // Preload images
    const loadImages = () => {
      for (let i = 0; i < frameCount; i++) {
        const img = new Image()
        img.src = \`/sequence/\${(i + 1).toString().padStart(4, '0')}.jpg\`
        images.push(img)
      }
    }
    
    loadImages()

    const render = () => {
      context.clearRect(0, 0, canvas.width, canvas.height)
      if (images[currentFrame.index]) {
        context.drawImage(images[currentFrame.index], 0, 0)
      }
    }

    gsap.to(currentFrame, {
      index: frameCount - 1,
      snap: "index",
      ease: "none",
      onUpdate: render,
      scrollTrigger: {
        trigger: containerRef.current,
        start: "top top",
        end: "+=400%", // Longer scroll for smoother playback
        scrub: 0.5, // Slight delay for smoothness
        pin: true
      }
    })

    // Initial render
    images[0].onload = render

  }, [])

  return (
    <div ref={containerRef} className="h-screen w-full bg-black flex items-center justify-center">
      <canvas ref={canvasRef} className="max-w-full max-h-screen" />
    </div>
  )
}`,

  'parallax-reveal': `import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import ScrollTrigger from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

export default function ParallaxReveal() {
  const containerRef = useRef(null)
  const imageRef = useRef(null)
  const overlayRef = useRef(null)
  const headline = "{{HEADLINE}}"
  const imageUrl = "{{IMAGE_URL}}"

  useEffect(() => {
    // Parallax Effect
    gsap.to(imageRef.current, {
      yPercent: 30,
      ease: "none",
      scrollTrigger: {
        trigger: containerRef.current,
        start: "top bottom",
        end: "bottom top",
        scrub: true
      }
    })

    // Reveal Animation
    gsap.to(overlayRef.current, {
      scaleY: 0,
      ease: "power2.inOut",
      scrollTrigger: {
        trigger: containerRef.current,
        start: "top center",
        end: "center center",
        scrub: 1
      }
    })
  }, [])

  return (
    <div ref={containerRef} className="h-[80vh] w-full relative overflow-hidden flex items-center justify-center my-20">
      <div className="absolute inset-0 overflow-hidden">
        <img 
          ref={imageRef}
          src={imageUrl}
          alt="Parallax"
          className="w-full h-[130%] object-cover -translate-y-[15%]"
        />
      </div>
      
      {/* Reveal Overlay */}
      <div ref={overlayRef} className="absolute inset-0 bg-white origin-top z-10" />
      
      <h2 className="relative z-20 text-white text-5xl md:text-8xl font-bold mix-blend-difference">
        {headline}
      </h2>
    </div>
  )
}`,

  'horizontal-scroll': `import { useEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import ScrollTrigger from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

export default function HorizontalScrollGallery() {
  const containerRef = useRef<HTMLDivElement>(null)
  const wrapperRef = useRef<HTMLDivElement>(null)
  const [isAtStart, setIsAtStart] = useState(true)
  const [isAtEnd, setIsAtEnd] = useState(false)

  // Configuration
  const items = {{HORIZONTAL_ITEMS}}
  const itemRadius = {{LAYOUT_RADIUS}}
  const titleSize = {{TYPO_TITLE_SIZE}}
  const labelSize = {{TYPO_LABEL_SIZE}}
  const cardWidth = '{{LAYOUT_WIDTH}}'
  const cardHeight = '{{LAYOUT_HEIGHT}}'
  const gap = {{LAYOUT_GAP}}
  
  // Start Card Config
  const startBgColor = '{{START_BG_COLOR}}'
  const startHeadlineSize = {{START_HEADLINE_SIZE}}
  const startBgOverlay = {{START_BG_OVERLAY}}
  const startImage = '{{START_IMAGE_URL}}'

  // End Card Config
  const ctaText = '{{CTA_TEXT}}'
  const ctaSubtext = '{{CTA_SUBTEXT}}'
  const ctaLink = '{{CTA_LINK}}'
  const endTitleSize = {{END_TITLE_SIZE}}
  const endButtonSize = {{END_BUTTON_SIZE}}
  const endBgColor = '{{END_BG_COLOR}}'
  const endBgOverlay = {{END_BG_OVERLAY}}

  useEffect(() => {
    const container = containerRef.current
    const wrapper = wrapperRef.current
    if (!container || !wrapper) return

    // Calculate total width based on number of cards (Items + Start Card + End Card)
    // We have items.length + 2 cards.
    // If width is vw based, we need to estimate. 
    // Best way for horizontal scrollTrigger is \`xPercent\`.
    
    // We need to calculate how far to move.
    // Total sections = items.length + 2.
    // Movement = -100 * (total sections - 1)
    const totalSections = items.length + 2
    
    const scrollTween = gsap.to(wrapper, {
      xPercent: -100 * (totalSections - 1) / totalSections, // Move relative to wrapper width
      ease: "none",
      scrollTrigger: {
        trigger: container,
        start: "top top",
        end: \`+=\${totalSections * 100}%\`, // Scroll distance proportional to content
        scrub: 1,
        pin: true,
        onUpdate: (self) => {
           setIsAtStart(self.progress < 0.05)
           setIsAtEnd(self.progress > 0.95)
        }
      }
    })

    return () => {
      scrollTween.kill()
      ScrollTrigger.getAll().forEach(t => t.kill())
    }
  }, [])

  return (
    <div ref={containerRef} className="relative h-screen overflow-hidden bg-neutral-900">
      {/* Wrapper width needs to accommodate all cards. 100vw * total cards */}
      <div 
        ref={wrapperRef} 
        className="flex h-full will-change-transform"
        style={{ width: \`\${(items.length + 2) * 100}%\` }}
      >
          {/* --- START CARD --- */}
          <div className="w-screen h-screen flex-shrink-0 flex items-center justify-center p-8 xs:p-12 md:p-24 relative overflow-hidden" style={{ backgroundColor: startBgColor }}>
             {/* Background Image if present */}
             {startImage && (
                 <>
                    <img src={startImage} alt="Start Background" className="absolute inset-0 w-full h-full object-cover" />
                    <div className="absolute inset-0" style={{ backgroundColor: \`rgba(0,0,0,\${startBgOverlay / 100})\` }} />
                 </>
             )}
              
             <div className="max-w-4xl w-full z-10 relative">
                  <h1 
                    className="font-bold leading-none mb-6"
                    style={{ fontSize: \`\${startHeadlineSize}px\`, {{START_TEXT_STYLE}}, color: '{{START_TEXT_COLOR}}' }}
                  >
                    {{HEADLINE}}
                  </h1>
                  {{START_SUBTITLE}}
                  <div className="w-24 h-1 bg-white/20 mt-8" />
             </div>
          </div>

          {/* --- GALLERY ITEMS --- */}
          {items.map((item, i) => (
            <div key={i} className="w-screen h-screen flex-shrink-0 flex items-center justify-center p-4 xs:p-8 md:p-16 relative">
                 {/* Card Container */}
                 <div 
                    className="relative overflow-hidden shadow-2xl group transition-transform duration-500 hover:scale-[1.02]"
                    style={{ 
                        width: cardWidth, 
                        height: cardHeight, 
                        borderRadius: \`\${itemRadius}px\`,
                        backgroundColor: '#000'
                    }}
                 >
                    <img 
                        src={item.image || "/api/placeholder/800/600"} 
                        alt={item.title} 
                        className="w-full h-full object-cover opacity-80 group-hover:opacity-100 group-hover:scale-110 transition-all duration-700 ease-in-out"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-60 group-hover:opacity-80 transition-opacity" />
                    
                    <div className="absolute bottom-0 left-0 right-0 p-8 transform translate-y-4 group-hover:translate-y-0 transition-transform duration-500 delay-100">
                        <span 
                            className="block text-white/60 mb-2 uppercase tracking-widest font-medium"
                            style={{ fontSize: \`\${labelSize}px\` }}
                        >
                            Project {String(i + 1).padStart(2, '0')}
                        </span>
                        <h2 
                            className="text-white font-bold leading-tight mb-4"
                            style={{ fontSize: \`\${titleSize}px\` }}
                        >
                            {item.title}
                        </h2>
                        <p className="text-white/80 line-clamp-2 max-w-md mb-6 opacity-0 group-hover:opacity-100 transition-opacity duration-500 delay-200">
                            {item.description}
                        </p>
                    </div>
                 </div>
            </div>
          ))}

          {/* --- END CARD --- */}
          <div className="w-screen h-screen flex-shrink-0 flex items-center justify-center p-8 relative overflow-hidden" style={{ backgroundColor: endBgColor }}>
               {/* End Card Background */}
               {{END_BG_IMAGE}}
               <div className="absolute inset-0" style={{ backgroundColor: \`rgba(0,0,0,\${endBgOverlay})\` }} />
               
               <div className="text-center relative z-10 max-w-2xl">
                   <h2 
                    className="font-bold mb-8"
                    style={{ fontSize: \`\${endTitleSize}px\`, {{END_TEXT_STYLE}}, color: '{{END_TEXT_COLOR}}' }}
                   >
                     {ctaText}
                   </h2>
                   {{END_SUBTITLE}}
                   <a 
                    href={ctaLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block bg-white text-black font-medium rounded-full hover:bg-neutral-200 transition-all transform hover:scale-105"
                    style={{ fontSize: \`\${endButtonSize}px\`, padding: \`\${endButtonSize * 0.8}px \${endButtonSize * 2}px\` }}
                   >
                     {ctaSubtext}
                   </a>
               </div>
          </div>
      </div>
      
      {/* Progress / Navigation optional overlay can be added here */}
      <div className="fixed bottom-12 left-1/2 -translate-x-1/2 flex items-center gap-4 z-50 mix-blend-difference text-white pointer-events-none">
          {(!isAtStart && !isAtEnd) && (
             <span className="text-sm tracking-widest uppercase opacity-50">Scroll</span>
          )}
          {isAtStart && (
             <>
                 <span className="text-xs">Scroll to explore</span>
                 <ArrowRight className="w-4 h-4 animate-pulse" />
             </>
          )}
      </div>
    </div>
  )
}`,

  'hydrodynamic-text': `import { useEffect, useRef } from 'react'
import gsap from 'gsap'

export default function HydrodynamicText() {
  const charsRef = useRef([])
  const headline = "{{HEADLINE}}"
  const subtitle = "{{SUBTITLE}}"

  useEffect(() => {
    const handleMouseMove = (e) => {
      const mx = e.clientX
      const my = e.clientY

      const config = {
        viscosity: {{VISCOSITY}},
        elasticity: {{ELASTICITY}},
        radius: {{RADIUS}},
        returnSpeed: {{RETURN_SPEED}},
        rotationForce: {{ROTATION_FORCE}}
      }

      charsRef.current.forEach((char, i) => {
        if (!char) return
        const rect = char.getBoundingClientRect()
        const cx = rect.left + rect.width / 2
        const cy = rect.top + rect.height / 2
        const dx = mx - cx
        const dy = my - cy
        const dist = Math.sqrt(dx * dx + dy * dy)

        if (dist < config.radius) {
          const strength = gsap.utils.mapRange(0, config.radius, 1, 0, dist)
          const pullX = dx * config.viscosity * strength
          const pullY = dy * config.viscosity * strength

          gsap.to(char, {
            x: pullX,
            y: pullY,
            rotation: dx * config.rotationForce,
            duration: 0.6,
            ease: "power2.out",
            overwrite: true
          })
        } else {
          gsap.to(char, {
            x: 0,
            y: 0,
            rotation: 0,
            duration: config.returnSpeed,
            ease: "elastic.out(1, " + config.elasticity + ")",
            overwrite: true
          })
        }
      })
    }

    const handleMouseLeave = () => {
       const config = {
        returnSpeed: {{RETURN_SPEED}},
        elasticity: {{ELASTICITY}}
      }
      
      charsRef.current.forEach((char) => {
        if (char) {
          gsap.to(char, {
            x: 0,
            y: 0,
            rotation: 0,
            duration: config.returnSpeed,
            ease: "elastic.out(1, " + config.elasticity + ")",
            overwrite: true
          })
        }
      })
    }

    // Draggable Logic
    let isDragging = false
    let startX = 0
    let startY = 0
    let initialX = 0
    let initialY = 0
    let activeTarget = null
    
    const targets = [headlineRef.current, subtitleRef.current].filter(Boolean)

    const onMouseDown = (e) => {
        if (!{{IS_DRAGGABLE}}) return
        const target = e.currentTarget
        activeTarget = target
        isDragging = true
        startX = e.clientX
        startY = e.clientY
        const style = window.getComputedStyle(target)
        const matrix = new WebKitCSSMatrix(style.transform)
        initialX = matrix.m41
        initialY = matrix.m42
        target.style.cursor = 'grabbing'
        e.preventDefault()
    }

    const onMouseMoveDrag = (e) => {
        if (!isDragging || !activeTarget) return
        const dx = e.clientX - startX
        const dy = e.clientY - startY
        gsap.set(activeTarget, {
            x: initialX + dx,
            y: initialY + dy,
            overwrite: 'auto'
        })
    }

    const onMouseUpDrag = () => {
        if (isDragging && activeTarget) {
            isDragging = false
            activeTarget.style.cursor = {{IS_DRAGGABLE}} ? 'grab' : 'default'
            activeTarget = null
        }
    }
    
    // Attach Listeners
    targets.forEach(target => {
        if ({{IS_DRAGGABLE}}) {
            target.addEventListener('mousedown', onMouseDown)
            target.style.cursor = 'grab'
        } else {
            target.style.cursor = 'default'
        }
    })

    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseleave', handleMouseLeave)
    if ({{IS_DRAGGABLE}}) {
        window.addEventListener('mousemove', onMouseMoveDrag)
        window.addEventListener('mouseup', onMouseUpDrag)
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseleave', handleMouseLeave)
      if ({{IS_DRAGGABLE}}) {
          window.removeEventListener('mousemove', onMouseMoveDrag)
          window.removeEventListener('mouseup', onMouseUpDrag)
      }
      targets.forEach(target => {
          target.removeEventListener('mousedown', onMouseDown)
      })
    }
  }, [])

  return (
    <div 
        className="h-screen w-full flex items-center justify-center overflow-hidden relative cursor-crosshair"
        style={{ backgroundColor: '{{BACKGROUND_COLOR}}' }}
    >
      {/* Background Image */}
      {/* Note: In a real implementation you would pass the image URL here */}
      {{BACKGROUND_IMAGE_ELEMENT}}
      
      <div 
        className="flex items-center justify-center overflow-hidden relative"
        style={{ 
          width: '{{BLOCK_WIDTH}}%', 
          height: '{{BLOCK_HEIGHT}}%' 
        }}
      >
        <h1 ref={headlineRef} className="relative z-10 text-center font-black leading-tight px-4 select-none {{TEXT_CLASS}}" style={{ color: '{{TEXT_COLOR}}' }}>
        {headline.split('').map((char, i) => (
          <span 
            key={i}
            ref={el => charsRef.current[i] = el}
            className="inline-block will-change-transform origin-center"
            style={{ fontSize: 'clamp(3rem, 15vw, 10rem)' }}
          >
            {char === ' ' ? '\u00A0' : char}
          </span>
        ))}
      </h1>

      {subtitle && (
        <div className="relative z-10 mt-8 text-center px-4 select-none pointer-events-none mix-blend-difference" style={{ color: '{{SUBTITLE_COLOR}}' }}>
             <p ref={subtitleRef} className="font-medium inline-block max-w-2xl pointer-events-auto">
                {subtitle.split('').map((char, i) => (
                  <span
                    key={i}
                    ref={el => charsRef.current[headline.length + i] = el}
                    className="inline-block will-change-transform origin-center"
                    style={{ fontSize: '{{SUBTITLE_SIZE}}px' }}
                  >
                     {char === ' ' ? '\u00A0' : char}
                  </span>
                ))}
             </p>
        </div>
      )}
      </div>
    </div>
  )
}`
}

export function generateReactGsapCode(
  style: keyof typeof ANIMATION_TEMPLATES,
  headline: string,
  imageUrl: string,
  textAlwaysVisible: boolean = false,
  gridItems?: any[],
  gridSize?: 'small' | 'medium' | 'large',
  physicsConfig?: PhysicsConfig,
  horizontalConfig?: HorizontalConfig,
  hydrodynamicConfig?: HydrodynamicConfig
): string {
  let code = ANIMATION_TEMPLATES[style] || ''

  // Common replacements
  code = code.replace(/{{HEADLINE}}/g, headline)
  code = code.replace(/{{IMAGE_URL}}/g, imageUrl)

  if (style === 'physics-card') {
    const gap = physicsConfig?.gridGap || 16
    const radius = physicsConfig?.cardRadius || 12
    const rotation = physicsConfig?.maxRotation || 5
    const hover = physicsConfig?.hoverForce || 20
    const snap = physicsConfig?.snapDuration || 0.4

    const cols = gridSize === 'small' ? 6 : gridSize === 'large' ? 3 : 4

    code = code.replace(/{{COLS}}/g, String(cols))
    code = code.replace(/{{GAP}}/g, String(gap))
    code = code.replace(/{{RADIUS}}/g, String(radius))
    code = code.replace(/{{ROTATION}}/g, String(rotation))
    code = code.replace(/{{HOVER}}/g, String(hover))
    code = code.replace(/{{SNAP}}/g, String(snap))
    code = code.replace('{{GRID_ITEMS}}', JSON.stringify(gridItems || [], null, 4))
  } else if (style === 'horizontal-scroll' && horizontalConfig) {
    // Horizontal replacements
    const hItems = horizontalConfig?.items ? JSON.stringify(horizontalConfig.items, null, 4) : '[]';
    const hRadius = horizontalConfig.layout.radius ?? 32;
    const hTitleSize = horizontalConfig.typography.titleSize ?? 32;
    const hLabelSize = horizontalConfig.typography.labelSize ?? 14;
    const hWidth = horizontalConfig.layout.width ?? '60vw';
    const hHeight = horizontalConfig.layout.height ?? '60vh';
    const hGap = horizontalConfig.layout.gap ?? 40;

    const hCtaText = horizontalConfig.cta?.text || 'Next Project?';
    const hCtaSubtext = horizontalConfig.cta?.subtext || 'Get in touch';
    const hCtaLink = horizontalConfig.cta?.link || '#';

    const hStartHeadlineSize = horizontalConfig.startCard?.headlineSize ?? 96;
    const hEndTitleSize = horizontalConfig.endCard?.titleSize ?? 48;
    const hEndButtonSize = horizontalConfig.endCard?.buttonSize ?? 18;
    const hStartBgOverlay = horizontalConfig.startCard?.backgroundOverlay ?? 80;

    // End Card Variables
    const hEndBgColor = horizontalConfig.endCard?.backgroundColor || '#1a1a1a';
    const hEndBgOverlay = (horizontalConfig.endCard?.backgroundOverlay ?? 50) / 100;

    const hEndBgImage = horizontalConfig.endCard?.backgroundImage
      ? `<img src="${horizontalConfig.endCard.backgroundImage}" alt="End Card Background" className="absolute inset-0 w-full h-full object-cover" />`
      : '';

    const hEndTextColor = horizontalConfig.endCard?.textColor || '#ffffff';

    let hEndTextStyle = '';
    if (horizontalConfig.endCard?.textGradient) {
      hEndTextStyle += `backgroundImage: 'linear-gradient(to right, ${horizontalConfig.endCard.gradientStart}, ${horizontalConfig.endCard.gradientEnd})', backgroundClip: 'text', WebkitBackgroundClip: 'text', color: 'transparent'`;
    }

    const hEndSubtitle = horizontalConfig.endCard?.subtitle
      ? `<p className="text-lg opacity-70 mb-4" style={{ color: '${horizontalConfig.endCard?.textGradient ? 'transparent' : (horizontalConfig.endCard.textColor || '#ffffff')}', ${horizontalConfig.endCard?.textGradient ? `backgroundImage: 'linear-gradient(to right, ${horizontalConfig.endCard.gradientStart}, ${horizontalConfig.endCard.gradientEnd})', backgroundClip: 'text', WebkitBackgroundClip: 'text'` : ''} }}>${horizontalConfig.endCard.subtitle}</p>`
      : '';

    // Start Card Variables
    const hStartBgColor = horizontalConfig.startCard?.backgroundColor || '#1a1a1a';

    const hStartImageRaw = horizontalConfig.startCard?.image || '';
    const hStartImage = (hStartImageRaw.startsWith('blob:') || hStartImageRaw.startsWith('data:'))
      ? "/path/to/your/start-image.jpg"
      : hStartImageRaw;

    const hStartTextColor = horizontalConfig.startCard?.textColor || '#ffffff';

    let hStartTextStyle = '';
    if (horizontalConfig.startCard?.textGradient) {
      hStartTextStyle += `backgroundImage: 'linear-gradient(to right, ${horizontalConfig.startCard.gradientStart}, ${horizontalConfig.startCard.gradientEnd})', backgroundClip: 'text', WebkitBackgroundClip: 'text', color: 'transparent'`;
    }

    const hStartSubtitle = horizontalConfig.startCard?.subtitle
      ? `<p className="text-xl md:text-2xl font-light opacity-80" style={{ color: '${horizontalConfig.startCard?.textGradient ? 'transparent' : (horizontalConfig.startCard.textColor || '#ffffff')}', ${horizontalConfig.startCard?.textGradient ? `backgroundImage: 'linear-gradient(to right, ${horizontalConfig.startCard.gradientStart}, ${horizontalConfig.startCard.gradientEnd})', backgroundClip: 'text', WebkitBackgroundClip: 'text'` : ''} }}>${horizontalConfig.startCard.subtitle}</p>`
      : '';

    code = code.replace('{{HORIZONTAL_ITEMS}}', hItems)
      .replace('{{LAYOUT_RADIUS}}', String(hRadius))
      .replace('{{TYPO_TITLE_SIZE}}', String(hTitleSize))
      .replace('{{TYPO_LABEL_SIZE}}', String(hLabelSize))
      .replace('{{LAYOUT_WIDTH}}', hWidth)
      .replace('{{LAYOUT_HEIGHT}}', hHeight)
      .replace('{{LAYOUT_GAP}}', String(hGap))
      .replace('{{CTA_TEXT}}', hCtaText)
      .replace('{{CTA_SUBTEXT}}', hCtaSubtext)
      .replace('{{CTA_LINK}}', hCtaLink)
      .replace('{{START_HEADLINE_SIZE}}', String(hStartHeadlineSize))
      .replace('{{END_TITLE_SIZE}}', String(hEndTitleSize))
      .replace('{{END_BUTTON_SIZE}}', String(hEndButtonSize))
      .replace('{{START_BG_OVERLAY}}', String(hStartBgOverlay))
      .replace('{{START_BG_COLOR}}', hStartBgColor)
      .replace('{{START_TEXT_COLOR}}', hStartTextColor)
      .replace('{{START_TEXT_STYLE}}', hStartTextStyle)
      .replace('{{START_SUBTITLE}}', hStartSubtitle)
      .replace('{{END_BG_COLOR}}', hEndBgColor)
      .replace('{{END_BG_OVERLAY}}', String(hEndBgOverlay))
      .replace('{{END_BG_IMAGE}}', hEndBgImage)
      .replace('{{END_TEXT_COLOR}}', hEndTextColor)
      .replace('{{END_TEXT_STYLE}}', hEndTextStyle)
      .replace('{{START_IMAGE_URL}}', hStartImage)
      .replace('{{END_SUBTITLE}}', hEndSubtitle);

  } else if (style === 'hydrodynamic-text' && hydrodynamicConfig) {
    code = code.replace(/{{VISCOSITY}}/g, String(hydrodynamicConfig.viscosity))
    code = code.replace(/{{ELASTICITY}}/g, String(hydrodynamicConfig.elasticity))
    code = code.replace(/{{RADIUS}}/g, String(hydrodynamicConfig.interactionRadius))
    code = code.replace(/{{RETURN_SPEED}}/g, String(hydrodynamicConfig.returnSpeed))
    code = code.replace(/{{ROTATION_FORCE}}/g, String(hydrodynamicConfig.rotationForce))
    code = code.replace(/{{SUBTITLE}}/g, hydrodynamicConfig.subtitle || '')
    code = code.replace(/{{SUBTITLE_SIZE}}/g, String(hydrodynamicConfig.subtitleFontSize || 24))
    code = code.replace(/{{TEXT_COLOR}}/g, hydrodynamicConfig.blendMode ? 'white' : (hydrodynamicConfig.textColor || '#FFFFFF'))
    code = code.replace(/{{SUBTITLE_COLOR}}/g, hydrodynamicConfig.blendMode ? 'white' : (hydrodynamicConfig.subtitleColor || '#9CA3AF'))

    code = code.replace(/{{FONT_SIZE}}/g, String(hydrodynamicConfig.fontSize))
    code = code.replace(/{{LETTER_SPACING}}/g, String(hydrodynamicConfig.letterSpacing))
    code = code.replace(/{{BACKGROUND_COLOR}}/g, hydrodynamicConfig.backgroundColor)
    code = code.replace(/{{IS_DRAGGABLE}}/g, String(hydrodynamicConfig.isDraggable))
    code = code.replace(/{{BLOCK_WIDTH}}/g, String(hydrodynamicConfig.blockWidth || 100))
    code = code.replace(/{{BLOCK_HEIGHT}}/g, String(hydrodynamicConfig.blockHeight || 100))

    const textClass = hydrodynamicConfig.blendMode ? "mix-blend-difference text-white" : "text-white"
    code = code.replace(/{{TEXT_CLASS}}/g, textClass)

    // Default opacity is 0.5 if undefined, same as Preview
    const opacity = hydrodynamicConfig.imageOpacity ?? 0.5;
    const imageElement = imageUrl
      ? `<img src="${imageUrl}" alt="Background" className="absolute inset-0 w-full h-full object-cover" style={{ opacity: ${opacity} }} />`
      : '';
    code = code.replace('{{BACKGROUND_IMAGE_ELEMENT}}', imageElement);
  }

  return code
}