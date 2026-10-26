# TryOnFashion

TryOnFashion is a premium fashion discovery and closet app built with Next.js, App Router, Tailwind CSS, NextAuth, Prisma, and PostgreSQL. The product lets users discover looks from fashion websites, save items to a personal digital closet, and prepare for future virtual try-on experiences.

## Stack

- Next.js 16 with App Router and TypeScript
- Tailwind CSS
- NextAuth v4 with Google OAuth
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
AUTH_SECRET=replace-with-a-long-random-secret
AUTH_GOOGLE_ID=your-google-client-id
AUTH_GOOGLE_SECRET=your-google-client-secret
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/tryonfashion?schema=public
NEXTAUTH_URL=http://localhost:3000
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

## Google OAuth setup

1. Go to the Google Cloud Console.
2. Create or select a project.
3. Enable the Google OAuth consent screen.
4. Create OAuth 2.0 Client ID credentials.
5. Add the following authorized redirect URI in Google Console:

```text
http://localhost:3000/api/auth/callback/google
```

For production, add the production domain plus `/api/auth/callback/google`.

6. Copy the Client ID and Secret into `AUTH_GOOGLE_ID` and `AUTH_GOOGLE_SECRET`.

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
