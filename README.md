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

## Clerk and Google sign-in setup

1. Create a Clerk application and copy its publishable and secret keys into `.env`.
2. In Clerk Dashboard, enable Google as a social connection. Clerk handles the Google OAuth callback; configure Google credentials and the authorized redirect URI shown in Clerk's Google connection setup if using your own Google OAuth credentials.
3. Add your local and production application domains in Clerk's allowed origins and redirect settings.
Google sign-in is configured through Clerk. This app no longer hosts a `/api/auth/callback/google` endpoint.

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
