ALTER TABLE "GalleryPhoto" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP TABLE "GalleryPhoto" CASCADE;--> statement-breakpoint
ALTER TABLE "User" ALTER COLUMN "creditBalance" SET DEFAULT 2;--> statement-breakpoint
UPDATE "User" SET "creditBalance" = 2 WHERE "creditBalance" = 0 AND NOT EXISTS (SELECT 1 FROM "CreditTransaction" WHERE "CreditTransaction"."userId" = "User"."id");