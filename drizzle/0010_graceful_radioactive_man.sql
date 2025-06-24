ALTER TABLE "Chat" ALTER COLUMN "status" SET DEFAULT 'pending';--> statement-breakpoint
ALTER TABLE "Chat" ADD COLUMN "feedbackQuality" boolean;--> statement-breakpoint
ALTER TABLE "Chat" ADD COLUMN "feedbackReason" text;