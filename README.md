<p align="center">
  <img src="public/favicon-192.png" width="96" height="96" alt="Goblin" />
</p>

<h1 align="center">Goblin</h1>

<p align="center"><b>Launch videos that already look like your brand.</b></p>

Goblin is a library of original motion templates for software teams that ship
often and don't have a motion designer. Set your brand kit once (name,
colours, font and motion feel) and every template restyles itself to match.
Pick one by outcome, fill in your copy, and export an MP4 in 16:9, square or
vertical, with a soundtrack timed to its cuts.

Live at **[usegoblin.xyz](https://www.usegoblin.xyz)**. Previews run in the
browser now. MP4 export opens to the waitlist first.

## The library

232 templates, each one hand-built in-house on [Remotion](https://www.remotion.dev).
They are code, not AI generations, so the video you preview is the video you
get, every time.

| Category | Templates | For example |
|---|---|---|
| Product | 55 | Fast Product Ad, UI Morph, Dashboard Remix, UGC Ad Generator |
| Showreel | 55 | Showreel, ASCII Bass Drop, Marble Music Machine |
| Launch | 29 | Launch intro, Feature drop, Changelog, Game Launch |
| Explainer | 26 | Token Bucket, Derivative Explainer, Stirred Cocktail Recipe |
| Social | 25 | Kinetic Type Reel, Festival Lineup Reel, Ring Escape |
| Story | 23 | Lighthouse Keeper, The Bug Who Hid, Shadow Theatre: Home |
| Brand | 13 | Editorial Brand Film, End card |
| Data | 6 | Backlink Audit, bar charts, traction posts |

Every template:

- reads all colours, type and easing from the brand kit, never hard-coded values
- exposes its copy as editable fields with sensible defaults
- runs at 30 fps, 8 to 23 seconds long, in 1920×1080 or 1080×1920
- ships with its own generated soundtrack in `public/tracks/`

## How it works

```
src/library/
  brand.ts       Brand kit type, fonts, motion presets and starter kits
  motion.tsx     Shared motion kit: timing, easing, palette, text, devices, icons
  kit.ts         Template props and shared types
  catalog.ts     One entry per template: id, title, category, fields, soundtrack
  registry.ts    Builds the template list the site and renderer use
  templates/     The templates (newer ones in templates/lib/, lazy-loaded)
render/          Remotion entry for MP4 rendering
scripts/
  render.mjs     Render any template to MP4
  audio/         Soundtrack synth (synth.py) and per-template tracks (tracks.py)
public/tracks/   Generated soundtracks, one WAV per template
src/app/         The site: homepage library, brand kit editor, account
```

Each template is a pure function of time. It takes `{ brand, content, audio }`,
reads the current frame from `useT()` and draws with SVG or HTML. The homepage
preview and the MP4 render use the same component, so they always match.

## Development

Vite · React · TypeScript · Tailwind CSS · Remotion · Framer Motion, deployed
on Vercel from `main` (`vercel.json`, serverless functions in `api/`).

```bash
npm install
npm run dev          # site with live previews
npm run build        # typecheck, then production build
```

Render a template to MP4:

```bash
node scripts/render.mjs <template-id> out/<template-id>.mp4 [--blur 3] [--frames 0-120]
```

Set `BROWSER_EXECUTABLE` to use a specific Chrome or Chromium.

Regenerate soundtracks (needs Python 3 with NumPy):

```bash
python3 scripts/audio/tracks.py <template-id> [<template-id> ...]
```

### Adding a template

1. Create `src/library/templates/lib/<Name>.tsx`. Use the motion kit and the
   brand palette, and play the track with `<Track src="tracks/<id>.wav" on={audio} />`.
2. Add a catalog entry in `src/library/catalog.ts` with a `lazy` import, title,
   category, outcome, tags, default copy, fields and `soundtrack`.
3. Add a `@track` function to `scripts/audio/tracks.py` and generate the WAV.
4. Run `npm run build`, then check a few frames before shipping.

Templates must be original Goblin designs. Default names, artists and lyrics
are fictional, and no template carries another company's branding.

### Environment

Copy keys into `.env.local`, which is git-ignored and never committed.
`VITE_POSTHOG_KEY` turns on product analytics. Without it, analytics does
nothing.

Sign-in uses [Better Auth](https://better-auth.com) (`api/_betterauth.ts`,
served at `/api/auth/*`), with accounts in Supabase Postgres:

| Variable | What it is |
|---|---|
| `DATABASE_URL` | Postgres connection string for the auth database |
| `BETTER_AUTH_SECRET` | Signing secret for sessions |
| `BETTER_AUTH_URL` | Site URL in production (previews infer it) |
| `BETTER_AUTH_API_KEY` | Better Auth Infrastructure dashboard, read by `dash()` |
| `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` | Google sign-in, optional |
| `VITE_GOOGLE_AUTH` | Set to `1` to show the Google button once the above are set |

## Legacy

Goblin started as a lab building real-time AI personas. The persona pages
(`/labs`, `/studio`, `/personas`, `/p/:id`, `/embed/:id`, `/demo/*`) and their
`api/` functions are still in the repo but are no longer the product.

## License

© 2026 Goblin Labs
