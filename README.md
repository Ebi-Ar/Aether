# Aether

A cinematic landing page builder — a visual editor for building pages where
motion is part of the layout rather than something added afterwards.

**Live:** https://itsaether.vercel.app

> Actively in development. The landing page, editor, template gallery and
> component library are live. **Orange buttons and links are features that
> aren't built yet**: they're kept visible as a to-do list. Hover one to see
> what's missing.

## What it does

Pages are assembled in the browser: a layers tree on the left, a live canvas in
the middle, and per-element properties and behaviours on the right. Sections are
reordered by drag and drop, previewed full-screen, and shared as a link. Work is
saved automatically in the browser. Publishing to a real site address is not
built yet.

Motion is driven by a set of physics primitives (gravity, friction and inertia)
built on GSAP. The goal is that an animation is configured as a property of an
element, not written by hand for every page.

### Marking unfinished features

Give the button or link a `data-coming-soon` attribute and a `title` saying
what's missing; `app/globals.css` turns it orange. Remove both once the feature
works. To list what's still unfinished, search for them:

```
grep -rn "data-coming-soon" app components
```

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

Next.js 16 · React 19 · TypeScript · GSAP · Tailwind CSS 4 · Radix UI · dnd-kit

## Running locally

```
npm install
npm run dev
```

Then open http://localhost:3000. Use `npm run dev:lan` to expose the dev server
on your network for testing on a phone.
