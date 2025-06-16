ALTER TABLE "Chat" ADD COLUMN "apiKey" varchar(64) NOT NULL;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "Chat" ADD CONSTRAINT "Chat_apiKey_User_apiKey_fk" FOREIGN KEY ("apiKey") REFERENCES "public"."User"("apiKey") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
