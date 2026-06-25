# SpendWise — Deployment & Backend Setup

This is your step-by-step for taking SpendWise live and (later) adding login +
multi-device sync. Do the steps in order. Anything that needs an account or a
secret is **yours to do** — Claude can't create accounts or enter credentials.

Decisions locked in:
- **Hosting:** Vercel (free)
- **Backend:** Supabase — auth + Postgres + row-level security (free tier)
- **Login:** Google sign-in
- **AI:** Bring-Your-Own-Key (each user pastes their own Claude key; it stays in
  their browser and is never synced to the cloud). No AI cost to you.

---

## Step 1 — Deploy to Vercel (do this first)

1. Go to <https://vercel.com> and sign up / log in **with GitHub**.
2. **Add New… → Project** → import `shashwatsingh07/SpendWise`.
3. Vercel auto-detects Vite. Leave defaults:
   - Build command: `npm run build`
   - Output directory: `dist`
4. Click **Deploy**. In ~1 min you get a live URL like `spendwise-xxxx.vercel.app`.
5. Every future `git push` to `main` auto-redeploys.

`vercel.json` (already in the repo) handles SPA routing so deep links like
`/insights` and page refreshes don't 404.

✅ At this point the full app is live and installable (PWA). No backend yet —
data is still per-device in the browser. That's expected; sync comes in Step 3.

---

## Step 2 — PWA (already built, nothing to do)

The app ships installable + offline-capable: web manifest, icons, and a service
worker are in `/public`. On the live site, your browser will offer **"Install"**
/ **"Add to Home Screen."** Nothing for you to configure.

---

## Step 3 — Supabase project (for login + sync)

> Do this when you're ready for accounts + multi-device. The app works fully
> without it.

1. Go to <https://supabase.com>, sign in, **New project**. Pick a name + a strong
   database password (save it). Choose the region closest to you.
2. When it finishes provisioning, open **Project Settings → API** and copy:
   - **Project URL**
   - **anon public** key  ← safe to expose in the frontend
3. Send those two values to Claude. They go into a `.env` file (gitignored):
   ```
   VITE_SUPABASE_URL=...        # Project URL
   VITE_SUPABASE_ANON_KEY=...   # anon public key
   ```
4. **Database schema** — open **SQL Editor** in Supabase and run the SQL Claude
   provides during the auth/sync build (one table per user with row-level
   security so a user can only read/write their own rows).

---

## Step 4 — Google sign-in (OAuth)

> Needs your live Vercel URL from Step 1.

1. Go to <https://console.cloud.google.com> → create a project (or reuse one).
2. **APIs & Services → OAuth consent screen** → External → fill app name +
   support email → save. Add yourself as a test user while developing.
3. **APIs & Services → Credentials → Create Credentials → OAuth client ID** →
   type **Web application**.
4. Under **Authorized redirect URIs**, add the callback URL from your Supabase
   project: **Supabase → Authentication → Providers → Google** shows the exact
   `https://<your-project>.supabase.co/auth/v1/callback` URL — paste that.
5. Copy the **Client ID** and **Client secret** Google gives you.
6. In **Supabase → Authentication → Providers → Google**: enable it, paste the
   Client ID + secret, save.
7. Add your site URLs in **Supabase → Authentication → URL Configuration**:
   - Site URL: your Vercel URL
   - Redirect URLs: your Vercel URL + `http://localhost:5173` (for local dev)

That's all on your side — Claude wires the login button and session handling.

---

## AI (Bring-Your-Own-Key) — already working

Each user adds their own Claude API key in **Settings → AI Settings**
(<https://console.anthropic.com> → API keys). The key is stored **only in that
browser** and used to call Claude directly. It is intentionally **not** synced to
the cloud, so you never hold anyone's secret key. Users without a key still get
the full app — only the AI prose/chat features stay off for them.

---

## Quick reference — who does what

| Task | You | Claude |
|---|---|---|
| Create Vercel / Supabase / Google accounts | ✅ | — |
| Provide Project URL + anon key, OAuth client id/secret | ✅ | — |
| Run the schema SQL in Supabase | ✅ (paste & run) | writes the SQL |
| Vercel config, PWA, login UI, sync layer, code | — | ✅ |
| Push to GitHub / deploy | trigger on Vercel | writes & pushes code |
