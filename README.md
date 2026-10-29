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

Effects are dragged from the editor's Effects tab onto an element and tuned
with sliders, so an animation is a property of an element rather than code
written for every page. Developers can copy any effect as GSAP or Motion code
for their own sites.

### Effects library

Every effect lives in `lib/effect-library`, one file each, and is defined once:
its name, which elements it works on, its sliders, how it runs in the editor and
on shared pages (on [Motion](https://motion.dev)), and the code developers can
copy (GSAP and Motion). To add an effect, create a file next to the others and
register it in `lib/effect-library/index.ts`; it then appears in the Effects
tab, the properties panel and the copy-code buttons.

| Effect | Trigger | Works on |
|---|---|---|
| Apple Zoom | Scroll | Any element (zooms the image inside, if there is one) |
| Hydrodynamic Text | Cursor | Text |
| Physics Card | Cursor | Any element |

The Legacy Library (`/legacy-library`) still runs on GSAP.

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

Next.js 16 · React 19 · TypeScript · Motion · GSAP · Tailwind CSS 4 · Radix UI · dnd-kit

## Running locally

```
npm install
npm run dev
```

Then open http://localhost:3000. Use `npm run dev:lan` to expose the dev server
on your network for testing on a phone.
