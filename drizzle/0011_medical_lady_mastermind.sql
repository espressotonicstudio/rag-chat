CREATE TABLE IF NOT EXISTS "Crawls" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"url" text NOT NULL,
	"jobId" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"apiKey" uuid NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "Crawls" ADD CONSTRAINT "Crawls_apiKey_User_apiKey_fk" FOREIGN KEY ("apiKey") REFERENCES "public"."User"("apiKey") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
