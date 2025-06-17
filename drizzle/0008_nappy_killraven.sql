ALTER TABLE "SuggestedQuestions" ALTER COLUMN "createdAt" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "SuggestedQuestions" ADD COLUMN "apiKey" uuid NOT NULL;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "SuggestedQuestions" ADD CONSTRAINT "SuggestedQuestions_apiKey_User_apiKey_fk" FOREIGN KEY ("apiKey") REFERENCES "public"."User"("apiKey") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
