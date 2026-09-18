CREATE TABLE "telegram_channels" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"url" text NOT NULL,
	"added_by" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "telegram_channels_url_unique" UNIQUE("url")
);
--> statement-breakpoint
ALTER TABLE "telegram_channels" ADD CONSTRAINT "telegram_channels_added_by_users_id_fk" FOREIGN KEY ("added_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;