# Mindre

Mindre is a terminal-inspired flashcard app for developers. This version keeps the existing SvelteKit UI and code-card study flow while using Supabase Auth, Postgres, Row-Level Security, and private Storage as its production data layer.

## Stack

- SvelteKit + TypeScript
- `@supabase/ssr` and `@supabase/supabase-js`
- Supabase Google OAuth
- Supabase Postgres with RLS
- Private `mindre-files` Storage bucket
- Highlight.js code rendering

## Supabase setup

### 1. Create a Supabase project

Create a project in the Supabase dashboard and copy its project URL and anon/publishable client key. Never use the service-role key in this application.

### 2. Run the database migration

Run `supabase/migrations/20260722180000_mindre_supabase.sql` in the Supabase SQL Editor, or link the Supabase CLI project and run:

```bash
supabase link --project-ref YOUR_PROJECT_REF
supabase db push
```

The migration creates the application tables, constraints, indexes, profile trigger, ownership triggers, RLS policies, import function, and the private `mindre-files` bucket with Storage policies.

### 3. Verify the private Storage bucket

The migration creates `mindre-files` with `public = false`, a 10 MB file limit, and owner-folder policies. After running it, open Supabase Dashboard → Storage and confirm the bucket exists and remains private. Do not switch it to a public bucket.

### 4. Enable Google OAuth

In Google Cloud Console, create OAuth web credentials and add this authorized redirect URI:

```text
https://YOUR_PROJECT_REF.supabase.co/auth/v1/callback
```

In Supabase Dashboard → Authentication → Providers → Google, enable Google and add the client ID and secret.

In Supabase Dashboard → Authentication → URL Configuration:

- Set the local Site URL to `http://localhost:5173` while developing.
- Add `http://localhost:5173/auth/callback` to Redirect URLs.
- Add the production callback URL, for example `https://mindre.example.com/auth/callback`.

### 5. Configure environment variables

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

Then add:

```text
PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
PUBLIC_SUPABASE_ANON_KEY=YOUR_PUBLIC_ANON_OR_PUBLISHABLE_KEY
```

### 6. Install and run

Mindre uses current Supabase and SvelteKit packages and requires Node.js 22.12 or newer.

```bash
npm install
npm run dev
```

Open `http://localhost:5173`.

For a production check:

```bash
npm run check
npm run build
```

## Local data import

After Google sign-in, Mindre checks for the former `mindre-cache` localStorage value. The user can import it or dismiss the notice. Imports are atomic through a Postgres function and fingerprinted in `local_imports`, so the same snapshot is not imported twice. Local data is removed only after Supabase confirms a successful or previously completed import.

## Review scheduling

The review system is intentionally small and SM-2-inspired:

- **Again:** resets repetitions and schedules the card in 10 minutes.
- **Hard:** slightly lowers ease and grows the previous interval by about 1.2×.
- **Good:** schedules 1 day, then 3 days, then multiplies by the ease factor.
- **Easy:** schedules 4 days, then 7 days, then applies an ease bonus.

Ease is constrained between `1.30` and `3.20`. The calculated state is stored in `card_progress`. “Review due cards” includes unreviewed cards and cards whose `due_at` is in the past.

## Storage behavior

Attachments upload directly from the authenticated browser to paths shaped like:

```text
{userId}/{deckId}/{generatedFileId}-{safeFilename}
```

The bucket is private. Downloads use the authenticated Supabase client. The app removes Storage objects before deleting their attachment, card, or deck records; database cascades remove related metadata and review progress.
