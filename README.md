# Aether

A cinematic landing page builder — a visual editor for building pages where
motion is part of the layout rather than something added afterwards.

**Live:** https://itsaether.vercel.app

> Actively in development. The landing page, editor and component library are
> working; the examples gallery is in progress.

## What it does

Pages are assembled in the browser: a layers tree on the left, a live canvas in
the middle, and per-element properties and behaviours on the right. Sections are
reordered by drag and drop, previewed at desktop or mobile widths, and published
from the editor.

Motion is driven by a set of physics primitives — gravity, friction and inertia —
built on GSAP, with Three.js and WebGL handling the scene work (lens flares,
lighting, depth). The goal is that an animation is configured as a property of an
element, not written by hand for every page.

## Routes

| Route | |
|---|---|
| `/` | Landing page |
| `/editor` | The page builder |
| `/view` | Renders a built page on its own |
| `/examples` | Gallery of example pages |
| `/legacy-library` | Earlier component library |
| `/demos/lookbook`, `/demos/lens-flare` | Individual motion demos |

## Stack

Next.js 16 · React 19 · TypeScript · GSAP · Three.js · Tailwind CSS 4 ·
Radix UI · dnd-kit · TanStack Query

## Running locally

```
npm install
npm run dev
```

Then open http://localhost:3000. Use `npm run dev:lan` to expose the dev server
on your network for testing on a phone.
