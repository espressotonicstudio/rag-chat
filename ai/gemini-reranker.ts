import { google } from "@ai-sdk/google";
import { generateText } from "ai";

interface RerankedResult {
  content: string;
  score: number;
  metadata: any;
  originalIndex: number;
  reasoning?: string;
}

interface RerankingMetrics {
  totalDocuments: number;
  processingTime: number;
  averageScoreChange: number;
  topDocumentChanged: boolean;
}

export class GeminiReranker {
  private model: any;

  constructor() {
    if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
      throw new Error(
        "GOOGLE_GENERATIVE_AI_API_KEY environment variable is required"
      );
    }

    // Use Gemini 2.5 Flash for optimal speed/cost balance
    this.model = google("gemini-2.5-flash");
  }

  /**
   * Rerank documents using Gemini 2.5 Flash via AI SDK
   */
  async rerank(
    query: string,
    documents: Array<{ content: string; score: number; metadata: any }>,
    options?: {
      topK?: number;
      includeReasoning?: boolean;
      contextualHints?: string[];
    }
  ): Promise<{
    rerankedDocuments: RerankedResult[];
    metrics: RerankingMetrics;
  }> {
    const startTime = Date.now();
    const topK = options?.topK || Math.min(10, documents.length);

    console.log(
      `[GEMINI-RERANK] Starting reranking for ${documents.length} documents, topK=${topK}`
    );

    try {
      // Prepare documents for reranking (limit to top candidates to manage token usage)
      const candidateDocuments = documents.slice(
        0,
        Math.min(20, documents.length)
      );

      const prompt = this.buildRerankingPrompt(
        query,
        candidateDocuments,
        options
      );

      const { text } = await generateText({
        model: this.model,
        prompt: prompt,
        temperature: 0.1, // Low temperature for consistent ranking
      });

      const rerankedResults = this.parseRerankingResponse(
        text,
        candidateDocuments,
        options?.includeReasoning || false
      );

      const processingTime = Date.now() - startTime;
      const metrics = this.calculateMetrics(
        documents,
        rerankedResults,
        processingTime
      );

      console.log(
        `[GEMINI-RERANK] Completed in ${processingTime}ms. Top document changed: ${metrics.topDocumentChanged}`
      );

      return {
        rerankedDocuments: rerankedResults.slice(0, topK),
        metrics,
      };
    } catch (error) {
      console.error("[GEMINI-RERANK] Error during reranking:", error);
      // Fallback to original order with original scores
      return {
        rerankedDocuments: documents.slice(0, topK).map((doc, idx) => ({
          ...doc,
          originalIndex: idx,
          reasoning: "Fallback: Reranking failed, using original order",
        })),
        metrics: {
          totalDocuments: documents.length,
          processingTime: Date.now() - startTime,
          averageScoreChange: 0,
          topDocumentChanged: false,
        },
      };
    }
  }

  private buildRerankingPrompt(
    query: string,
    documents: Array<{ content: string; score: number; metadata: any }>,
    options?: { contextualHints?: string[]; includeReasoning?: boolean }
  ): string {
    const contextualHints = options?.contextualHints || [];
    const includeReasoning = options?.includeReasoning || false;

    let prompt = `You are an expert document ranking system. Your task is to rerank the following documents based on their relevance to the user query.

**Query:** "${query}"

${
  contextualHints.length > 0
    ? `**Context Hints:** ${contextualHints.join(", ")}`
    : ""
}

**Documents to rank:**
${documents
  .map(
    (doc, idx) => `
Document ${idx + 1}:
Content: ${doc.content.substring(0, 500)}${
      doc.content.length > 500 ? "..." : ""
    }
Original Score: ${doc.score.toFixed(3)}
---`
  )
  .join("\n")}

**Instructions:**
1. Analyze each document's relevance to the query
2. Consider semantic relevance, factual accuracy, and completeness
3. Rank documents from most relevant (1) to least relevant (${documents.length})
4. Provide a relevance score from 0.0 to 1.0 for each document

**Required Output Format:**
\`\`\`json
{
  "rankings": [
    {
      "documentIndex": 1,
      "rank": 1,
      "score": 0.95${
        includeReasoning
          ? ',\n      "reasoning": "Brief explanation of why this document is ranked here"'
          : ""
      }
    }
  ]
}
\`\`\`

Respond only with the JSON, no additional text.`;

    return prompt;
  }

  private parseRerankingResponse(
    response: string,
    originalDocuments: Array<{ content: string; score: number; metadata: any }>,
    includeReasoning: boolean
  ): RerankedResult[] {
    try {
      // Extract JSON from response
      const jsonMatch = response.match(/```json\s*([\s\S]*?)\s*```/);
      const jsonString = jsonMatch ? jsonMatch[1] : response;

      const parsed = JSON.parse(jsonString);

      if (!parsed.rankings || !Array.isArray(parsed.rankings)) {
        throw new Error("Invalid response format: missing rankings array");
      }

      // Sort by rank and map to results
      const rerankedResults: RerankedResult[] = parsed.rankings
        .sort((a: any, b: any) => a.rank - b.rank)
        .map((ranking: any) => {
          const docIndex = ranking.documentIndex - 1; // Convert to 0-based index
          const originalDoc = originalDocuments[docIndex];

          if (!originalDoc) {
            console.warn(
              `[GEMINI-RERANK] Invalid document index: ${ranking.documentIndex}`
            );
            return null;
          }

          return {
            content: originalDoc.content,
            score: ranking.score || 0,
            metadata: originalDoc.metadata,
            originalIndex: docIndex,
            reasoning: includeReasoning ? ranking.reasoning : undefined,
          };
        })
        .filter(Boolean); // Remove null entries

      return rerankedResults;
    } catch (error) {
      console.error("[GEMINI-RERANK] Failed to parse response:", error);
      console.error("[GEMINI-RERANK] Raw response:", response);

      // Fallback: return original order
      return originalDocuments.map((doc, idx) => ({
        content: doc.content,
        score: doc.score,
        metadata: doc.metadata,
        originalIndex: idx,
        reasoning: "Parsing failed, using original order",
      }));
    }
  }

  private calculateMetrics(
    originalDocuments: Array<{ content: string; score: number; metadata: any }>,
    rerankedDocuments: RerankedResult[],
    processingTime: number
  ): RerankingMetrics {
    const scoreChanges = rerankedDocuments.map((reranked, newIndex) => {
      const originalIndex = reranked.originalIndex;
      const originalScore = originalDocuments[originalIndex]?.score || 0;
      return Math.abs(reranked.score - originalScore);
    });

    const averageScoreChange =
      scoreChanges.length > 0
        ? scoreChanges.reduce((sum, change) => sum + change, 0) /
          scoreChanges.length
        : 0;

    const topDocumentChanged =
      rerankedDocuments.length > 0
        ? rerankedDocuments[0].originalIndex !== 0
        : false;

    return {
      totalDocuments: originalDocuments.length,
      processingTime,
      averageScoreChange,
      topDocumentChanged,
    };
  }

  /**
   * Quick rerank for real-time use cases - limits documents and reasoning
   */
  async quickRerank(
    query: string,
    documents: Array<{ content: string; score: number; metadata: any }>,
    topK: number = 5
  ) {
    return this.rerank(query, documents.slice(0, 10), {
      topK,
      includeReasoning: false,
    });
  }

  /**
   * Detailed rerank with reasoning for analysis/debugging
   */
  async detailedRerank(
    query: string,
    documents: Array<{ content: string; score: number; metadata: any }>,
    contextualHints?: string[]
  ) {
    return this.rerank(query, documents, {
      includeReasoning: true,
      contextualHints,
    });
  }
}

export const geminiReranker = new GeminiReranker();
