CREATE TABLE IF NOT EXISTS "SuggestedQuestions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"question" text NOT NULL,
	"createdAt" timestamp NOT NULL
);
