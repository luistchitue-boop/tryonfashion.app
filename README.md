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
AI_GATEWAY_API_KEY=your-vercel-ai-gateway-key
```

## Neon database setup

1. Copy the connection string from your Neon project and set it as `DATABASE_URL` locally and in Vercel. A Neon pooled connection URL is supported by the app's Neon serverless driver.
2. Apply the committed Drizzle migration:

```bash
npm run db:migrate
```

Vercel runs the same migration automatically through `npm run vercel-build`. The initial migration creates the app's tables, including `User` and `SavedItem`.

## Virtual Try-On photo uploads

Virtual Try-On accepts a JPEG, PNG, WebP, or AVIF photo up to 4 MB with each generation request. The photo is processed in memory and sent to the AI provider with up to four selected closet-item images; it is not stored by the app.

## Virtual Try-On

The signed-in `/closet/try-on` page lets the user select up to four saved Closet items that have product images and upload a photo for a single generation. It sends the photo and clothing images to the image model through Vercel AI Gateway and returns an ephemeral preview; neither source photos nor generated images are persisted. Add an `AI_GATEWAY_API_KEY` from your Vercel AI Gateway settings to local `.env`. For Vercel deployments, configure an AI Gateway key or the supported Vercel OIDC integration. Each request is authenticated, validates ownership of all selected items, and fetches only public HTTPS product images.

## Stripe credits

The signed-in `/credits` page sells one-time image-generation credit packages through Stripe Checkout. New accounts start with two free credits, each redeemable for one virtual try-on image. A verified `checkout.session.completed` webhook adds purchased credits to the user's account exactly once; returning from Checkout by itself never grants credits. Each successful image generation costs approximately $0.12 in model usage, and a failed generation is refunded. Current packs are 10 credits for $2.99, 40 for $9.99, and 100 for $19.99; these prices provide room for model and payment processing costs. Video generation is not offered. Review prices before launch.

Configure these server-only variables locally and in the deployment environment:

- `STRIPE_SECRET_KEY`: Stripe secret key (`sk_test_...` for testing; `sk_live_...` for production).
- `STRIPE_WEBHOOK_SECRET`: webhook signing secret (`whsec_...`). Configure a webhook endpoint at `/api/stripe/webhook` for `checkout.session.completed`.
- `APP_URL`: canonical site origin used for Checkout return URLs (for example `http://localhost:3000` locally, and your HTTPS production origin when deployed).

Never expose Stripe secrets through `NEXT_PUBLIC_*` variables or commit real credentials. Apply the Drizzle migration before enabling checkout. Test purchases with Stripe test mode and confirm webhook delivery before switching to live payments.

## CJ product catalog

The `/shop` page searches live shopping products from joined fashion advertisers available to the publisher account through CJ's Product Feed GraphQL API. It supports women's/men's discovery, keyword search, pagination, product cards, tracked CJ links, and saving products to a user's Closet. Catalog responses are briefly cached for 15 minutes; product and advertiser availability remains controlled by CJ and each advertiser.

Set these server-only variables in local `.env` and in the deployment environment:

- `CJ_API_TOKEN`: CJ Personal Access Token.
- `CJ_COMPANY_ID`: publisher company ID (CID) permitted to query the catalog.
- `CJ_PUBLISHER_ID`: publisher ID (PID) used by CJ to generate product click URLs.
- `CJ_ADVERTISER_COUNTRY`: optional two-letter advertiser country filter; defaults to `US`.

Never expose CJ credentials through `NEXT_PUBLIC_*` variables or commit real credentials. The account must have joined advertisers with accessible, non-private shopping product feeds; CJ search does not guarantee a particular retailer is available. The old `/stores` URL redirects to `/shop`. Some product links may earn TryOnFashion a commission.

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
