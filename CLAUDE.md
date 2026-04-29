# Uboard Dashboard

A small Next.js dashboard that reads data from a Google Sheet and renders it server-side. No database, no auth layer — just a service account talking to the Sheets API.

## Stack

- **Next.js 16.2.4 / React 19.2.4** — breaking changes from older versions exist. Before writing any Next.js code, check `node_modules/next/dist/docs/` for the canonical API. Do not assume Next 13/14/15 conventions apply.
- **App Router** — all routes live under `src/app/`. The single page (`page.tsx`) is a React Server Component; there are no client components yet.
- **Tailwind CSS v4** — configured via `postcss.config.mjs`. No `tailwind.config.*` file; v4 uses CSS-first config.
- **googleapis** — official Google client library for Sheets API v4.

## Key files

| File | Purpose |
|---|---|
| `src/lib/sheets.ts` | Server-only data layer. Builds a JWT auth client from env vars and exposes `getNames()`, which reads `Sheet1!A2:A`. Never import this from a client component. |
| `src/app/page.tsx` | Dashboard page. Server component, `force-dynamic`. Calls `getNames()`, renders a numbered list. Shows an error card on failure. |
| `src/app/layout.tsx` | Root layout — fonts, metadata, global CSS. |
| `src/app/globals.css` | Global styles and Tailwind imports. |
| `next.config.ts` | Next.js config. |

## Environment variables

**Local:** `.env.local` in the project root (gitignored, never committed).

```
GOOGLE_SHEET_ID_MAIN=          # The spreadsheet ID from the URL
GOOGLE_SERVICE_ACCOUNT_EMAIL=  # service-account@project.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY=            # PEM key with literal \n for newlines
```

The credentials JSON lives **outside** the project at:
`C:\Users\UBOARD\Desktop\Security Claude Key\`

Do not reference, copy, or embed that file's contents into the repo.

**Production:** env vars are set in the Vercel dashboard under Project → Settings → Environment Variables. Never bake them into build output or logs.

## Data flow

```
Google Sheet
  → service account JWT  (GOOGLE_SERVICE_ACCOUNT_EMAIL + GOOGLE_PRIVATE_KEY)
  → googleapis Sheets v4 client
  → src/lib/sheets.ts :: getNames()
  → src/app/page.tsx  (Server Component, rendered on each request)
  → HTML → browser
```

## Conventions

- **Never** log or print any `process.env` value, even partially.
- **Never** commit any file matching `.env*`.
- **Never** import `src/lib/sheets.ts` from a client component — it holds credentials at runtime.
- Keep data fetching in Server Components or Route Handlers; don't expose the Sheets client to the client bundle.
- `force-dynamic` is intentional on `page.tsx` — data must be fresh on every request.
