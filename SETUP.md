# mindre — Setup Guide

## Cross-device sync with Vercel KV

Your data now syncs across all devices via Vercel KV (Redis).  
localStorage is still used as an instant-load cache.

---

## 1. Install the Vercel KV package

```bash
npm install @vercel/kv
```

---

## 2. Create a KV database on Vercel

1. Go to your project on [vercel.com](https://vercel.com)
2. Click **Storage** tab → **Create Database** → **KV**
3. Name it (e.g. `mindre-db`) and click **Create**
4. Click **Connect to Project** and select your project

Vercel will automatically add these env vars to your project:
- `KV_URL`
- `KV_REST_API_URL`
- `KV_REST_API_TOKEN`
- `KV_REST_API_READ_ONLY_TOKEN`

---

## 3. For local development

Pull the env vars to your `.env.local`:

```bash
npx vercel env pull .env.local
```

Then run:

```bash
npm run dev
```

---

## 4. Deploy

```bash
git add .
git commit -m "add vercel kv sync"
git push
```

Vercel auto-deploys on push. Done!

---

## How it works

| Layer | Role |
|---|---|
| Vercel KV (Redis) | Source of truth, cross-device |
| localStorage | Instant cache on load (no flicker) |
| Svelte store | Reactive in-memory state |

On page load → fetches from KV → updates store + cache.  
On every change → saves to store + cache immediately, then syncs to KV.

---

## Files changed

```
src/
├── app.css                          ← redesigned theme
├── routes/
│   ├── +layout.svelte               ← cleaner header
│   ├── +page.svelte                 ← better home/deck grid
│   ├── api/decks/+server.js         ← NEW: KV API route
│   ├── deck/[id]/+page.svelte       ← edit-in-place cards
│   └── study/[id]/+page.svelte      ← shuffle + done screen
└── lib/
    └── stores.js                    ← KV sync + localStorage cache
```

## New features

- **Cross-device sync** via Vercel KV
- **Edit cards** in-place (pencil button)
- **Shuffle mode** in study mode
- **Done screen** when you finish all cards
- **Progress bar** in study mode
- **Dot indicators** showing card position
- **Hover-reveal** delete buttons (cleaner UI)
