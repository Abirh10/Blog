# dashboard-data (Appwrite Function)

Proxies live widgets for the `/about-me` page. The `github` route needs no
secret at all — it's the primary source for **Activity**, **Hours Coding**,
and **Coffees Drank** (see below). `spotify` needs real secrets that must
never end up in the frontend bundle — anything under `VITE_*` in this repo's
`.env` gets shipped to the browser in plain text, which is fine for the
Appwrite project ID but **not** fine for those.

## What it serves

| `?type=` | Needs a secret? | Returns |
|---|---|---|
| `github` | No — scrapes the same public markup `github.com/<user>/` renders | `{ contributions: [{date, level}], totalContributions }` |
| `wakatime` | Yes — `WAKATIME_API_KEY` | `{ totalHours }` (optional; see below) |
| `spotify` | Yes — `SPOTIFY_CLIENT_ID`, `SPOTIFY_CLIENT_SECRET`, `SPOTIFY_REFRESH_TOKEN` | `{ track: {...} | null }` |

**Hours Coding / Coffees Drank are derived from `github`'s `totalContributions`**
(`AboutMe.jsx`: `hours ≈ totalContributions × hoursPerContribution`, a tunable
heuristic in `src/data/about-me.js` — GitHub doesn't expose actual time spent,
so this is an estimate, not a measurement). That's the whole reason `wakatime`
is optional here: deploying just the `github` route already lights up Activity,
Hours Coding, and Coffees Drank with zero extra accounts or API keys. The
`wakatime` route is left in place only in case you'd rather wire in real
tracked time later — nothing in the frontend calls it right now.

## 1. Deploy the function

In the Appwrite Console for your project:

1. **Functions → Create function**.
2. Runtime: **Node.js 18+** (any current Node runtime works).
3. Entrypoint: `src/main.js`.
4. Connect this folder (`functions/dashboard-data`) — either push it with the
   Appwrite CLI (`appwrite deploy function` from this directory), or use the
   Console's "manual" upload and zip this folder's contents.
5. **Settings → Execute Access**: set to **Any** — this endpoint only ever
   returns non-sensitive display data (your GitHub activity, coding hours,
   currently-playing song), the same things this page renders publicly
   anyway, so there's nothing to protect by requiring a session here.
6. **Settings → Domains**: generate a domain so the function gets a plain
   HTTPS URL you can `fetch()` directly (instead of going through the
   Appwrite SDK's executions API). Copy that URL.

No secrets are required for step 1 alone to already light up Activity, Hours
Coding, and Coffees Drank — skip straight to step 4 if you don't want Spotify.

## 2. Set the secrets (optional — only for Spotify; in the function's own Variables tab, NOT the repo's `.env`)

- `SPOTIFY_CLIENT_ID` / `SPOTIFY_CLIENT_SECRET` — create an app at
  [developer.spotify.com/dashboard](https://developer.spotify.com/dashboard)
  ("Create app", any name/description, redirect URI
  `http://127.0.0.1:8888/callback` — you only need this for step 3 below).
- `SPOTIFY_REFRESH_TOKEN` — see step 3.

## 3. Get a Spotify refresh token (one-time, on your machine)

Spotify's API only shows *your* listening activity if you grant it once via
a real login — there's no way around a browser step for this one. Run the
helper script from the repo root:

```bash
node scripts/get-spotify-refresh-token.mjs <your-spotify-client-id> <your-spotify-client-secret>
```

It opens `http://127.0.0.1:8888/authorize`, redirects you to Spotify to log
in and approve, then prints a refresh token straight to your terminal —
paste that into the function's `SPOTIFY_REFRESH_TOKEN` variable. The token
never passes through this chat or gets written to any file in the repo.

## 4. Point the frontend at it

Add the function's URL to `.env` (this one's fine to be public — it's just
an endpoint, not a secret):

```
VITE_DASHBOARD_FUNCTION_URL=https://<your-function-domain>
```

Without this variable set, `/about-me` automatically falls back to the
static placeholder data in `src/data/about-me.js` — nothing breaks, it just
won't be "live" until this is configured.
