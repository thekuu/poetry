ALTER TABLE "poems" ADD COLUMN "type" text DEFAULT 'standard' NOT NULL;--> statement-breakpoint
ALTER TABLE "poems" ADD COLUMN "source_url" text;