# TryOnFashion

TryOnFashion is a premium fashion discovery and closet app built with Next.js, App Router, Tailwind CSS, Clerk, Drizzle ORM, and Neon PostgreSQL. The product lets users discover looks from fashion websites, save items to a personal digital closet, and prepare for future virtual try-on experiences.

## Stack

- Next.js 16 with App Router and TypeScript
- Tailwind CSS
- Clerk authentication with Google sign-in
- Drizzle ORM with Neon PostgreSQL
- React Hook Form + Zod for validation
- Lucide icons

## Local setup

1. Install dependencies:

```bash
npm install
```

2. Create a local environment file from the example:

```bash
cp .env.example .env
```

3. Update the values in `.env` with your own secrets and database URL.

Required variables:

```bash
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_replace-with-your-clerk-publishable-key
CLERK_SECRET_KEY=sk_test_replace-with-your-clerk-secret-key
DATABASE_URL=your-neon-postgres-connection-string
BLOB_READ_WRITE_TOKEN=provided-by-vercel-blob
AI_GATEWAY_API_KEY=your-vercel-ai-gateway-key
```

## Neon database setup

1. Copy the connection string from your Neon project and set it as `DATABASE_URL` locally and in Vercel. A Neon pooled connection URL is supported by the app's Neon serverless driver.
2. Apply the committed Drizzle migration:

```bash
npm run db:migrate
```

Vercel runs the same migration automatically through `npm run vercel-build`. The initial migration creates the app's tables, including `User` and `SavedItem`.

## Personal photo gallery

Connect a Vercel Blob store to the project and enable it for Production, Preview, and Development as needed. Vercel provides `BLOB_READ_WRITE_TOKEN` (or its OIDC Blob connection variables) automatically. Gallery uploads are private, tied to the signed-in user in Neon, and served back through an authenticated route. Users can upload JPEG, PNG, WebP, or AVIF photos up to 4 MB each, preview them, and delete them. The Drizzle migration adds the `GalleryPhoto` table.

## Virtual Try-On

The signed-in `/closet/try-on` page pairs one of the user's Gallery photos with a saved Closet item that has a product image. It sends the two images to Google's Gemini 3 Pro Image model through Vercel AI Gateway and returns an ephemeral preview; generated images are not persisted. Add an `AI_GATEWAY_API_KEY` from your Vercel AI Gateway settings to local `.env`. For Vercel deployments, configure an AI Gateway key or the supported Vercel OIDC integration. Each request is authenticated, checks ownership of both selected records, and fetches only public HTTPS product images.

## Featured stores

The `/stores` directory lets users choose a women's or men's department and requests product cards from a fixed set of public retailer category pages. The server only fetches hard-coded HTTPS URLs for known retailers, limits redirects to their domains, validates product links and image CDN hosts, and caches parsed catalog results in the Next.js data cache for 15 minutes. Transient errors are not cached so users can retry; rate limits and access blocks are reported clearly. Retailers may block automated access or change their page markup, so live listings are best-effort, not guaranteed. This is not an official product feed and should be replaced with retailer-approved APIs or licensed affiliate feeds for a durable production catalog. Respect each retailer's terms and image/data display requirements; the app does not attempt to bypass access controls.

## Clerk and Google sign-in setup

1. Create a Clerk application and copy its publishable and secret keys into `.env`.
2. In Clerk Dashboard, enable Google as a social connection. Clerk handles the Google OAuth callback; configure Google credentials and the authorized redirect URI shown in Clerk's Google connection setup if using your own Google OAuth credentials.
3. Add your local and production application domains in Clerk's allowed origins and redirect settings.
Google sign-in is configured through Clerk. This app no longer hosts a `/api/auth/callback/google` endpoint.

## Chrome extension

The standalone Manifest V3 extension lives in `extension/` and uses Plasmo plus Clerk's Chrome Extension SDK. It reads product JSON-LD/Open Graph metadata from the active tab, lets the user review/edit it, and saves through `POST /api/extension/closet` with a verified Clerk bearer token.

1. Copy `extension/.env.development.example` to `extension/.env.development` and set the Clerk Chrome Extension publishable key, Clerk Frontend API URL, Clerk Sync Host, and API URL. For production builds, configure the equivalent values in `extension/.env.chrome`.
2. In Clerk Dashboard, enable the **Native API**. Clerk's extension quickstart requires the Native API for browser extensions.
3. Allow the exact extension origin (such as `chrome-extension://<id>`) in Clerk's instance allowed origins and set the web app's `CHROME_EXTENSION_ORIGINS` to the exact comma-separated origins for the unpacked and published extension IDs. Set the web app's `CLERK_AUTHORIZED_PARTIES` to the web app origin(s) that issue the synced Clerk session token (for production, `https://www.tryonfashion.app`). These are separate checks: the extension origin is for CORS, while the web app origin is the token's authorized party (`azp`).
4. Create and keep a stable CRX key; set `CRX_PUBLIC_KEY` in `extension/.env.chrome` and keep the matching extension ID in `CHROME_EXTENSION_ORIGINS`. Do not commit key files.
5. In `extension/`, run `npm install`, `npm run dev`, then load `extension/build/chrome-mv3-dev` through `chrome://extensions` with Developer mode enabled. Production builds use `npm run build`.

The extension opens the app's `/sign-in` page for authentication. Clerk Sync Host shares that web session with the extension; after signing in on the website, reopen the extension. Chrome does not allow an extension popup to automatically reopen itself after the web sign-in tab completes.

The extension intentionally requires an explicit user click and review before saving. It does not crawl pages in the background; it uses `activeTab` access to extract structured product metadata from the currently open page.

## Running the app

Start the development server:

```bash
npm run dev
```

Open http://localhost:3000 to view the app.

## Useful scripts

```bash
npm run lint
npm run typecheck
npm run build
npm run db:generate
npm run db:migrate
npm run db:studio
```

## Notes

- Public routes include the landing page and informational pages.
- The `/closet` route is protected and requires a valid Google sign-in session.
- The app stores saved items in Neon PostgreSQL through Drizzle and scopes each query to the authenticated user.
- Metadata extraction for product URLs is best-effort and should always be reviewed by the user before saving.
