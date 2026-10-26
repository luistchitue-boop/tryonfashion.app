CREATE TABLE "GalleryPhoto" (
	"id" text PRIMARY KEY NOT NULL,
	"userId" text NOT NULL,
	"pathname" text NOT NULL,
	"filename" text NOT NULL,
	"contentType" text NOT NULL,
	"createdAt" timestamp (3) DEFAULT now() NOT NULL,
	CONSTRAINT "GalleryPhoto_pathname_unique" UNIQUE("pathname")
);
--> statement-breakpoint
ALTER TABLE "GalleryPhoto" ADD CONSTRAINT "GalleryPhoto_userId_User_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
CREATE INDEX "GalleryPhoto_userId_createdAt_idx" ON "GalleryPhoto" USING btree ("userId","createdAt");