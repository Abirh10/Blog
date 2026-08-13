# About Abir Hirani

A personal blog built with React, Vite, and Appwrite — warm editorial writing pages
by day, a gold-streaked cosmic dashboard by night (and always on `/about-me`).

Full sign-up/login, a rich-text post editor, light/dark theming, and a live
bento-grid "About Me" page (real GitHub activity, an interactive globe, a
scratch-to-reveal card) sit behind a permanent animated background: a WebGL
shader painting molten gold streaks, with a real depth-simulating starfield
drifting on top.

> New to this codebase? **[flow.md](flow.md)** is a from-scratch, no-assumed-knowledge
> walkthrough of how every piece fits together — start there if you want the
> "why," not just the "what." This README is the quick-start / reference version.

## Features

- **Auth** — email/password sign-up, login, and session-aware routing via Appwrite,
  with client-side route guards (`AuthLayout`) redirecting logged-out users away
  from protected pages and vice versa.
- **Posts** — create, edit, and delete posts with a TinyMCE rich-text editor,
  auto-generated URL slugs, a featured-image upload, and an active/inactive
  publish status.
- **Light / dark theme** — persisted to `localStorage`, no flash-of-wrong-theme on
  load, and independently overridable per-page (the About Me page always renders
  dark regardless of the site-wide setting).
- **Animated background, everywhere** — a custom WebGL fragment shader
  ("Starship," by @XorDev) rendering continuous gold energy streaks, layered
  with a real parallax starfield, shown on every route in both themes so the
  whole site shares one consistent backdrop instead of one page having special
  decoration.
- **`/about-me`** — a bento-grid dashboard shown right after signing in:
  - An interactive rotating-earth globe (drag to spin).
  - A scratch-to-reveal card (real canvas erase, mouse + touch).
  - A GitHub contribution heatmap and coding-hours/coffee stats, both derived
    from your **real, live GitHub activity** — no API key required. See
    [`functions/dashboard-data`](functions/dashboard-data) for the optional
    Appwrite Function that also unlocks a live "currently playing" Spotify
    widget.
  - Tools/tech marquee, social links, favorite-tool card.
- **Design system** — one set of CSS custom-property tokens (`src/index.css`)
  drives every color in the app, so retheming (light/dark, or the accent color
  itself) touches one file instead of hunting through components.

## Tech stack

| Layer | What | Why |
|---|---|---|
| UI | React 19, React Router 7 | Component tree + client-side routing |
| State | Redux Toolkit | The one thing that's genuinely global: auth status |
| Styling | Tailwind CSS v4 | CSS-first config, no `tailwind.config.js` |
| Forms | React Hook Form | Login/signup/post-editor state without re-rendering on every keystroke |
| Rich text | TinyMCE + html-react-parser | Writing posts, then safely rendering the saved HTML |
| Backend | [Appwrite](https://appwrite.io) | Hosted auth, database, and file storage — no server code in this repo |
| 3D / shaders | Three.js, `@react-three/fiber` | The gold-streak shader background |
| Globe | `cobe` (npm) + a CSS-only fallback (`globe.tsx`) | See [Component credits](#component-credits) |
| Animation | `motion` (Framer Motion's successor) | The realistic parallax starfield |
| Icons | `lucide-react` | UI icons throughout |
| Tooling | Vite, TypeScript (incremental), oxlint | Dev server/build, types for the newer `.tsx` components, linting |

The project is intentionally mixed JS/TS: original pages/components are `.jsx`,
everything added since is `.tsx` with real types. See flow.md §on TypeScript
for why a full migration wasn't done.

## Getting started

```bash
git clone git@github.com:Abirh10/Blog.git
cd Blog
npm install
cp .env.example .env   # then fill in your Appwrite project details, see below
npm run dev
```

Open the printed `localhost` URL.

### Environment variables

Copy `.env.example` to `.env` and fill in values from your Appwrite console
(Project Settings → Project ID/endpoint; Databases → Database/Collection ID;
Storage → Bucket ID). **flow.md §9** walks through setting up the Appwrite
side from scratch — the database collection's attributes, permissions, and
storage bucket permissions — if you're starting a fresh Appwrite project.

`VITE_DASHBOARD_FUNCTION_URL` is optional; without it, the About Me page's
GitHub/coding-stats/Spotify widgets just use the placeholder data in
`src/data/about-me.js` instead of live data. See
[`functions/dashboard-data/README.md`](functions/dashboard-data/README.md) to
wire that up (the GitHub-derived stats need no API key at all; Spotify needs a
one-time OAuth step covered there).

### Scripts

| Command | Does |
|---|---|
| `npm run dev` | Start the Vite dev server with HMR |
| `npm run build` | Production build to `dist/` |
| `npm run preview` | Serve the production build locally |
| `npm run lint` | Run oxlint |

## Project structure

```
Blog/
├── flow.md                      # deep-dive walkthrough — start here
├── functions/dashboard-data/    # optional Appwrite Function (live About Me widgets)
├── scripts/                     # one-time local setup helpers (Spotify OAuth)
├── src/
│   ├── appwrite/                # auth.js, config.js — the Appwrite SDK wrappers
│   ├── components/               # reusable UI, including components/ui (shadcn-style primitives)
│   ├── context/                  # ThemeContext (light/dark)
│   ├── data/about-me.js          # editable content for the /about-me page
│   ├── hooks/                    # useDashboardData (live-widget fetch + fallback)
│   ├── pages/                    # one file per route
│   ├── store/                    # Redux store + the auth slice
│   └── index.css                 # design tokens (colors, fonts) for the whole app
└── .env.example                  # template for your local .env
```

## Deployment

`npm run build` produces a static `dist/` folder — deploy it to any static
host (Vercel, Netlify, Cloudflare Pages, etc.) with the same environment
variables set in the host's dashboard. The Appwrite Function in
`functions/dashboard-data` deploys separately, straight to Appwrite (see its
own README) — it isn't part of this build.

## Component credits

A few UI pieces in `src/components/ui` are adapted from other open-source
projects rather than written from scratch, per each component's own file-header
comment:

- **`background-pixel-stars.tsx`**, **`globe-cobe.tsx`** (archived, not
  currently used), and the About Me bento-grid pattern (`scratch-to-reveal.tsx`,
  `github-heatmap.tsx`) — adapted from
  [shivy02/portfolio-website](https://github.com/shivy02/portfolio-website)
  (Apache License 2.0; source code license only — its personal content/photos
  are not reused here).
- **`stars-background.tsx`** — adapted from
  [imskyleen/animate-ui](https://github.com/imskyleen/animate-ui)'s Stars
  Background component, itself crediting
  [umangladani's CodePen](https://codepen.io/umangladani/pen/wvgwgjK) for the
  parallax concept.
- **`starship-shader.tsx`** — the "Starship" fragment shader by
  [@XorDev](https://x.com/XorDev), adapted to a black background and wired
  into React Three Fiber.

## License

Personal project — no license is declared for the project's own code. Adapted
third-party components keep their original licenses, noted above and in each
file's header comment.
