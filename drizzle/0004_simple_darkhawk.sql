ALTER TABLE "CreditTransaction" ADD COLUMN "paymentAmountCents" integer;--> statement-breakpoint
ALTER TABLE "CreditTransaction" ADD COLUMN "currency" text;--> statement-breakpoint
ALTER TABLE "CreditTransaction" ADD COLUMN "packageId" text;