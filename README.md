# TryOnFashion

TryOnFashion is a premium fashion discovery and closet app built with Next.js, App Router, Tailwind CSS, Clerk, Prisma, and PostgreSQL. The product lets users discover looks from fashion websites, save items to a personal digital closet, and prepare for future virtual try-on experiences.

## Stack

- Next.js 16 with App Router and TypeScript
- Tailwind CSS
- Clerk authentication with Google sign-in
- Prisma ORM with PostgreSQL
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
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/tryonfashion?schema=public
```

## PostgreSQL setup

1. Ensure PostgreSQL is running locally or in a managed database.
2. Create a database named `tryonfashion` (or change the `DATABASE_URL` to match your existing database).
3. Run the Prisma migration:

```bash
npx prisma migrate dev --name init
```

4. Regenerate the Prisma client if needed:

```bash
npx prisma generate
```

## Clerk and Google sign-in setup

1. Create a Clerk application and copy its publishable and secret keys into `.env`.
2. In Clerk Dashboard, enable Google as a social connection. Clerk handles the Google OAuth callback; configure Google credentials and the authorized redirect URI shown in Clerk's Google connection setup if using your own Google OAuth credentials.
3. Add your local and production application domains in Clerk's allowed origins and redirect settings.
4. For an existing database, review the Prisma schema update and run `npx prisma db push` to add the nullable unique Clerk ID column without deleting saved items.

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
npx prisma migrate dev --name init
npx prisma studio
```

## Notes

- Public routes include the landing page and informational pages.
- The `/closet` route is protected and requires a valid Google sign-in session.
- The app stores saved items in PostgreSQL and scopes each query to the authenticated user.
- Metadata extraction for product URLs is best-effort and should always be reviewed by the user before saving.
