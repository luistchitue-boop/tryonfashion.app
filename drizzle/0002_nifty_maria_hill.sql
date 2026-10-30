CREATE TABLE "CreditTransaction" (
	"id" text PRIMARY KEY NOT NULL,
	"userId" text NOT NULL,
	"amount" integer NOT NULL,
	"type" text NOT NULL,
	"reference" text NOT NULL,
	"createdAt" timestamp (3) DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "User" ADD COLUMN "creditBalance" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "CreditTransaction" ADD CONSTRAINT "CreditTransaction_userId_User_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
CREATE UNIQUE INDEX "CreditTransaction_reference_key" ON "CreditTransaction" USING btree ("reference");--> statement-breakpoint
CREATE INDEX "CreditTransaction_userId_createdAt_idx" ON "CreditTransaction" USING btree ("userId","createdAt");