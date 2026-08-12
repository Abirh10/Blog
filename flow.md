# flow.md — How "About Abir Hirani" Works

This document explains, from the ground up, how this blog is built and why. It assumes
no prior React/Appwrite knowledge — if you already know some of this, skip ahead.

---

## 1. What this project actually is

It's a **single-page application (SPA)**: one HTML file (`index.html`) loads a bundle
of JavaScript, and that JavaScript takes over the page completely — swapping content
in and out as you click around, without ever asking the server for a new HTML page.
That's what makes it feel instant, like an app rather than a website.

Two halves:

| Half | Technology | Lives where |
|---|---|---|
| **Frontend** (what you see/click) | React 19 + React Router + Redux Toolkit + Tailwind CSS | This repo, `src/` |
| **Backend** (data, accounts, files) | [Appwrite](https://appwrite.io) — a hosted "backend-as-a-service" | Not in this repo — it's a cloud service (or self-hosted server) you configure via `.env` |

You never write server code here. Appwrite already *is* the server: it gives you user
accounts, a database, and file storage over an HTTP API. Your React code just calls
that API using Appwrite's JavaScript SDK.

---

## 2. The full tech stack, and why each piece is here

- **React 19** — builds the UI out of small reusable pieces called *components*
  (a button, a post card, a whole page). When data changes, React figures out what to
  re-draw instead of you doing it by hand.
- **Vite** — the build tool / dev server. `npm run dev` starts a local server that
  rebuilds instantly as you save files. `npm run build` produces the optimized static
  files you'd deploy.
- **React Router (`react-router-dom`)** — maps URLs like `/post/my-slug` to a
  component to render, without a real page reload.
- **Redux Toolkit (`@reduxjs/toolkit`, `react-redux`)** — a small global store that
  holds *one* thing in this app: "is someone logged in, and who?" Any component,
  anywhere, can ask the store instead of passing that info down through props by hand.
- **Appwrite SDK (`appwrite`)** — talks to your Appwrite project for auth, database
  documents, and file storage.
- **React Hook Form (`react-hook-form`)** — manages form state/validation (login,
  signup, the post editor) without re-rendering on every keystroke.
- **TinyMCE (`@tinymce/tinymce-react`)** — the rich text editor used to write post
  content (bold, images, links, etc.), producing HTML.
- **html-react-parser** — takes that stored HTML string back out of the database and
  turns it into real React elements so it can be displayed safely and styled.
- **Tailwind CSS v4** — utility classes (`flex`, `rounded-xl`, `text-ink`) instead of
  hand-written CSS files. v4 is configured entirely in CSS now (see §7), no
  `tailwind.config.js` needed.

---

## 3. Project map

```
Blog/
├── index.html            # the one real HTML file; loads main.jsx as a module
├── .env                  # YOUR secrets (Appwrite project info) — never commit this
├── .env.example           # template showing what .env needs
├── flow.md                # this file
├── src/
│   ├── main.jsx            # entry point: sets up Redux + the router, renders <App/>
│   ├── App.jsx              # the shell: Header + page content (<Outlet/>) + Footer
│   ├── index.css            # design tokens, dark/light theme, global styles
│   ├── conf/conf.js          # reads Appwrite settings out of .env
│   ├── appwrite/
│   │   ├── auth.js           # AuthService — signup, login, logout, "who am I"
│   │   └── config.js         # Service — create/read/update/delete posts + file storage
│   ├── store/
│   │   ├── store.js          # the Redux store itself
│   │   └── authSlice.js      # the one slice of state: { status, userData }
│   ├── context/
│   │   └── ThemeContext.jsx  # light/dark mode state + persistence
│   ├── components/           # reusable building blocks (see §8)
│   └── pages/                # one file per route (see §5)
```

---

## 4. Boot sequence — what happens when the page loads

```mermaid
sequenceDiagram
    participant Browser
    participant index.html
    participant main.jsx
    participant Redux as Redux Store
    participant Router as React Router
    participant App.jsx
    participant Appwrite

    Browser->>index.html: loads page
    index.html->>index.html: inline script sets data-theme (dark/light) before paint
    index.html->>main.jsx: <script type="module">
    main.jsx->>Redux: create store
    main.jsx->>Router: create router (route table)
    main.jsx->>App.jsx: render inside <Provider> + <RouterProvider>
    App.jsx->>Appwrite: authService.getCurrentUser()
    Appwrite-->>App.jsx: user session or null
    App.jsx->>Redux: dispatch login() or logout()
    App.jsx->>Browser: render Header + current page + Footer
```

Key file, `src/main.jsx`: it builds a **route table** with `createBrowserRouter` —
a plain list mapping a URL path to a component — and wraps the whole app in two
providers: Redux's `<Provider>` (so any component can read auth state) and React
Router's `<RouterProvider>` (so URL changes swap the page).

`src/App.jsx` is the **layout shell**. Every single route renders inside it. On
mount, it asks Appwrite "is there a logged-in user right now?" (`getCurrentUser()`),
and stores the answer in Redux. While that check is in flight, it shows a small
spinner instead of flashing a "logged out" UI that would immediately flip to
"logged in". Once resolved, it renders `<Header/>`, then `<Outlet/>` (React Router's
placeholder for "whichever page matched the URL"), then `<Footer/>`.

---

## 5. Routes (the site map)

| Path | Page component | Auth required? | What it shows |
|---|---|---|---|
| `/` | `Home` | No | Hero intro + latest posts |
| `/login` | `Login` | Must be **logged out** | Sign-in form |
| `/signup` | `Signup` | Must be **logged out** | Registration form |
| `/all-posts` | `AllPosts` | Must be **logged in** | Grid of every active post |
| `/add-post` | `AddPost` | Must be **logged in** | Rich-text post editor (create) |
| `/edit-post/:slug` | `EditPost` | Must be **logged in** | Same editor, pre-filled |
| `/post/:slug` | `Post` | No | A single post, full article view |
| `*` (anything else) | `NotFound` | No | 404 page |

"Must be logged in / logged out" is enforced by wrapping the page in
`<AuthLayout authentication={true|false}>` (`src/components/AuthLayout.jsx`).
That component reads `state.auth.status` from Redux and redirects with
`useNavigate()` if the requirement isn't met — e.g. if you try to open
`/add-post` while logged out, it bounces you to `/login`. This is a **client-side**
gate only (it doesn't stop someone from hand-typing an API request) — the real
security boundary is the permissions you set inside Appwrite itself (§9).

---

## 6. Authentication flow

```mermaid
flowchart LR
    A[Signup form] -->|createAccount| B(Appwrite Account API)
    B -->|auto login| C[getCurrentUser]
    C --> D[Redux: login action]
    D --> E[Header shows Logout / Add Post]

    F[Login form] -->|createEmailPasswordSession| B
    G[Logout button] -->|deleteSessions| B
    G --> H[Redux: logout action]
```

- **`src/appwrite/auth.js`** wraps Appwrite's `Account` API in a class,
  `AuthService`, with four methods: `createAccount`, `login`, `getCurrentUser`,
  `logout`. A single instance is exported (`authService`) and reused everywhere —
  there's no reason to create a new Appwrite client per component.
- **`src/store/authSlice.js`** is the Redux slice: two fields, `status` (boolean)
  and `userData` (the Appwrite user object, or `null`). Two actions: `login` and
  `logout`. That's the entire global state of this app — everything else
  (posts, form inputs) lives in local component state because only *auth* needs
  to be known everywhere at once.
- **`src/components/Login.jsx` / `SignUp.jsx`** use `react-hook-form` to collect
  email/password(/name), call `authService`, and on success `dispatch(login({userData}))`
  before navigating home.
- **`LogoutBtn.jsx`** calls `authService.logout()` then `dispatch(logout())`.

---

## 7. The Appwrite backend — what it stores and how

Appwrite gives you three services this app uses, all wrapped in
**`src/appwrite/config.js`** (`Service` class, exported as `service` → imported
as `appwriteService`):

1. **Account** (used only in `auth.js`) — user accounts & sessions.
2. **Databases** — one *Database*, containing one *Collection* ("posts"), where each
   *Document* is a blog post with fields: `title`, `content` (HTML from TinyMCE),
   `featuredImage` (a file ID, not the image itself), `status` (`active`/`inactive`),
   `userId` (who owns it). The document's own `$id` doubles as the post's URL slug —
   that's why `createPost` is called with the slug as the document ID instead of
   letting Appwrite generate one.
3. **Storage** — one *Bucket* holding the uploaded featured images. `uploadFile`
   stores the raw file and returns a file ID; `getFilePreview(fileId)` turns that ID
   into a viewable image URL on the fly (no need to store the URL itself, so
   permissions/CDN transforms stay under Appwrite's control).

**`src/conf/conf.js`** reads five values out of `import.meta.env` (populated from
`.env` by Vite) and exposes them as one object: the Appwrite URL, project ID,
database ID, collection ID, bucket ID. Every Appwrite call in the app goes through
this — change environments (dev vs. prod Appwrite project) by only editing `.env`.

### Data flow: publishing a post

```mermaid
flowchart TD
    A[Fill in title/content in AddPost] --> B[react-hook-form watches title]
    B --> C[auto-generate url-safe slug]
    A --> D[Pick a featured image file]
    D --> E[appwriteService.uploadFile -> Storage bucket]
    E --> F[get back fileId]
    C --> G[appwriteService.createPost]
    F --> G
    G -->|document id = slug| H[Databases collection]
    H --> I[navigate to /post/:slug]
```

Editing (`EditPost`) is the same shape, except it first calls `getPost(slug)` to
pre-fill the form, and on submit calls `updatePost` (replacing the old image file
if a new one was chosen). Deleting removes the database document *and* the stored
image file, so you don't leave orphaned files in the bucket.

---

## 8. Component inventory

Everything reusable lives in `src/components/` and is re-exported from
`src/components/index.js` (a "barrel" file) so pages can write
`import { Button, Input } from "../components"` instead of long relative paths.

| Component | Purpose |
|---|---|
| `Header` / `Footer` | Site chrome — nav, logo, theme toggle, mobile menu |
| `Logo` | The "AH" monogram + "About Abir Hirani" wordmark |
| `ThemeToggle` | Sun/moon button that flips light/dark mode |
| `Container` | Centers content with a max width + side padding |
| `Button`, `Input`, `Select` | Themed form primitives used everywhere |
| `Login`, `SignUp` | The actual auth forms (pages just wrap these) |
| `AuthLayout` | The route guard described in §5 |
| `PostCard` | One post preview tile (image, date, title) used in grids |
| `RTE` | TinyMCE wrapper wired into react-hook-form via `Controller` |
| `post-form/PostForm` | The shared create/edit post form |

Pages (`src/pages/`) are thin — they mostly just arrange components inside a
`<Container>` and fetch whatever data that specific page needs.

---

## 9. Setting up your own Appwrite backend

The frontend is useless without a real Appwrite project behind it. Steps:

1. Create a project at [cloud.appwrite.io](https://cloud.appwrite.io) (or run
   self-hosted Appwrite).
2. **Add a Web platform** in the project's settings with your dev URL
   (`http://localhost:5173`) so the SDK is allowed to call the API from the browser.
3. **Databases** → create a database → create a collection (e.g. "posts") with
   attributes matching what `config.js` writes: `title` (string), `content`
   (string, large size — it's HTML), `featuredImage` (string), `status` (string),
   `userId` (string). Set collection permissions so:
   - Any user can **read** documents with `status = active` (or just allow read for
     `any`/`users` and rely on the app filtering, matching what `getPosts()` already
     queries).
   - Only authenticated users can **create**; only the document's owner can
     **update/delete** (Appwrite's per-document permissions, set at creation time,
     handle this — this app currently relies on collection-level "users" permission,
     so tightening to per-document owner permissions is a good next step).
4. **Storage** → create a bucket for images, with read access open and
   create/delete restricted to authenticated users.
5. Copy `.env.example` to `.env` and fill in the five values from the project
   settings, database, collection, and bucket you just created:

   ```
   VITE_APPWRITE_URL=https://cloud.appwrite.io/v1
   VITE_APPWRITE_PROJECT_ID=...
   VITE_APPWRITE_DATABASE_ID=...
   VITE_APPWRITE_COLLECTION_ID=...
   VITE_APPWRITE_BUCKET_ID=...
   ```
6. Restart `npm run dev` (Vite only reads `.env` at startup).

Without a valid `.env`, the app used to hard-crash to a blank white screen — that
was one of the bugs fixed in this pass (see §11).

---

## 10. The design system (dark/light mode redesign)

The UI was rebuilt around a small, warm, editorial palette instead of the default
gray/blue Tailwind starter look — meant to feel like a personal essay/writing space
rather than a generic SaaS dashboard.

- **Typography** — `Fraunces` (a serif with real character) for headings, `Inter`
  for body/UI text. Loaded via Google Fonts in `index.html`. This pairing is what
  gives the "editorial" feel: warm serif headlines over clean, neutral UI text.
- **Color** — one accent color, a burnt-orange (`--color-accent`), used sparingly
  (buttons, links, active nav state, hover accents) against warm neutral
  "paper"/"ink" backgrounds instead of pure white/black. Named tokens (defined in
  `src/index.css` under Tailwind v4's `@theme`) generate real Tailwind utilities:
  `bg-paper`, `text-ink`, `text-ink-muted`, `bg-surface`, `border-border-soft`,
  `bg-accent`, `text-accent`, `bg-danger`, etc. — so every component uses the same
  semantic names instead of hard-coded hex values or Tailwind's generic `gray-500`.
- **Dark/light mode mechanism** — Tailwind v4 normally infers dark mode from the OS
  (`prefers-color-scheme`). Instead, `index.css` declares a **custom variant**:
  ```css
  @custom-variant dark (&:where([data-theme="dark"], [data-theme="dark"] *));
  ```
  and every token is defined twice: once as the light default inside `@theme`, and
  once overridden under `:root[data-theme="dark"] { ... }`. Toggling dark mode is
  then just flipping one HTML attribute (`<html data-theme="dark">`) — every
  utility class using those tokens updates instantly, no class-swapping needed on
  individual elements.
  - `src/context/ThemeContext.jsx` owns the current theme in React state, writes it
    to `localStorage`, and sets the attribute on `<html>`.
  - A small inline `<script>` in `index.html`'s `<head>` sets the attribute
    *before* React even loads, reading the saved preference (or the OS preference
    on first visit) — this avoids a "flash of wrong theme" on page load.
  - `ThemeToggle.jsx` is the sun/moon button in the header that flips it.
- **Motion/texture** — subtle only: a soft `fade-up` entrance on hero/card content,
  a hover lift on cards/buttons, and a faint grain texture behind the hero so flat
  color fields don't look cheap. Nothing animates aggressively or blocks reading.
- **Layout patterns** — a sticky, translucent (blurred) header; generous whitespace;
  rounded-2xl cards/panels throughout for a soft, consistent shape language;
  content capped at a comfortable reading width (`Container`, and a narrower
  `max-w-3xl` specifically for the article body on `/post/:slug`).

---

## 11. Bugs fixed while doing this pass

The project as handed over didn't actually run. Worth knowing about, since some of
these are common beginner pitfalls:

- **Hard crash with no `.env`**: Appwrite's client throws immediately if given an
  invalid URL, and `conf.js` was turning a missing env var into the literal string
  `"undefined"`. Since that crash happened at *import time* (module load), it took
  down the entire app before React could even render an error — you just got a
  blank white page with nothing in the console overlay. Fixed by making sure a
  `.env` always exists (`.env.example` as the template).
- **`conf.js` shape mismatch**: `conf.js` exported a nested object
  (`conf.appwrite.url`), but `auth.js`/`config.js` read flat properties
  (`conf.appwriteUrl`). Every Appwrite call was silently getting `undefined`.
  Standardized on the flat shape.
- **Case-sensitive import paths**: several imports referenced files by a different
  case than the actual filename (`store/store.js` vs `Store.js`,
  `components/index.js` vs `Index.js`, `pages/Signup` vs `SignUp.jsx`). Windows
  ignores this; Linux (most deploy targets, and most CI) does not — the build
  would fail the moment it left this machine. Renamed files to match imports.
- **Typos in folder names**: `components/post-from/PostFrom.jsx` →
  `components/post-form/PostForm.jsx`; `Container/Contanier.jsx` → `Container.jsx`.
- **`main.jsx` imported a `Home` page that didn't exist** — there was no landing
  page component at all. Created `src/pages/Home.jsx`.
- **`App.jsx` used `<Outlet/>`, `login`, `logout` without importing them**, and had
  a literal `TODO:` string that would have rendered as visible text on every page.
- **Login/Signup dispatched the wrong Redux payload shape**: `dispatch(authLogin(userData))`
  instead of `dispatch(authLogin({ userData }))` — since the reducer reads
  `action.payload.userData`, the user object was silently getting dropped and
  `state.auth.userData` would stay `null` even after a successful login.
- **`AllPosts.jsx` called `appwriteService.getPosts()` directly in the component
  body** (not inside `useEffect`) — every re-render (including the one triggered by
  its own `setPosts`) fired another fetch. Moved into `useEffect(..., [])`.
- Removed unused leftover Vite starter assets (`App.css`, `hero.png`, `react.svg`,
  `vite.svg`) that weren't referenced anywhere.

---

## 12. Running it locally

```bash
npm install
cp .env.example .env   # then fill in your Appwrite values, see §9
npm run dev
```

Open the printed `localhost` URL. `npm run build` produces a production bundle in
`dist/`; `npm run preview` serves that build locally to sanity-check it.

---

## 13. The starfield background and the `/about-me` bento dashboard

Added after the initial redesign, in the same spirit but with a different flavor:
a pixel-art starfield background (a `<canvas>` component under `src/components/ui/`,
following the [shadcn](https://ui.shadcn.com) convention of a dedicated `/ui` folder
for reusable primitives — see `components.json`), and a bento-grid "About Me" page
shown right after signing in, styled after
[shivy02/portfolio-website](https://github.com/shivy02/portfolio-website)
(Apache-2.0 licensed source, personal content not reused — see that repo's `LICENSE`).

**TypeScript, incrementally.** The project stayed JavaScript everywhere it already
was; new files (`.tsx`) were added alongside it rather than converting the whole
codebase. `tsconfig.json` + the `@/*` → `src/*` alias (mirrored in `vite.config.js`)
are what make that possible — Vite compiles `.tsx` regardless, the tsconfig is what
gives you real type-checking (`npx tsc --noEmit`) and editor IntelliSense.

**The starfield (`background-pixel-stars.tsx`)** is mounted once, globally, in
`App.jsx` — not painted behind everything unconditionally, though. It's a night-sky
effect: visible in dark mode site-wide, and always-on specifically for `/about-me`
(see below), gated by `theme === 'dark' || pathname === '/about-me'`. Two things had
to change for it to actually be visible at all: the canvas needed `-z-10` (negative
z-index elements paint behind normal in-flow content, regardless of DOM order), and
the app shell's own opaque `bg-paper` had to be removed — the shell no longer paints
a solid background over the whole viewport, `body`'s own background (from
`index.css`) is the base layer *below* the canvas instead, so the canvas isn't
hidden behind an opaque rectangle sitting on top of it. It's mobile-hardened:
DPR-aware canvas sizing (crisp on retina, not blurred), debounced resize +
`orientationchange` handling, and it pauses via the Page Visibility API when the tab
isn't visible (battery).

**`/about-me`** is a protected route (`AuthLayout authentication`), and `Login`/
`Signup` navigate there instead of `/` on success. It forces a dark palette on its
own content regardless of the site-wide theme toggle — done by widening the CSS dark
override in `index.css` from `:root[data-theme="dark"]` to plain `[data-theme="dark"]`,
so setting that attribute on *any* element (not just `<html>`) scopes the dark tokens
to just that subtree. The page's own wrapper div does exactly that.

Cards (`src/components/ui/bento-card.tsx`) are laid out with CSS Grid
(`.about-me-grid` in `index.css`, named `grid-template-areas`, one definition for
mobile single-column, one for a 5-column desktop layout). One real bug worth
knowing about if you touch this: grid/flex tracks default to a minimum size based
on their content (`min-width: auto`), so the `Marquee` cards (Tools, Last Played) —
which intentionally have a wide, unclipped duplicated track for the CSS-scroll
illusion — were forcing the *entire grid* wider than the viewport on mobile. Fixed
with `minmax(0, 1fr)` instead of bare `1fr` on the grid columns; that's the standard
fix for "a flex/grid item's intrinsic content width is inflating its container."

Content lives in `src/data/about-me.js` — one file, clearly marked `EDIT ME` for
anything that isn't independently verifiable (travel history, coffee count).
`githubUsername`, `contact.email`, and `contact.github` are filled in with real
values (from this project's git config and session context), not placeholders.

**Live widgets** (GitHub activity, WakaTime hours, Spotify last-played) go through
`functions/dashboard-data/`, a small Appwrite Function — necessary because two of
those three need real secrets (WakaTime API key; Spotify client secret + refresh
token) that must never ship in the frontend bundle (anything under `VITE_*` in
`.env` is public, readable by anyone who opens dev tools). See that function's own
README for the full deploy walkthrough, including `scripts/get-spotify-refresh-token.mjs`
— a one-time local helper for the Spotify OAuth handshake, since that step
inherently requires a real browser login only you can do. Until
`VITE_DASHBOARD_FUNCTION_URL` is set, `useDashboardData` (`src/hooks/`) quietly
falls back to the placeholder data in `about-me.js` — the page never looks broken
for not having these deployed yet.

**cobe globe.** `src/components/ui/globe.tsx` uses [cobe](https://github.com/shu-ding/cobe)
for the dot-matrix globe with a flight arc between two points. Worth noting: the
reference repo pins cobe 0.6.x, which has no native arc support, so it hand-rolls a
second overlay `<canvas>` with its own great-circle projection math just to draw the
flight path. The version that actually installs here is cobe 2.x, which added
`arcs`/`markerElevation` as real config options — so that whole overlay approach
was dropped in favor of just using the real API. One gap: cobe's shipped `.d.ts`
doesn't declare `onRender` even though it's a genuine, documented runtime option;
`globe.tsx` fills that gap with a local type intersection rather than reaching for
`as any`.

**Brand icons.** `lucide-react` dropped brand/logo marks (GitHub, Twitter, etc.) in
the version installed here — `src/components/ui/icons.tsx` has a small local
`GithubIcon` SVG for the one place that needed it, rather than pulling in a second
icon package.

---

## 14. Reasonable next steps (not done here, worth knowing about)

- Per-document Appwrite permissions (owner-only update/delete) instead of relying
  on collection-level rules, for real defense in depth.
- Pagination on `/all-posts` (currently fetches every active post at once).
- A dedicated 401/empty-state illustration instead of the plain 404 for protected
  routes bounced to `/login`.
- Code-splitting the router (React.lazy per page) — the production bundle is a
  single ~510 KB JS file today, mostly TinyMCE; only loading the editor bundle on
  `/add-post` and `/edit-post` would shrink every other page's initial load.
