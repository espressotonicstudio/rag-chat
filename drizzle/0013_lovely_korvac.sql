CREATE TABLE IF NOT EXISTS "ChatAnalysis" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"chatId" text NOT NULL,
	"status" text NOT NULL,
	"sentiment" text NOT NULL,
	"issueCategory" text NOT NULL,
	"complexity" text NOT NULL,
	"resolutionQuality" text NOT NULL,
	"satisfactionIndicators" text NOT NULL,
	"firstContactResolution" boolean NOT NULL,
	"agentPerformance" text NOT NULL,
	"keyTopics" text[] DEFAULT '{}' NOT NULL,
	"escalationRequested" boolean NOT NULL,
	"improvementOpportunities" text[] DEFAULT '{}' NOT NULL,
	"summary" text NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "ChatAnalysis" ADD CONSTRAINT "ChatAnalysis_chatId_Chat_id_fk" FOREIGN KEY ("chatId") REFERENCES "public"."Chat"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
