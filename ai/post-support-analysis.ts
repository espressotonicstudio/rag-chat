// Analyze the chat history to determine support metrics
import { generateObject } from "ai";
import { google } from "@ai-sdk/google";
import { getChatById } from "@/app/db";
import { z } from "zod";
import { SUPPORT_STATUS } from "@/schema";

const SupportAnalysisSchema = z.object({
  // Basic resolution status
  status: z.enum(SUPPORT_STATUS),

  // Customer sentiment analysis
  sentiment: z
    .enum(["positive", "negative", "neutral", "mixed"])
    .describe("Overall customer sentiment throughout the conversation"),

  // Issue categorization
  issueCategory: z
    .enum([
      "technical",
      "billing",
      "product_inquiry",
      "account_management",
      "feature_request",
      "bug_report",
      "general_inquiry",
      "complaint",
    ])
    .describe("Primary category of the customer's issue"),

  // Complexity assessment
  complexity: z
    .enum(["simple", "moderate", "complex"])
    .describe(
      "How complex was this issue to resolve - simple (FAQ-level), moderate (requires some troubleshooting), complex (technical/multi-step)"
    ),

  // Resolution indicators
  resolutionQuality: z
    .enum([
      "fully_resolved",
      "partially_resolved",
      "unresolved",
      "escalation_needed",
    ])
    .describe("How well was the issue resolved based on conversation flow"),

  // Customer satisfaction indicators
  satisfactionIndicators: z
    .enum([
      "clearly_satisfied",
      "somewhat_satisfied",
      "neutral",
      "dissatisfied",
      "very_dissatisfied",
    ])
    .describe("Customer satisfaction level based on their responses and tone"),

  // First contact resolution
  firstContactResolution: z
    .boolean()
    .describe(
      "Was the issue resolved in this single conversation without needing follow-up?"
    ),

  // Agent performance
  agentPerformance: z
    .enum(["excellent", "good", "adequate", "needs_improvement"])
    .describe("How well did the agent handle the conversation"),

  // Key insights
  keyTopics: z
    .array(z.string())
    .describe("Main topics, features, or areas discussed (max 5 items)"),

  // Escalation indicators
  escalationRequested: z
    .boolean()
    .describe(
      "Did the customer request to speak to a manager or escalate the issue?"
    ),

  // Improvement opportunities
  improvementOpportunities: z
    .array(z.string())
    .describe(
      "Areas where the support process could be improved (max 3 items)"
    ),

  // Summary
  summary: z
    .string()
    .describe("Brief 2-3 sentence summary of the interaction and outcome"),
});

export const analyzeChat = async (chatId: string) => {
  const history = await getChatById({ id: chatId });

  if (!history || !history.messages) {
    throw new Error("No chat history found for analysis");
  }

  const { object: analysis } = await generateObject({
    model: google("gemini-2.5-flash"),
    schema: SupportAnalysisSchema,
    prompt: `Analyze this customer support conversation and provide detailed metrics:

    ${JSON.stringify(history.messages)}

    Please analyze:
    1. The customer's overall sentiment and satisfaction level
    2. What type of issue they had and how complex it was
    3. How well it was resolved and the quality of support provided
    4. Key topics discussed and any escalation requests
    5. Opportunities for improvement in the support process

    Be objective and base your analysis on the actual conversation flow, customer responses, and resolution outcomes.`,
  });

  return analysis;
};

export type SupportAnalysis = z.infer<typeof SupportAnalysisSchema>;
